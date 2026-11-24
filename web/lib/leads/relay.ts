import { createAdminClient } from "@/lib/supabase/admin"
import { escapeLikePattern } from "@/lib/supabase/queries/shared"
import {
  notifyNewFittingRequest, sendGolferConfirmation, sendLeadReminders, sendShopRequest,
} from "@/lib/email"
import { buildShopMessage, isSingleAddress } from "@/lib/leads/message"
import { MAX_REMINDERS, reminderKind, type ReminderLead } from "@/lib/leads/reminders"
import { normalizeWebsite } from "@/lib/moderation/normalize"
import { log } from "@/lib/logger"

/**
 * Getting golfer requests to shops — the ONLY code that sends a request to a
 * shop or forwards one to a verified owner.
 *
 * SECURITY: no auth here. Callers are admin actions (isAdmin() checked), the
 * claim-approval path, the request API, and the daily cron.
 *
 * Sends are claimed first (a timestamp column set only if empty), so two taps
 * or overlapping runs send once; a failed send releases the claim for a retry.
 */

const FORWARD_WINDOW_DAYS = 30
const CONFIRMATIONS_PER_ADDRESS_PER_DAY = 3
const CONFIRMATIONS_PER_DAY = 100

export type RelayResult = { error?: string }

type LeadShop = {
  id: string; name: string; slug: string; status: string
  claimed_at: string | null; owner_email: string | null
}
type Lead = {
  id: string; shop_id: string | null; status: string; outcome: string | null
  visitor_name: string; visitor_email: string; visitor_phone: string | null
  fitting_type: string | null; preferred_date: string | null; preferred_time: string | null
  notes: string | null; notified_at: string | null
  shop_sent_at: string | null; owner_forwarded_at: string | null
  shops: LeadShop | null
}

const LEAD_FIELDS =
  "id, shop_id, status, outcome, visitor_name, visitor_email, visitor_phone, fitting_type, preferred_date, preferred_time, notes, notified_at, shop_sent_at, owner_forwarded_at, shops(id, name, slug, status, claimed_at, owner_email)"

async function loadLead(id: string): Promise<Lead | null> {
  const { data, error } = await createAdminClient()
    .from("fitting_requests").select(LEAD_FIELDS).eq("id", id).single()
  if (error || !data) return null
  // Supabase types a to-one join as an array; take the first row either way.
  const raw = data as unknown as Omit<Lead, "shops"> & { shops: LeadShop | LeadShop[] | null }
  return { ...raw, shops: Array.isArray(raw.shops) ? raw.shops[0] ?? null : raw.shops }
}

/** Set a timestamp only if it's still empty. True when THIS caller won. */
async function claimOnce(
  id: string, column: "shop_sent_at" | "owner_forwarded_at", extra: Record<string, unknown> = {},
): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("fitting_requests")
    .update({ [column]: new Date().toISOString(), ...extra })
    .eq("id", id)
    .is(column, null)
    .select("id")
  if (error) throw error
  return (data?.length ?? 0) > 0
}

async function patchLead(id: string, values: Record<string, unknown>) {
  const { error } = await createAdminClient().from("fitting_requests").update(values).eq("id", id)
  if (error) log.error("leads/relay", "could not update request", { id, error })
}

/* ── To an unverified shop: the request only ─────────────── */

/** Why this address must not be emailed, or null when it's fine. */
async function blockedAddress(shopId: string, email: string): Promise<string | null> {
  const supabase = createAdminClient()
  const [byShop, byEmail] = await Promise.all([
    supabase.from("outreach").select("status, contact_email, email_verified").eq("shop_id", shopId),
    supabase.from("outreach").select("status, contact_email, email_verified")
      .ilike("contact_email", escapeLikePattern(email)),
  ])
  // Can't confirm someone hasn't opted out? Don't send.
  if (byShop.error || byEmail.error) throw byShop.error ?? byEmail.error
  const rows = [...(byShop.data ?? []), ...(byEmail.data ?? [])]
  if (rows.some((r) => r.status === "do_not_contact")) return "This shop asked not to be contacted."
  if (rows.some((r) => r.email_verified === "invalid" && r.contact_email?.toLowerCase() === email.toLowerCase())) {
    return "That address is known to bounce. Try another, or call the shop."
  }
  return null
}

