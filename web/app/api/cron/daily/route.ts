import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { sweepExpiredFeatured } from "@/lib/verified"
import { notifyNewFittingRequest } from "@/lib/email"
import { log } from "@/lib/logger"

/**
 * Daily housekeeping — GET /api/cron/daily, scheduled in vercel.json.
 *
 * Three jobs that used to depend on a human remembering:
 *   1. Lapse Featured shops whose verified_expires_at has passed (annual
 *      one-time payments never emit a Stripe cancellation, so without this
 *      the paid badge + top-of-list sort lasted forever).
 *   2. Re-send fitting-lead notifications that failed (Resend outage, missing
 *      key): fitting_requests.notified_at is NULL. The lead was always saved;
 *      this makes sure someone actually hears about it.
 *   3. Prune crawler_hits older than 90 days — the table is otherwise
 *      unbounded (scripts/crawler_report.py only needs recent counts).
 *
 * SECURITY: Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Compared
 * constant-time; without CRON_SECRET set the route refuses to run at all.
 * Every job is idempotent, so a manual re-run is always safe.
 */

export const dynamic = "force-dynamic"
export const maxDuration = 60

const CRAWLER_HITS_RETENTION_DAYS = 90
const LEAD_RETRY_MAX_ATTEMPTS = 5

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const provided = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim()
  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    log.error("cron/daily", "CRON_SECRET is not set — refusing to run")
    return NextResponse.json({ error: "Cron is not configured." }, { status: 500 })
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const report: Record<string, unknown> = {}

  // ── 1. Expired Featured ──
  try {
    const lapsed = await sweepExpiredFeatured()
    report.lapsedFeatured = lapsed
  } catch (e) {
    log.error("cron/daily", "featured sweep failed", { error: e })
    report.lapsedFeatured = "error"
  }

  // ── 2. Un-notified leads ──
  try {
    report.leadsRenotified = await retryUnnotifiedLeads()
  } catch (e) {
    log.error("cron/daily", "lead retry failed", { error: e })
    report.leadsRenotified = "error"
  }

  // ── 3. crawler_hits retention ──
  try {
    const supabase = createAdminClient()
    const cutoff = new Date(Date.now() - CRAWLER_HITS_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    const { error, count } = await supabase
      .from("crawler_hits")
      .delete({ count: "exact" })
      .lt("ts", cutoff.toISOString())
    if (error) throw error
    report.crawlerHitsPruned = count ?? 0
  } catch (e) {
    log.error("cron/daily", "crawler_hits prune failed", { error: e })
    report.crawlerHitsPruned = "error"
  }

  log.info("cron/daily", "run complete", report)
  return NextResponse.json({ ok: true, ...report })
}

/* Leads whose notification email never went out. Joined to the shop so a
   claimed listing's owner still gets the lead (same routing as the live
   request). Attempts are counted so a permanently-bouncing address can't be
   retried forever. */
async function retryUnnotifiedLeads(): Promise<number> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("fitting_requests")
    .select(
      "id, shop_slug, shop_name, visitor_name, visitor_email, visitor_phone, fitting_type, preferred_date, preferred_time, notes, notify_attempts, shops(name, slug, owner_email, claimed_at)",
    )
    .is("notified_at", null)
    .lt("notify_attempts", LEAD_RETRY_MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(50)
  if (error) throw error

  let sent = 0
  for (const lead of data ?? []) {
    // Supabase types a to-one join as an array; take the first row either way.
    const shopRel = lead.shops as unknown
    const shop = (Array.isArray(shopRel) ? shopRel[0] : shopRel) as
      | { name: string; slug: string; owner_email: string | null; claimed_at: string | null }
      | null
    const ok = await notifyNewFittingRequest({
      shopName: shop?.name ?? lead.shop_name,
      shopSlug: shop?.slug ?? lead.shop_slug,
      ownerEmail: shop?.claimed_at && shop.owner_email ? shop.owner_email : null,
      visitorName: lead.visitor_name,
      visitorEmail: lead.visitor_email,
      visitorPhone: lead.visitor_phone ?? "",
      fittingType: lead.fitting_type ?? "",
      preferredDate: lead.preferred_date ?? "",
      preferredTime: lead.preferred_time ?? "",
      notes: lead.notes ?? "",
    })
    await supabase
      .from("fitting_requests")
      .update({
        notify_attempts: (lead.notify_attempts ?? 0) + 1,
        ...(ok ? { notified_at: new Date().toISOString() } : {}),
      })
      .eq("id", lead.id)
    if (ok) sent++
  }
  return sent
}
