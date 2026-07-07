import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SHOP_TYPES } from "@/lib/shop-types"
import { log } from "@/lib/logger"
import { rateLimitOk, clientIp } from "@/lib/rate-limit"
import { US_STATE_CODES } from "@/lib/constants"
import { str, isValidEmail, parseJsonBody, invalidBodyResponse, honeypotTripped } from "@/lib/api/validation"

/**
 * Public "Submit a Shop" endpoint.
 * POST /api/submit-shop  → inserts a row into shop_submissions (quarantined,
 * review_status='new'). RLS allows anon INSERT only, so this can never touch
 * live listings.
 */

const VALID_SHOP_TYPES = new Set(SHOP_TYPES.map((t) => t.dbType))

export async function POST(request: Request) {
  // Same throttle the other public write routes use — the honeypot alone
  // doesn't stop a targeted script.
  if (!rateLimitOk(`submit-shop:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    log.warn("api/submit-shop", "rate limited", { ip: clientIp(request) })
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
  }

  const body = await parseJsonBody(request)
  if (!body) return invalidBodyResponse()
  if (honeypotTripped(body)) return NextResponse.json({ ok: true })

  // ── Validate ──
  const name       = str(body.name, 120)
  const city       = str(body.city, 80)
  const stateCode  = str(body.state_code, 2).toUpperCase()
  const shopType   = str(body.shop_type, 60)
  const website    = str(body.website, 300)
  const phone      = str(body.phone, 40)
  const notes      = str(body.notes, 1000)
  const email      = str(body.submitter_email, 200)
  const offersFitting = body.offers_fitting === true

  const errors: string[] = []
  if (name.length < 2)            errors.push("Shop name is required.")
  if (city.length < 2)            errors.push("City is required.")
  if (!US_STATE_CODES.has(stateCode)) errors.push("A valid US state is required.")
  if (shopType && !VALID_SHOP_TYPES.has(shopType)) errors.push("Invalid shop type.")
  if (!email)                     errors.push("Your email is required.")
  else if (!isValidEmail(email)) errors.push("Enter a valid email.")

  if (errors.length) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 })
  }

  // ── Insert (RLS: anon INSERT only) ──
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("shop_submissions").insert({
      name,
      city,
      state_code: stateCode,
      shop_type: shopType || null,
      website: website || null,
      phone: phone || null,
      offers_fitting: offersFitting,
      notes: notes || null,
      submitter_email: email || null,
    })
    if (error) throw error
  } catch (e) {
    log.error("api/submit-shop", "insert failed", { error: e })
    return NextResponse.json(
      { error: "Something went wrong saving your submission. Please try again." },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
