import { describe, expect, it } from "vitest"
import { CORE_GUIDES, countCore, isCoreCity, isCoreListing, isCoreState, robotsFor } from "@/lib/index-policy"
import { getAllGuides } from "@/lib/guides"

const strong = {
  slug: "a", city: "Austin", state_code: "TX",
  offers_fitting: true, street: "1 Main St", website: "https://a.com", phone: null,
  services_array: ["Club Fitting", "Club Repair", "Lessons"],
  fitting_price_min: 100, brands_fitted: ["PING"], launch_monitors: [], credentials: null, claimed_at: null,
}

describe("isCoreListing", () => {
  it("accepts exactly the bar", () => expect(isCoreListing(strong)).toBe(true))
  it.each([
    ["no fitting", { offers_fitting: false }],
    ["no street", { street: null }],
    ["no contact", { website: null, phone: null }],
    ["two services", { services_array: ["a", "b"] }],
    ["null services", { services_array: null }],
    ["one fact", { fitting_price_min: null }],
  ])("rejects: %s", (_, change) => expect(isCoreListing({ ...strong, ...change })).toBe(false))
  it("a $0 price still counts as published", () =>
    expect(isCoreListing({ ...strong, fitting_price_min: 0 })).toBe(true))
  it("phone works instead of website", () =>
    expect(isCoreListing({ ...strong, website: null, phone: "5551234567" })).toBe(true))
  it("a claimed listing always counts", () =>
    expect(isCoreListing({ claimed_at: "2026-07-24" })).toBe(true))
})

describe("thresholds", () => {
  it("city needs 2, state needs 5", () => {
    expect([1, 2].map(isCoreCity)).toEqual([false, true])
    expect([4, 5].map(isCoreState)).toEqual([false, true])
  })
  it("counts only strong shops, merging city spellings", () => {
    const c = countCore([
      strong,
      { ...strong, slug: "b", city: "austin", state_code: "tx" },
      { ...strong, slug: "weak", street: null },
      { ...strong, slug: "c", city: null },
    ])
    expect([...c.listings]).toEqual(["a", "b", "c"])
    expect(c.cities.get("austin-tx")).toBe(2)
    expect(c.states.get("TX")).toBe(3)
  })
})

describe("robotsFor", () => {
  it("weak pages are hidden from Google only, never from everyone", () => {
    expect(robotsFor(false, true)).toEqual({
      robots: { index: true, follow: true, googleBot: { index: false, follow: true } },
    })
  })
  it("core pages keep the site default", () => expect(robotsFor(true, true)).toEqual({}))
  it("the off switch restores everything", () => expect(robotsFor(false, false)).toEqual({}))
})

it("every core guide exists", () => {
  const slugs = new Set(getAllGuides().map((g) => g.slug))
  for (const slug of CORE_GUIDES) expect(slugs.has(slug), slug).toBe(true)
})
