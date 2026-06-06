import type { Shop } from "@/types/shop"

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
  "latitude", "longitude",
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
  | "latitude" | "longitude"
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

export interface DirectoryFilters {
  q?: string           // free-text: name or city
  state?: string       // state_code e.g. "TX"
  shopTypes?: string[] // array of shop_type values
  services?: string[]  // partial match against services field
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
