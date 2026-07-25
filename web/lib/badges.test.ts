import { describe, expect, it } from "vitest"
import { getShopTag, isTopRated, isVerified, isFeaturedPaid } from "./badges"

describe("isTopRated", () => {
  it("requires both thresholds", () => {
    expect(isTopRated(4.8, 25)).toBe(true)
    expect(isTopRated(4.9, 100)).toBe(true)
    expect(isTopRated(4.7, 100)).toBe(false)   // rating too low
    expect(isTopRated(5.0, 24)).toBe(false)    // too few reviews
    expect(isTopRated(null, null)).toBe(false)
    expect(isTopRated(undefined, 30)).toBe(false)
  })
})

describe("isVerified (free, claim-based)", () => {
  it("true when claimed_at is set, regardless of tier", () => {
    expect(isVerified({ claimed_at: "2026-07-01T00:00:00Z" })).toBe(true)
    expect(isVerified({ claimed_at: null })).toBe(false)
    expect(isVerified({})).toBe(false)
  })
})

describe("isFeaturedPaid", () => {
  it("requires the featured tier and an unexpired subscription", () => {
    expect(isFeaturedPaid({ listing_tier: "featured", verified_expires_at: "2999-01-01T00:00:00Z" })).toBe(true)
    expect(isFeaturedPaid({ listing_tier: "featured", verified_expires_at: null })).toBe(true) // legacy, no expiry
    expect(isFeaturedPaid({ listing_tier: "featured", verified_expires_at: "2020-01-01T00:00:00Z" })).toBe(false)
    expect(isFeaturedPaid({ listing_tier: "free" })).toBe(false)
  })
})

describe("getShopTag priority", () => {
  it("paid Featured beats everything, even a claimed top-rated shop", () => {
    expect(getShopTag({ listing_tier: "featured", verified_expires_at: "2999-01-01T00:00:00Z", claimed_at: "2026-07-01T00:00:00Z", rating: 5, reviews: 99 })?.label)
      .toBe("Featured")
  })
  it("legacy is_featured flag still shows Featured", () => {
    expect(getShopTag({ listing_tier: "free", is_featured: true, claimed_at: "2026-07-01T00:00:00Z", rating: 5, reviews: 99 })?.label)
      .toBe("Featured")
  })
  it("free Verified (claimed) beats Top Rated", () => {
    expect(getShopTag({ listing_tier: "free", is_featured: false, claimed_at: "2026-07-01T00:00:00Z", rating: 5, reviews: 99 })?.label)
      .toBe("Verified")
  })
  it("Top Rated when earned and unclaimed", () => {
    expect(getShopTag({ listing_tier: "free", is_featured: false, claimed_at: null, rating: 4.8, reviews: 25 })?.label)
      .toBe("Top Rated")
  })
  it("expired Featured subscription falls back to Verified for a claimed shop", () => {
    expect(getShopTag({ listing_tier: "featured", verified_expires_at: "2020-01-01T00:00:00Z", claimed_at: "2026-07-01T00:00:00Z" })?.label)
      .toBe("Verified")
  })
  it("null when nothing applies (scraped verified boolean is ignored by design)", () => {
    expect(getShopTag({ listing_tier: "free", is_featured: false, claimed_at: null, rating: 4.2, reviews: 300 }))
      .toBeNull()
  })
})
