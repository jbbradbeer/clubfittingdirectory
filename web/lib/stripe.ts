import Stripe from "stripe"

/**
 * Lazy Stripe client singleton.
 *
 * SECURITY / ENV: STRIPE_SECRET_KEY is a server-only env var (never
 * NEXT_PUBLIC_). Use the test-mode key (sk_test_…) in web/.env.local and the
 * live key in Vercel → Settings → Environment Variables. Constructed lazily so
 * builds and pages that never touch Stripe don't need the key at all.
 */

let stripe: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY (server-only env var).")
  }
  if (!stripe) stripe = new Stripe(key)
  return stripe
}

/**
 * Resolve the Founding Verified price for Checkout.
 *
 * STRIPE_PRICE_ID accepts either a price id (price_…) or a product id
 * (prod_…) — the founder's existing product from the outreach plan is a
 * prod_ id. For a product id, active prices are listed and a one-time price
 * is preferred (simplest renewal story); otherwise the first active price is
 * used. The result also carries whether the price is recurring, so checkout
 * can pick mode "payment" vs "subscription" to match.
 *
 * Cached per instance — the price only changes with a config change.
 * Returns null when unset or unresolvable; callers surface a clear error.
 */
export type VerifiedPrice = { id: string; recurring: boolean }

let cachedPrice: VerifiedPrice | null = null

export async function getVerifiedPrice(): Promise<VerifiedPrice | null> {
  const configured = process.env.STRIPE_PRICE_ID
  if (!configured) return null
  if (cachedPrice) return cachedPrice

  if (configured.startsWith("price_")) {
    const price = await getStripe().prices.retrieve(configured)
    cachedPrice = { id: price.id, recurring: price.type === "recurring" }
    return cachedPrice
  }

  if (configured.startsWith("prod_")) {
    const { data: prices } = await getStripe().prices.list({
      product: configured,
      active: true,
      limit: 10,
    })
    if (prices.length === 0) return null
    const chosen = prices.find((p) => p.type === "one_time") ?? prices[0]
    cachedPrice = { id: chosen.id, recurring: chosen.type === "recurring" }
    return cachedPrice
  }

  return null
}
