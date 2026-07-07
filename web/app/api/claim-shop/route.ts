import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { log } from "@/lib/logger"
import { rateLimitOk, clientIp } from "@/lib/rate-limit"
import { sendClaimConfirmation } from "@/lib/email"
import { str, isValidEmail, parseJsonBody, invalidBodyResponse, honeypotTripped } from "@/lib/api/validation"

/**
 * Public "Claim this shop" endpoint — the outreach engine's landing action.
 * POST /api/claim-shop → inserts into shop_claims (quarantined, RLS anon
 * INSERT only). The founder reviews claims in /admin; approval stamps
 * claimed_at + owner_email on the shop. Claiming is free — the Verified
 * badge stays a paid tier.
 */

export async function POST(request: Request) {
  // 5 claims per IP per 10 minutes — an owner claims once.
  if (!rateLimitOk(`claim-shop:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 },
    )
  }

  const body = await parseJsonBody(request)
  if (!body) return invalidBodyResponse()
  if (honeypotTripped(body)) return NextResponse.json({ ok: true })

  // ── Validate ──
  const slug   = str(body.shop_slug, 200)
  const name   = str(body.claimant_name, 120)
  const role   = str(body.claimant_role, 60)
  const email  = str(body.claimant_email, 200)
  const phone  = str(body.claimant_phone, 40)
  const message = str(body.message, 1000)
  const source = str(body.source, 20) === "outreach" ? "outreach" : "listing_page"

  const errors: string[] = []
  if (!slug)            errors.push("Missing shop.")
  if (name.length < 2)  errors.push("Your name is required.")
  if (!email)           errors.push("Your email is required.")
  else if (!isValidEmail(email)) errors.push("Enter a valid email.")

  if (errors.length) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Resolve the shop server-side from the slug — never trust a posted id.
    const { data: shops, error: shopErr } = await supabase
      .from("shops")
      .select("id, name")
      .eq("slug", slug)
      .eq("status", "active")
      .limit(1)
    if (shopErr) throw shopErr
    if (!shops || shops.length === 0) {
      return NextResponse.json({ error: "Shop not found." }, { status: 400 })
    }

    const { error } = await supabase.from("shop_claims").insert({
      shop_id: shops[0].id,
      claimant_name: name,
      claimant_role: role || null,
      claimant_email: email,
      claimant_phone: phone || null,
      message: message || null,
      source,
    })
    if (error) throw error

    // Best-effort: confirm to the claimant + invite them to book the intro
    // call (founder cc'd as the new-claim alert). Never fails the request.
    await sendClaimConfirmation({
      shopName: shops[0].name,
      claimantName: name,
      claimantEmail: email,
    })
  } catch (e) {
    log.error("api/claim-shop", "insert failed", { error: e })
    return NextResponse.json(
      { error: "Something went wrong sending your claim. Please try again." },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
