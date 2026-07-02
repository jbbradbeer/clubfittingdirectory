import { describe, expect, it } from "vitest"
import { getShopTag, isTopRated } from "./badges"

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

describe("getShopTag priority", () => {
  it("paid Verified beats everything, even when is_featured is also set", () => {
    expect(getShopTag({ listing_tier: "verified", is_featured: true, rating: 5, reviews: 99 })?.label)
      .toBe("Verified")
  })
  it("Featured beats Top Rated", () => {
    expect(getShopTag({ listing_tier: "free", is_featured: true, rating: 5, reviews: 99 })?.label)
      .toBe("Featured")
  })
  it("Top Rated when earned and nothing paid", () => {
    expect(getShopTag({ listing_tier: "free", is_featured: false, rating: 4.8, reviews: 25 })?.label)
      .toBe("Top Rated")
  })
  it("null when nothing applies (scraped verified boolean is ignored by design)", () => {
    expect(getShopTag({ listing_tier: "free", is_featured: false, rating: 4.2, reviews: 300 }))
      .toBeNull()
  })
})
