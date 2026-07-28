import { cache } from "react"
import { createStaticClient } from "@/lib/supabase/server"
import { toCitySlug } from "@/lib/slugs"
import type { Shop } from "@/types/shop"
import {
  CARD_FIELDS,
  fetchAllRows,
  sanitizeSearchTerm,
  tallyStates,
  tallyTypes,
  type PagedQuery,
} from "./shared"

/* ── Top-rated shops for the homepage ── */
export async function getTopRatedShops(limit = 6): Promise<Shop[]> {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from("shops")
    .select(CARD_FIELDS)
    .eq("status", "active")
    .gte("rating", 4.8)
    .order("rating", { ascending: false, nullsFirst: false })
    .order("reviews", { ascending: false, nullsFirst: false })
    // Stable tiebreaker by id so rows that tie on the sort key always come back
    // in the SAME order. Without this, the DB may return ties in a different
    // order each run, which changes the rendered HTML and forces a needless
    // ISR write. Every multi-row query in this file does the same.
    .order("id", { ascending: true })
    .limit(limit)

  if (error) throw error
  return (data as unknown as Shop[]) ?? []
}

/* ── Single shop by slug ──
   Wrapped in React cache() so the listing page's generateMetadata + body (same
   request) share one query instead of hitting the DB twice. */
export const getShopBySlug = cache(async (slug: string): Promise<Shop | null> => {
  const supabase = createStaticClient()
  // Use limit(1) instead of .single(): .single() throws (→ 500) if two active
  // rows ever share a slug. This selects the top match, returns null for "no
  // rows", and never crashes on an accidental duplicate.
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .order("rating", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true }) // stable pick if a slug is ever duplicated
    .limit(1)

  // A real database error still throws; "no rows" is just an empty array → null.
  if (error) throw error
  return (data?.[0] as Shop) ?? null
})

/* ── All slugs (for generateStaticParams) ── */
export async function getAllShopSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = createStaticClient()
  return fetchAllRows(() =>
    supabase
      .from("shops")
      .select("slug, updated_at")
      .eq("status", "active")
      .order("id", { ascending: true }),
  )
}

/* ── Lightweight rows for the national /map page ──
   Only the columns the map markers/popups need — the full Shop row would make
   the server-rendered payload several times larger for no benefit. */
export interface MapShop {
  slug: string
  name: string
  city: string
  state_code: string
  latitude: number
  longitude: number
  rating: number | null
  offers_fitting: boolean | null
  verified: boolean | null
  is_featured: boolean | null
  shop_type: string | null
}

export async function getMapShops(): Promise<MapShop[]> {
  const supabase = createStaticClient()
  return fetchAllRows<MapShop>(() =>
    supabase
      .from("shops")
      .select(
        "slug, name, city, state_code, latitude, longitude, rating, offers_fitting, verified, is_featured, shop_type",
      )
      .eq("status", "active")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("id", { ascending: true }),
  )
}

/* ── All states that have at least one listing ──
   cache()'d: state pages call this in both generateMetadata and the body. */
export const getAllStatesWithShops = cache(async (): Promise<
  { state_code: string; state: string; count: number }[]
> => {
  const supabase = createStaticClient()
  const data = await fetchAllRows<{ state_code: string | null; state: string }>(() =>
    supabase
      .from("shops")
      .select("state_code, state")
      .eq("status", "active")
      .order("id", { ascending: true }),
  )

  return tallyStates(data).sort((a, b) => a.state.localeCompare(b.state))
})

/* ── Combined homepage aggregates in ONE table scan ──
   Replaces three separate full-table queries (states list, type counts, and
   directory stats) with a single pass. cache()'d for good measure. */
export const getHomepageStats = cache(async (): Promise<{
  states: { state_code: string; state: string; count: number }[]
  typeCounts: Record<string, number>
  stats: { total: number; states: number; fitters: number }
}> => {
  const supabase = createStaticClient()
  const rows = await fetchAllRows<{ state_code: string | null; state: string; shop_type: string | null }>(() =>
    supabase
      .from("shops")
      .select("state_code, state, shop_type")
      .eq("status", "active")
      .order("id", { ascending: true }),
  )

  const states = tallyStates(rows).sort((a, b) => a.state.localeCompare(b.state))
  const typeCounts = tallyTypes(rows)
  const fitters = rows.filter((r) => r.shop_type === "Clubfitter").length

  // DC has its own state_code and stays browsable in the `states` list, but it
  // is NOT a state — so the headline "states covered" stat must exclude it
  // (otherwise it reads 51, contradicting the "all 50 states" copy).
  const stateCount = states.filter((s) => s.state_code !== "DC").length

  return {
    states,
    typeCounts,
    stats: { total: rows.length, states: stateCount, fitters },
  }
})

