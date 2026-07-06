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
  "verified_expires_at", "latitude", "longitude",
  "launch_monitors", "ownership_type", "fitting_price_min", "fitting_price_max",
].join(", ")

/**
 * The subset of Shop fields that CARD_FIELDS actually selects. Card/grid
 * queries return this — not a full Shop — so the type reflects reality instead
 * of pretending every column is present (the old `as unknown as Shop` cast hid
 * that the other ~15 columns are undefined on card results).
 */
export type ShopCard = Pick<
  Shop,
  | "id" | "slug" | "name" | "shop_type" | "primary_service"
  | "city" | "state" | "state_code" | "phone" | "website"
  | "rating" | "rating_tier" | "reviews" | "photos_count" | "has_photos"
  | "offers_fitting" | "fitting_environment" | "services" | "services_array"
  | "num_services" | "verified" | "location_link" | "is_featured" | "listing_tier"
  | "verified_expires_at" | "latitude" | "longitude"
  | "launch_monitors" | "ownership_type" | "fitting_price_min" | "fitting_price_max"
>

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
