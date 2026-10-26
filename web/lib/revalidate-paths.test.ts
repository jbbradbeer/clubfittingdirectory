import { describe, expect, it } from "vitest"
import { pathsForShop, mapNeedsRefresh } from "./revalidate-paths"

const shop = {
  slug: "pete-s-golf-austin",
  state_code: "TX",
  city: "Austin",
  shop_type: "Clubfitter",
  services: "Custom fitting, club repair, regripping",
  latitude: 30.2,
  longitude: -97.7,
  name: "Pete's Golf",
}

describe("pathsForShop", () => {
  it("lists the listing, state, city and category pages", () => {
    const paths = pathsForShop(shop)
    expect(paths).toContain("/listing/pete-s-golf-austin")
    expect(paths).toContain("/state/tx")
    expect(paths).toContain("/city/austin-tx")
    expect(paths).toContain("/category/club-fitters")
  })
  it("matches /repair services case-insensitively (the page query uses ilike)", () => {
    expect(pathsForShop({ ...shop, services: "club repair" })).toContain("/repair")
    expect(pathsForShop({ ...shop, services: "CLUB REPAIR" })).toContain("/repair")
    expect(pathsForShop({ ...shop, services: "Lessons only" })).not.toContain("/repair")
  })
  it("survives a row with nothing identifiable", () => {
    expect(pathsForShop({})).toEqual([])
  })
})

describe("mapNeedsRefresh", () => {
  it("always refreshes on insert/delete", () => {
    expect(mapNeedsRefresh("INSERT", shop, null)).toBe(true)
    expect(mapNeedsRefresh("DELETE", null, shop)).toBe(true)
  })
  it("refreshes an update only when the pin or label moved", () => {
    expect(mapNeedsRefresh("UPDATE", shop, { ...shop, services: "other" })).toBe(false)
    expect(mapNeedsRefresh("UPDATE", shop, { ...shop, latitude: 31 })).toBe(true)
    expect(mapNeedsRefresh("UPDATE", shop, { ...shop, name: "Old name" })).toBe(true)
  })
})
