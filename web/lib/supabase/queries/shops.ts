import { createClient, createStaticClient } from "@/lib/supabase/server"
import type { Shop, ShopFilters } from "@/types/shop"

const CARD_FIELDS = [
  "id", "slug", "name", "shop_type", "primary_service",
  "city", "state", "state_code", "phone", "website",
  "rating", "rating_tier", "reviews", "photos_count", "has_photos",
  "offers_fitting", "fitting_environment", "services", "services_array",
  "num_services", "verified", "location_link", "is_featured", "listing_tier",
  "latitude", "longitude",
].join(", ")

/* ── All active shops with optional filters ── */
export async function getShops(filters: ShopFilters = {}): Promise<Shop[]> {
  const supabase = await createClient()

  let query = supabase
    .from("shops")
    .select(CARD_FIELDS)
    .eq("status", "active")

  if (filters.state)        query = query.eq("state_code", filters.state)
  if (filters.shopType)     query = query.eq("shop_type", filters.shopType)
  if (filters.offersFitting !== undefined)
                            query = query.eq("offers_fitting", filters.offersFitting)
  if (filters.search)
    query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`)

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
  const supabase = await createClient()
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

/* ── Single shop by slug ── */
export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single()

  if (error) {
    // PGRST116 = "no rows returned" — genuine 404, return null
    if (error.code === "PGRST116") return null
    // Any other error is a real database problem — throw it
    throw error
  }
  return data as Shop
}

/* ── Shops in a given state ── */
export async function getShopsByState(stateCode: string): Promise<Shop[]> {
  const supabase = await createClient()
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
export async function getAllShopSlugs(): Promise<{ slug: string }[]> {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from("shops")
    .select("slug")
    .eq("status", "active")

  if (error) throw error
  return data ?? []
}

/* ── All states that have at least one listing ── */
export async function getAllStatesWithShops(): Promise<
  { state_code: string; state: string; count: number }[]
> {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from("shops")
    .select("state_code, state")
    .eq("status", "active")

  if (error) throw error

  const counts: Record<string, { state: string; count: number }> = {}
  for (const row of data ?? []) {
    if (!row.state_code) continue
    if (!counts[row.state_code])
      counts[row.state_code] = { state: row.state, count: 0 }
    counts[row.state_code].count++
  }

  return Object.entries(counts)
    .map(([state_code, { state, count }]) => ({ state_code, state, count }))
    .sort((a, b) => a.state.localeCompare(b.state))
}

/* ── Directory-wide stats for the homepage ── */
export async function getDirectoryStats(): Promise<{
  total: number
  states: number
  fitters: number
}> {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from("shops")
    .select("state_code, shop_type")
    .eq("status", "active")

  if (error) throw error

  const rows = data ?? []
  const states  = new Set(rows.map((r: { state_code: string }) => r.state_code)).size
  const fitters = rows.filter((r: { shop_type: string | null }) => r.shop_type === "Clubfitter").length
  return { total: rows.length, states, fitters }
}

/* ─────────────────────────────────────────────────────────
   DIRECTORY SEARCH — composable paginated query
   Used by the /directory client component.
   All filters are optional; only applied when provided.
   ───────────────────────────────────────────────────────── */

export interface DirectoryFilters {
  q?: string           // free-text: name or city
  state?: string       // state_code e.g. "TX"
  shopTypes?: string[] // array of shop_type values
  services?: string[]  // partial match against services field
  fitting?: boolean    // offers_fitting = true
  fittingEnv?: string  // fitting_environment: "Indoor" | "Outdoor" | "Indoor & Outdoor"
  minRating?: number   // minimum rating (0–5)
  sort?: "rating" | "name" | "services" | "fitting"
  page?: number        // 1-based
  perPage?: number     // default 24
}

export interface DirectoryResult {
  shops: Shop[]
  total: number        // total matching rows (for pagination)
  page: number
  perPage: number
  totalPages: number
}

export async function getListings(
  filters: DirectoryFilters = {},
  /** Pass a pre-created client to allow calling from browser-side too */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clientOverride?: any,
): Promise<DirectoryResult> {
  const supabase = clientOverride ?? (await createClient())
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let qq = q as any

    if (filters.q) {
      const term = filters.q.trim()
      qq = qq.or(`name.ilike.%${term}%,city.ilike.%${term}%`)
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
        .map((s) => `services.ilike.%${s}%`)
        .join(",")
      qq = qq.or(orClauses)
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
  const { data, error } = await supabase
    .from("shops")
    .select("shop_type")
    .eq("status", "active")

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
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
  const term = q.trim()
  if (term.length < 2) return []

  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from("shops")
    .select("slug, name, city, state_code, shop_type, rating")
    .eq("status", "active")
    .or(`name.ilike.%${term}%,city.ilike.%${term}%`)
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
  const supabase = await createClient()
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
  const { data, error } = await supabase
    .from("shops")
    .select("state_code")
    .eq("status", "active")

  if (error) throw error
  const codes = [...new Set((data ?? []).map((r: { state_code: string }) => r.state_code))]
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
  const { data, error } = await supabase
    .from("shops")
    .select("shop_type")
    .eq("status", "active")

  if (error) throw error
  const types = [...new Set((data ?? []).map((r: { shop_type: string | null }) => r.shop_type ?? ""))]
  return types.filter((t): t is string => Boolean(t))
}

/* ─────────────────────────────────────────────────────────
   CITY PAGES — SEO city-level landing pages
   ───────────────────────────────────────────────────────── */

/** Converts a city name + state code into a URL-safe slug.
 *  e.g. "San Francisco", "CA" → "san-francisco-ca"
 *       "St. Louis", "MO"    → "st-louis-mo"
 */
export function toCitySlug(city: string, stateCode: string): string {
  const cityPart = city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `${cityPart}-${stateCode.toLowerCase()}`
}

/* ── All city slugs (for generateStaticParams on city page) ── */
export async function getAllCitySlugs(): Promise<{ citySlug: string }[]> {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from("shops")
    .select("city, state_code")
    .eq("status", "active")

  if (error) throw error

  const seen = new Set<string>()
  const result: { citySlug: string }[] = []
  for (const row of (data ?? []) as { city: string; state_code: string }[]) {
    if (!row.city || !row.state_code) continue
    const slug = toCitySlug(row.city, row.state_code)
    if (!seen.has(slug)) {
      seen.add(slug)
      result.push({ citySlug: slug })
    }
  }
  return result
}

/* ── All shops for a city page, derived from state query ── */
export async function getShopsForCityPage(
  citySlug: string,
): Promise<{ shops: Shop[]; city: string; state: string; stateCode: string } | null> {
  // State code is always the final hyphen-segment (2 letters)
  const parts     = citySlug.split("-")
  const stateCode = parts[parts.length - 1].toUpperCase()

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
  const stateShops = (data as unknown as Shop[]) ?? []

  // Find the city whose slug matches
  const matchedCity = stateShops.find(
    (s) => s.city && toCitySlug(s.city, stateCode) === citySlug,
  )?.city ?? null

  if (!matchedCity) return null

  const shops     = stateShops.filter((s) => s.city === matchedCity)
  const firstShop = stateShops[0]

  return { shops, city: matchedCity, state: firstShop.state, stateCode }
}
