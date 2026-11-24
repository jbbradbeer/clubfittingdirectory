import { beforeEach, describe, expect, it, vi } from "vitest"

/* In-memory stand-in for the Supabase calls apply.ts makes: select/insert/
   update with eq/is filters. Enough to prove the state transitions. */
type Row = Record<string, unknown>
const db: Record<string, Row[]> = {}
let failInsertInto: string | null = null

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      const filters: ((r: Row) => boolean)[] = []
      let op: "select" | "insert" | "update" = "select"
      let payload: Row = {}
      const run = () => {
        const rows = (db[table] ??= [])
        if (op === "insert") {
          if (failInsertInto === table) return { data: null, error: { message: "boom" } }
          rows.push({ ...payload })
          return { data: [payload], error: null }
        }
        const hit = rows.filter((r) => filters.every((f) => f(r)))
        if (op === "update") hit.forEach((r) => Object.assign(r, payload))
        return { data: hit, error: null }
      }
      const q = {
        select: () => q,
        insert: (p: Row) => { op = "insert"; payload = p; return q },
        update: (p: Row) => { op = "update"; payload = p; return q },
        eq: (k: string, v: unknown) => { filters.push((r) => r[k] === v); return q },
        is: (k: string, v: unknown) => { filters.push((r) => (r[k] ?? null) === v); return q },
        order: () => q,
        range: async () => run(),
        single: async () => {
          const { data } = run()
          return data && data.length === 1 ? { data: { ...data[0] }, error: null } : { data: null, error: { message: "none" } }
        },
        then: (ok: (v: unknown) => unknown) => Promise.resolve(run()).then(ok),
      }
      return q
    },
  }),
}))
vi.mock("@/lib/supabase/queries/shared", () => ({
  fetchAllRows: async (make: () => { range: (a: number, b: number) => Promise<{ data: Row[] }> }) =>
    (await make().range(0, 999)).data,
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
const { email } = vi.hoisted(() => ({ email: vi.fn(async () => true) }))
vi.mock("@/lib/email", () => ({ sendClaimApprovedEmail: email }))

import { applyClaimApproval, applyRejection, applySubmissionApproval } from "@/lib/moderation/apply"

const sub = (o: Row = {}): Row => ({
  id: "sub-123456", name: "The Club Coach", shop_type: "Clubfitter", city: "Casa Grande", state_code: "AZ",
  website: "azclubcoach.com", phone: "email only", offers_fitting: false, review_status: "new", ...o,
})
const shop = (o: Row = {}): Row => ({
  id: "shop-1", slug: "all-about-golf-tempe-az", name: "All About GOLF", city: "Tempe", state_code: "AZ",
  shop_type: "Clubfitter", status: "active", claimed_at: null, owner_email: null, website: null, phone: null, ...o,
})
const claim = (o: Row = {}): Row => ({
  id: "claim-1", shop_id: "shop-1", claimant_name: "Todd", claimant_email: "todd@allaboutgolf.com",
  message: "Saturday 9 to 2", review_status: "new", ...o,
})

beforeEach(() => {
  for (const k of Object.keys(db)) delete db[k]
  failInsertInto = null
  email.mockClear()
})

describe("applySubmissionApproval", () => {
  it("publishes once — a second click creates nothing", async () => {
    db.shop_submissions = [sub()]
    db.shops = []
    expect((await applySubmissionApproval("sub-123456")).slug).toBe("the-club-coach-casa-grande-az")
    expect((await applySubmissionApproval("sub-123456")).error).toMatch(/already been reviewed/)
    expect(db.shops).toHaveLength(1)
  })
  it("two overlapping approvals still create one listing", async () => {
    db.shop_submissions = [sub()]
    db.shops = []
    await Promise.all([applySubmissionApproval("sub-123456"), applySubmissionApproval("sub-123456")])
    expect(db.shops).toHaveLength(1)
  })
  it("cleans the website and drops a non-phone", async () => {
    db.shop_submissions = [sub()]
    db.shops = []
    await applySubmissionApproval("sub-123456")
    expect(db.shops[0]).toMatchObject({ website: "https://azclubcoach.com/", phone: null })
  })
  it("a missing shop type is fixable by the reviewer, and blocks until it is", async () => {
    db.shop_submissions = [sub({ shop_type: null })]
    db.shops = []
    expect((await applySubmissionApproval("sub-123456")).error).toMatch(/shop type/)
    expect(db.shop_submissions[0].review_status).toBe("new")
    expect((await applySubmissionApproval("sub-123456", { shop_type: "Retailer" })).error).toBeUndefined()
    expect(db.shops[0].shop_type).toBe("Retailer")
  })
  it("uses the corrected state in the address and listing", async () => {
    db.shop_submissions = [sub({ name: "Rick's", city: "Olean", state_code: "PA" })]
    db.shops = []
    const { slug } = await applySubmissionApproval("sub-123456", { state_code: "NY" })
    expect(slug).toBe("rick-s-olean-ny")
    expect(db.shops[0].state).toBe("New York")
  })
  it("refuses a likely duplicate unless told it isn't one", async () => {
    db.shop_submissions = [sub({ website: "https://azclubcoach.com" })]
    db.shops = [shop({ name: "Club Coach Repair", website: "http://www.azclubcoach.com/home" })]
    expect((await applySubmissionApproval("sub-123456")).error).toMatch(/duplicate/)
    expect(db.shops).toHaveLength(1)
    expect((await applySubmissionApproval("sub-123456", { allowDuplicate: true })).error).toBeUndefined()
    expect(db.shops).toHaveLength(2)
  })
  it("returns the item to the queue if the listing can't be created", async () => {
    db.shop_submissions = [sub()]
    db.shops = []
    failInsertInto = "shops"
    expect((await applySubmissionApproval("sub-123456")).error).toMatch(/Could not create/)
    expect(db.shop_submissions[0].review_status).toBe("new")
  })
})

describe("applyClaimApproval", () => {
  it("stamps the owner and keeps their message as a to-do", async () => {
    db.shop_claims = [claim()]
    db.shops = [shop()]
    await applyClaimApproval("claim-1")
    expect(db.shops[0].owner_email).toBe("todd@allaboutgolf.com")
    expect(db.listing_update_requests).toMatchObject([{ message: "Saturday 9 to 2", shop_id: "shop-1" }])
    expect(email).toHaveBeenCalledTimes(1)
  })
  it("never takes over a shop that already has an owner", async () => {
    db.shop_claims = [claim({ claimant_email: "rival@gmail.com" })]
    db.shops = [shop({ claimed_at: "2026-07-28", owner_email: "todd@allaboutgolf.com" })]
    expect((await applyClaimApproval("claim-1")).error).toMatch(/already has an owner/)
    expect(db.shops[0].owner_email).toBe("todd@allaboutgolf.com")
    expect(db.shop_claims[0].review_status).toBe("new")
    expect(email).not.toHaveBeenCalled()
  })
  it("does nothing for an inactive shop", async () => {
    db.shop_claims = [claim()]
    db.shops = [shop({ status: "inactive" })]
    expect((await applyClaimApproval("claim-1")).error).toBeTruthy()
    expect(db.shops[0].claimed_at).toBeNull()
  })
  it("a claim without a message creates no to-do", async () => {
    db.shop_claims = [claim({ message: "  " })]
    db.shops = [shop()]
    await applyClaimApproval("claim-1")
    expect(db.listing_update_requests).toBeUndefined()
  })
})

describe("applyRejection", () => {
  it("can't reject something already approved", async () => {
    db.shop_claims = [claim({ review_status: "approved" })]
    expect((await applyRejection("shop_claims", "claim-1")).error).toMatch(/already been reviewed/)
    expect(db.shop_claims[0].review_status).toBe("approved")
  })
})