export async function sendLeadToShop(id: string, rawEmail: string): Promise<RelayResult> {
  const lead = await loadLead(id)
  const shop = lead?.shops
  if (!lead) return { error: "Request not found." }
  if (!shop || shop.status !== "active") return { error: "This shop is no longer listed. Help the golfer directly." }
  if (lead.outcome || lead.status === "closed") return { error: "This request is already finished." }

  // Claimed since the page loaded: the verified owner gets it instead.
  if (shop.claimed_at && shop.owner_email) return forwardLeadToOwner(id)

  const email = rawEmail.trim()
  if (!isSingleAddress(email)) return { error: "Enter one valid email address." }
  if (email.toLowerCase() === lead.visitor_email.toLowerCase()) return { error: "That's the golfer's address, not the shop's." }
  const blocked = await blockedAddress(shop.id, email)
  if (blocked) return { error: blocked }

  const won = await claimOnce(id, "shop_sent_at", {
    shop_email: email, status: "contacted", reminded_at: null, reminder_count: 0,
  })
  if (!won) return { error: "Already sent to this shop." }

  const sent = await sendShopRequest({
    to: email,
    leadId: id,
    message: buildShopMessage({
      shopName: shop.name, shopSlug: shop.slug, fittingType: lead.fitting_type,
      preferredDate: lead.preferred_date, preferredTime: lead.preferred_time, notes: lead.notes,
    }),
  })
  if (!sent) {
    await patchLead(id, { shop_sent_at: null, shop_email: null, status: lead.status })
    return { error: "The email didn't send. Nothing was recorded, so you can try again." }
  }
  return {}
}

/* ── To a verified owner: full details ───────────────────── */

export async function forwardLeadToOwner(id: string): Promise<RelayResult> {
  const lead = await loadLead(id)
  const shop = lead?.shops
  if (!lead || !shop?.claimed_at || !shop.owner_email) return { error: "This shop has no verified owner." }

  const won = await claimOnce(id, "owner_forwarded_at", {
    status: "contacted",
    // Stops the un-notified retry from sending the owner a second copy.
    notified_at: lead.notified_at ?? new Date().toISOString(),
  })
  if (!won) return { error: "Already sent to the owner." }

  const sent = await notifyNewFittingRequest({
    shopName: shop.name, shopSlug: shop.slug, ownerEmail: shop.owner_email,
    visitorName: lead.visitor_name, visitorEmail: lead.visitor_email, visitorPhone: lead.visitor_phone ?? "",
    fittingType: lead.fitting_type ?? "", preferredDate: lead.preferred_date ?? "",
    preferredTime: lead.preferred_time ?? "", notes: lead.notes ?? "",
  })
  if (!sent) {
    await patchLead(id, { owner_forwarded_at: null, status: lead.status, notified_at: lead.notified_at })
    return { error: "The email to the owner didn't send. It will be retried daily." }
  }
  return {}
}

/** After a claim is approved (and daily, as a retry): send the owner their
 *  open requests from the last 30 days, once each. Returns how many went out. */
