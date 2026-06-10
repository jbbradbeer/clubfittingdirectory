import { describe, expect, it } from "vitest"
import { fetchAllRows, sanitizeSearchTerm } from "@/lib/supabase/queries/shared"

/* Regression tests for the search-input sanitizer. The apostrophe mapping
   exists because macOS smart quotes broke search entirely (commit f7cc17d);
   the structural-character stripping is what keeps visitor input from
   altering the PostgREST .or() filter. */
describe("sanitizeSearchTerm", () => {
  it("maps every apostrophe variant to the single-char wildcard _", () => {
    expect(sanitizeSearchTerm("Pete's")).toBe("Pete_s")
    expect(sanitizeSearchTerm("Pete’s")).toBe("Pete_s") // macOS smart quote
    expect(sanitizeSearchTerm("Pete‘s")).toBe("Pete_s")
    expect(sanitizeSearchTerm("Pete`s")).toBe("Pete_s")
    expect(sanitizeSearchTerm("Pete´s")).toBe("Pete_s")
  })

  it("strips characters with structural meaning in PostgREST filters", () => {
    expect(sanitizeSearchTerm("a,b")).toBe("a b")
    expect(sanitizeSearchTerm("(golf)")).toBe("golf")
    expect(sanitizeSearchTerm("100%")).toBe("100")
    expect(sanitizeSearchTerm("back\\slash")).toBe("back slash")
    expect(sanitizeSearchTerm("star*")).toBe("star")
  })

  it("cannot be used to inject extra .or() clauses", () => {
    const hostile = "x%,name.ilike.%admin"
    expect(sanitizeSearchTerm(hostile)).not.toContain(",")
    expect(sanitizeSearchTerm(hostile)).not.toContain("%")
  })

  it("leaves ordinary searches untouched and trims whitespace", () => {
    expect(sanitizeSearchTerm("Club Champion")).toBe("Club Champion")
    expect(sanitizeSearchTerm("  austin  ")).toBe("austin")
    expect(sanitizeSearchTerm("")).toBe("")
  })
})

/* Regression tests for the 1,000-row PostgREST cap fix. A fake query builder
   stands in for Supabase: each makeQuery() call returns an object whose
   .range(from, to) resolves with the matching slice of `rows`. */
function fakeTable<T>(rows: T[], calls: [number, number][]) {
  return () => ({
    range: (from: number, to: number) => {
      calls.push([from, to])
      return Promise.resolve({ data: rows.slice(from, to + 1), error: null })
    },
  })
}

describe("fetchAllRows", () => {
  it("returns everything in one call when under 1,000 rows", async () => {
    const calls: [number, number][] = []
    const rows = Array.from({ length: 42 }, (_, i) => ({ id: i }))
    const result = await fetchAllRows(fakeTable(rows, calls))
    expect(result).toHaveLength(42)
    expect(calls).toEqual([[0, 999]])
  })

  it("pages past the 1,000-row cap and preserves order", async () => {
    const calls: [number, number][] = []
    const rows = Array.from({ length: 2500 }, (_, i) => ({ id: i }))
    const result = await fetchAllRows(fakeTable(rows, calls))
    expect(result).toHaveLength(2500)
    expect(calls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ])
    expect(result[0]).toEqual({ id: 0 })
    expect(result[2499]).toEqual({ id: 2499 })
  })

  it("handles an exact page-boundary row count (the original bug shape)", async () => {
    const calls: [number, number][] = []
    const rows = Array.from({ length: 1000 }, (_, i) => ({ id: i }))
    const result = await fetchAllRows(fakeTable(rows, calls))
    expect(result).toHaveLength(1000)
    // Needs a second (empty) page to know it is finished.
    expect(calls).toEqual([
      [0, 999],
      [1000, 1999],
    ])
  })

  it("matches the production table size that triggered the bug", async () => {
    const rows = Array.from({ length: 1267 }, (_, i) => ({ id: i }))
    const result = await fetchAllRows(fakeTable(rows, []))
    expect(result).toHaveLength(1267)
  })

  it("throws instead of silently returning partial data on a query error", async () => {
    const failing = () => ({
      range: () =>
        Promise.resolve({ data: null, error: { message: "boom" } }),
    })
    await expect(fetchAllRows(failing)).rejects.toEqual({ message: "boom" })
  })

  it("treats null data as an empty page rather than crashing", async () => {
    const empty = () => ({
      range: () => Promise.resolve({ data: null, error: null }),
    })
    await expect(fetchAllRows(empty)).resolves.toEqual([])
  })
})
