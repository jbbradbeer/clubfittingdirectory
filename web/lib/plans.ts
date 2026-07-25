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

/**
 * The Verified offer — the five perks a paying shop gets. Single source for
 * the claim page, /for-shops, the pay page, and the upsell emails, so the
 * pitch never drifts between surfaces. `short` is the one-line version for
 * tight layouts and email bullets.
 */
export const VERIFIED_PERKS = [
  {
    title: "The Verified badge",
    short: "The Verified badge — the only paid marker golfers see",
    body: "The only paid marker on the directory — a green badge on your listing and on every card golfers scan. It signals a real, vetted fitting operation.",
  },
  {
    title: "Featured placement",
    short: "Featured placement — top of your state, city, and category pages",
    body: "Your shop ranks at the top of your state, city, and category pages — above every unpaid shop nearby. Golfers comparing fitters see you first.",
  },
  {
    title: "AI Search Optimization",
    short: "AI Search Optimization — we tune your listing so AI engines cite you",
    body: "Golfers now ask ChatGPT and Google AI who fits clubs near them. We hand-tune your listing's facts, services, and structured data so AI engines cite your shop in those answers.",
  },
  {
    title: "Gear Shelf newsletter rotation",
    short: "Gear Shelf rotation — The Tuxedo Collective newsletter (6,600 golfers)",
    body: "A featured slot in The Tuxedo Collective newsletter — 6,600 golf subscribers who care about playing better equipment.",
  },
  {
    title: "Priority listing updates",
    short: "Priority listing updates — corrections applied by hand, fast",
    body: "Hours, services, pricing, photos, your booking link — send corrections any time and we apply them by hand, fast.",
  },
] as const

