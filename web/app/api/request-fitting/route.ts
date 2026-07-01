import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { notifyNewFittingRequest } from "@/lib/email"
import { log } from "@/lib/logger"

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

  // ── Insert (RLS: anon INSERT only) ──
  // A lead is the asset — never lose one. We try with the shop link first; if
  // the shop_id no longer matches a row (FK violation 23503, e.g. shop removed
  // since page-load), we retry WITHOUT the link so the lead is still captured
  // (shop_name/slug are snapshotted, so it stays readable).
  try {
    const supabase = await createClient()
    const row = {
      shop_id: shopId || null,
      shop_slug: shopSlug || null,
      shop_name: shopName || null,
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

  // ── Notify the founder (best-effort; never blocks the save) ──
  await notifyNewFittingRequest({
    shopName: shopName || null,
    shopSlug: shopSlug || null,
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