export async function forwardOpenLeads(shopId?: string): Promise<number> {
  const since = new Date(Date.now() - FORWARD_WINDOW_DAYS * 86_400_000).toISOString()
  let query = createAdminClient()
    .from("fitting_requests")
    .select("id, shops!inner(claimed_at)")
    .not("shops.claimed_at", "is", null)
    .is("owner_forwarded_at", null)
    .is("outcome", null)
    .in("status", ["new", "contacted"])
    // Never-notified requests belong to the cron's own retry; taking them here
    // too could email the owner twice.
    .not("notified_at", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(50)
  if (shopId) query = query.eq("shop_id", shopId)
  const { data, error } = await query
  if (error) throw error

  let sent = 0
  for (const row of data ?? []) {
    const { error: failed } = await forwardLeadToOwner(row.id)
    if (failed) log.warn("leads/relay", "could not forward request", { id: row.id, reason: failed })
    else sent++
  }
  return sent
}

/* ── To the golfer ───────────────────────────────────────── */

/** Best-effort confirmation. Only database values and no typed text are used,
 *  and it's capped, so the form can't be used to message strangers. */
export async function confirmToGolfer(lead: {
  id: string; visitorEmail: string
  shop: { id: string; name: string; slug: string; phone: string | null; website: string | null; claimed: boolean }
}): Promise<void> {
  if (!isSingleAddress(lead.visitorEmail)) return
  const supabase = createAdminClient()
  const since = new Date(Date.now() - 86_400_000).toISOString()
  const [mine, all] = await Promise.all([
    supabase.from("fitting_requests").select("shop_id")
      .ilike("visitor_email", escapeLikePattern(lead.visitorEmail)).gte("golfer_confirmed_at", since),
    supabase.from("fitting_requests").select("id", { count: "exact", head: true }).gte("golfer_confirmed_at", since),
  ])
  if (mine.error || all.error) throw mine.error ?? all.error
  const recent = mine.data ?? []
  if (recent.length >= CONFIRMATIONS_PER_ADDRESS_PER_DAY) return
  if (recent.some((r) => r.shop_id === lead.shop.id)) return
  if ((all.count ?? 0) >= CONFIRMATIONS_PER_DAY) return

  const sent = await sendGolferConfirmation({
    to: lead.visitorEmail,
    shopName: lead.shop.name,
    shopSlug: lead.shop.slug,
    shopPhone: lead.shop.phone,
    shopWebsite: normalizeWebsite(lead.shop.website),
    claimed: lead.shop.claimed,
  })
  if (sent) await patchLead(lead.id, { golfer_confirmed_at: new Date().toISOString() })
}

/* ── Reminders to the founder ────────────────────────────── */

export async function sendDueReminders(now: Date = new Date()): Promise<number> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("fitting_requests")
    .select("id, status, created_at, shop_sent_at, owner_forwarded_at, outcome, reminded_at, reminder_count, shop_name, notified_at")
    .is("outcome", null)
    .is("owner_forwarded_at", null)
    .in("status", ["new", "contacted"])
    .lt("reminder_count", MAX_REMINDERS)
    .order("created_at", { ascending: true })
    .limit(200)
  if (error) throw error

  const due = (data ?? []).flatMap((row) => {
    const kind = reminderKind(row as ReminderLead, now)
    return kind ? [{ ...row, kind }] : []
  })
  if (due.length === 0) return 0

  const sent = await sendLeadReminders(
    due.map((d) => ({ shopName: d.shop_name, createdAt: d.created_at, kind: d.kind })),
  )
  if (!sent) return 0 // nothing recorded: tomorrow's run tries again
  for (const d of due) {
    await patchLead(d.id, { reminded_at: now.toISOString(), reminder_count: d.reminder_count + 1 })
  }
  return due.length
}

/** The shop's known address for prefilling, if it's one we may use. */
export async function knownShopEmails(
  shopIds: string[],
): Promise<Map<string, { email: string; verified: boolean }>> {
  const map = new Map<string, { email: string; verified: boolean }>()
  if (shopIds.length === 0) return map
  const { data, error } = await createAdminClient()
    .from("outreach")
    .select("shop_id, contact_email, email_verified, status")
    .in("shop_id", shopIds)
  if (error) throw error
  for (const r of data ?? []) {
    if (!r.contact_email || r.status === "do_not_contact" || r.email_verified === "invalid") continue
    map.set(r.shop_id, { email: r.contact_email, verified: r.email_verified === "valid" })
  }
  return map
}

/** "No thanks" reply: never contact this shop about requests or outreach again. */
export async function markShopOptOut(shopId: string): Promise<RelayResult> {
  const { data, error } = await createAdminClient()
    .from("outreach")
    .upsert({ shop_id: shopId, status: "do_not_contact" }, { onConflict: "shop_id" })
    .select("shop_id")
  if (error || !data?.length) return { error: "Could not record the opt-out. Please try again." }
  return {}
}
