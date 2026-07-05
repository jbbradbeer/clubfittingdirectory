import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { activateVerified, lapseVerified } from "@/app/admin/actions"

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

  // Current Verified roster with expiry — the renewal control surface.
  const { data: verifiedList } = await supabase
    .from("shops")
    .select("name,slug,verified_at,verified_expires_at")
    .eq("listing_tier", "verified")
    .order("verified_expires_at", { ascending: true, nullsFirst: true })

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

      {/* Verified listings — activation + renewals (see tasks/paid-activation-runbook.md) */}
      <div className="mt-8 bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6">
        <h2 className="font-display text-lg text-[var(--color-charcoal)]">Verified listings</h2>
        <p className="text-sm text-[var(--color-charcoal-light)] mt-1">
          Stripe payment arrived? Paste the shop&apos;s URL slug (the part after /listing/) and
          activate — badge goes live and the 1-year expiry is stamped automatically.
        </p>

        <form action={activateVerified} className="mt-4 flex gap-2">
          <input
            name="slug"
            required
            placeholder="e.g. mcgolf-custom-clubs-waverly-oh"
            className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-forest)]"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold bg-[var(--color-forest)] text-white rounded-lg hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer"
          >
            Activate Verified
          </button>
        </form>

        {verifiedList && verifiedList.length > 0 && (
          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-[var(--color-charcoal-light)] border-b border-[var(--color-border)]">
                <th className="py-2 pr-3">Shop</th>
                <th className="py-2 pr-3">Verified</th>
                <th className="py-2 pr-3">Expires</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {verifiedList.map((s) => {
                const expired =
                  s.verified_expires_at != null && new Date(s.verified_expires_at) < new Date()
                return (
                  <tr key={s.slug} className="border-b border-[var(--color-line)] last:border-0">
                    <td className="py-2.5 pr-3">
                      <Link href={`/listing/${s.slug}`} className="font-medium text-[var(--color-forest)] hover:underline">
                        {s.name}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--color-charcoal-light)]">
                      {s.verified_at ? new Date(s.verified_at).toLocaleDateString() : "—"}
                    </td>
                    <td className={`py-2.5 pr-3 ${expired ? "text-red-600 font-semibold" : "text-[var(--color-charcoal-light)]"}`}>
                      {s.verified_expires_at ? new Date(s.verified_expires_at).toLocaleDateString() : "—"}
                      {expired && " (past due)"}
                    </td>
                    <td className="py-2.5 text-right">
                      <form action={lapseVerified}>
                        <input type="hidden" name="slug" value={s.slug} />
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-xs font-semibold border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] hover:bg-[var(--color-cream)] transition-colors cursor-pointer"
                        >
                          Lapse
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