/* ── Count per shop_type (for category cards) ── */
export async function getShopTypeCounts(): Promise<Record<string, number>> {
  const supabase = createStaticClient()
  const data = await fetchAllRows<{ shop_type: string | null }>(() =>
    supabase
      .from("shops")
      .select("shop_type")
      .eq("status", "active")
      .order("id", { ascending: true }),
  )

  return tallyTypes(data)
}

/* ── Lightweight type-ahead search (homepage hero, header) ── */
export interface SearchSuggestion {
  slug: string
  name: string
  city: string | null
  state_code: string | null
  shop_type: string | null
  rating: number | null
}

export async function searchShops(
  q: string,
  limit = 6,
): Promise<SearchSuggestion[]> {
  const term = sanitizeSearchTerm(q)
  if (term.length < 2) return []

  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from("shops")
    .select("slug, name, city, state_code, shop_type, rating")
    .eq("status", "active")
    .or(`name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%`)
    .order("is_featured", { ascending: false })
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) throw error
  return (data as SearchSuggestion[]) ?? []
}

/* ── Nearby shops in same state, excluding current slug ── */
export async function getNearbyShops(
  stateCode: string,
  excludeSlug: string,
  limit = 3,
): Promise<Shop[]> {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from("shops")
    .select(CARD_FIELDS)
    .eq("status", "active")
    .eq("state_code", stateCode)
    .neq("slug", excludeSlug)
    .order("is_featured", { ascending: false })
    .order("rating", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true }) // stable tiebreaker — keeps "nearby" picks identical between regenerations
    .limit(limit)

  if (error) throw error
  return (data as unknown as Shop[]) ?? []
}

/* ── All shops in a state (for state page — full listing) ── */
export async function getShopsForStatePage(
  stateCode: string,
): Promise<{ shops: Shop[]; cityCount: number }> {
  const supabase = createStaticClient()
  const data = await fetchAllRows<Shop>(() => {
    const q = supabase
      .from("shops")
      .select(CARD_FIELDS)
      .eq("status", "active")
      .eq("state_code", stateCode)
      .order("is_featured", { ascending: false })
      .order("rating",      { ascending: false, nullsFirst: false })
      .order("id",          { ascending: true }) // stable tiebreaker — see getTopRatedShops
    return q as unknown as PagedQuery<Shop> // CARD_FIELDS is dynamic, so rows can't be inferred
  })

  const shops     = data
  const cityCount = new Set(shops.map((s) => s.city)).size
  return { shops, cityCount }
}

/* ── All distinct state_codes (for generateStaticParams on state page) ── */
export async function getAllStateCodes(): Promise<string[]> {
  const supabase = createStaticClient()
  const data = await fetchAllRows<{ state_code: string }>(() =>
    supabase
      .from("shops")
      .select("state_code")
      .eq("status", "active")
      .order("id", { ascending: true }),
  )
  const codes = [...new Set(data.map((r: { state_code: string }) => r.state_code))]
  return codes.filter((c): c is string => Boolean(c))
}

/* ── All shops for a given shop_type (category page) ── */
export async function getShopsForCategoryPage(
  shopType: string,
): Promise<{ shops: Shop[]; stateBreakdown: { state_code: string; state: string; count: number }[] }> {
  const supabase = createStaticClient()
  const shops = await fetchAllRows<Shop>(() => {
    const q = supabase
      .from("shops")
      .select(CARD_FIELDS)
      .eq("status", "active")
      .eq("shop_type", shopType)
      .order("is_featured", { ascending: false })
      .order("rating",      { ascending: false, nullsFirst: false })
      .order("id",          { ascending: true }) // stable tiebreaker — see getTopRatedShops
    return q as unknown as PagedQuery<Shop> // CARD_FIELDS is dynamic, so rows can't be inferred
  })

  const stateBreakdown = tallyStates(shops).sort((a, b) => b.count - a.count)

  return { shops, stateBreakdown }
}

