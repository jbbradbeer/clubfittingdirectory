import { afterEach, describe, expect, it, vi } from "vitest"
import { geocodeAddress, pickMatch } from "@/lib/geocode"

const addr = { street: "228 N Union St", city: "Olean", stateCode: "NY", postalCode: "14760" }
const match = (o: object = {}) => ({
  coordinates: { x: -78.43, y: 42.08 }, addressComponents: { city: "OLEAN", state: "NY", zip: "14760", ...o },
})

describe("pickMatch", () => {
  it("accepts the right state with the right ZIP or city", () => {
    const pin = { latitude: 42.08, longitude: -78.43 }
    expect(pickMatch([match()], addr)).toEqual(pin)
    expect(pickMatch([match({ city: "ALLEGANY" })], addr)).toEqual(pin)
    expect(pickMatch([match({ zip: "99999" })], { ...addr, postalCode: null })).toEqual(pin)
  })
  it("refuses the wrong state, or a match with neither ZIP nor city", () => {
    expect(pickMatch([match({ state: "PA" })], addr)).toBeNull()
    expect(pickMatch([match({ city: "BUFFALO", zip: "14201" })], addr)).toBeNull()
  })
  it("skips a match without coordinates", () => {
    expect(pickMatch([{ ...match(), coordinates: {} }], addr)).toBeNull()
  })
})

describe("geocodeAddress", () => {
  afterEach(() => vi.unstubAllGlobals())
  it("makes no request and gives no pin without a street", async () => {
    const f = vi.fn()
    vi.stubGlobal("fetch", f)
    expect(await geocodeAddress({ ...addr, street: "  " })).toBeNull()
    expect(f).not.toHaveBeenCalled()
  })
  it("a timeout or error is just no pin", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("timeout") }))
    expect(await geocodeAddress(addr)).toBeNull()
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })))
    expect(await geocodeAddress(addr)).toBeNull()
  })
  it("sends only the address", async () => {
    const f = vi.fn(async (url: string) => { void url; return Response.json({ result: { addressMatches: [match()] } }) })
    vi.stubGlobal("fetch", f)
    expect(await geocodeAddress(addr)).toEqual({ latitude: 42.08, longitude: -78.43 })
    expect([...new URL(f.mock.calls[0][0]).searchParams.keys()].sort()).toEqual(["benchmark", "city", "format", "state", "street", "zip"])
  })
})
