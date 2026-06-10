import { describe, expect, it } from "vitest"
import { toCitySlug } from "@/lib/slugs"

/* City slugs are both URLs and database identity for /city pages — if this
   function's output ever shifts, existing pages 404. These tests pin the
   exact current behaviour. */
describe("toCitySlug", () => {
  it("joins lowercased city and state code with hyphens", () => {
    expect(toCitySlug("Austin", "TX")).toBe("austin-tx")
    expect(toCitySlug("San Francisco", "CA")).toBe("san-francisco-ca")
  })

  it("collapses punctuation and spaces into single hyphens", () => {
    expect(toCitySlug("St. Louis", "MO")).toBe("st-louis-mo")
    expect(toCitySlug("O'Fallon", "MO")).toBe("o-fallon-mo")
    expect(toCitySlug("Coeur d'Alene", "ID")).toBe("coeur-d-alene-id")
  })

  it("keeps existing hyphens as single separators", () => {
    expect(toCitySlug("Winston-Salem", "NC")).toBe("winston-salem-nc")
  })

  it("strips leading/trailing separators from messy input", () => {
    expect(toCitySlug(" Austin ", "TX")).toBe("austin-tx")
    expect(toCitySlug("(Austin)", "TX")).toBe("austin-tx")
  })

  it("lowercases the state code", () => {
    expect(toCitySlug("Boise", "id")).toBe("boise-id")
    expect(toCitySlug("Boise", "ID")).toBe("boise-id")
  })

  it("keeps numbers", () => {
    expect(toCitySlug("29 Palms", "CA")).toBe("29-palms-ca")
  })
})
