import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { notifyNewFittingRequest } from "@/lib/email"
import { log } from "@/lib/logger"
import { rateLimitOk, clientIp } from "@/lib/rate-limit"

/**
 * Public "Request a Fitting" endpoint — the booking engine's intake.
 * POST /api/request-fitting  → inserts a row into fitting_requests (RLS allows
 * anon INSERT only) and emails the founder the lead (best-effort; the save
 * always happens first so no lead is lost if email fails).
 */

const VALID_FITTING_TYPES = new Set([
  "driver", "irons", "wedges", "putter", "full_bag", "other",
])
const VALID_TIMES = new Set(["morning", "afternoon", "evening", "flexible"])

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : ""
}

export async function POST(request: Request) {
  // Rate limit: 5 requests per IP per 10 minutes. A real golfer submits once;
  // this only stops floods (spam bots, runaway scripts).
  if (!rateLimitOk(`request-fitting:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    log.warn("api/request-fitting", "rate limited", { ip: clientIp(request) })
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  // Honeypot: hidden field real users never fill. Pretend success so bots don't learn.
  if (str(body.company_website, 200)) {
    return NextResponse.json({ ok: true })
  }

  // ── Validate ──
  const shopId        = str(body.shop_id, 60)
  const shopSlug      = str(body.shop_slug, 200)
  const shopName      = str(body.shop_name, 200)
  const visitorName   = str(body.visitor_name, 120)
  const visitorEmail  = str(body.visitor_email, 200)
  const visitorPhone  = str(body.visitor_phone, 40)
  const fittingType   = str(body.fitting_type, 40)
  const preferredDate = str(body.preferred_date, 40)
  const preferredTime = str(body.preferred_time, 20)
  const notes         = str(body.notes, 1000)

  const errors: string[] = []
  if (visitorName.length < 2) errors.push("Your name is required.")
  if (!visitorEmail) errors.push("Your email is required.")
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(visitorEmail)) errors.push("Enter a valid email.")
  if (fittingType && !VALID_FITTING_TYPES.has(fittingType)) errors.push("Invalid fitting type.")
  if (preferredTime && !VALID_TIMES.has(preferredTime)) errors.push("Invalid preferred time.")

  if (errors.length) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 })
  }

  // ── Resolve the shop server-side (never trust the posted id/name) ──
  // Also tells us whether the listing is claimed: claimed shops get the lead
  // forwarded to their owner directly (the free-claim promise).
  let dbShop: {
    id: string
    name: string
    slug: string
    owner_email: string | null
    claimed_at: string | null
  } | null = null
  if (shopSlug) {
    try {
      const admin = createAdminClient()
      const { data } = await admin
        .from("shops")
        .select("id,name,slug,owner_email,claimed_at")
        .eq("slug", shopSlug)
        .eq("status", "active")
        .maybeSingle()
      dbShop = data ?? null
    } catch (e) {
      log.warn("api/request-fitting", "shop lookup failed — falling back to posted values", { error: e })
    }
  }

  // ── Insert (RLS: anon INSERT only) ──
  // A lead is the asset — never lose one. We try with the shop link first; if
  // the shop_id no longer matches a row (FK violation 23503, e.g. shop removed
  // since page-load), we retry WITHOUT the link so the lead is still captured
  // (shop_name/slug are snapshotted, so it stays readable).
  try {
    const supabase = await createClient()
    const row = {
      shop_id: dbShop?.id ?? (shopId || null),
      shop_slug: dbShop?.slug ?? (shopSlug || null),
      shop_name: dbShop?.name ?? (shopName || null),
      visitor_name: visitorName,
      visitor_email: visitorEmail,
      visitor_phone: visitorPhone || null,
      fitting_type: fittingType || null,
      preferred_date: preferredDate || null,
      preferred_time: preferredTime || null,
      notes: notes || null,
    }
    const { error } = await supabase.from("fitting_requests").insert(row)
    if (error) {
      if (error.code === "23503" && row.shop_id) {
        log.warn("api/request-fitting", "shop_id FK miss — saving lead without link")
        const { error: retryError } = await supabase
          .from("fitting_requests")
          .insert({ ...row, shop_id: null })
        if (retryError) throw retryError
      } else {
        throw error
      }
    }
  } catch (e) {
    log.error("api/request-fitting", "insert failed", { error: e })
    return NextResponse.json(
      { error: "Something went wrong sending your request. Please try again." },
      { status: 500 },
    )
  }

  // ── Notify (best-effort; never blocks the save). Claimed shop → email goes
  // to the owner with the founder cc'd; otherwise founder-only as before. ──
  await notifyNewFittingRequest({
    shopName: dbShop?.name ?? (shopName || null),
    shopSlug: dbShop?.slug ?? (shopSlug || null),
    ownerEmail: dbShop?.claimed_at && dbShop.owner_email ? dbShop.owner_email : null,
    visitorName,
    visitorEmail,
    visitorPhone,
    fittingType,
    preferredDate,
    preferredTime,
    notes,
  })

  return NextResponse.json({ ok: true })
}
