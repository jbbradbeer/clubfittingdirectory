/**
 * Badge logic — the single source of truth for which tag a shop earns.
 *
 * Three badges, strictly ranked:
 *   Verified (paid, listing_tier='verified')  — the $49/mo / $499/yr product
 *   Featured (is_featured)                    — legacy/premium placement flag
 *   Top Rated (computed)                      — EARNED, never bought. Computed
 *     at render time from live rating data so it can't go stale; the old
 *     scraped rating_tier column is deprecated and must not be read.
 *
 * The Google-scraped `verified` boolean is intentionally NOT displayed
 * anywhere — it would be a free lookalike of the paid Verified badge.
 */

export const TOP_RATED_MIN_RATING = 4.8
export const TOP_RATED_MIN_REVIEWS = 25

export function isTopRated(rating: number | null | undefined,
                           reviews: number | null | undefined): boolean {
  return (rating ?? 0) >= TOP_RATED_MIN_RATING &&
         (reviews ?? 0) >= TOP_RATED_MIN_REVIEWS
}

export interface ShopTag {
  label: "Verified" | "Featured" | "Top Rated"
  className: string
}

/**
 * Paid Verified status: the tier must be set AND the subscription not past its
 * expiry. Evaluated at render time, so an expired badge disappears on the next
 * page regeneration (up to the 30-day ISR window; the admin Verified card is
 * the real renewal control).
 */
export function isVerified(shop: {
  listing_tier?: string | null
  verified_expires_at?: string | null
}): boolean {
  if (shop.listing_tier !== "verified") return false
  if (!shop.verified_expires_at) return true // legacy activation without expiry
  return new Date(shop.verified_expires_at) > new Date()
}

export function getShopTag(shop: {
  listing_tier?: string | null
  verified_expires_at?: string | null
  is_featured?: boolean | null
  rating?: number | null
  reviews?: number | null
}): ShopTag | null {
  if (isVerified(shop)) {
    return { label: "Verified", className: "bg-[var(--color-forest)] text-white" }
  }
  if (shop.is_featured) {
    return { label: "Featured", className: "bg-[var(--color-gold)] text-[var(--color-forest-deep)]" }
  }
  if (isTopRated(shop.rating, shop.reviews)) {
    return { label: "Top Rated", className: "bg-[var(--color-forest-tint)] text-[var(--color-forest)]" }
  }
  return null
}
