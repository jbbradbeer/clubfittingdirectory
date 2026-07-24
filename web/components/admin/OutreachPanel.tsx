import { createAdminClient } from "@/lib/supabase/admin"
import { fetchAllRows } from "@/lib/supabase/queries/shared"
import { Pagination } from "@/components/admin/Pagination"

interface OutreachRow {
  id: string
  segment: string | null
  status: string
  contact_email: string | null
  touches: number
  last_touch_at: string | null
  notes: string | null
  shops: { name: string; slug: string; city: string; state_code: string } | null
}

/* Funnel math only needs these three columns — fetching just them keeps the
   payload tiny even with thousands of outreach rows (the old version pulled
   every column plus the shops join for all 5,000). */
interface FunnelRow {
  segment: string | null
  status: string
  touches: number
}

const STATUSES = [
  "not_contacted", "drafted", "sent_1", "sent_2", "sent_3",
  "replied", "call_booked", "closed_won", "closed_lost", "do_not_contact",
] as const
const SEGMENTS = ["A", "B", "C"] as const
const REPLIED_LIKE = new Set(["replied", "call_booked", "closed_won"])

const KILL_MIN_COMPLETED = 100
const KILL_RATE = 0.04
const PAGE_SIZE = 50

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch {
    return iso
  }
}

export async function OutreachPanel({ page }: { page?: string }) {
  const supabase = createAdminClient()
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1)

  // Two focused queries instead of one 5,000-row full-column pull:
  // slim columns for the funnel math (fetchAllRows pages past PostgREST's
  // silent 1,000-row cap), full rows only for the paginated
  // "needs your reply" list.
  const [funnelRes, repliedRes] = await Promise.all([
    fetchAllRows<FunnelRow>(() =>
      supabase.from("outreach").select("segment,status,touches").order("id"),
    ).then(
      (data) => ({ data, error: null as { message: string } | null }),
      (e) => ({
        data: [] as FunnelRow[],
        error: { message: e instanceof Error ? e.message : String(e) },
      }),
    ),
    supabase
      .from("outreach")
      .select("id,segment,status,contact_email,touches,last_touch_at,notes,shops(name,slug,city,state_code)", { count: "exact" })
      .eq("status", "replied")
      .order("last_touch_at", { ascending: false, nullsFirst: false })
      .range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1),
  ])

  const rows = funnelRes.data
  const error = funnelRes.error ?? repliedRes.error
  const needsAction = (repliedRes.data ?? []) as unknown as OutreachRow[]

  const funnel: Record<string, Record<string, number>> = {}
  for (const r of rows) {
    const seg = r.segment ?? "—"
    funnel[seg] = funnel[seg] ?? {}
    funnel[seg][r.status] = (funnel[seg][r.status] ?? 0) + 1
  }

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

  return (
    <div>
      <p className="text-sm text-[var(--color-charcoal-light)] mb-8">
        Verified campaign · {rows.length} shops queued
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

      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
        Replied — needs your reply ({repliedRes.count ?? 0})
      </h3>
      {needsAction.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal-light)] mb-10">Nothing waiting on you.</p>
      ) : (
        <div className="space-y-3 mb-4">
          {needsAction.map((r) => (
            <div key={r.id} className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-4">
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
          ))}
        </div>
      )}
      <Pagination page={pageNum} pageSize={PAGE_SIZE} total={repliedRes.count ?? 0} />

      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3 mt-10">
        Funnel by segment
      </h3>
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
  )
}
