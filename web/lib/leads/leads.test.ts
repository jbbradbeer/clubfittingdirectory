import { describe, expect, it } from "vitest"
import { redactContact } from "@/lib/leads/redact"
import { buildShopMessage, isSingleAddress } from "@/lib/leads/message"
import { reminderKind, type ReminderLead } from "@/lib/leads/reminders"

describe("redactContact", () => {
  it.each([
    "jo@example.com", "jo.smith+golf@mail.example.co.uk", "jo at example dot com", "jo (at) example (dot) com",
    "555-123-4567", "(555) 123 4567", "555.123.4567", "+1 555 123 4567", "5551234567", "123-4567",
    "https://example.com/me", "www.example.com", "example.com/jo",
  ])("removes %s", (secret) => {
    const out = redactContact(`Reach me: ${secret} thanks`)
    expect(out).toContain("[removed]")
    expect(out).not.toContain(secret)
    expect(out).not.toMatch(/\d{3}.*\d{4}/)
  })
  it("removes social handles", () => expect(redactContact("dm me @jo_golf")).toBe("dm me [removed]"))
  it("keeps ordinary golf notes", () => {
    const note = "Handicap 12, swing speed 95-100 mph, 7 iron goes 150. Left-handed."
    expect(redactContact(note)).toBe(note)
  })
  it("handles nothing", () => expect(redactContact(null)).toBe(""))
})

describe("buildShopMessage", () => {
  const base = {
    shopName: "Tee Time", shopSlug: "tee-time", fittingType: "irons",
    preferredDate: "2026-12-01", preferredTime: "morning", notes: "Call 555-123-4567 or jo@example.com",
  }
  it("carries the request but no contact details", () => {
    const m = buildShopMessage(base)
    expect(m.details.map((d) => d.label)).toEqual(["Looking for", "Preferred date", "Preferred time", "Notes"])
    expect(JSON.stringify(m)).not.toMatch(/555|jo@example/)
  })
  it("ignores golfer identity even if a caller passes it along", () => {
    const m = buildShopMessage({ ...base, notes: null, visitor_name: "Jo Smith", visitor_email: "jo@example.com" } as never)
    expect(JSON.stringify(m)).not.toMatch(/Jo Smith|jo@example/)
  })
  it("drops free text smuggled into the date, time, or type", () => {
    const m = buildShopMessage({ ...base, fittingType: "call me", preferredDate: "555-123-4567", preferredTime: "jo@x.com", notes: "" })
    expect(m.details).toEqual([{ label: "Looking for", value: "A fitting" }])
  })
  it("has an opt-out and a postal address, and a one-line subject", () => {
    const m = buildShopMessage({ ...base, shopName: "Evil\r\nBcc: x@y.z" })
    expect(m.footer).toMatch(/no thanks/)
    expect(m.footer).toMatch(/Wilmington/)
    expect(m.subject).not.toMatch(/[\r\n]/)
  })
})

describe("isSingleAddress", () => {
  it.each(["pro@shop.com", "a.b+c@mail.shop.co"])("accepts %s", (e) => expect(isSingleAddress(e)).toBe(true))
  it.each(["a@b.com,c@d.com", "a@b.com; c@d.com", "Bob <a@b.com>", "a@b", "a b@c.com", "a@b.com\nBcc:c@d.com", ""])(
    "rejects %j", (e) => expect(isSingleAddress(e)).toBe(false))
})

describe("reminderKind", () => {
  const now = new Date("2026-12-10T06:00:00Z")
  const ago = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString()
  const lead = (o: Partial<ReminderLead> = {}): ReminderLead => ({
    id: "1", status: "new", created_at: ago(30), shop_sent_at: null, owner_forwarded_at: null,
    outcome: null, reminded_at: null, reminder_count: 0, ...o,
  })
  it("nudges an unsent request after 24 hours, not before", () => {
    expect(reminderKind(lead(), now)).toBe("unsent")
    expect(reminderKind(lead({ created_at: ago(23) }), now)).toBeNull()
  })
  it("once per day, three times at most", () => {
    expect(reminderKind(lead({ reminded_at: ago(5), reminder_count: 1 }), now)).toBeNull()
    expect(reminderKind(lead({ reminded_at: ago(24), reminder_count: 2 }), now)).toBe("unsent")
    expect(reminderKind(lead({ reminded_at: ago(24), reminder_count: 3 }), now)).toBeNull()
  })
  it("nudges a quiet shop after 3 days, then every 3 days", () => {
    const sent = { status: "contacted", created_at: ago(200) }
    expect(reminderKind(lead({ ...sent, shop_sent_at: ago(71) }), now)).toBeNull()
    expect(reminderKind(lead({ ...sent, shop_sent_at: ago(73) }), now)).toBe("quiet")
    expect(reminderKind(lead({ ...sent, shop_sent_at: ago(120), reminded_at: ago(48), reminder_count: 1 }), now)).toBeNull()
  })
  it.each([
    ["an outcome is recorded", { outcome: "connected" }],
    ["the owner already has it", { owner_forwarded_at: ago(1) }],
    ["it was closed", { status: "closed" }],
    ["it was booked", { status: "booked" }],
    ["the founder handled it by phone", { status: "contacted" }],
  ])("stays silent when %s", (_, o) => expect(reminderKind(lead(o), now)).toBeNull())
})
