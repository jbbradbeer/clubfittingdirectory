import type { FaqItem } from "@/components/seo/FaqSection"
import type { Shop } from "@/types/shop"
import { ownershipLabel, formatFittingPrice } from "@/lib/fitter-classification"

/**
 * Generates location/category-specific intro copy and FAQs for collection pages.
 * Interpolating the place/category name keeps each page's text unique (avoiding
 * the "thin / duplicate content" risk of hundreds of near-identical pages) while
 * staying genuinely useful and accurate.
 */

/* ── Freshness stamp ──
   Evaluated when a page is BUILT (each deploy + every 30-day ISR refresh), so
   it reflects real rebuild dates instead of churning per request. Year-stamped,
   comparison-framed titles are the format that wins both Google SERPs and AI
   citations (tasks/research/geo-ai-search-2026-07.md). */
export const DIRECTORY_YEAR = new Date().getFullYear()
export const LAST_UPDATED_LABEL = new Date().toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
})

/* ── Data-driven intro paragraphs ──
   Composed from each page's REAL shop data (launch monitor brands, published
   prices, ownership) so every one of the ~1,100 city pages reads differently.
   A clause only renders when the underlying data exists — no invented claims,
   and data-poor pages just get a shorter honest paragraph. */

function monitorBrands(shops: CollectionShop[]): string[] {
  const counts: Record<string, number> = {}
  for (const s of shops) {
    for (const m of s.launch_monitors ?? []) counts[m] = (counts[m] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([brand]) => brand)
}

function priceRange(shops: CollectionShop[]): { min: number; max: number } | null {
  const mins = shops.map((s) => s.fitting_price_min).filter((n): n is number => n != null && n > 0)
  if (!mins.length) return null
  const maxes = shops.map((s) => s.fitting_price_max).filter((n): n is number => n != null && n > 0)
  return { min: Math.min(...mins), max: maxes.length ? Math.max(...maxes) : Math.min(...mins) }
}

function listWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ""
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

/** Shared data sentences appended to both city and state intros. */
function dataSentences(shops: CollectionShop[]): string {
  const parts: string[] = []
  const brands = monitorBrands(shops).slice(0, 4)
  if (brands.length) {
    parts.push(`Launch monitors on record here include ${listWords(brands)}.`)
  }
  const price = priceRange(shops)
  if (price) {
    parts.push(
      price.max > price.min
        ? `Published fitting prices run from $${price.min} to $${price.max}.`
        : `Published fitting prices start at $${price.min}.`,
    )
  }
  const independent = shops.filter((s) => s.ownership_type === "independent").length
  if (independent > 0 && shops.length > 1) {
    parts.push(
      independent === shops.length
        ? `Every shop listed is independently owned.`
        : `${independent} of the ${shops.length} shops are independently owned.`,
    )
  }
  return parts.join(" ")
}

export function stateIntro(stateName: string, shops: CollectionShop[], cityCount: number): string {
  const opening = `Comparing golf club fitters in ${stateName}? Browse ${shops.length} fitters, retailers, and simulators across ${cityCount} ${
    cityCount === 1 ? "city" : "cities"
  }, with fitting prices, launch monitor technology, and ownership shown where we've verified them.`
  const data = dataSentences(shops)
  const closing = `Compare the listings below to find the right fit close to home.`
  return [opening, data, closing].filter(Boolean).join(" ")
}

export function cityIntro(city: string, stateName: string, shops: CollectionShop[]): string {
  const opening = `Find golf club fitting in ${city}, ${stateName}. We list ${shops.length} ${
    shops.length === 1 ? "shop" : "shops"
  } offering custom club fitting, equipment retail, and simulator sessions.`
  const data = dataSentences(shops)
  const closing = `Compare ratings, prices, and services to book the fitting that suits your game.`
  return [opening, data, closing].filter(Boolean).join(" ")
}

export function categoryIntro(label: string, shops: CollectionShop[], stateCount: number): string {
  const opening = `Browse ${shops.length} ${label.toLowerCase()} across ${stateCount} ${
    stateCount === 1 ? "state" : "states"
  }, with fitting prices, launch monitor technology, and ownership shown where we've verified them.`
  const data = dataSentences(shops)
  const closing = `Compare ratings, services, and locations to find the right option for your game.`
  return [opening, data, closing].filter(Boolean).join(" ")
}

/* ── Data-driven FAQ helpers ──
   A minimal structural type so collection pages can pass their shop arrays
   straight in. Answering with each page's REAL data (top-rated shop, fitting
   count) makes every page unique — and gives Google/AI engines a concrete,
   quotable answer instead of boilerplate. */
export interface ShopFact {
  name: string
  rating: number | null
  offers_fitting: boolean | null
}

/** ShopFact plus the enrichment columns the collection pages already fetch
    (CARD_FIELDS) — used to build data-driven intros and FAQs. All optional so
    plain ShopFact arrays still type-check. */
export interface CollectionShop extends ShopFact {
  launch_monitors?: string[] | null
  fitting_price_min?: number | null
  fitting_price_max?: number | null
  ownership_type?: string | null
}

function topRatedFaq(place: string, shops: ShopFact[]): FaqItem | null {
  const rated = shops.filter((s) => s.rating != null && s.rating >= 4)
  if (!rated.length) return null
  const top = rated.reduce((a, b) => ((b.rating ?? 0) > (a.rating ?? 0) ? b : a))
  return {
    question: `Who is the highest-rated club fitter in ${place}?`,
    answer: `${top.name} is currently the highest-rated shop listed in ${place}, with a ${top.rating}/5 rating. Ratings change as new reviews come in, so compare the listings above before you book.`,
  }
}

function fittingCountFaq(place: string, shops: ShopFact[]): FaqItem | null {
  const fitting = shops.filter((s) => s.offers_fitting).length
  if (!fitting) return null
  return {
    question: `How many shops in ${place} offer club fitting?`,
    answer: `${fitting} of the ${shops.length} ${place} ${
      shops.length === 1 ? "shop" : "shops"
    } in this directory explicitly ${fitting === 1 ? "offers" : "offer"} club fitting. Others focus on retail, repair, lessons, or simulator time — check each listing's services for details.`,
  }
}

/** Local price FAQ built from this page's actual published prices — a concrete,
    quotable answer ("in Austin fittings start at $75") that boilerplate can't
    give. Returns null when no shop on the page has a published price. */
function localPriceFaq(place: string, shops: CollectionShop[]): FaqItem | null {
  const price = priceRange(shops)
  if (!price) return null
  const spread =
    price.max > price.min
      ? `published fitting prices range from $${price.min} to $${price.max}`
      : `published fitting prices start at $${price.min}`
  return {
    question: `How much does a golf club fitting cost in ${place}?`,
    answer: `Among the ${place} shops in this directory that publish prices, ${spread}. Nationally, a single-club fitting typically runs $50–$150 and a full-bag fitting more; many shops credit the fee toward clubs you buy. Check each listing for its current menu.`,
  }
}

/** Launch-monitor FAQ from this page's real tech data. */
function localTechFaq(place: string, shops: CollectionShop[]): FaqItem | null {
  const brands = monitorBrands(shops)
  if (!brands.length) return null
  return {
    question: `What launch monitor technology do ${place} club fitters use?`,
    answer: `Shops in ${place} with verified fitting technology use ${listWords(brands.slice(0, 5))}. The listings above show each shop's equipment where we've confirmed it — worth checking, since the launch monitor drives the quality of your fitting data.`,
  }
}

/* ── FAQs ── */
function baseFittingFaqs(opts: { skipCost?: boolean } = {}): FaqItem[] {
  return [
    {
      question: "What is golf club fitting?",
      answer:
        "Club fitting is the process of matching golf clubs to your swing, body, and goals — adjusting factors like shaft, length, lie angle, loft, and grip. A proper fitting can improve consistency, distance, and accuracy.",
    },
    // The generic cost FAQ is dropped when the page has a data-driven local
    // price FAQ, so a page never asks the cost question twice.
    ...(opts.skipCost
      ? []
      : [
          {
            question: "How much does a club fitting cost?",
            answer:
              "Prices vary by shop and fitting type, but a single-club fitting often ranges from around $50 to $150, while a full-bag fitting can cost more. Many retailers credit the fitting fee toward clubs you purchase.",
          },
        ]),
    {
      question: "How long does a fitting take?",
      answer:
        "A single-club fitting typically takes 30–60 minutes, while a full-bag fitting can take two hours or more. It's best to book ahead so the fitter can allocate enough time.",
    },
  ]
}

export function stateFaqs(stateName: string, shops: CollectionShop[] = []): FaqItem[] {
  const priceFaq = localPriceFaq(stateName, shops)
  return [
    {
      question: `How do I find a golf club fitter in ${stateName}?`,
      answer: `Use this directory to browse fitters by city across ${stateName}. Each listing includes the shop's services, rating, and contact information so you can compare options near you.`,
    },
    ...[
      priceFaq,
      localTechFaq(stateName, shops),
      fittingCountFaq(stateName, shops),
      topRatedFaq(stateName, shops),
    ].filter((f): f is FaqItem => f !== null),
    ...baseFittingFaqs({ skipCost: priceFaq !== null }),
  ]
}

export function cityFaqs(city: string, stateName: string, shops: CollectionShop[] = []): FaqItem[] {
  const priceFaq = localPriceFaq(city, shops)
  return [
    {
      question: `Where can I get fitted for golf clubs in ${city}?`,
      answer: `The shops listed on this page offer club fitting in and around ${city}, ${stateName}. Check each listing's services and rating, then contact the shop directly to book a session.`,
    },
    ...[
      priceFaq,
      localTechFaq(city, shops),
      topRatedFaq(city, shops),
      fittingCountFaq(city, shops),
    ].filter((f): f is FaqItem => f !== null),
    ...baseFittingFaqs({ skipCost: priceFaq !== null }),
  ]
}

export function categoryFaqs(label: string, shops: CollectionShop[] = []): FaqItem[] {
  const lower = label.toLowerCase()

  // Category-scoped variants of the data-driven FAQs — same real data as the
  // state/city helpers, phrased for a nationwide category page.
  const price = priceRange(shops)
  const priceFaq: FaqItem | null = price
    ? {
        question: `How much does a fitting cost at ${lower}?`,
        answer: `Among the ${lower} in this directory that publish prices, ${
          price.max > price.min
            ? `fitting prices range from $${price.min} to $${price.max}`
            : `fitting prices start at $${price.min}`
        }. Nationally, a single-club fitting typically runs $50–$150 and a full-bag fitting more; many shops credit the fee toward clubs you buy.`,
      }
    : null

  const brands = monitorBrands(shops)
  const techFaq: FaqItem | null = brands.length
    ? {
        question: `What launch monitor technology do ${lower} use?`,
        answer: `${label} with verified fitting technology in this directory use ${listWords(brands.slice(0, 5))}. Each listing shows the shop's equipment where we've confirmed it.`,
      }
    : null

  const rated = shops.filter((s) => s.rating != null && s.rating >= 4)
  const top = rated.length
    ? rated.reduce((a, b) => ((b.rating ?? 0) > (a.rating ?? 0) ? b : a))
    : null
  const topFaq: FaqItem | null = top
    ? {
        question: `Who is the highest-rated of the ${lower} in this directory?`,
        answer: `${top.name} is currently the highest-rated, with a ${top.rating}/5 rating. Ratings change as new reviews come in, so compare the listings above before you book.`,
      }
    : null

  return [
    {
      question: `What should I look for when choosing ${lower}?`,
      answer: `Compare ratings, the specific services offered, and proximity to you. Listings that offer custom fitting, modern technology, and strong reviews are a good starting point.`,
    },
    ...[priceFaq, techFaq, topFaq].filter((f): f is FaqItem => f !== null),
    ...baseFittingFaqs({ skipCost: priceFaq !== null }),
  ]
}

/* ── Listing page (/listing/[slug]) ──
   A "quick facts" paragraph and data-driven FAQs for each shop profile. The
   paragraph is deliberately plain, self-contained prose — the sentence an AI
   answer engine can lift verbatim when asked "who does club fitting in
   {city}?" (tasks/research/geo-ai-search-2026-07.md, rec #5). Every clause
   renders only when the underlying data exists. */

/** Lowercase descriptor for the opening sentence, preferring the ownership
    classification ("independent fitter") over the generic shop type. */
function shopDescriptor(shop: Shop): string {
  const ownership = ownershipLabel(shop.ownership_type)
  if (ownership) return ownership.toLowerCase()
  if (shop.shop_type) return shop.shop_type.toLowerCase()
  return "golf shop"
}

export function listingQuickFacts(shop: Shop): string {
  const parts: string[] = []

  const place = [shop.city, shop.state].filter(Boolean).join(", ")
  const descriptor = shopDescriptor(shop)
  const article = /^[aeiou]/.test(descriptor) ? "an" : "a"
  parts.push(`${shop.name} is ${article} ${descriptor}${place ? ` in ${place}` : ""}.`)

  const price = formatFittingPrice(shop.fitting_price_min, shop.fitting_price_max)
  if (shop.offers_fitting || price) {
    const env = shop.fitting_environment ? ` ${shop.fitting_environment.toLowerCase()}` : ""
    parts.push(
      price
        ? `The shop offers${env} club fitting with published prices of ${price.toLowerCase()}.`
        : `The shop offers${env} custom club fitting.`,
    )
  }

  if (shop.launch_monitors && shop.launch_monitors.length > 0) {
    parts.push(`Fitting technology on record: ${listWords(shop.launch_monitors)}.`)
  }

  if (shop.rating && shop.rating > 0 && shop.reviews && shop.reviews > 0) {
    parts.push(`Golfers rate it ${shop.rating}/5 across ${shop.reviews} reviews.`)
  }

  return parts.join(" ")
}

export function listingFaqs(shop: Shop): FaqItem[] {
  const place = [shop.city, shop.state_code].filter(Boolean).join(", ")
  const price = formatFittingPrice(shop.fitting_price_min, shop.fitting_price_max)
  const items: (FaqItem | null)[] = [
    shop.offers_fitting || price || (shop.launch_monitors?.length ?? 0) > 0
      ? {
          question: `Does ${shop.name} offer golf club fitting?`,
          answer: `Yes — ${shop.name} in ${place} offers club fitting${
            shop.fitting_environment ? ` (${shop.fitting_environment.toLowerCase()})` : ""
          }${
            (shop.launch_monitors?.length ?? 0) > 0
              ? ` using ${listWords(shop.launch_monitors ?? [])}`
              : ""
          }. Contact the shop directly to book a session.`,
        }
      : null,
    price
      ? {
          question: `How much does a club fitting cost at ${shop.name}?`,
          answer: `${shop.name} lists fitting prices of ${price.toLowerCase()}, as reported from the shop's website. Nationally, a single-club fitting typically runs $50–$150 and a full-bag fitting more — confirm the current menu with the shop before booking.`,
        }
      : null,
    (shop.launch_monitors?.length ?? 0) > 0
      ? {
          question: `What launch monitor technology does ${shop.name} use?`,
          answer: `${shop.name} has ${listWords(shop.launch_monitors ?? [])} on record. The launch monitor drives the quality of your fitting data, so it's worth confirming the setup when you book.`,
        }
      : null,
    shop.city
      ? {
          question: `Where is ${shop.name} located?`,
          answer: `${shop.name} is located at ${[shop.street, shop.city, `${shop.state} ${shop.postal_code ?? ""}`.trim()]
            .filter(Boolean)
            .join(", ")}. See the map on this page for directions, or browse more fitters in ${shop.city} in this directory.`,
        }
      : null,
  ]
  const faqs = items.filter((f): f is FaqItem => f !== null)
  // One lone question makes a thin FAQ block — skip the section entirely.
  return faqs.length >= 2 ? faqs : []
}

/* ── Repair landing page (/repair) ── */
export function repairIntro(shopCount: number, stateCount: number): string {
  return `Golf club repair keeps a good set in play for a fraction of the cost of replacing it. The ${shopCount} shops listed here across ${stateCount} ${
    stateCount === 1 ? "state" : "states"
  } offer repair services like regripping, reshafting, and loft and lie adjustment alongside fitting and retail. Compare ratings and services, then contact the shop directly for a quote.`
}

export function repairFaqs(shops: ShopFact[] = []): FaqItem[] {
  return [
    {
      question: "How much does golf club repair cost?",
      answer:
        "Typical US prices: regripping runs about $3–$15 per club plus the grip, reshafting an iron or wood about $20–$45 plus the shaft, and a loft or lie adjustment about $5–$10 per club. Prices vary by shop and shaft, so confirm before you commit.",
    },
    {
      question: "Is it worth repairing golf clubs instead of replacing them?",
      answer:
        "Usually yes for clubs you like: fresh grips, a shaft that matches your swing, or corrected loft and lie can make a familiar set perform like new for far less than a new set. Replacement makes more sense when heads are worn out or the technology gap is large.",
    },
    {
      question: "How do I find golf club repair near me?",
      answer:
        "Every shop on this page offers club repair — use the state links above to narrow to your area, or search the full directory and filter by the Club Repair service to compare ratings and contact details near you.",
    },
    {
      question: "How long does golf club repair take?",
      answer:
        "Regrips are often same-day once the solvent sets, while reshafts and loft/lie adjustments typically take a few days depending on parts and the shop's queue. Ask the shop for turnaround when you get your quote.",
    },
    ...[topRatedRepairFaq(shops)].filter((f): f is FaqItem => f !== null),
  ]
}

function topRatedRepairFaq(shops: ShopFact[]): FaqItem | null {
  const rated = shops.filter((s) => s.rating != null && s.rating >= 4)
  if (!rated.length) return null
  const top = rated.reduce((a, b) => ((b.rating ?? 0) > (a.rating ?? 0) ? b : a))
  return {
    question: "Who is the highest-rated golf club repair shop in the directory?",
    answer: `${top.name} is currently the highest-rated shop offering club repair in this directory, with a ${top.rating}/5 rating. Ratings change as new reviews come in, so compare the listings above before you book.`,
  }
}
