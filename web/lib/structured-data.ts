import type { Shop } from "@/types/shop"
import type { Guide } from "@/lib/guides/types"
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_AUTHOR, SITE_AUTHOR_TITLE } from "@/lib/constants"
import { toCitySlug } from "@/lib/slugs"
import { formatFittingPrice } from "@/lib/fitter-classification"

/* ─────────────────────────────────────────────────────────
   JSON-LD STRUCTURED DATA
   Generates schema.org LocalBusiness markup for each
   listing page. Google uses this to display rich results
   (star ratings, address, phone, hours) in search.
   ───────────────────────────────────────────────────────── */

/**
 * Maps shop_type to the most specific schema.org @type.
 * Falls back to "LocalBusiness" if no match.
 */
function schemaType(shopType: string | null): string {
  switch (shopType) {
    case "Golf Course / Pro Shop": return "SportsClub"
    case "Clubfitter":             return "LocalBusiness"
    case "Retailer":               return "SportingGoodsStore"
    case "Simulator":              return "EntertainmentBusiness"
    case "Instruction":            return "EducationalOrganization"
    case "Driving Range":          return "SportsActivityLocation"
    default:                       return "LocalBusiness"
  }
}

/**
 * Convert Outscraper working_hours JSON to schema.org openingHours strings.
 * A day's value is usually a string ("9 AM–5 PM") but can also be an array of
 * strings for split hours (["9 AM–1 PM", "2 PM–6 PM"]) — or, in bad data,
 * something else entirely. We coerce defensively so a single odd shop can
 * never crash the page.
 * Output: ["Mo 09:00-17:00", "Tu 09:00-17:00", ...]
 */
function parseOpeningHours(
  hours: Record<string, string | string[]> | null,
): string[] {
  if (!hours) return []

  const dayMap: Record<string, string> = {
    monday: "Mo", tuesday: "Tu", wednesday: "We", thursday: "Th",
    friday: "Fr", saturday: "Sa", sunday: "Su",
  }

  const toTime = (raw: string): string | null => {
    const match = raw.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i)
    if (!match) return null
    let h = parseInt(match[1], 10)
    const m = match[2] ? parseInt(match[2], 10) : 0
    const period = match[3].toUpperCase()
    if (period === "PM" && h !== 12) h += 12
    if (period === "AM" && h === 12) h = 0
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }

  const results: string[] = []

  for (const [day, rawValue] of Object.entries(hours)) {
    const abbr = dayMap[day.toLowerCase().trim()]
    if (!abbr) continue

    // A day can hold one range (string) or several (array). Ignore anything else.
    const ranges = Array.isArray(rawValue) ? rawValue : [rawValue]

    for (const range of ranges) {
      if (typeof range !== "string" || range.toLowerCase().includes("closed")) continue

      // Parse "9 AM–5 PM" or "9:00 AM–5:00 PM"
      const parts = range.split(/[–\-]/).map((s) => s.trim())
      if (parts.length !== 2) continue

      const open  = toTime(parts[0])
      const close = toTime(parts[1])
      if (open && close) results.push(`${abbr} ${open}-${close}`)
    }
  }

  return results
}