/* ── All shops offering a given service (service landing pages, e.g. /repair).
   `serviceTerm` is substring-matched against the pipe-delimited services text
   — see lib/service-filters.ts for the curated values. ── */
export async function getShopsForServicePage(
  serviceTerm: string,
): Promise<{ shops: Shop[]; stateBreakdown: { state_code: string; state: string; count: number }[] }> {
  const supabase = createStaticClient()
  const shops = await fetchAllRows<Shop>(() => {
    const q = supabase
      .from("shops")
      .select(CARD_FIELDS)
      .eq("status", "active")
      .ilike("services", `%${serviceTerm}%`)
      .order("is_featured", { ascending: false })
      .order("rating",      { ascending: false, nullsFirst: false })
      .order("id",          { ascending: true }) // stable tiebreaker — see getTopRatedShops
    return q as unknown as PagedQuery<Shop> // CARD_FIELDS is dynamic, so rows can't be inferred
  })

  const stateBreakdown = tallyStates(shops).sort((a, b) => b.count - a.count)

  return { shops, stateBreakdown }
}

/* ── All distinct shop_type values (for generateStaticParams on category page) ── */
export async function getAllShopTypes(): Promise<string[]> {
  const supabase = createStaticClient()
  const data = await fetchAllRows<{ shop_type: string | null }>(() =>
    supabase
      .from("shops")
      .select("shop_type")
      .eq("status", "active")
      .order("id", { ascending: true }),
  )
  const types = [...new Set(data.map((r: { shop_type: string | null }) => r.shop_type ?? ""))]
  return types.filter((t): t is string => Boolean(t))
}

/* ─────────────────────────────────────────────────────────
   CITY PAGES — SEO city-level landing pages
   ───────────────────────────────────────────────────────── */

/* toCitySlug now lives in lib/slugs.ts (pure helper, unit-tested there);
   re-exported here so existing imports keep working. */
export { toCitySlug } from "@/lib/slugs"

/* ── All city slugs (for generateStaticParams on city page) ── */
export async function getAllCitySlugs(): Promise<{ citySlug: string; shopCount: number }[]> {
  const supabase = createStaticClient()
  const data = await fetchAllRows<{ city: string; state_code: string }>(() =>
    supabase
      .from("shops")
      .select("city, state_code")
      .eq("status", "active")
      .order("id", { ascending: true }),
  )

  // shopCount lets the sitemap skip one-shop cities (those pages are noindexed
  // as thin content; listing them in the sitemap would send a mixed signal).
  const counts = new Map<string, number>()
  for (const row of data) {
    if (!row.city || !row.state_code) continue
    const slug = toCitySlug(row.city, row.state_code)
    counts.set(slug, (counts.get(slug) ?? 0) + 1)
  }
  return [...counts.entries()].map(([citySlug, shopCount]) => ({ citySlug, shopCount }))
}

/* ── City links for a state (city-page cross-linking) ──
   Lightweight one-column fetch used by city pages to link sideways to their
   sibling cities. Without these links every city page is a crawl dead-end that
   only points back up to its state. cache()'d per state code. */
