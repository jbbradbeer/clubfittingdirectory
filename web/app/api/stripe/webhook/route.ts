import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { activateVerifiedShop } from "@/lib/verified"
import { sendPaymentReceivedEmail } from "@/lib/email"
import { log } from "@/lib/logger"

/**
 * Stripe webhook — the automation that replaces the manual activation runbook.
 * POST /api/stripe/webhook
 *
 * On checkout.session.completed (paid): record the payment in shop_payments,
 * activate/extend the Verified badge, and send the welcome email (founder
 * cc'd = payment alert).
 *
 * On invoice.paid with billing_reason "subscription_cycle" (only fires when
 * the configured Stripe price is recurring): a renewal auto-charge — record
 * it and extend the badge another year. The first subscription invoice
 * (billing_reason "subscription_create") is skipped; the session handler
 * covers it.
 *
 * SECURITY: every request must carry a valid Stripe signature over the RAW
 * request body (STRIPE_WEBHOOK_SECRET). No rate limiting — only
 * Stripe-signed requests get past the check.
 *
 * IDEMPOTENCY: shop_payments.stripe_session_id is UNIQUE. The insert runs
 * BEFORE activation; a replayed event hits the unique constraint and returns
 * 200 without touching the shop, so an expiry can never be double-extended.
 */

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    log.error("api/stripe-webhook", "STRIPE_WEBHOOK_SECRET not set")
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 })
  }

  // Raw body is required for signature verification — never JSON-parse first.
  const rawBody = await request.text()
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = await getStripe().webhooks.constructEventAsync(rawBody, signature, secret)
  } catch (e) {
    log.warn("api/stripe-webhook", "signature verification failed", { error: e })
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 })
  }

  // Subscription renewal auto-charges (recurring price only).
  if (event.type === "invoice.paid") {
    return handleRenewalInvoice(event.data.object as Stripe.Invoice)
  }

  // Everything except a completed, paid checkout is acknowledged and ignored.
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  if (session.payment_status !== "paid") {
    log.info("api/stripe-webhook", "session completed but not paid — ignoring", {
      session: session.id,
      paymentStatus: session.payment_status,
    })
    return NextResponse.json({ received: true })
  }

  const shopId = session.metadata?.shop_id
  const shopSlug = session.metadata?.shop_slug
  if (!shopId || !shopSlug) {
    // A session we didn't create (or created without metadata) — log loudly;
    // returning 200 stops Stripe from retrying something we can't handle.
    log.error("api/stripe-webhook", "paid session missing shop metadata", {
      session: session.id,
    })
    return NextResponse.json({ received: true })
  }

  try {
    const supabase = createAdminClient()

    // Idempotency gate: insert the payment row first. "23505" = unique
    // violation → this event was already processed.
    const { error: insertErr } = await supabase.from("shop_payments").insert({
      shop_id: shopId,
      stripe_session_id: session.id,
      stripe_payment_intent:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      amount_total: session.amount_total,
      customer_email: session.customer_details?.email ?? null,
    })
    if (insertErr) {
      if (insertErr.code === "23505") {
        log.info("api/stripe-webhook", "duplicate event — already processed", {
          session: session.id,
        })
        return NextResponse.json({ received: true })
      }
      throw insertErr
    }

    const slug = await activateVerifiedShop(shopSlug)
    log.info("api/stripe-webhook", "payment processed, badge activated", {
      slug,
      session: session.id,
      amount: session.amount_total,
    })

    // Best-effort welcome email (founder cc = payment alert). Never fails the
    // webhook — the payment row + activation are already committed.
    const ownerEmail = session.customer_details?.email
    if (ownerEmail) {
      const { data: shop } = await supabase
        .from("shops")
        .select("name")
        .eq("slug", slug)
        .single()
      await sendPaymentReceivedEmail({
        shopName: shop?.name ?? slug,
        slug,
        ownerEmail,
      })
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    // 500 → Stripe retries with backoff; the idempotency gate makes the retry safe.
    log.error("api/stripe-webhook", "processing failed", { error: e, session: session.id })
    return NextResponse.json({ error: "Processing failed." }, { status: 500 })
  }
}

/* ── Renewal auto-charge (subscription mode only) ──
   The shop is identified by the subscription metadata set at checkout
   (subscription_data.metadata), snapshotted onto the invoice. Idempotency
   reuses shop_payments.stripe_session_id with the invoice id. */
async function handleRenewalInvoice(invoice: Stripe.Invoice) {
  // First subscription invoice is covered by checkout.session.completed.
  if (invoice.billing_reason !== "subscription_cycle") {
    return NextResponse.json({ received: true })
  }

  const meta = invoice.parent?.subscription_details?.metadata
  const shopId = meta?.shop_id
  const shopSlug = meta?.shop_slug
  if (!shopId || !shopSlug || !invoice.id) {
    log.error("api/stripe-webhook", "renewal invoice missing shop metadata", {
      invoice: invoice.id,
    })
    return NextResponse.json({ received: true })
  }

  try {
    const supabase = createAdminClient()
    const { error: insertErr } = await supabase.from("shop_payments").insert({
      shop_id: shopId,
      stripe_session_id: invoice.id, // idempotency key (same UNIQUE column)
      stripe_payment_intent: null,
      amount_total: invoice.amount_paid,
      customer_email: invoice.customer_email ?? null,
    })
    if (insertErr) {
      if (insertErr.code === "23505") {
        log.info("api/stripe-webhook", "duplicate renewal invoice — already processed", {
          invoice: invoice.id,
        })
        return NextResponse.json({ received: true })
      }
      throw insertErr
    }

    const slug = await activateVerifiedShop(shopSlug)
    log.info("api/stripe-webhook", "renewal processed, badge extended", {
      slug,
      invoice: invoice.id,
      amount: invoice.amount_paid,
    })
    return NextResponse.json({ received: true })
  } catch (e) {
    log.error("api/stripe-webhook", "renewal processing failed", {
      error: e,
      invoice: invoice.id,
    })
    return NextResponse.json({ error: "Processing failed." }, { status: 500 })
  }
}
