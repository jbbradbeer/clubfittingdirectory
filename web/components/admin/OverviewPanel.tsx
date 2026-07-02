import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * The at-a-glance tab: everything needing the founder's attention today,
 * plus the number that matters (Verified shops ≈ revenue). Head-only count
 * queries — cheap regardless of table size.
 */
export async function OverviewPanel() {
  const supabase = createAdminClient()

  const count = async (table: string, filters: Record<string, string>) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true })
    for (const [col, val] of Object.entries(filters)) q = q.eq(col, val)
    const { count: n, error } = await q
    return error ? null : (n ?? 0)
  }

  const [newLeads, pendingSubs, pendingClaims, outreachReplied, verifiedShops, claimedShops] =
    await Promise.all([
      count("fitting_requests", { status: "new" }),
      count("shop_submissions", { review_status: "new" }),
      count("shop_claims", { review_status: "new" }),
      count("outreach", { status: "replied" }),
      count("shops", { listing_tier: "verified" }),
      supabase.from("shops").select("id", { count: "exact", head: true })
        .not("claimed_at", "is", null).then(({ count: n, error }) => (error ? null : (n ?? 0))),
    ])

  const mrr = verifiedShops === null ? null : Math.round((verifiedShops * 349) / 12)

  const cards: { label: string; value: number | null; tab: string; urgent?: boolean }[] = [
    { label: "New fitting requests", value: newLeads, tab: "leads", urgent: (newLeads ?? 0) > 0 },
    { label: "Pending submissions", value: pendingSubs, tab: "submissions", urgent: (pendingSubs ?? 0) > 0 },
    { label: "Pending claims", value: pendingClaims, tab: "submissions", urgent: (pendingClaims ?? 0) > 0 },
    { label: "Outreach replies waiting", value: outreachReplied, tab: "outreach", urgent: (outreachReplied ?? 0) > 0 },
    { label: "Claimed shops", value: claimedShops, tab: "submissions" },
    { label: "Verified (paying) shops", value: verifiedShops, tab: "outreach" },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={`/admin?tab=${c.tab}`}
            className={`bg-white border rounded-xl p-4 transition-colors hover:border-[var(--color-forest)] ${
              c.urgent ? "border-[var(--color-gold)]" : "border-[var(--color-border)]"
            }`}
          >
            <p className="text-2xl font-display text-[var(--color-charcoal)]">
              {c.value === null ? "—" : c.value}
            </p>
            <p className="text-xs uppercase tracking-wider text-[var(--color-charcoal-light)]">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-[var(--color-forest)] text-white rounded-2xl shadow-card p-6">
        <p className="text-xs uppercase tracking-wider text-white/70">Recurring revenue (annual plans ÷ 12)</p>
        <p className="text-3xl font-display mt-1">
          {mrr === null ? "—" : `$${mrr.toLocaleString()} MRR`}
        </p>
        <p className="text-sm text-white/70 mt-1">
          {verifiedShops ?? 0} Verified shops · target $10,000 by year end
        </p>
      </div>
    </div>
  )
}
