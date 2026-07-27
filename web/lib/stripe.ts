import Stripe from "stripe"
import type { PlanKey } from "@/lib/plans"
import { PLANS } from "@/lib/plans"

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
 * Resolve the Verified price for a plan (monthly $49 or annual $499).
 *
 * STRIPE_PRICE_ID_MONTHLY / STRIPE_PRICE_ID_ANNUAL each accept either a price
 * id (price_…) or a product id (prod_…). For a product id, active prices are
 * listed and a recurring price whose interval matches the plan is preferred;
 * otherwise the first active price is used. The result also carries whether
 * the price is recurring, so checkout can pick mode "payment" vs
 * "subscription" to match.
 *
 * Cached per plan per instance — a price only changes with a config change.
 * Returns null when unset or unresolvable; callers surface a clear error.
 */
export type VerifiedPrice = { id: string; recurring: boolean }

const PLAN_ENV: Record<PlanKey, string> = {
  monthly: "STRIPE_PRICE_ID_MONTHLY",
  annual: "STRIPE_PRICE_ID_ANNUAL",
}

const cachedPrices = new Map<PlanKey, VerifiedPrice>()

export async function getVerifiedPrice(plan: PlanKey): Promise<VerifiedPrice | null> {
  const configured = process.env[PLAN_ENV[plan]]
  if (!configured) return null

  const cached = cachedPrices.get(plan)
  if (cached) return cached

  if (configured.startsWith("price_")) {
    const price = await getStripe().prices.retrieve(configured)
    const resolved = { id: price.id, recurring: price.type === "recurring" }
    cachedPrices.set(plan, resolved)
    return resolved
  }

  if (configured.startsWith("prod_")) {
    const { data: prices } = await getStripe().prices.list({
      product: configured,
      active: true,
      limit: 10,
    })
    if (prices.length === 0) return null
    const chosen =
      prices.find(
        (p) => p.type === "recurring" && p.recurring?.interval === PLANS[plan].interval,
      ) ?? prices[0]
    const resolved = { id: chosen.id, recurring: chosen.type === "recurring" }
    cachedPrices.set(plan, resolved)
    return resolved
  }

  return null
}
