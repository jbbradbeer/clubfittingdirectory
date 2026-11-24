import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchAllRows } from "@/lib/supabase/queries/shared"
import { pathsForShop } from "@/lib/revalidate-paths"
import { sendClaimApprovedEmail } from "@/lib/email"
import { forwardOpenLeads } from "@/lib/leads/relay"
import { log } from "@/lib/logger"
import { US_STATES } from "@/lib/constants"
import { dbTypeToShopType, SHOP_TYPES } from "@/lib/shop-types"
import { findDuplicates, type ExistingShop } from "@/lib/moderation/duplicates"
import { normalizeWebsite, phoneDigits } from "@/lib/moderation/normalize"

/**
 * Approving and rejecting shop submissions and ownership claims — THE single
 * code path (same idea as lib/verified.ts for the paid tier). The admin buttons
 * call it today; it lives in lib/ because admin actions are cookie-gated and
 * can't be reused by anything else.
 *
 * SECURITY: these functions do no auth. Callers must already have verified
 * isAdmin() (or be another trusted server path).
 *
 * Every transition CLAIMS the queue row first (`review_status = 'new'` in the
 * update filter), so a double-click or two overlapping runs can't create two
 * listings. If the follow-up write fails, the row goes back to 'new'.
 */

export type ApplyResult = { error?: string; slug?: string }

const NOT_PENDING = "This item has already been reviewed — refresh the page."

function buildShopSlug(name: string, city: string, stateCode: string): string {
  const part = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return [part(name), part(city), stateCode.toLowerCase()].filter(Boolean).join("-")
}

/** Light copy of every shop (active AND inactive) for the duplicate check. */
export async function loadShopsForDuplicateCheck(): Promise<ExistingShop[]> {
  const supabase = createAdminClient()
  return fetchAllRows<ExistingShop>(() =>
    supabase
      .from("shops")
      .select("id, slug, name, city, state_code, website, phone, status")
      .order("id", { ascending: true }),
  )
}

type QueueTable = "shop_submissions" | "shop_claims"

/* Compare-and-set on the queue row. True when THIS caller won it. */
async function transition(
  table: QueueTable, id: string, from: string, to: string,
): Promise<{ won: boolean; error?: string }> {
  const { data, error } = await createAdminClient()
    .from(table)
    .update({ review_status: to })
    .eq("id", id)
    .eq("review_status", from)
    .select("id")
  if (error) return { won: false, error: error.message }
  return { won: (data?.length ?? 0) > 0 }
}

async function release(table: QueueTable, id: string) {
  const back = await transition(table, id, "approved", "new")
  if (!back.won) log.error("moderation", "could not return item to the queue", { table, id, error: back.error })
}

function revalidateShop(shop: Parameters<typeof pathsForShop>[0], extra: string[]) {
  for (const path of new Set([...pathsForShop(shop), ...extra])) revalidatePath(path)
  revalidatePath("/admin", "layout")
}

/* ── Submissions ─────────────────────────────────────────── */

export type SubmissionOverrides = {
  city?: string
  state_code?: string
  shop_type?: string
  /** Publish even though a likely duplicate exists (e.g. a real second location). */
  allowDuplicate?: boolean
}

