import { cache } from "react"
import { createStaticClient } from "@/lib/supabase/server"
import { toCitySlug } from "@/lib/slugs"
import type { Shop, ShopFilters } from "@/types/shop"
import {
  CARD_FIELDS,
  fetchAllRows,
  sanitizeSearchTerm,
  type DirectoryFilters,
  type DirectoryResult,
} from "./shared"

export type { DirectoryFilters, DirectoryResult }

/* ── All active shops with optional filters ── */
export async function getShops(filters: ShopFilters = {}): Promise<Shop[]> {
  const supabase = createStaticClient()

  let query = supabase
    .from("shops")
    .select(CARD_FIELDS)
    .eq("status", "active")

  if (filters.state)        query = query.eq("state_code", filters.state)
  if (filters.shopType)     query = query.eq("shop_type", filters.shopType)
  if (filters.offersFitting !== undefined)
                            query = query.eq("offers_fitting", filters.offersFitting)
  if (filters.search) {
    const term = sanitizeSearchTerm(filters.search)
    if (term) query = query.or(`name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%`)
  }

  if (filters.sort === "name")
    query = query.order("name", { ascending: true })
  else if (filters.sort === "reviews")
    query = query.order("reviews", { ascending: false, nullsFirst: false })
  else
    query = query
      .order("is_featured", { ascending: false })
      .order("rating", { ascending: false, nullsFirst: false })

  query = query.limit(200)

  const { data, error } = await query
  if (error) throw error
  return (data as unknown as Shop[]) ?? []
}

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
    .limit(1)

  // A real database error still throws; "no rows" is just an empty array → null.
  if (error) throw error
  return (data?.[0] as Shop) ?? null
})

/* ── Shops in a given state ── */
export async function getShopsByState(stateCode: string): Promise<Shop[]> {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from("shops")
    .select(CARD_FIELDS)
    .eq("status", "active")
    .eq("state_code", stateCode)
    .order("is_featured", { ascending: false })
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(500)

  if (error) throw error
  return (data as unknown as Shop[]) ?? []
}

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

  const counts: Record<string, { state: string; count: number }> = {}
  for (const row of data) {
    if (!row.state_code) continue
    if (!counts[row.state_code])
      counts[row.state_code] = { state: row.state, count: 0 }
    counts[row.state_code].count++
  }

  return Object.entries(counts)
    .map(([state_code, { state, count }]) => ({ state_code, state, count }))
    .sort((a, b) => a.state.localeCompare(b.state))
})

/* ── Directory-wide stats for the homepage ── */
export async function getDirectoryStats(): Promise<{
  total: number
  states: number
  fitters: number
}> {
  const supabase = createStaticClient()
  const rows = await fetchAllRows<{ state_code: string; shop_type: string | null }>(() =>
    supabase
      .from("shops")
      .select("state_code, shop_type")
      .eq("status", "active")
      .order("id", { ascending: true }),
  )

  const states  = new Set(rows.map((r: { state_code: string }) => r.state_code)).size
  const fitters = rows.filter((r: { shop_type: string | null }) => r.shop_type === "Clubfitter").length
  return { total: rows.length, states, fitters }
}

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

  const stateMap: Record<string, { state: string; count: number }> = {}
  const typeCounts: Record<string, number> = {}
  for (const row of rows) {
    if (row.state_code) {
      if (!stateMap[row.state_code]) stateMap[row.state_code] = { state: row.state, count: 0 }
      stateMap[row.state_code].count++
    }
    const t = row.shop_type ?? "Unknown"
    typeCounts[t] = (typeCounts[t] ?? 0) + 1
  }

  const states = Object.entries(stateMap)
    .map(([state_code, { state, count }]) => ({ state_code, state, count }))
    .sort((a, b) => a.state.localeCompare(b.state))
  const fitters = rows.filter((r) => r.shop_type === "Clubfitter").length

  return {
    states,
    typeCounts,
    stats: { total: rows.length, states: Object.keys(stateMap).length, fitters },
  }
})

/* ─────────────────────────────────────────────────────────
   DIRECTORY SEARCH — composable paginated query
   Used by the /directory client component.
   All filters are optional; only applied when provided.
   (DirectoryFilters / DirectoryResult are defined in ./shared and
   re-exported above.)
   ───────────────────────────────────────────────────────── */

