/**
 * Featured pricing plans — the single source of truth for what the paid tier
 * costs. Every dollar figure shown in copy, email, or the admin MRR math
 * derives from here; the actual charge amounts live on the matching Stripe
 * prices (STRIPE_PRICE_ID_MONTHLY / STRIPE_PRICE_ID_ANNUAL), which must be
 * kept in sync with these numbers.
 *
 * The Verified badge is FREE — it is granted when an owner claims their
 * listing and the claim is approved. Shops pay only for Featured.
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

/** What the annual plan saves vs. 12 months of monthly — derived, never hand-typed. */
export const ANNUAL_SAVINGS = {
  amountCents: PLANS.monthly.amountCents * 12 - PLANS.annual.amountCents,
  display: `$${(PLANS.monthly.amountCents * 12 - PLANS.annual.amountCents) / 100}`,
  note: "2 months free",
} as const

export function isPlanKey(value: unknown): value is PlanKey {
  return value === "monthly" || value === "annual"
}

/**
 * What every claimed shop gets for free — forever. Single source for the
 * claim page, /for-shops, and the approval email, so the free/paid line
 * never drifts between surfaces.
 */
export const FREE_PERKS = [
  {
    title: "The Verified badge",
    short: "The Verified badge — earned, never bought",
    body: "We hand-verify that you actually own or run the shop when your claim is approved — then the green badge goes on your listing and on every card golfers scan. Free, and it stays.",
  },
  {
    title: "Lead forwarding",
    short: "Lead forwarding — fitting requests straight to your inbox",
    body: "Every fitting request golfers submit through your listing page is forwarded straight to your inbox. No charge, no middleman.",
  },
  {
    title: "Listing corrections",
    short: "Listing corrections — wrong hours or services fixed by hand",
    body: "Wrong hours, missing services, an old phone number — tell us and we fix it by hand, usually within a day or two.",
  },
] as const

/**
 * Web-presence services — the productized "we build and run your shop's
 * website" offer pitched to shops with broken or missing sites (see
 * scripts/website_audit.py). Prices stay "from …" until validated on the
 * first sales calls — never print a firmer number anywhere public.
 */
export const SERVICE_TIERS = [
  {
    name: "Shop Site",
    price: "from $750",
    cadence: "one-time build, plus a small monthly care plan",
    tagline: "A real website for your shop — built, hosted, and kept alive.",
    bullets: [
      "A fast 1–3 page site: services, pricing, hours, Google reviews, map",
      "A \"request a fitting\" form that lands straight in your inbox",
      "Domain and security (SSL) sorted — no more browser warnings",
      "Hosting, edits, and uptime handled on the care plan",
    ],
  },
  {
    name: "Shop Site + Growth",
    price: "from $250/month",
    cadence: "monthly, cancel anytime",
    tagline: "The site plus the local-search basics that bring golfers in.",
    bullets: [
      "Everything in Shop Site",
      "Google Business Profile posts and cleanup",
      "A review-request flow so happy golfers actually leave reviews",
      "Featured placement on clubfittingdirectory.com included",
    ],
  },
] as const

/**
 * The Featured offer — the four perks a paying shop gets on top of the free
 * plan. Single source for the claim page, /for-shops, the pay page, and the
 * upsell emails. `short` is the one-line version for tight layouts and
 * email bullets.
 */
export const FEATURED_PERKS = [
  {
    title: "Featured placement",
    short: "Featured placement — top of your state, city, and category pages",
    body: "Your shop ranks at the top of your state, city, and category pages — above every non-featured shop nearby. Golfers comparing fitters see you first.",
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
    body: "Hours, services, pricing, photos, your booking link — send updates any time and we apply them by hand, first in the queue.",
  },
] as const
