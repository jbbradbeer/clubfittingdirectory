import { NextResponse } from "next/server"
import { getStripe, getVerifiedPrice } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { log } from "@/lib/logger"
import { rateLimitOk, clientIp } from "@/lib/rate-limit"
import { str, parseJsonBody, invalidBodyResponse } from "@/lib/api/validation"
import { SITE_URL } from "@/lib/constants"

/**
 * Create a Stripe Checkout Session for the Founding Verified annual payment.
 * POST /api/checkout { shop_slug } → { url }
 *
 * Gate: the shop must be active AND claimed (claimed_at is only ever stamped
 * by the admin approveClaim action, so "claimed" means the founder has
 * verified this owner — the claim-first / pay-after rule). Sessions are
 * created fresh on each click because Stripe Checkout URLs expire after 24h.
 */

/* Renewals inside this window are allowed (expiry extends from the current
   expiry, so no paid time is lost). Outside it, block to prevent an
   accidental double payment on a freshly verified shop. */
const EARLY_RENEW_WINDOW_DAYS = 60

export async function POST(request: Request) {
  if (!rateLimitOk(`checkout:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 },
    )
  }

  const body = await parseJsonBody(request)
  if (!body) return invalidBodyResponse()

  const slug = str(body.shop_slug, 200).toLowerCase()
  if (!slug) return NextResponse.json({ error: "Missing shop." }, { status: 400 })

  try {
    // Accepts price_… or prod_… (resolved to the product's active price).
    const price = await getVerifiedPrice()
    if (!price) {
      log.error("api/checkout", "STRIPE_PRICE_ID unset or has no active price")
      return NextResponse.json(
        { error: "Payments aren't configured yet. Please reply to our email instead." },
        { status: 500 },
      )
    }

    // Service-role read: claimed_at / owner_email aren't in the public
    // RLS-visible column set, and the gate must be checked server-side.
    const supabase = createAdminClient()
    const { data: shop, error } = await supabase
      .from("shops")
      .select("id, name, slug, status, claimed_at, owner_email, listing_tier, verified_expires_at")
      .eq("slug", slug)
      .single()

    if (error || !shop || shop.status !== "active") {
      return NextResponse.json({ error: "Shop not found." }, { status: 400 })
    }
    if (!shop.claimed_at) {
      return NextResponse.json(
        { error: "This listing hasn't been claimed and verified yet. Claim it first." },
        { status: 400 },
      )
    }

    // Currently Verified with plenty of runway → block accidental double-pay.
    if (shop.listing_tier === "verified" && shop.verified_expires_at) {
      const daysLeft =
        (new Date(shop.verified_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      if (daysLeft > EARLY_RENEW_WINDOW_DAYS) {
        return NextResponse.json(
          { error: "This shop is already Verified. Renewal opens 60 days before expiry." },
          { status: 400 },
        )
      }
    }

    // In dev, bounce back to localhost so the test-mode flow stays local.
    const origin =
      process.env.NODE_ENV === "development" ? new URL(request.url).origin : SITE_URL

    // A recurring price needs mode "subscription"; metadata is mirrored onto
    // the subscription so renewal invoices can be traced back to the shop.
    const session = await getStripe().checkout.sessions.create({
      mode: price.recurring ? "subscription" : "payment",
      line_items: [{ price: price.id, quantity: 1 }],
      ...(shop.owner_email ? { customer_email: shop.owner_email } : {}),
      metadata: { shop_id: shop.id, shop_slug: shop.slug },
      ...(price.recurring
        ? { subscription_data: { metadata: { shop_id: shop.id, shop_slug: shop.slug } } }
        : {}),
      success_url: `${origin}/onboard/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/onboard/pay/${shop.slug}`,
    })

    log.info("api/checkout", "session created", { slug: shop.slug, session: session.id })
    return NextResponse.json({ url: session.url })
  } catch (e) {
    log.error("api/checkout", "session creation failed", { error: e, slug })
    return NextResponse.json(
      { error: "Something went wrong starting the payment. Please try again." },
      { status: 500 },
    )
  }
}
