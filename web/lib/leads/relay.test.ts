import { beforeEach, describe, expect, it, vi } from "vitest"

/* In-memory Supabase stand-in covering the calls relay.ts makes. */
type Row = Record<string, unknown>
const db: Record<string, Row[]> = {}
let failTable: string | null = null

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      const filters: ((r: Row) => boolean)[] = []
      let patch: Row | null = null
      const val = (r: Row, k: string): unknown =>
        k.split(".").reduce<unknown>((o, p) => (o as Row | null)?.[p], r) ?? null
      const run = () => {
        if (failTable === table) return { data: null, error: { message: "down" }, count: null }
        const hit = (db[table] ?? []).filter((r) => filters.every((f) => f(r)))
        if (patch) hit.forEach((r) => Object.assign(r, patch))
        return { data: hit.map((r) => ({ ...r })), error: null, count: hit.length }
      }
      const q: Record<string, unknown> = {}
      const add = (f: (r: Row) => boolean) => { filters.push(f); return q }
      Object.assign(q, {
        select: () => q,
        update: (p: Row) => { patch = p; return q },
        upsert: (p: Row) => {
          const rows = (db[table] ??= [])
          const row = rows.find((r) => r.shop_id === p.shop_id)
          if (row) Object.assign(row, p); else rows.push({ ...p })
          filters.push((r) => r.shop_id === p.shop_id)
          return q
        },
        eq: (k: string, v: unknown) => add((r) => val(r, k) === v),
        is: (k: string, v: unknown) => add((r) => val(r, k) === v),
        not: (k: string) => add((r) => val(r, k) !== null),
        in: (k: string, vs: unknown[]) => add((r) => vs.includes(val(r, k))),
        gte: (k: string, v: string) => add((r) => val(r, k) !== null && String(val(r, k)) >= v),
        lt: (k: string, v: number) => add((r) => Number(val(r, k) ?? 0) < v),
        ilike: (k: string, v: string) =>
          add((r) => String(val(r, k) ?? "").toLowerCase() === v.replace(/\\(.)/g, "$1").toLowerCase()),
        order: () => q, limit: () => q,
        single: async () => {
          const { data, error } = run()
          return data?.length === 1 ? { data: data[0], error: null } : { data: null, error: error ?? { message: "none" } }
        },
        then: (ok: (v: unknown) => unknown) => Promise.resolve(run()).then(ok),
      })
      return q
    },
  }),
}))
vi.mock("@/lib/supabase/queries/shared", () => ({
  escapeLikePattern: (v: string) => v.replace(/[\\%_]/g, (c) => `\\${c}`),
}))
const mail = vi.hoisted(() => ({
  sendShopRequest: vi.fn(async (_: unknown) => true),
  notifyNewFittingRequest: vi.fn(async (_: unknown) => true),
  sendGolferConfirmation: vi.fn(async (_: unknown) => true),
  sendLeadReminders: vi.fn(async (_: unknown) => true),
}))
vi.mock("@/lib/email", () => mail)

import {
  confirmToGolfer, forwardLeadToOwner, forwardOpenLeads, knownShopEmails, markShopOptOut,
  sendDueReminders, sendLeadToShop,
} from "@/lib/leads/relay"

const days = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const shop = (o: Row = {}): Row => ({
  id: "s1", name: "Tee Time", slug: "tee-time", status: "active", claimed_at: null, owner_email: null, ...o,
})
const lead = (o: Row = {}): Row => ({
  id: "l1", shop_id: "s1", status: "new", outcome: null, visitor_name: "Jo Smith", visitor_email: "jo@golfer.com",
  visitor_phone: "555-123-4567", fitting_type: "irons", preferred_date: null, preferred_time: null,
  notes: "Text 555-123-4567", notified_at: days(1), shop_sent_at: null, owner_forwarded_at: null,
  golfer_confirmed_at: null, reminded_at: null, reminder_count: 0, created_at: days(1), shop_name: "Tee Time",
  shops: shop(), ...o,
})
const claimedShop = shop({ claimed_at: days(0), owner_email: "owner@shop.com" })

