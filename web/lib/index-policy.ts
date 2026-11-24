import type { Metadata } from "next"
import { toCitySlug } from "@/lib/slugs"

/**
 * Which pages Google is invited to index — the SINGLE place this is decided.
 *
 * WHY: the domain is new (June 2026) and launched with ~1,900 templated pages;
 * Google trialled it for two weeks, then dropped everything but the homepage
 * (no manual action). Until the site earns trust we show Google only the pages
 * with real substance. Every page stays live and indexable for visitors, Bing,
 * and AI search: weak pages get a GOOGLEBOT-ONLY noindex, never a general one.
 *
 * Reverse everything: set GOOGLE_CORE_ONLY to false and redeploy.
 *
 * Pure (no database) so it can be unit-tested. Pages and the sitemap must both
 * read from here so they can never disagree.
 */
export const GOOGLE_CORE_ONLY = true

const MIN_SERVICES = 3
const MIN_FACTS = 2
const MIN_CORE_SHOPS_PER_CITY = 2
const MIN_CORE_SHOPS_PER_STATE = 5

/** The columns the listing rule needs (all anon-readable). */
export const CORE_FIELDS =
  "slug, city, state_code, offers_fitting, street, website, phone, services_array, fitting_price_min, brands_fitted, launch_monitors, credentials, claimed_at"

export type CoreShop = {
  offers_fitting?: boolean | null
  street?: string | null
  website?: string | null
  phone?: string | null
  services_array?: string[] | null
  fitting_price_min?: number | null
  brands_fitted?: string[] | null
  launch_monitors?: string[] | null
  credentials?: string[] | null
  claimed_at?: string | null
}

/** A listing with enough verified substance to stand on its own. */
export function isCoreListing(shop: CoreShop): boolean {
  if (shop.claimed_at) return true
  const facts = [
    shop.fitting_price_min != null,
    (shop.brands_fitted?.length ?? 0) > 0,
    (shop.launch_monitors?.length ?? 0) > 0,
    (shop.credentials?.length ?? 0) > 0,
  ].filter(Boolean).length
  return (
    Boolean(shop.offers_fitting) &&
    Boolean(shop.street) &&
    Boolean(shop.website || shop.phone) &&
    (shop.services_array?.length ?? 0) >= MIN_SERVICES &&
    facts >= MIN_FACTS
  )
}

export function isCoreCity(coreShops: number): boolean {
  return coreShops >= MIN_CORE_SHOPS_PER_CITY
}

export function isCoreState(coreShops: number): boolean {
  return coreShops >= MIN_CORE_SHOPS_PER_STATE
}

/** Guides kept in Google for now: our own data, plus the main buying questions. */
export const CORE_GUIDES: ReadonlySet<string> = new Set([
  "golf-club-fitting",
  "golf-club-fitting-cost",
  "state-of-club-fitting-2026",
  "how-to-choose-a-club-fitter",
  "club-champion-vs-independent-fitter",
  "where-to-get-fitted-for-golf-clubs",
  "is-golf-club-fitting-worth-it",
  "golf-club-fitting-chart",
  "what-to-expect-at-a-golf-club-fitting",
  "golf-club-repair-cost",
  "launch-monitors",
  "driver-fitting",
  "iron-fitting",
  "club-fitting-for-beginners",
  "golf-shaft-flex",
])

export function isCoreGuide(slug: string): boolean {
  return CORE_GUIDES.has(slug)
}

export type CoreCounts = {
  listings: Set<string>
  /** city slug → core shops */
  cities: Map<string, number>
  /** upper-case state code → core shops */
  states: Map<string, number>
}

export function countCore(
  rows: (CoreShop & { slug: string; city: string | null; state_code: string | null })[],
): CoreCounts {
  const counts: CoreCounts = { listings: new Set(), cities: new Map(), states: new Map() }
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1)
  for (const row of rows) {
    if (!isCoreListing(row)) continue
    counts.listings.add(row.slug)
    if (!row.state_code) continue
    bump(counts.states, row.state_code.toUpperCase())
    if (row.city) bump(counts.cities, toCitySlug(row.city, row.state_code))
  }
  return counts
}

/**
 * Metadata `robots` for a page. Spread it into the page's metadata. Core pages
 * inherit the site default (index for everyone). Next.js REPLACES a parent's
 * robots object rather than merging it, hence the explicit index/follow here.
 */
export function robotsFor(isCore: boolean, enabled: boolean = GOOGLE_CORE_ONLY): Pick<Metadata, "robots"> {
  if (isCore || !enabled) return {}
  return { robots: { index: true, follow: true, googleBot: { index: false, follow: true } } }
}
