import { describe, expect, it } from "vitest"
import {
  cleanStoredHours, describeHours, formatTime, isPlausibleCity, parseHours, parseServices, parseZip,
} from "@/lib/submission-details"
import { hasReliableHours } from "@/lib/hours"

const open = { status: "open", open: "09:00", close: "17:30" }

describe("parseHours", () => {
  it("writes the shape listings already use", () => {
    expect(parseHours({ Monday: open, Sunday: { status: "closed" } })).toEqual({
      Monday: ["9AM-5:30PM"], Sunday: ["Closed"],
    })
  })
  it("a blank day is unknown, not closed", () => {
    expect(parseHours({ Monday: { status: "" }, Tuesday: undefined })).toEqual({})
  })
  it("drops half-filled, backwards and made-up times", () => {
    expect(parseHours({
      Monday: { status: "open", open: "09:00" },
      Tuesday: { status: "open", open: "17:00", close: "09:00" },
      Wednesday: { status: "open", open: "<b>", close: "17:00" },
      Funday: open,
    })).toEqual({})
  })
  it.each([null, "x", 5, []])("survives %j", (v) => expect(parseHours(v)).toEqual({}))
  it("feeds the five-known-days rule", () => {
    const week = Object.fromEntries(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => [d, open]))
    expect(hasReliableHours(parseHours(week))).toBe(true)
    expect(hasReliableHours(parseHours({ Monday: open }))).toBe(false)
  })
  it("round-trips through the approval check", () => {
    const h = parseHours({ Monday: open, Sunday: { status: "closed" } })
    expect(cleanStoredHours(h)).toEqual(h)
  })
})

describe("cleanStoredHours", () => {
  it("rejects anything the form couldn't have produced", () => {
    expect(cleanStoredHours({ Monday: ["<script>"], Tuesday: "9AM-5PM", Wednesday: ["9AM-5PM", "x"], Foo: ["9AM-5PM"] })).toEqual({})
  })
})

describe("the rest", () => {
  it("formats noon and midnight", () => {
    expect(formatTime("00:00")).toBe("12AM")
    expect(formatTime("12:30")).toBe("12:30PM")
  })
  it("keeps known services only", () => {
    expect(parseServices(["Golf Lessons", "Free Beer", "Club Repair", "Golf Lessons", 7])).toEqual(["Club Repair", "Golf Lessons"])
    expect(parseServices("Club Repair")).toEqual([])
  })
  it("spots a city that isn't one", () => {
    expect(isPlausibleCity("Walnut, MS")).toBe(false)
    expect(isPlausibleCity("90210")).toBe(false)
    expect(isPlausibleCity("St. Louis")).toBe(true)
    expect(isPlausibleCity("Coeur d'Alene")).toBe(true)
  })
  it("reads ZIPs", () => {
    expect(parseZip(" 04101-1234 ")).toBe("04101")
    expect(parseZip("4101")).toBeNull()
  })
  it("summarises hours in week order", () => {
    expect(describeHours({ Sunday: ["Closed"], Monday: ["9AM-5PM"] })).toBe("Mon 9AM-5PM · Sun Closed")
  })
})