beforeEach(() => {
  for (const k of Object.keys(db)) delete db[k]
  failTable = null
  Object.values(mail).forEach((m) => { m.mockReset(); m.mockResolvedValue(true) })
  db.fitting_requests = [lead()]
  db.outreach = []
})

describe("sendLeadToShop", () => {
  it("sends the request with no golfer identity, once", async () => {
    expect(await sendLeadToShop("l1", " pro@shop.com ")).toEqual({})
    expect((await sendLeadToShop("l1", "pro@shop.com")).error).toMatch(/Already sent/)
    expect(mail.sendShopRequest).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(mail.sendShopRequest.mock.calls[0])).not.toMatch(/Jo Smith|jo@golfer|555-123/)
    expect(db.fitting_requests[0]).toMatchObject({ shop_email: "pro@shop.com", status: "contacted" })
  })
  it("two taps at once still send once", async () => {
    await Promise.all([sendLeadToShop("l1", "pro@shop.com"), sendLeadToShop("l1", "pro@shop.com")])
    expect(mail.sendShopRequest).toHaveBeenCalledTimes(1)
  })
  it("a failed send leaves it ready to retry", async () => {
    mail.sendShopRequest.mockResolvedValueOnce(false)
    expect((await sendLeadToShop("l1", "pro@shop.com")).error).toMatch(/didn't send/)
    expect(db.fitting_requests[0]).toMatchObject({ shop_sent_at: null, shop_email: null, status: "new" })
    expect(await sendLeadToShop("l1", "pro@shop.com")).toEqual({})
  })
  it("goes to the verified owner if the shop was claimed meanwhile", async () => {
    db.fitting_requests = [lead({ shops: claimedShop })]
    await sendLeadToShop("l1", "pro@shop.com")
    expect(mail.sendShopRequest).not.toHaveBeenCalled()
    expect(mail.notifyNewFittingRequest.mock.calls[0][0]).toMatchObject({ ownerEmail: "owner@shop.com" })
  })
  it.each([
    ["opted out (this shop)", [{ shop_id: "s1", status: "do_not_contact" }]],
    ["opted out (same address, other shop)", [{ shop_id: "s2", status: "do_not_contact", contact_email: "PRO@shop.com" }]],
    ["known to bounce", [{ shop_id: "s1", status: "sent_1", contact_email: "pro@shop.com", email_verified: "invalid" }]],
  ])("refuses an address that is %s", async (_, rows) => {
    db.outreach = rows
    expect((await sendLeadToShop("l1", "pro@shop.com")).error).toBeTruthy()
    expect(mail.sendShopRequest).not.toHaveBeenCalled()
  })
  it("doesn't send when it can't check for opt-outs", async () => {
    failTable = "outreach"
    await expect(sendLeadToShop("l1", "pro@shop.com")).rejects.toBeTruthy()
    expect(mail.sendShopRequest).not.toHaveBeenCalled()
  })
  it.each([
    ["hidden shop", { shops: shop({ status: "inactive" }) }, "pro@shop.com"],
    ["no shop", { shops: null }, "pro@shop.com"],
    ["finished request", { outcome: "connected" }, "pro@shop.com"],
    ["bad address", {}, "a@b.com,c@d.com"],
    ["the golfer's own address", {}, "JO@golfer.com"],
  ])("refuses: %s", async (_, o, email) => {
    db.fitting_requests = [lead(o as Row)]
    expect((await sendLeadToShop("l1", email)).error).toBeTruthy()
    expect(mail.sendShopRequest).not.toHaveBeenCalled()
  })
})

