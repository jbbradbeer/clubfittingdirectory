import type { Shop } from "@/types/shop"
import { SITE_URL } from "@/lib/constants"

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

  // Aggregate rating
  if (shop.rating && shop.rating > 0) {
    schema.aggregateRating = {
      "@type":       "AggregateRating",
      ratingValue:   shop.rating,
      bestRating:    5,
      worstRating:   1,
      ...(shop.reviews && shop.reviews > 0 ? { reviewCount: shop.reviews } : {}),
    }
  }

  // Opening hours
  const openingHours = parseOpeningHours(shop.working_hours)
  if (openingHours.length > 0) schema.openingHours = openingHours

  return schema
}

/** Build the city slug used in /city/[citySlug] URLs */
function toCitySlug(city: string, stateCode: string): string {
  const cityPart = city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `${cityPart}-${stateCode.toLowerCase()}`
}

/** BreadcrumbList schema for the breadcrumb nav — matches the visible breadcrumb on the page */
export function buildBreadcrumbSchema(
  shop: Shop,
): Record<string, unknown> {
  const citySlug = toCitySlug(shop.city, shop.state_code)

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
        item:       `${SITE_URL}/state/${shop.state_code.toLowerCase()}`,
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
