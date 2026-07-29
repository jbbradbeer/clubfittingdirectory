import type { Shop } from "@/types/shop"

/**
 * Which listing pages show the AI fitting assistant. This is a hand-picked
 * demo allowlist — the widget is the live sales demo for the Shop Site +
 * Growth tier, not a site-wide feature. Add a slug here (and redeploy) to
 * turn it on for a shop. Comma-separated env override: ASSISTANT_SLUGS.
 */
const DEFAULT_ASSISTANT_SLUGS = [
  "no-bogeys-golf-laguna-beach-ca",
  "the-golf-improvement-center-warner-robins-ga",
  "a-to-z-golf-coaching-fitting-center-hampton-ga",
]

export function assistantSlugs(): string[] {
  const env = process.env.ASSISTANT_SLUGS
  if (env) return env.split(",").map((s) => s.trim()).filter(Boolean)
  return DEFAULT_ASSISTANT_SLUGS
}

export function assistantEnabledFor(slug: string): boolean {
  if (!process.env.ANTHROPIC_API_KEY) return false
  return assistantSlugs().includes(slug)
}

/** The shop facts the assistant is allowed to answer from — nothing else. */
export function shopContext(shop: Shop): string {
  const hours = shop.working_hours
    ? Object.entries(shop.working_hours)
        .map(([day, v]) => `${day}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("; ")
    : "not listed"
  const price =
    shop.fitting_price_min && shop.fitting_price_max
      ? `$${shop.fitting_price_min}–$${shop.fitting_price_max}`
      : shop.fitting_price_min
        ? `from $${shop.fitting_price_min}`
        : "not listed — the shop confirms pricing directly"
  return JSON.stringify({
    name: shop.name,
    type: shop.shop_type,
    address: [shop.street, shop.city, shop.state, shop.postal_code].filter(Boolean).join(", "),
    phone: shop.phone ?? "not listed",
    website: shop.website ?? "not listed",
    rating: shop.rating ? `${shop.rating} stars (${shop.reviews ?? 0} Google reviews)` : "not listed",
    services: shop.services_array.length ? shop.services_array : shop.services ?? "not listed",
    offers_fitting: shop.offers_fitting,
    fitting_environment: shop.fitting_environment ?? "not listed",
    launch_monitors: shop.launch_monitors.length ? shop.launch_monitors : "not listed",
    fitting_price: price,
    hours,
    open_on_weekends: shop.open_on_weekends,
  })
}

export function systemPrompt(shop: Shop): string {
  return `You are the friendly booking assistant for ${shop.name}, a golf club fitting shop, embedded on the shop's page at clubfittingdirectory.com.

Shop facts (the ONLY source of truth — never invent details not listed here):
${shopContext(shop)}

Rules:
- Answer questions about this shop's services, hours, location, pricing, and fittings using only the facts above. If a fact says "not listed", say you don't have that detail and suggest calling the shop or asking in a fitting request.
- When the visitor wants to book, is ready to schedule, or asks how to get fitted: tell them to tap the "Request a Fitting" button right below this chat — the shop will confirm a time with them directly.
- Keep answers to 1-3 short sentences. Warm, plainspoken, no jargon.
- Stay on topic: this shop and golf club fitting. Politely decline anything else.
- Never make up prices, availability, or promises on the shop's behalf.`
}