describe("forwarding to a verified owner", () => {
  it("never forwards to an unclaimed shop", async () => {
    expect((await forwardLeadToOwner("l1")).error).toMatch(/no verified owner/)
    expect(mail.notifyNewFittingRequest).not.toHaveBeenCalled()
  })
  it("sends each open recent request once", async () => {
    db.fitting_requests = [
      lead({ shops: claimedShop }),
      lead({ id: "old", created_at: days(31), shops: claimedShop }),
      lead({ id: "done", outcome: "connected", shops: claimedShop }),
      lead({ id: "closed", status: "closed", shops: claimedShop }),
      lead({ id: "never-notified", notified_at: null, shops: claimedShop }),
      lead({ id: "unclaimed" }),
      lead({ id: "other", shop_id: "s9", shops: claimedShop }),
    ]
    expect(await forwardOpenLeads("s1")).toBe(1)
    expect(await forwardOpenLeads("s1")).toBe(0)
  })
  it("a failed forward is retried later", async () => {
    db.fitting_requests = [lead({ shops: claimedShop })]
    mail.notifyNewFittingRequest.mockResolvedValueOnce(false)
    expect(await forwardOpenLeads()).toBe(0)
    expect(await forwardOpenLeads()).toBe(1)
  })
})

describe("confirmToGolfer", () => {
  const args = {
    id: "l1", visitorEmail: "jo@golfer.com",
    shop: { id: "s1", name: "Tee Time", slug: "tee-time", phone: null, website: "javascript:alert(1)", claimed: false },
  }
  it("sends once per shop per day and drops an unsafe website", async () => {
    await confirmToGolfer(args)
    await confirmToGolfer(args)
    expect(mail.sendGolferConfirmation).toHaveBeenCalledTimes(1)
    expect(mail.sendGolferConfirmation.mock.calls[0][0]).toMatchObject({ shopWebsite: null })
  })
  it("stops at three per address per day, whatever the capitals", async () => {
    db.fitting_requests.push(...["a", "b", "c"].map((s) =>
      lead({ id: s, shop_id: s, visitor_email: "JO@golfer.com", golfer_confirmed_at: days(0.1) })))
    await confirmToGolfer(args)
    expect(mail.sendGolferConfirmation).not.toHaveBeenCalled()
  })
  it("isn't recorded when the send fails", async () => {
    mail.sendGolferConfirmation.mockResolvedValueOnce(false)
    await confirmToGolfer(args)
    expect(db.fitting_requests[0].golfer_confirmed_at).toBeNull()
  })
})

describe("reminders", () => {
  it("counts a reminder only when the email went out", async () => {
    db.fitting_requests = [lead({ created_at: days(2) })]
    mail.sendLeadReminders.mockResolvedValueOnce(false)
    expect(await sendDueReminders()).toBe(0)
    expect(db.fitting_requests[0].reminder_count).toBe(0)
    expect(await sendDueReminders()).toBe(1)
    expect(db.fitting_requests[0].reminder_count).toBe(1)
    expect(await sendDueReminders()).toBe(0)
  })
  it("sends nothing when nothing is due", async () => {
    db.fitting_requests = [lead({ created_at: days(0.5) })]
    expect(await sendDueReminders()).toBe(0)
    expect(mail.sendLeadReminders).not.toHaveBeenCalled()
  })
})

describe("shop addresses", () => {
  it("never prefills opted-out or bouncing addresses", async () => {
    db.outreach = [
      { shop_id: "a", contact_email: "a@x.com", email_verified: "valid", status: "sent_1" },
      { shop_id: "b", contact_email: "b@x.com", email_verified: "unverified", status: "do_not_contact" },
      { shop_id: "c", contact_email: "c@x.com", email_verified: "invalid", status: "sent_1" },
    ]
    expect([...(await knownShopEmails(["a", "b", "c"]))]).toEqual([["a", { email: "a@x.com", verified: true }]])
  })
  it("an opt-out sticks, even for a shop with no outreach row", async () => {
    expect(await markShopOptOut("s1")).toEqual({})
    expect((await sendLeadToShop("l1", "pro@shop.com")).error).toMatch(/not to be contacted/)
  })
})