export async function applySubmissionApproval(
  id: string, overrides: SubmissionOverrides = {},
): Promise<ApplyResult> {
  const supabase = createAdminClient()
  const { data: sub, error: subErr } = await supabase
    .from("shop_submissions").select("*").eq("id", id).single()
  if (subErr || !sub) return { error: "Submission not found." }
  if (sub.review_status !== "new") return { error: NOT_PENDING }

  const city = (overrides.city ?? sub.city ?? "").trim()
  const stateCode = (overrides.state_code ?? sub.state_code ?? "").trim().toUpperCase()
  const shopType = overrides.shop_type || sub.shop_type

  if (city.length < 2) return { error: "Enter the shop's city." }
  const state = US_STATES.find((s) => s.code === stateCode)
  if (!state) return { error: "Choose the shop's state." }
  if (!shopType || !dbTypeToShopType(shopType)) {
    return { error: `Choose a shop type (${SHOP_TYPES.map((t) => t.singular).join(", ")}).` }
  }

  const shops = await loadShopsForDuplicateCheck()
  if (!overrides.allowDuplicate) {
    const dup = findDuplicates({ ...sub, city, state_code: stateCode }, shops).find((m) => m.likely)
    if (dup) {
      return { error: `Looks like a duplicate of ${dup.shop.name} (${dup.reasons.join(", ")}). Tick "not a duplicate" to publish anyway.` }
    }
  }

  let slug = buildShopSlug(sub.name, city, stateCode)
  if (shops.some((s) => s.slug === slug)) slug = `${slug}-${id.slice(0, 6)}`

  const claimed = await transition("shop_submissions", id, "new", "approved")
  if (claimed.error) return { error: `Could not update submission: ${claimed.error}` }
  if (!claimed.won) return { error: NOT_PENDING }

  const { error: insErr } = await supabase.from("shops").insert({
    slug,
    status: "active",
    name: sub.name,
    shop_type: shopType,
    city,
    state: state.name,
    state_code: stateCode,
    website: normalizeWebsite(sub.website),
    // "email only" and similar aren't phone numbers — leave the field empty.
    phone: phoneDigits(sub.phone) ? sub.phone : null,
    offers_fitting: sub.offers_fitting ?? false,
  })
  if (insErr) {
    await release("shop_submissions", id)
    return { error: `Could not create listing: ${insErr.message}` }
  }

  // The new listing, its index pages, and the pages that show site-wide counts
  // or every pin. Deliberately NOT every listing page (ISR write budget).
  revalidateShop(
    { slug, city, state_code: stateCode, shop_type: shopType },
    ["/", "/directory", "/states", "/map"],
  )
  return { slug }
}

export async function applyRejection(table: QueueTable, id: string): Promise<ApplyResult> {
  const res = await transition(table, id, "new", "rejected")
  if (res.error) return { error: `Could not reject: ${res.error}` }
  if (!res.won) return { error: NOT_PENDING }
  revalidatePath("/admin", "layout")
  return {}
}

/* ── Claims ──────────────────────────────────────────────── */

/** Approve a claim: stamps claimed_at (which IS the free Verified badge) and
 *  owner_email, keeps the owner's message as an update request, and sends the
 *  approval email. Never takes over a shop someone else already owns. */
export async function applyClaimApproval(id: string): Promise<ApplyResult> {
  const supabase = createAdminClient()
  const { data: claim, error: claimErr } = await supabase
    .from("shop_claims")
    .select("id, shop_id, claimant_name, claimant_email, message, review_status")
    .eq("id", id)
    .single()
  if (claimErr || !claim) return { error: "Claim not found." }
  if (claim.review_status !== "new") return { error: NOT_PENDING }

  const claimed = await transition("shop_claims", id, "new", "approved")
  if (claimed.error) return { error: `Could not update claim: ${claimed.error}` }
  if (!claimed.won) return { error: NOT_PENDING }

  const { data: rows, error: shopErr } = await supabase
    .from("shops")
    .update({ claimed_at: new Date().toISOString(), owner_email: claim.claimant_email })
    .eq("id", claim.shop_id)
    .eq("status", "active")
    .is("claimed_at", null)
    .select("slug, name, city, state_code, shop_type")
  const shop = rows?.[0]
  if (shopErr || !shop) {
    await release("shop_claims", id)
    return {
      error: shopErr
        ? `Could not mark shop claimed: ${shopErr.message}`
        : "This shop already has an owner, or is no longer listed. Nothing was changed.",
    }
  }

  // What the owner told us ("prices are wrong…") becomes a visible to-do in the
  // Updates tab instead of disappearing once the claim is approved.
  const message = claim.message?.trim()
  if (message) {
    const { error } = await supabase.from("listing_update_requests").insert({
      shop_id: claim.shop_id,
      requester_name: claim.claimant_name,
      requester_email: claim.claimant_email,
      payload: {},
      message,
    })
    if (error) log.error("moderation", "claim message not copied to update requests", { claimId: id, error })
  }

  revalidateShop(shop, ["/"])

  // Best-effort: never fails the approval; the founder is cc'd on the email.
  const sent = await sendClaimApprovedEmail({
    shopName: shop.name ?? shop.slug,
    slug: shop.slug,
    ownerEmail: claim.claimant_email,
  })
  if (!sent) log.warn("moderation", "claim approved email not sent", { slug: shop.slug })

  // Send the new owner the golfers already waiting. Never fails the approval;
  // the daily cron retries anything that didn't go.
  try {
    await forwardOpenLeads(claim.shop_id)
  } catch (e) {
    log.error("moderation", "open requests not forwarded", { slug: shop.slug, error: e })
  }
  return { slug: shop.slug }
}
