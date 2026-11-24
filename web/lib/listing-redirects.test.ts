import { describe, expect, it } from "vitest"
import { LISTING_REDIRECTS } from "@/lib/listing-redirects"

describe("LISTING_REDIRECTS", () => {
  it("never chains or loops", () => {
    for (const to of Object.values(LISTING_REDIRECTS)) expect(LISTING_REDIRECTS).not.toHaveProperty(to)
  })
  it("uses plain slugs", () => {
    for (const s of Object.entries(LISTING_REDIRECTS).flat()) expect(s).toMatch(/^[a-z0-9-]+$/)
  })
})
