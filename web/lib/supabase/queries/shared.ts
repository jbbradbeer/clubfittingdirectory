import type { Shop } from "@/types/shop"
import { log } from "@/lib/logger"

/* ─────────────────────────────────────────────────────────
   Shared query helpers — single source of truth used by both
   shops.ts (server) and listings.ts (browser). Previously these
   were duplicated in both files and could silently drift apart.
   ───────────────────────────────────────────────────────── */

/* The columns fetched for card/grid views (lighter than SELECT *). */
export const CARD_FIELDS = [
  "id", "slug", "name", "shop_type", "primary_service",
  "city", "state", "state_code", "phone", "website",
  "rating", "rating_tier", "reviews", "photos_count", "has_photos",
  "offers_fitting", "fitting_environment", "services", "services_array",
  "num_services", "verified", "location_link", "is_featured", "listing_tier",
  "verified_expires_at", "claimed_at", "latitude", "longitude",
  "launch_monitors", "ownership_type", "fitting_price_min", "fitting_price_max",
].join(", ")

/* NOTE: card/grid queries cast their rows to Shop even though only the
   CARD_FIELDS columns are actually selected — the other ~15 columns are
   undefined at runtime. Card consumers must only rely on CARD_FIELDS columns. */

/* Strip characters that have structural meaning inside a PostgREST `.or()` /
   `.ilike` filter string (commas separate clauses, parens group them, % and \
   are LIKE wildcards/escapes), so a visitor's search text can't break or alter
   the query. */
export function sanitizeSearchTerm(input: string): string {
  return (
    input
      // Treat every apostrophe variant as a single-character wildcard (_) so a
      // search matches the stored name regardless of which apostrophe the
      // keyboard produced. macOS/iOS "smart quotes" silently turns a typed '
      // into a curly ’ (U+2019); the data uses straight apostrophes, so without
      // this "Pete’s" would never match the stored "Pete's".
      .replace(/['’‘`´]/g, "_")
      // Strip characters that have structural meaning inside a PostgREST `.or()`
      // / `.ilike` filter string (commas separate clauses, parens group them, %
      // and \ are LIKE wildcards/escapes), so a visitor's search text can't
      // break or alter the query.
      .replace(/[,()%\\*]/g, " ")
      .trim()
  )
}

/* PostgREST (Supabase's API layer) silently caps every response at 1,000 rows.
   The shops table passed that size in June 2026, which silently truncated the
   sitemap, generateStaticParams, and the homepage stats — ~267 shops vanished
   from Google with no error anywhere. Any "fetch all rows" query must go
   through this helper, which pages in 1,000-row chunks until a short page
   signals the end.

   The query returned by makeQuery MUST include a stable .order() (e.g.
   .order("id")) — without one Postgres guarantees no consistent ordering
   across pages, so rows could repeat or be skipped between chunks. */
export type PagedQuery<Row> = {
  range: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: unknown }>
}

export async function fetchAllRows<Row>(
  makeQuery: () => PagedQuery<Row>,
): Promise<Row[]> {
  const PAGE = 1000
  const MAX_PAGES = 20 // runaway guard (20,000 rows) — raise when the table grows past this
  const all: Row[] = []
  for (let i = 0; i < MAX_PAGES; i++) {
    const { data, error } = await makeQuery().range(i * PAGE, (i + 1) * PAGE - 1)
    if (error) throw error
    const rows = data ?? []
    all.push(...rows)
    if (rows.length < PAGE) return all
  }
  log.error("fetchAllRows", `hit the ${MAX_PAGES * PAGE}-row guard — results may be truncated`)
  return all
}

/* ── Aggregate tallies shared by the state/category/homepage queries ── */

/** Count shops per state. Unsorted — callers sort by name or by count. */
export function tallyStates(
  rows: Array<{ state_code: string | null; state: string }>,
): { state_code: string; state: string; count: number }[] {
  const map: Record<string, { state: string; count: number }> = {}
  for (const row of rows) {
    if (!row.state_code) continue
    if (!map[row.state_code]) map[row.state_code] = { state: row.state, count: 0 }
    map[row.state_code].count++
  }
  return Object.entries(map).map(([state_code, { state, count }]) => ({
    state_code,
    state,
    count,
  }))
}

/** Count shops per shop_type (null → "Unknown"). */
export function tallyTypes(
  rows: Array<{ shop_type: string | null }>,
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of rows) {
    const t = row.shop_type ?? "Unknown"
    counts[t] = (counts[t] ?? 0) + 1
  }
  return counts
}

export interface DirectoryFilters {
  q?: string           // free-text: name or city
  state?: string       // state_code e.g. "TX"
  shopTypes?: string[] // array of shop_type values
  services?: string[]  // partial match against services field
  ownership?: string[] // ownership_type values (see lib/fitter-classification.ts)
  fitting?: boolean    // offers_fitting = true
  fittingEnv?: string  // fitting_environment
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

/* ── Directory listing query — single implementation shared by the browser
   client (listings.ts) and the server (shops.ts). The caller supplies its own
   Supabase client so the same filter/sort/pagination logic serves both. ── */
export async function queryListings(
  supabase: { from: (table: string) => any },
  filters: DirectoryFilters = {},
): Promise<DirectoryResult> {
  const page     = Math.max(1, filters.page    ?? 1)
  const perPage  = Math.max(1, filters.perPage ?? 24)
  const from     = (page - 1) * perPage
  const to       = from + perPage - 1

  const applyFilters = (q: any) => {
    if (filters.q) {
      const term = sanitizeSearchTerm(filters.q)
      if (term) q = q.or(`name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%`)
    }
    if (filters.state)                            q = q.eq("state_code", filters.state)
    if (filters.shopTypes?.length)                q = q.in("shop_type", filters.shopTypes)
    if (filters.services?.length) {
      const orClauses = filters.services
        .map((s) => sanitizeSearchTerm(s))
        .filter(Boolean)
        .map((s) => `services.ilike.%${s}%`)
        .join(",")
      if (orClauses) q = q.or(orClauses)
    }
    if (filters.ownership?.length)                q = q.in("ownership_type", filters.ownership)
    if (filters.fitting === true)                 q = q.eq("offers_fitting", true)
    if (filters.fittingEnv)                       q = q.eq("fitting_environment", filters.fittingEnv)
    if (filters.minRating && filters.minRating > 0) q = q.gte("rating", filters.minRating)
    return q
  }

  let countQ = applyFilters(
    supabase.from("shops").select("id", { count: "exact", head: true }).eq("status", "active"),
  )
  let dataQ = applyFilters(
    supabase.from("shops").select(CARD_FIELDS).eq("status", "active"),
  )

  // Sort
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
    dataQ = dataQ
      .order("is_featured", { ascending: false })
      .order("rating",      { ascending: false, nullsFirst: false })
  }

  // Stable tiebreaker: without a final unique sort key, rows that tie on the
  // chosen sort can shuffle between page requests (duplicated/skipped shops).
  dataQ = dataQ.order("id", { ascending: true }).range(from, to)

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
