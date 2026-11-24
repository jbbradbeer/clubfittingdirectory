import { describe, expect, it } from "vitest"
import { findDuplicates, type ExistingShop } from "@/lib/moderation/duplicates"
import { isSharedHost, namesSimilar, normalizeWebsite, ownHost, phoneDigits } from "@/lib/moderation/normalize"

const shop = (o: Partial<ExistingShop>): ExistingShop => ({
  id: "x", slug: "x", name: "X", city: "X", state_code: "XX", website: null, phone: null, status: "active", ...o,
})

describe("normalizers", () => {
  it("adds https to bare domains and rejects non-web text", () => {
    expect(normalizeWebsite("azclubcoach.com")).toBe("https://azclubcoach.com/")
    expect(normalizeWebsite("javascript:alert(1)")).toBeNull()
    expect(normalizeWebsite("https://user:pw@evil.com")).toBeNull()
    expect(normalizeWebsite("email only")).toBeNull()
    expect(normalizeWebsite(null)).toBeNull()
  })
  it("only treats real 10-digit numbers as phones", () => {
    expect(phoneDigits("+18775514653")).toBe("8775514653")
    expect(phoneDigits("(913) 663-5050")).toBe("9136635050")
    expect(phoneDigits("email only")).toBeNull()
  })
  it("never counts a shared platform as a shop's own domain", () => {
    expect(isSharedHost("joesgolf.wixsite.com")).toBe(true)
    expect(ownHost("https://www.facebook.com/joesgolf")).toBeNull()
    expect(ownHost("https://notfacebook.com")).toBe("notfacebook.com")
    expect(ownHost("https://www.golf-md.com/about")).toBe("golf-md.com")
  })
  it("compares names by their distinguishing words", () => {
    expect(namesSimilar("Ultimate Fit Golf", "Ultimate Fit GOLF LLC")).toBe(true)
    expect(namesSimilar("The Golf Shop", "Golf Center")).toBe(false)
    expect(namesSimilar("Precision Golf", "Precision Club Fitting")).toBe(false)
  })
})

/* The five real submissions that were approved as duplicates in 2026. */
describe("findDuplicates — historical misses", () => {
  it("Golf MD: same website, different phone", () => {
    const [m] = findDuplicates(
      { name: "Golf MD", city: "Lenexa", state_code: "KS", website: "https://golf-md.com/", phone: "6202124206" },
      [shop({ name: "GOLF Md", city: "Lenexa", state_code: "KS", website: "https://golf-md.com/", phone: "(913) 663-5050" })],
    )
    expect(m.likely).toBe(true)
  })
  it("Arkansas Golf Center: www and phone formatting differ", () => {
    const [m] = findDuplicates(
      { name: "Arkansas Golf Center", city: "Conway", state_code: "AR", website: "https://arkansasgolfcenter.com/", phone: "5013270171" },
      [shop({ name: "Arkansas GOLF Center", city: "Conway", state_code: "AR", website: "https://www.arkansasgolfcenter.com/", phone: "(501) 327-0171" })],
    )
    expect(m).toMatchObject({ likely: true })
    expect(m.reasons).toHaveLength(3)
  })
  it("Ultimate Fit: suburb vs city, no phone", () => {
    const [m] = findDuplicates(
      { name: "Ultimate Fit Golf", city: "Minneapolis", state_code: "MN", website: "https://www.ultimatefitgolf.com/", phone: null },
      [shop({ name: "Ultimate Fit GOLF LLC", city: "Columbia Heights", state_code: "MN", website: "https://www.ultimatefitgolf.com/" })],
    )
    expect(m.likely).toBe(true)
  })
  it("Puetz: same everything", () => {
    const [m] = findDuplicates(
      { name: "Puetz Golf Seattle Superstore", city: "Seattle", state_code: "WA", website: "https://www.puetzgolf.com", phone: "(206) 362-2272" },
      [shop({ name: "Puetz GOLF Seattle Superstore", city: "Seattle", state_code: "WA", website: "https://www.puetzgolf.com/", phone: "(206) 362-2272" })],
    )
    expect(m.likely).toBe(true)
  })
  it("Victory: listed under another name in a suburb", () => {
    const [m] = findDuplicates(
      { name: "Victory Golf & Repair", city: "Seattle", state_code: "WA", website: "https://www.victorygolfandrepair.com/", phone: "(206) 432-0908" },
      [shop({ name: "Allvictorygolf", city: "Kent", state_code: "WA", website: "https://www.victorygolfandrepair.com/", phone: "(206) 432-0908" })],
    )
    expect(m.likely).toBe(true)
  })
})

describe("findDuplicates — non-duplicates", () => {
  it("a chain branch in another state is only a hint", () => {
    const [m] = findDuplicates(
      { name: "Club Champion", city: "Austin", state_code: "TX", website: "https://clubchampion.com", phone: null },
      [shop({ name: "Club Champion", city: "Chicago", state_code: "IL", website: "https://clubchampion.com/chicago" })],
    )
    expect(m.likely).toBe(false)
  })
  it("two shops that merely share Facebook don't match", () => {
    expect(findDuplicates(
      { name: "Joe's Fitting", city: "Austin", state_code: "TX", website: "https://facebook.com/joe", phone: null },
      [shop({ name: "Sam's Repair", city: "Austin", state_code: "TX", website: "https://facebook.com/sam" })],
    )).toEqual([])
  })
  it("missing phone and website never match each other", () => {
    expect(findDuplicates(
      { name: "Alpha Fitting", city: "Austin", state_code: "TX", website: null, phone: null },
      [shop({ name: "Beta Repair", city: "Austin", state_code: "TX" })],
    )).toEqual([])
  })
  it("matches inactive shops, so a removed one can't quietly return", () => {
    const [m] = findDuplicates(
      { name: "Old Shop", city: "Austin", state_code: "TX", website: "https://old.golf", phone: null },
      [shop({ name: "Old Shop", city: "Austin", state_code: "TX", website: "https://old.golf", status: "inactive" })],
    )
    expect(m.likely).toBe(true)
  })
})
