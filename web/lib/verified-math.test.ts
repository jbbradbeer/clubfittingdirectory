import { describe, expect, it } from "vitest"
import { nextExpiry } from "./verified-math"

const NOW = new Date("2026-07-23T12:00:00Z")

describe("nextExpiry", () => {
  it("first activation (no expiry) extends one year from now", () => {
    expect(nextExpiry(null, NOW).toISOString()).toBe("2027-07-23T12:00:00.000Z")
  })

  it("lapsed shop (expiry in the past) extends one year from now", () => {
    expect(nextExpiry("2026-01-01T00:00:00Z", NOW).toISOString()).toBe(
      "2027-07-23T12:00:00.000Z",
    )
  })

  it("early renewal extends from the CURRENT expiry — no paid time lost", () => {
    // Verified through Sep 1; renewing in July stacks a year onto Sep 1.
    expect(nextExpiry("2026-09-01T00:00:00Z", NOW).toISOString()).toBe(
      "2027-09-01T00:00:00.000Z",
    )
  })

  it("expiry exactly now behaves like a fresh year from now", () => {
    expect(nextExpiry(NOW.toISOString(), NOW).toISOString()).toBe(
      "2027-07-23T12:00:00.000Z",
    )
  })
})
