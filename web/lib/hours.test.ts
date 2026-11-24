import { describe, expect, it } from "vitest"
import { hasReliableHours } from "@/lib/hours"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const week = (n: number) => Object.fromEntries(DAYS.slice(0, n).map((d) => [d, "9AM-5PM"]))

describe("hasReliableHours", () => {
  it.each([[0, false], [1, false], [4, false], [5, true], [7, true]])("%i days → %s", (n, ok) =>
    expect(hasReliableHours(week(n))).toBe(ok))
  it("the real scrape artifact is hidden", () =>
    expect(hasReliableHours({ Wednesday: ["11AM-6PM"] })).toBe(false))
  it("counts Closed as known, ignores blanks and junk keys", () => {
    expect(hasReliableHours({ ...week(4), Sunday: "Closed" })).toBe(true)
    expect(hasReliableHours({ ...week(4), Sunday: "" })).toBe(false)
    expect(hasReliableHours({ ...week(4), Sunday: [] })).toBe(false)
    expect(hasReliableHours({ ...week(4), Holiday: "9AM" })).toBe(false)
  })
  it("handles missing hours", () => expect(hasReliableHours(null)).toBe(false))
})