/** Build the full LocalBusiness JSON-LD object for a shop */
export function buildLocalBusinessSchema(shop: Shop): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type":    schemaType(shop.shop_type),
    name:       shop.name,
    url:        `${SITE_URL}/listing/${shop.slug}`,
  }

  // Contact
  if (shop.phone)   schema.telephone = shop.phone
  if (shop.website) schema.sameAs    = shop.website

  // Address
  if (shop.city || shop.state) {
    schema.address = {
      "@type":         "PostalAddress",
      streetAddress:   shop.street   ?? undefined,
      addressLocality: shop.city,
      addressRegion:   shop.state_code,
      postalCode:      shop.postal_code ?? undefined,
      addressCountry:  "US",
    }
  }

  // Geo coordinates
  if (shop.latitude && shop.longitude) {
    schema.geo = {
      "@type":    "GeoCoordinates",
      latitude:   shop.latitude,
      longitude:  shop.longitude,
    }
  }

  // Maps link
  if (shop.location_link) schema.hasMap = shop.location_link

  // Aggregate rating — only emit when we have BOTH a rating and a review count.
  // Google flags an AggregateRating with no reviewCount/ratingCount as invalid
  // structured data, so a rating with zero reviews must be omitted entirely.
  if (shop.rating && shop.rating > 0 && shop.reviews && shop.reviews > 0) {
    schema.aggregateRating = {
      "@type":       "AggregateRating",
      ratingValue:   shop.rating,
      reviewCount:   shop.reviews,
      bestRating:    5,
      worstRating:   1,
    }
  }

  // Opening hours
  const openingHours = parseOpeningHours(shop.working_hours)
  if (openingHours.length > 0) schema.openingHours = openingHours

  // ── Differentiating attributes (migration 017) — every property below maps
  //    1:1 to a stored, provenance-governed field and is omitted when empty. ──
  if (shop.year_established != null) schema.foundingDate = String(shop.year_established)

  const priceRange = formatFittingPrice(shop.fitting_price_min, shop.fitting_price_max)
  if (priceRange) schema.priceRange = priceRange

  // Brands the shop fits — knowsAbout is the least-lossy fit for "works with
  // these manufacturers" without claiming it *sells* them (offers would).
  if (shop.brands_fitted && shop.brands_fitted.length > 0) {
    schema.knowsAbout = shop.brands_fitted
  }

  // Machine-readable label/value pairs for the attributes with no dedicated
  // schema.org property — the block AI engines can lift unambiguously.
  const additionalProperty = [
    shop.launch_monitors?.length
      ? { "@type": "PropertyValue", name: "Launch monitors", value: shop.launch_monitors.join(", ") }
      : null,
    shop.fitting_environment
      ? { "@type": "PropertyValue", name: "Fitting environment", value: shop.fitting_environment }
      : null,
    shop.bay_count != null
      ? { "@type": "PropertyValue", name: "Fitting bays", value: shop.bay_count }
      : null,
    shop.mobile_fitting != null
      ? { "@type": "PropertyValue", name: "Mobile fitting", value: shop.mobile_fitting }
      : null,
    shop.in_house_build != null
      ? { "@type": "PropertyValue", name: "In-house club building", value: shop.in_house_build }
      : null,
    shop.credentials?.length
      ? { "@type": "PropertyValue", name: "Credentials", value: shop.credentials.join(", ") }
      : null,
    shop.ownership_type && shop.ownership_type !== "unknown"
      ? { "@type": "PropertyValue", name: "Ownership", value: shop.ownership_type.replace(/_/g, " ") }
      : null,
  ].filter(Boolean)
  if (additionalProperty.length > 0) schema.additionalProperty = additionalProperty

  return schema
}

/** BreadcrumbList schema for the breadcrumb nav — matches the visible breadcrumb on the page */
export function buildBreadcrumbSchema(
  shop: Shop,
): Record<string, unknown> {
  const citySlug = shop.city && shop.state_code
    ? toCitySlug(shop.city, shop.state_code)
    : ""

  return {
    "@context": "https://schema.org",
    "@type":    "BreadcrumbList",
    itemListElement: [
      {
        "@type":    "ListItem",
        position:   1,
        name:       "Home",
        item:       SITE_URL,
      },
      {
        "@type":    "ListItem",
        position:   2,
        name:       shop.state,
        item:       `${SITE_URL}/state/${(shop.state_code ?? "").toLowerCase()}`,
      },
      {
        "@type":    "ListItem",
        position:   3,
        name:       shop.city,
        item:       `${SITE_URL}/city/${citySlug}`,
      },
      {
        "@type":    "ListItem",
        position:   4,
        name:       shop.name,
        item:       `${SITE_URL}/listing/${shop.slug}`,
      },
    ],
  }
}

/**
 * BreadcrumbList schema for a CITY page: Home > State > City.
 * Matches the visible 3-level breadcrumb on /city/[citySlug]. (Do not reuse the
 * shop breadcrumb here — that adds a bogus 4th "listing" level pointing at a URL
 * built from the city slug, which doesn't exist.)
 */
