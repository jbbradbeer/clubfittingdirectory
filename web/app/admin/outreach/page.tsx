import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata: Metadata = {
  title: "Admin — Outreach",
  robots: { index: false, follow: false },
}

// Always render fresh (pipeline moves daily)
export const dynamic = "force-dynamic"

interface OutreachRow {
  id: string
  segment: string | null
  status: string
  contact_email: string | null
  email_verified: string
  email_search_status: string
  touches: number
  last_touch_at: string | null
  notes: string | null
  shops: { name: string; slug: string; city: string; state_code: string } | null
}

const STATUSES = [
  "not_contacted", "drafted", "sent_1", "sent_2", "sent_3",
  "replied", "call_booked", "closed_won", "closed_lost", "do_not_contact",
] as const
const SEGMENTS = ["A", "B", "C"] as const
const REPLIED_LIKE = new Set(["replied", "call_booked", "closed_won"])

const KILL_MIN_COMPLETED = 100
const KILL_RATE = 0.04

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch {
    return iso
  }
}

export default async function OutreachPage() {
  if (!(await isAdmin())) redirect("/admin/login")

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("outreach")
    .select("id,segment,status,contact_email,email_verified,email_search_status,touches,last_touch_at,notes,shops(name,slug,city,state_code)")
    .order("last_touch_at", { ascending: false, nullsFirst: false })
    .limit(5000)

  const rows = (data ?? []) as unknown as OutreachRow[]

  // Funnel: counts per segment per status
  const funnel: Record<string, Record<string, number>> = {}
  for (const r of rows) {
    const seg = r.segment ?? "—"
    funnel[seg] = funnel[seg] ?? {}
    funnel[seg][r.status] = (funnel[seg][r.status] ?? 0) + 1
  }

  // Reply rates per segment (contacted = touches >= 1)
  const rate = (segs: readonly string[]) => {
    const pool = rows.filter((r) => segs.includes(r.segment ?? "") && r.touches >= 1)
    const replied = pool.filter((r) => REPLIED_LIKE.has(r.status))
    return { contacted: pool.length, replied: replied.length,
             pct: pool.length ? replied.length / pool.length : null }
  }
  const abRate = rate(["A", "B"])
  const completedT3 = rows.filter((r) =>
    ["A", "B"].includes(r.segment ?? "") && r.touches >= 1 &&
    (r.touches >= 3 || ["closed_lost", "closed_won", "call_booked", "replied", "do_not_contact"].includes(r.status)),
  ).length
  const killTripped = completedT3 >= KILL_MIN_COMPLETED && abRate.pct !== null && abRate.pct < KILL_RATE

  const needsAction = rows.filter((r) => r.status === "replied")
  const emailsFound = rows.filter((r) => r.contact_email).length
  const emailsValid = rows.filter((r) => r.email_verified === "valid").length

  return (
    <section className="bg-[var(--color-ivory)] min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-3xl text-[var(--color-charcoal)]">Outreach</h1>
          <Link href="/admin" className="text-sm text-[var(--color-charcoal-light)] hover:text-[var(--color-forest)]">
            ← Dashboard
          </Link>
        </div>
        <p className="text-sm text-[var(--color-charcoal-light)] mb-8">
          Founding Verified campaign · {rows.length} shops queued · {emailsFound} emails found · {emailsValid} verified valid
        </p>

        {error && (
          <p className="mb-6 text-sm text-red-600">
            Could not load outreach data: {error.message} (has migration 008 been run?)
          </p>
        )}

        {killTripped && (
          <div className="mb-8 rounded-2xl border-2 border-red-500 bg-red-50 p-5">
            <p className="font-semibold text-red-700">Kill criterion tripped</p>
            <p className="text-sm text-red-700 mt-1">
              Segments A+B reply rate is {((abRate.pct ?? 0) * 100).toFixed(1)}% after {completedT3} contacts
              completed touch 3 (threshold: 4% at 100). Rework the pitch before touching Segment C.
            </p>
          </div>
        )}

        {/* Reply-rate cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {SEGMENTS.map((s) => {
            const r = rate([s])
            return (
              <div key={s} className="bg-white border border-[var(--color-border)] rounded-xl p-4">
                <p className="text-2xl font-display text-[var(--color-charcoal)]">
                  {r.pct === null ? "—" : `${(r.pct * 100).toFixed(1)}%`}
                </p>
                <p className="text-xs uppercase tracking-wider text-[var(--color-charcoal-light)]">
                  Segment {s} replies ({r.replied}/{r.contacted})
                </p>
              </div>
            )
          })}
          <div className="bg-white border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-2xl font-display text-[var(--color-charcoal)]">
              {abRate.pct === null ? "—" : `${(abRate.pct * 100).toFixed(1)}%`}
            </p>
            <p className="text-xs uppercase tracking-wider text-[var(--color-charcoal-light)]">
              A+B combined · {completedT3}/{KILL_MIN_COMPLETED} to kill check
            </p>
          </div>
        </div>

        {/* Needs action */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
          Replied — needs your reply ({needsAction.length})
        </h2>
        {needsAction.length === 0 ? (
          <p className="text-sm text-[var(--color-charcoal-light)] mb-10">Nothing waiting on you.</p>
        ) : (
          <div className="space-y-3 mb-10">
            {needsAction.map((r) => (
              <div key={r.id} className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-charcoal)]">
                    {r.shops?.name ?? "Unknown shop"}
                    <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-gold)] text-[var(--color-forest-deep)]">
                      replied
                    </span>
                  </p>
                  <p className="text-sm text-[var(--color-charcoal-light)]">
                    {r.shops ? `${r.shops.city}, ${r.shops.state_code} · ` : ""}
                    {r.contact_email && (
                      <a href={`mailto:${r.contact_email}`} className="text-[var(--color-forest)] hover:underline">
                        {r.contact_email}
                      </a>
                    )}
                    {" · last touch "}{fmtDate(r.last_touch_at)}
                  </p>
                  {r.notes && <p className="text-sm italic text-[var(--color-charcoal-light)] mt-1">“{r.notes}”</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Funnel table */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
          Funnel by segment
        </h2>
        <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-[var(--color-charcoal-light)]">
                <th className="py-2 pr-4">Status</th>
                {SEGMENTS.map((s) => <th key={s} className="py-2 pr-4">{s}</th>)}
                <th className="py-2">Untagged</th>
              </tr>
            </thead>
            <tbody>
              {STATUSES.map((st) => (
                <tr key={st} className="border-t border-[var(--color-border)]">
                  <td className="py-2 pr-4 text-[var(--color-charcoal)] capitalize">{st.replace(/_/g, " ")}</td>
                  {SEGMENTS.map((s) => (
                    <td key={s} className="py-2 pr-4 text-[var(--color-charcoal-light)]">
                      {funnel[s]?.[st] ?? 0}
                    </td>
                  ))}
                  <td className="py-2 text-[var(--color-charcoal-light)]">{funnel["—"]?.[st] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