export async function getListings(
  filters: DirectoryFilters = {},
  /** Pass a pre-created client to allow calling from browser-side too */
   
  clientOverride?: any,
): Promise<DirectoryResult> {
  const supabase = clientOverride ?? createStaticClient()
  const page    = Math.max(1, filters.page    ?? 1)
  const perPage = Math.max(1, filters.perPage ?? 24)
  const from    = (page - 1) * perPage
  const to      = from + perPage - 1

  // Count query (no range, to get total)
  let countQ = supabase
    .from("shops")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")

  // Data query
  let dataQ = supabase
    .from("shops")
    .select(CARD_FIELDS)
    .eq("status", "active")

  // ── Apply the same filters to both queries ──
  const applyFilters = <T>(q: T): T => {
     
    let qq = q as any

    if (filters.q) {
      const term = sanitizeSearchTerm(filters.q)
      if (term) qq = qq.or(`name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%`)
    }
    if (filters.state) {
      qq = qq.eq("state_code", filters.state)
    }
    if (filters.shopTypes && filters.shopTypes.length > 0) {
      qq = qq.in("shop_type", filters.shopTypes)
    }
    if (filters.services && filters.services.length > 0) {
      // Match any service string — OR across each service term
      const orClauses = filters.services
        .map((s) => sanitizeSearchTerm(s))
        .filter(Boolean)
        .map((s) => `services.ilike.%${s}%`)
        .join(",")
      if (orClauses) qq = qq.or(orClauses)
    }
    if (filters.fitting === true) {
      qq = qq.eq("offers_fitting", true)
    }
    if (filters.fittingEnv) {
      qq = qq.eq("fitting_environment", filters.fittingEnv)
    }
    if (filters.minRating && filters.minRating > 0) {
      qq = qq.gte("rating", filters.minRating)
    }
    return qq as T
  }

  countQ = applyFilters(countQ)
  dataQ  = applyFilters(dataQ)

  // ── Sort ──
  if (filters.sort === "name") {
    dataQ = dataQ.order("name", { ascending: true })
  } else if (filters.sort === "services") {
    dataQ = dataQ
      .order("num_services", { ascending: false, nullsFirst: false })
      .order("rating",       { ascending: false, nullsFirst: false })
  } else if (filters.sort === "fitting") {
    dataQ = dataQ
      .order("offers_fitting", { ascending: false })
      .order("rating",         { ascending: false, nullsFirst: false })
  } else {
    // Default: rating desc, featured first
    dataQ = dataQ
      .order("is_featured", { ascending: false })
      .order("rating",      { ascending: false, nullsFirst: false })
  }

  // ── Pagination ──
  dataQ = dataQ.range(from, to)

  // ── Execute both in parallel ──
  const [{ count }, { data, error }] = await Promise.all([countQ, dataQ])

  if (error) throw error

  const total      = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return {
    shops:      (data as unknown as Shop[]) ?? [],
    total,
    page,
    perPage,
    totalPages,
  }
}

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

  const counts: Record<string, number> = {}
  for (const row of data) {
    const t = row.shop_type ?? "Unknown"
    counts[t] = (counts[t] ?? 0) + 1
  }
  return counts
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
    .limit(limit)

  if (error) throw error
  return (data as unknown as Shop[]) ?? []
}

/* ── All shops in a state (for state page — full listing) ── */
export async function getShopsForStatePage(
  stateCode: string,
): Promise<{ shops: Shop[]; cityCount: number }> {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from("shops")
    .select(CARD_FIELDS)
    .eq("status", "active")
    .eq("state_code", stateCode)
    .order("is_featured", { ascending: false })
    .order("rating",      { ascending: false, nullsFirst: false })
    .limit(1000)

  if (error) throw error
  const shops     = (data as unknown as Shop[]) ?? []
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
  const { data, error } = await supabase
    .from("shops")
    .select(CARD_FIELDS)
    .eq("status", "active")
    .eq("shop_type", shopType)
    .order("is_featured", { ascending: false })
    .order("rating",      { ascending: false, nullsFirst: false })
    .limit(1000)

  if (error) throw error
  const shops = (data as unknown as Shop[]) ?? []

  // Tally by state
  const stateMap: Record<string, { state: string; count: number }> = {}
  for (const s of shops) {
    if (!s.state_code) continue
    if (!stateMap[s.state_code])
      stateMap[s.state_code] = { state: s.state, count: 0 }
    stateMap[s.state_code].count++
  }
  const stateBreakdown = Object.entries(stateMap)
    .map(([state_code, { state, count }]) => ({ state_code, state, count }))
    .sort((a, b) => b.count - a.count)

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
export async function getAllCitySlugs(): Promise<{ citySlug: string }[]> {
  const supabase = createStaticClient()
  const data = await fetchAllRows<{ city: string; state_code: string }>(() =>
    supabase
      .from("shops")
      .select("city, state_code")
      .eq("status", "active")
      .order("id", { ascending: true }),
  )

  const seen = new Set<string>()
  const result: { citySlug: string }[] = []
  for (const row of data) {
    if (!row.city || !row.state_code) continue
    const slug = toCitySlug(row.city, row.state_code)
    if (!seen.has(slug)) {
      seen.add(slug)
      result.push({ citySlug: slug })
    }
  }
  return result
}

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
  let query = supabase
    .from("shops")
    .select(CARD_FIELDS)
    .eq("status", "active")
    .eq("state_code", stateCode)
  if (cityFirstWord) query = query.ilike("city", `${cityFirstWord}%`)
  const { data, error } = await query
    .order("is_featured", { ascending: false })
    .order("rating",      { ascending: false, nullsFirst: false })
    .limit(1000)

  if (error) throw error
  const stateShops = (data as unknown as Shop[]) ?? []

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
