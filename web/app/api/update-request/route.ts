import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { log } from "@/lib/logger"
import { rateLimitOk, clientIp } from "@/lib/rate-limit"
import { notifyUpdateRequest } from "@/lib/email"
import { str, isValidEmail, parseJsonBody, invalidBodyResponse, honeypotTripped } from "@/lib/api/validation"

/**
 * Public "request listing updates" endpoint (owner self-serve, v1 — no login).
 * POST /api/update-request → inserts into listing_update_requests
 * (quarantined, RLS anon INSERT only). The founder reviews in /admin →
 * Update Requests and applies changes by hand.
 *
 * Ownership is a soft signal here: a requester email that doesn't match the
 * shop's owner_email is still accepted but flagged in the admin card — never
 * rejected, so the endpoint can't be used to probe which emails own a shop.
 */

export async function POST(request: Request) {
  // 5 requests per IP per 10 minutes — an owner sends one, maybe two.
  if (!rateLimitOk(`update-request:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 },
    )
  }

  const body = await parseJsonBody(request)
  if (!body) return invalidBodyResponse()
  if (honeypotTripped(body)) return NextResponse.json({ ok: true })

  // ── Validate ──
  const slug      = str(body.shop_slug, 200)
  const name      = str(body.requester_name, 120)
  const email     = str(body.requester_email, 200)
  const hours     = str(body.hours, 300)
  const services  = str(body.services, 500)
  const pricing   = str(body.pricing, 300)
  const photosUrl = str(body.photos_url, 500)
  const message   = str(body.message, 1000)

  const errors: string[] = []
  if (!slug)            errors.push("Missing shop.")
  if (name.length < 2)  errors.push("Your name is required.")
  if (!email)           errors.push("Your email is required.")
  else if (!isValidEmail(email)) errors.push("Enter a valid email.")
  if (!hours && !services && !pricing && !photosUrl && !message) {
    errors.push("Tell us at least one thing to update.")
  }

  if (errors.length) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Resolve the shop server-side from the slug — never trust a posted id.
    const { data: shops, error: shopErr } = await supabase
      .from("shops")
      .select("id, name, slug")
      .eq("slug", slug)
      .eq("status", "active")
      .limit(1)
    if (shopErr) throw shopErr
    if (!shops || shops.length === 0) {
      return NextResponse.json({ error: "Shop not found." }, { status: 400 })
    }
    const shop = shops[0]

    const payload: Record<string, string> = {}
    if (hours)     payload.hours = hours
    if (services)  payload.services = services
    if (pricing)   payload.pricing = pricing
    if (photosUrl) payload.photos_url = photosUrl

    const { error } = await supabase.from("listing_update_requests").insert({
      shop_id: shop.id,
      requester_name: name,
      requester_email: email,
      payload,
      message: message || null,
    })
    if (error) throw error

    // Soft ownership check for the founder alert (service-role read —
    // owner_email is not anon-visible). Best-effort; the row is saved.
    let ownerMismatch = false
    try {
      const admin = createAdminClient()
      const { data: ownerRow } = await admin
        .from("shops")
        .select("owner_email")
        .eq("id", shop.id)
        .single()
      const ownerEmail = ownerRow?.owner_email
      ownerMismatch = Boolean(
        ownerEmail && ownerEmail.toLowerCase() !== email.toLowerCase(),
      )
    } catch {
      /* alert still goes out without the flag */
    }

    await notifyUpdateRequest({
      shopName: shop.name,
      shopSlug: shop.slug,
      requesterName: name,
      requesterEmail: email,
      ownerMismatch,
      fields: [
        { label: "Hours", value: hours },
        { label: "Services", value: services },
        { label: "Pricing", value: pricing },
        { label: "Photos/link", value: photosUrl },
      ].filter((f) => f.value),
      message: message || null,
    })
  } catch (e) {
    log.error("api/update-request", "insert failed", { error: e })
    return NextResponse.json(
      { error: "Something went wrong sending your request. Please try again." },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
