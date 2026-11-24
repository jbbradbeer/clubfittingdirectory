import { describe, expect, it } from "vitest"
import { acceptsFittingRequests } from "@/lib/fitting-signal"

const checked = {
  slug: "tourspecwrx-west-hills-ca", name: "TOURSPECWRX", offers_fitting: false, launch_monitors: [],
  brands_fitted: null, services: "Club Repair | Custom Club Building", services_array: ["Club Repair"],
}

describe("acceptsFittingRequests", () => {
  it("no for a checked shop with no sign of fitting", () => expect(acceptsFittingRequests(checked)).toBe(false))
  it("yes for an unchecked shop, however thin its data", () =>
    expect(acceptsFittingRequests({ ...checked, slug: "abbos-clubworks-jonesboro-ar" })).toBe(true))
  it.each([
    ["the flag", { offers_fitting: true }],
    ["a price", { fitting_price_min: 0 }],
    ["a launch monitor", { launch_monitors: ["TrackMan"] }],
    ["brands fitted", { brands_fitted: ["PING"] }],
    ["services text", { services: "Club Repair | Club Fitting" }],
    ["services list", { services_array: ["Club Fitting"] }],
    ["the name", { name: "Shop for Fitting and Repairs" }],
  ])("%s added later brings the button back", (_, o) =>
    expect(acceptsFittingRequests({ ...checked, ...o })).toBe(true))
  it("doesn't read 'fit' inside other words", () =>
    expect(acceptsFittingRequests({ ...checked, name: "Benefit Golf Outfitters" })).toBe(false))
})