export function buildCityBreadcrumbSchema(
  city: string,
  state: string,
  stateCode: string,
  citySlug: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type":    "BreadcrumbList",
    itemListElement: [
      {
        "@type":    "ListItem",
        position:   1,
        name:       "Home",
        item:       SITE_URL,
      },
      {
        "@type":    "ListItem",
        position:   2,
        name:       state,
        item:       `${SITE_URL}/state/${stateCode.toLowerCase()}`,
      },
      {
        "@type":    "ListItem",
        position:   3,
        name:       city,
        item:       `${SITE_URL}/city/${citySlug}`,
      },
    ],
  }
}

/**
 * BreadcrumbList schema for a STATE page: Home > States > State.
 * Matches the visible 3-level breadcrumb on /state/[state_code].
 */
export function buildStateBreadcrumbSchema(
  stateName: string,
  stateCode: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type":    "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",   item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "States", item: `${SITE_URL}/states` },
      {
        "@type":  "ListItem",
        position: 3,
        name:     stateName,
        item:     `${SITE_URL}/state/${stateCode.toLowerCase()}`,
      },
    ],
  }
}

/**
 * BreadcrumbList schema for a CATEGORY page: Home > Category.
 * Matches the visible 2-level breadcrumb on /category/[type].
 */
export function buildCategoryBreadcrumbSchema(
  label: string,
  slug: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type":    "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: label,  item: `${SITE_URL}/category/${slug}` },
    ],
  }
}

/**
 * ItemList schema for a COLLECTION page (state / city / category). Tells Google
 * the page is an ordered list of N businesses, each linking to its listing —
 * eligibility for richer results on these high-value local pages.
 */
export function buildItemListSchema(
  shops: Pick<Shop, "name" | "slug">[],
  listName: string,
): Record<string, unknown> {
  // Cap the embedded list: Google only uses a limited number of ItemList
  // entries, so serializing 1,000 into the HTML just bloats page weight.
  const MAX_ITEMS = 100
  const items = shops.slice(0, MAX_ITEMS)
  return {
    "@context": "https://schema.org",
    "@type":    "ItemList",
    name:        listName,
    numberOfItems: items.length,
    itemListElement: items.map((shop, i) => ({
      "@type":   "ListItem",
      position:  i + 1,
      url:       `${SITE_URL}/listing/${shop.slug}`,
      name:      shop.name,
    })),
  }
}

/**
 * WebSite schema with a SearchAction — enables the Google "sitelinks search box"
 * (a search field inside your search result that queries the directory directly).
 */
export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type":    "WebSite",
    name:        SITE_NAME,
    url:         SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type":     "SearchAction",
      target:      {
        "@type":       "EntryPoint",
        urlTemplate:   `${SITE_URL}/directory?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

/**
 * Organization schema — brand identity for Google (name, logo, social links).
 * Helps with brand recognition and knowledge-panel signals.
 */
export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type":    "Organization",
    name:        SITE_NAME,
    url:         SITE_URL,
    logo:        `${SITE_URL}/logo.png`,
    description: SITE_DESCRIPTION,
  }
}

/**
 * Article schema for a guide page — tells Google this is editorial content with a
 * headline, publish/modified dates, and a publisher. Helps the article qualify
 * for article-style rich results and signals freshness.
 */
export function buildArticleSchema(guide: Guide): Record<string, unknown> {
  const url = `${SITE_URL}/guides/${guide.slug}`
  return {
    "@context": "https://schema.org",
    "@type":    "Article",
    headline:        guide.h1,
    description:     guide.metaDescription,
    image:           `${url}/opengraph-image`,
    ...(guide.keyTakeaways?.length ? { abstract: guide.keyTakeaways.join(" ") } : {}),
    datePublished:   guide.datePublished,
    dateModified:    guide.dateModified,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: {
      "@type":   "Person",
      name:      SITE_AUTHOR,
      jobTitle:  SITE_AUTHOR_TITLE,
      url:       `${SITE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      name:    SITE_NAME,
      url:     SITE_URL,
      logo:    { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
  }
}

/**
 * BreadcrumbList schema for a GUIDE page: Home > Guides > Article.
 * Matches the visible 3-level breadcrumb on /guides/[slug].
 */
export function buildGuideBreadcrumbSchema(guide: Guide): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type":    "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",   item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
      {
        "@type":  "ListItem",
        position: 3,
        name:     guide.h1,
        item:     `${SITE_URL}/guides/${guide.slug}`,
      },
    ],
  }
}
