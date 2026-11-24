import { createAdminClient } from "@/lib/supabase/admin"
import { sendApprovalReminder } from "@/lib/email"

const WAIT_MS = 24 * 3_600_000

/**
 * Daily nudge: everything that has waited over 24 hours for approval, in one
 * email, until it's dealt with. Also catches an instant alert that never
 * arrived. Returns how many items it listed.
 */
export async function remindPendingApprovals(now = new Date()): Promise<number> {
  const supabase = createAdminClient()
  const cutoff = new Date(now.getTime() - WAIT_MS).toISOString()
  const [subs, claims] = await Promise.all([
    supabase.from("shop_submissions").select("name, created_at")
      .eq("review_status", "new").lte("created_at", cutoff).order("created_at").limit(50),
    supabase.from("shop_claims").select("created_at, shops(name)")
      .eq("review_status", "new").lte("created_at", cutoff).order("created_at").limit(50),
  ])
  if (subs.error) throw subs.error
  if (claims.error) throw claims.error

  const items = [
    ...(subs.data ?? []).map((s) => ({ kind: "submission" as const, shopName: s.name as string, createdAt: s.created_at as string })),
    ...((claims.data ?? []) as unknown as { created_at: string; shops: { name: string } | null }[]).map((c) => ({
      kind: "claim" as const, shopName: c.shops?.name ?? "Unknown shop", createdAt: c.created_at,
    })),
  ]
  if (items.length === 0) return 0
  const sent = await sendApprovalReminder(items, now.toISOString().slice(0, 10))
  if (!sent) throw new Error("approval reminder not sent")
  return items.length
}