export const getCityLinksForState = cache(async (
  stateCode: string,
): Promise<{ name: string; slug: string; count: number }[]> => {
  const supabase = createStaticClient()
  const rows = await fetchAllRows<{ city: string | null }>(() =>
    supabase
      .from("shops")
      .select("city")
      .eq("status", "active")
      .eq("state_code", stateCode)
      .order("id", { ascending: true }),
  )

  const map: Record<string, { name: string; count: number }> = {}
  for (const row of rows) {
    if (!row.city) continue
    const slug = toCitySlug(row.city, stateCode)
    if (!map[slug]) map[slug] = { name: row.city, count: 0 }
    map[slug].count++
  }
  return Object.entries(map)
    .map(([slug, { name, count }]) => ({ name, slug, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})

/* ── All shops for a city page, derived from state query ──
   cache()'d (called in both generateMetadata and the page body). */
export const getShopsForCityPage = cache(async (
  citySlug: string,
): Promise<{ shops: Shop[]; city: string; state: string; stateCode: string } | null> => {
  // State code is always the final hyphen-segment (2 letters)
  const parts     = citySlug.split("-")
  const stateCode = parts[parts.length - 1].toUpperCase()
  // First token of the city name — used to narrow the DB query (index-friendly)
  // instead of fetching the whole state. The exact-city match still happens by
  // slug below, so this only has to be a safe SUPERSET of the target rows.
  const cityFirstWord = (parts[0] ?? "").replace(/[^a-z0-9]/gi, "")

  const supabase = createStaticClient()
  const stateShops = await fetchAllRows<Shop>(() => {
    let query = supabase
      .from("shops")
      .select(CARD_FIELDS)
      .eq("status", "active")
      .eq("state_code", stateCode)
    if (cityFirstWord) query = query.ilike("city", `${cityFirstWord}%`)
    const q = query
      .order("is_featured", { ascending: false })
      .order("rating",      { ascending: false, nullsFirst: false })
      .order("id",          { ascending: true }) // stable tiebreaker — see getTopRatedShops
    return q as unknown as PagedQuery<Shop> // CARD_FIELDS is dynamic, so rows can't be inferred
  })

  // Match by SLUG (not exact city string) for both identification and filtering,
  // so cities whose spellings collapse to the same slug (e.g. "St. Louis" and
  // "St Louis" → "st-louis-mo") are grouped together instead of one silently
  // hiding the other's listings.
  const shops = stateShops.filter(
    (s) => s.city && toCitySlug(s.city, stateCode) === citySlug,
  )

  if (shops.length === 0) return null

  // Display name comes from a shop in this city (not an arbitrary state shop).
  return { shops, city: shops[0].city, state: shops[0].state, stateCode }
})

/* ── Nearby shops by real-world distance ──
   Powers the "Other fitters near {city}" module on city pages. A thin one-shop
   city page is worthless to Google on its own; surrounding it with the genuinely
   nearest fitters turns it into a real comparison page (and lets us flip it from
   noindex to indexable — see city/[citySlug]/page.tsx).

   No PostGIS RPC needed: we range-filter on lat/lng (a cheap, index-friendly
   bounding box) to fetch a small candidate set, then refine with an exact
   haversine distance in JS. Anchor shops without coordinates simply get an empty
   list (the caller keeps the page noindexed). cache()'d because the city page
   asks for this in both generateMetadata and the body within one request. */
function haversineMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8 // Earth radius, miles
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export const getNearbyShopsByDistance = cache(async (
  lat: number,
  lng: number,
  excludeCitySlug: string,
  limit = 6,
  radiusMi = 60,
): Promise<(Shop & { distanceMi: number })[]> => {
  const supabase = createStaticClient()
  // Bounding box around the anchor. ~69 miles per degree of latitude; longitude
  // degrees shrink with latitude, so divide by cos(lat) (clamped so a near-pole
  // value can't blow the box up). This is a generous SUPERSET — the haversine
  // pass below trims it to the true radius.
  const latDelta = radiusMi / 69
  const lngDelta = radiusMi / (69 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)))

  const candidates = await fetchAllRows<Shop>(() => {
    const q = supabase
      .from("shops")
      .select(CARD_FIELDS)
      .eq("status", "active")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .gte("latitude", lat - latDelta)
      .lte("latitude", lat + latDelta)
      .gte("longitude", lng - lngDelta)
      .lte("longitude", lng + lngDelta)
      .order("id", { ascending: true })
    return q as unknown as PagedQuery<Shop> // CARD_FIELDS is dynamic, so rows can't be inferred
  })

  return candidates
    .filter((s) => s.latitude != null && s.longitude != null)
    // Drop the anchor city's own shops — those already render on the page.
    .filter((s) => !(s.city && toCitySlug(s.city, s.state_code) === excludeCitySlug))
    .map((s) => ({ ...s, distanceMi: haversineMiles(lat, lng, s.latitude!, s.longitude!) }))
    .filter((s) => s.distanceMi <= radiusMi)
    .sort((a, b) => a.distanceMi - b.distanceMi || String(a.id).localeCompare(String(b.id)))
    .slice(0, limit)
})
