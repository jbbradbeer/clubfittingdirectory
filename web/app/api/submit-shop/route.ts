import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SHOP_TYPES } from "@/lib/shop-types"
import { log } from "@/lib/logger"

/**
 * Public "Submit a Shop" endpoint.
 * POST /api/submit-shop  → inserts a row into shop_submissions (quarantined,
 * review_status='new'). RLS allows anon INSERT only, so this can never touch
 * live listings.
 */

const US_STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
])

const VALID_SHOP_TYPES = new Set(SHOP_TYPES.map((t) => t.dbType))

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

  // Honeypot: a hidden field real users never fill. Bots that fill everything
  // trip it. Pretend success so the bot doesn't learn it was caught.
  if (str(body.company_website, 200)) {
    return NextResponse.json({ ok: true })
  }

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
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push("Enter a valid email.")

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
