/**
 * Verified pricing plans — the single source of truth for what the badge
 * costs. Every dollar figure shown in copy, email, or the admin MRR math
 * derives from here; the actual charge amounts live on the matching Stripe
 * prices (STRIPE_PRICE_ID_MONTHLY / STRIPE_PRICE_ID_ANNUAL), which must be
 * kept in sync with these numbers.
 */

export type PlanKey = "monthly" | "annual"

export const PLANS = {
  monthly: {
    amountCents: 4900,
    label: "$49/month",
    priceDisplay: "$49",
    per: "/month",
    interval: "month",
  },
  annual: {
    amountCents: 49900,
    label: "$499/year",
    priceDisplay: "$499",
    per: "/year",
    interval: "year",
  },
} as const satisfies Record<
  PlanKey,
  {
    amountCents: number
    label: string
    priceDisplay: string
    per: string
    interval: "month" | "year"
  }
>

export function isPlanKey(value: unknown): value is PlanKey {
  return value === "monthly" || value === "annual"
}
