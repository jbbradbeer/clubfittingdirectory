import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { lapseFeatured, sendPaymentLink } from "@/app/admin/actions"
import { ActionButton } from "@/components/admin/ActionButton"
import { ShopSearchSelect } from "@/components/admin/ShopSearchSelect"

/**
 * The at-a-glance tab: everything needing the founder's attention today,
 * plus the number that matters (Featured shops ≈ revenue). Head-only count
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
      count("shops", { listing_tier: "featured" }),
      supabase.from("shops").select("id", { count: "exact", head: true })
        .not("claimed_at", "is", null).then(({ count: n, error }) => (error ? null : (n ?? 0))),
    ])

  // Current Featured roster with expiry + plan — the renewal control surface.
  const { data: verifiedList } = await supabase
    .from("shops")
    .select("name,slug,verified_at,verified_expires_at,verified_plan")
    .eq("listing_tier", "featured")
    .order("verified_expires_at", { ascending: true, nullsFirst: true })

  // MRR from unexpired badges: monthly $49 counts whole, annual $499 ÷ 12.
  // Shops activated before the plan column existed (null) count as annual.
  const now = new Date()
  const paying = (verifiedList ?? []).filter(
    (s) => !s.verified_expires_at || new Date(s.verified_expires_at) > now,
  )
  const monthlyCount = paying.filter((s) => s.verified_plan === "monthly").length
  const annualCount = paying.length - monthlyCount
  const mrr =
    verifiedList === null ? null : monthlyCount * 49 + Math.round((annualCount * 499) / 12)

  const cards: { label: string; value: number | null; href: string; urgent?: boolean }[] = [
    { label: "New fitting requests", value: newLeads, href: "/admin/leads?status=new", urgent: (newLeads ?? 0) > 0 },
    { label: "Pending submissions", value: pendingSubs, href: "/admin/submissions?status=new", urgent: (pendingSubs ?? 0) > 0 },
    { label: "Pending claims", value: pendingClaims, href: "/admin/submissions?status=new", urgent: (pendingClaims ?? 0) > 0 },
    { label: "Outreach replies waiting", value: outreachReplied, href: "/admin/outreach", urgent: (outreachReplied ?? 0) > 0 },
    { label: "Claimed shops", value: claimedShops, href: "/admin/submissions" },
    { label: "Featured (paying) shops", value: verifiedShops, href: "/admin/outreach" },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
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
        <p className="text-xs uppercase tracking-wider text-white/70">Recurring revenue (monthly + annual ÷ 12)</p>
        <p className="text-3xl font-display mt-1">
          {mrr === null ? "—" : `$${mrr.toLocaleString()} MRR`}
        </p>
        <p className="text-sm text-white/70 mt-1">
          {verifiedShops ?? 0} Featured shops ({monthlyCount} monthly · {annualCount} annual) · target $10,000 by year end
        </p>
      </div>

      {/* Featured listings — activation + renewals (see tasks/paid-activation-runbook.md) */}
      <div className="mt-8 bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6">
        <h2 className="font-display text-lg text-[var(--color-charcoal)]">Featured listings</h2>
        <p className="text-sm text-[var(--color-charcoal-light)] mt-1">
          Stripe payments now activate automatically via the webhook. This manual
          activation stays as the backstop — search for the shop, pick the plan,
          activate; placement + expiry are stamped.
          &ldquo;Renewal link&rdquo; emails the owner their payment page (~30 days before expiry).
        </p>

        <ShopSearchSelect />

        {verifiedList && verifiedList.length > 0 && (
          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-[var(--color-charcoal-light)] border-b border-[var(--color-border)]">
                <th className="py-2 pr-3">Shop</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">Activated</th>
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
                      {s.verified_plan === "monthly" ? "$49/mo" : "$499/yr"}
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--color-charcoal-light)]">
                      {s.verified_at ? new Date(s.verified_at).toLocaleDateString() : "—"}
                    </td>
                    <td className={`py-2.5 pr-3 ${expired ? "text-red-600 font-semibold" : "text-[var(--color-charcoal-light)]"}`}>
                      {s.verified_expires_at ? new Date(s.verified_expires_at).toLocaleDateString() : "—"}
                      {expired && " (past due)"}
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <ActionButton
                          action={sendPaymentLink}
                          fields={{ slug: s.slug, renewal: "1" }}
                          successLabel="Sent ✓"
                          className="px-3 py-1.5 text-xs font-semibold border border-[var(--color-forest)] rounded-lg text-[var(--color-forest)] hover:bg-[var(--color-forest-tint)] transition-colors cursor-pointer"
                        >
                          Renewal link
                        </ActionButton>
                        <ActionButton
                          action={lapseFeatured}
                          fields={{ slug: s.slug }}
                          className="px-3 py-1.5 text-xs font-semibold border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] hover:bg-[var(--color-cream)] transition-colors cursor-pointer"
                        >
                          Lapse
                        </ActionButton>
                      </div>
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
