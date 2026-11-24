"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { rateLimitOk } from "@/lib/rate-limit"
import { log } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { ADMIN_COOKIE, ADMIN_SESSION_MS, tokenForPassword, isAdmin } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { activateFeaturedShop, lapseFeaturedShop } from "@/lib/verified"
import { sendPaymentLinkEmail } from "@/lib/email"
import { applyClaimApproval, applyRejection, applySubmissionApproval } from "@/lib/moderation/apply"
import { isPlanKey } from "@/lib/plans"

/* Mutating actions return { error } instead of throwing: they're invoked from
   client components (ActionButton), where a thrown server-action error renders
   the opaque error boundary instead of an inline message. */
export type ActionResult = { error?: string } | void

/* ── Login ── */
export async function login(formData: FormData) {
  // Throttle brute-force attempts: the constant-time comparison doesn't help
  // if a bot can try thousands of passwords per minute.
  const hdrs = await headers()
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (!rateLimitOk(`admin-login:${ip}`, 5, 15 * 60 * 1000)) {
    log.warn("admin/login", "rate limited", { ip })
    redirect("/admin/login?error=1")
  }

  const password = String(formData.get("password") ?? "")
  const token = tokenForPassword(password)
  if (!token) {
    redirect("/admin/login?error=1")
  }
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    // secure in production (HTTPS); allow http://localhost in dev so the cookie
    // isn't dropped during local testing.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MS / 1000,
  })
  redirect("/admin")
}

/* ── Logout ── */
export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE)
  redirect("/admin/login")
}

/* ── Submissions & claims ──
   Thin, admin-gated wrappers: the real work lives in lib/moderation/apply.ts. */
export async function approveSubmission(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) redirect("/admin/login")
  const id = String(formData.get("id") ?? "")
  if (!id) return
  const text = (key: string) => {
    const v = formData.get(key)
    return typeof v === "string" ? v : undefined
  }
  try {
    const { error } = await applySubmissionApproval(id, {
      city: text("city"),
      state_code: text("state_code"),
      shop_type: text("shop_type"),
      street: text("street"),
      postal_code: text("postal_code"),
      offers_fitting: text("offers_fitting") === undefined ? undefined : text("offers_fitting") === "1",
      omitHours: text("omit_hours") === "1",
      omitServices: text("omit_services") === "1",
      allowDuplicate: text("allow_duplicate") === "1",
    })
    if (error) return { error }
  } catch (e) {
    log.error("admin/actions", "approve submission failed", { id, error: e })
    return { error: "Could not approve — please try again." }
  }
}

export async function rejectSubmission(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) redirect("/admin/login")
  const id = String(formData.get("id") ?? "")
  if (!id) return
  const { error } = await applyRejection("shop_submissions", id)
  if (error) return { error }
}

export async function approveClaim(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) redirect("/admin/login")
  const id = String(formData.get("id") ?? "")
  if (!id) return
  try {
    const { error } = await applyClaimApproval(id)
    if (error) return { error }
  } catch (e) {
    log.error("admin/actions", "approve claim failed", { id, error: e })
    return { error: "Could not approve — please try again." }
  }
}

/* ── Activate the paid Featured tier (replaces the manual-SQL step).
   Run when a Stripe payment email arrives — see tasks/paid-activation-runbook.md.
   Sets the placement live and stamps an expiry so a lapsed subscription
   can't stay Featured forever. ── */
export async function activateFeatured(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) redirect("/admin/login")
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase()
  if (!slug) return
  const rawPlan = String(formData.get("plan") ?? "")
  const plan = isPlanKey(rawPlan) ? rawPlan : "annual"

  // Shared with the Stripe webhook — one code path for Featured activation
  // (sets tier + stamps expiry + refreshes the cached pages).
  try {
    await activateFeaturedShop(slug, plan)
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not activate." }
  }
}

/* ── Lapse a Featured listing (subscription not renewed). Keeps verified_at /
   verified_expires_at as history; tier goes back to free and the paid
   placement comes off. The free Verified badge stays — it's tied to
   claimed_at, not payment. ── */
export async function lapseFeatured(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login")
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase()
  if (!slug) return

  // Shared with the Stripe webhook + daily sweep — one lapse path (lib/verified.ts).
  try {
    await lapseFeaturedShop(slug, "admin")
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not lapse." }
  }
}

/* ── Reject a claim (does not touch shops) ── */
export async function rejectClaim(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) redirect("/admin/login")
  const id = String(formData.get("id") ?? "")
  if (!id) return
  const { error } = await applyRejection("shop_claims", id)
  if (error) return { error }
}

/* ── Send the Stripe payment link to a claimed shop's owner.
   The /onboard/pay/[slug] page is gated on claimed_at, so this button only
   works (and only makes sense) after a claim is approved. Doubles as the
   renewal-note sender from the Overview roster. ── */
export async function sendPaymentLink(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login")
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase()
  const renewal = String(formData.get("renewal") ?? "") === "1"
  if (!slug) return

  const supabase = createAdminClient()
  const { data: shop, error } = await supabase
    .from("shops")
    .select("name, slug, owner_email, claimed_at")
    .eq("slug", slug)
    .single()
  if (error || !shop) return { error: `Shop not found: ${error?.message ?? slug}` }
  if (!shop.claimed_at || !shop.owner_email) {
    return { error: "Shop has no approved claim / owner email — approve the claim first." }
  }

  const sent = await sendPaymentLinkEmail({
    shopName: shop.name,
    slug: shop.slug,
    ownerEmail: shop.owner_email,
    renewal,
  })
  if (!sent) return { error: "Email failed to send — check RESEND_API_KEY and Vercel logs." }
  log.info("admin/actions", "payment link sent", { slug, renewal })
}

/* ── Listing update requests (Update Requests tab) ── */
export async function markUpdateDone(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login")
  const id = String(formData.get("id") ?? "")
  const shopSlug = String(formData.get("shop_slug") ?? "")
  if (!id) return
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("listing_update_requests")
    .update({ review_status: "done" })
    .eq("id", id)
  if (error) return { error: `Could not mark done: ${error.message}` }
  revalidatePath("/admin", "layout")
  // The founder just hand-applied edits to the listing — refresh its page.
  if (/^[a-z0-9-]+$/.test(shopSlug)) revalidatePath(`/listing/${shopSlug}`)
}

export async function rejectUpdateRequest(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login")
  const id = String(formData.get("id") ?? "")
  if (!id) return
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("listing_update_requests")
    .update({ review_status: "rejected" })
    .eq("id", id)
  if (error) return { error: `Could not reject request: ${error.message}` }
  revalidatePath("/admin", "layout")
}
