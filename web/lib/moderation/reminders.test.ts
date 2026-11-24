import { beforeEach, describe, expect, it, vi } from "vitest"

type Row = { review_status: string; created_at: string; name?: string; shops?: { name: string } | null }
const db: Record<string, Row[]> = {}
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const f: ((r: Row) => boolean)[] = []
      const q = {
        select: () => q,
        eq: (_: string, v: string) => { f.push((r) => r.review_status === v); return q },
        lte: (_: string, v: string) => { f.push((r) => r.created_at <= v); return q },
        order: () => q,
        limit: async () => ({ data: (db[table] ?? []).filter((r) => f.every((x) => x(r))), error: null }),
      }
      return q
    },
  }),
}))
const { send } = vi.hoisted(() => ({ send: vi.fn(async (items: unknown[], day: string) => { void items; void day; return true }) }))
vi.mock("@/lib/email", () => ({ sendApprovalReminder: send }))

import { remindPendingApprovals } from "@/lib/moderation/reminders"

const now = new Date("2026-11-25T06:00:00.000Z")
const old = "2026-11-23T06:00:00.000Z"
const fresh = "2026-11-24T20:00:00.000Z"

beforeEach(() => { for (const k of Object.keys(db)) delete db[k]; send.mockClear() })

describe("remindPendingApprovals", () => {
  it("lists only what is still pending after 24 hours", async () => {
    db.shop_submissions = [
      { name: "Waiting", review_status: "new", created_at: old },
      { name: "Fresh", review_status: "new", created_at: fresh },
      { name: "Done", review_status: "approved", created_at: old },
    ]
    db.shop_claims = [{ shops: { name: "Tyler Golf" }, review_status: "new", created_at: old }]
    expect(await remindPendingApprovals(now)).toBe(2)
    expect(send).toHaveBeenCalledWith([
      { kind: "submission", shopName: "Waiting", createdAt: old },
      { kind: "claim", shopName: "Tyler Golf", createdAt: old },
    ], "2026-11-25")
  })
  it("sends nothing when nothing is waiting", async () => {
    expect(await remindPendingApprovals(now)).toBe(0)
    expect(send).not.toHaveBeenCalled()
  })
  it("a failed send is reported, not counted", async () => {
    send.mockResolvedValueOnce(false)
    db.shop_submissions = [{ name: "Waiting", review_status: "new", created_at: old }]
    await expect(remindPendingApprovals(now)).rejects.toThrow()
  })
})
