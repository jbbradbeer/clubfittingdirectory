import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { sanitizeSearchTerm } from "@/lib/supabase/queries/shared"
import { updateLeadStatus } from "@/app/admin/leads/actions"
import { ActionButton } from "@/components/admin/ActionButton"
import { FilterBar } from "@/components/admin/FilterBar"
import { Pagination } from "@/components/admin/Pagination"

interface Lead {
  id: string
  shop_id: string | null
  shop_slug: string | null
  shop_name: string | null
  visitor_name: string
  visitor_email: string
  visitor_phone: string | null
  fitting_type: string | null
  preferred_date: string | null
  preferred_time: string | null
  notes: string | null
  status: string
  created_at: string
}

const STATUSES = ["new", "contacted", "booked", "closed"] as const
const PAGE_SIZE = 25

const FITTING_LABELS: Record<string, string> = {
  driver: "Driver", irons: "Irons", wedges: "Wedges",
  putter: "Putter", full_bag: "Full bag", other: "Other",
}
const TIME_LABELS: Record<string, string> = {
  morning: "Morning", afternoon: "Afternoon", evening: "Evening", flexible: "Flexible",
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return iso
  }
}

/* Colour treatment per status — gold = needs attention, green = booked, etc. */
const STATUS_STYLE: Record<string, string> = {
  new: "bg-[var(--color-gold)] text-[var(--color-forest-deep)]",
  contacted: "bg-blue-100 text-blue-700",
  booked: "bg-[var(--color-forest)] text-white",
  closed: "bg-[var(--color-cream)] text-[var(--color-charcoal-light)]",
}

/**
 * Fitting Requests tab — filtered + paginated server-side from the URL
 * (?q=&status=&page=), so search survives refresh and the query never loads
 * the whole table.
 */
export async function LeadsPanel({
  q,
  status,
  page,
}: {
  q?: string
  status?: string
  page?: string
}) {
  const supabase = createAdminClient()
  const term = sanitizeSearchTerm(q ?? "")
  const activeStatus = STATUSES.includes(status as (typeof STATUSES)[number]) ? status : ""
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1)

  // Status count tiles (head-only queries — cheap at any table size).
  const counts = Object.fromEntries(
    await Promise.all(
      STATUSES.map(async (s) => {
        const { count } = await supabase
          .from("fitting_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", s)
        return [s, count ?? 0] as const
      }),
    ),
  )

  let query = supabase
    .from("fitting_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1)
  if (activeStatus) query = query.eq("status", activeStatus)
  if (term.length >= 2) {
    query = query.or(
      `visitor_name.ilike.%${term}%,visitor_email.ilike.%${term}%,shop_name.ilike.%${term}%`,
    )
  }
  const { data, count: total, error } = await query
  const leads = (data ?? []) as Lead[]

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {STATUSES.map((s) => (
          <div key={s} className="bg-white border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-2xl font-display text-[var(--color-charcoal)]">{counts[s]}</p>
            <p className="text-xs uppercase tracking-wider text-[var(--color-charcoal-light)] capitalize">{s}</p>
          </div>
        ))}
      </div>

      <FilterBar
        placeholder="Search by golfer, email, or shop…"
        statusOptions={STATUSES.map((s) => ({ value: s, label: s }))}
      />

      {error && (
        <p className="mb-6 text-sm text-red-600">Could not load requests: {error.message}</p>
      )}

      {leads.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal-light)]">
          {term || activeStatus ? "No requests match these filters." : "No requests yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {leads.map((l) => <LeadCard key={l.id} l={l} />)}
        </div>
      )}

      <Pagination page={pageNum} pageSize={PAGE_SIZE} total={total ?? 0} />
    </div>
  )
}

function LeadCard({ l }: { l: Lead }) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left: who + what */}
        <div className="min-w-0">
          <p className="font-semibold text-[var(--color-charcoal)]">
            {l.visitor_name}
            <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[l.status] ?? ""}`}>
              {l.status}
            </span>
          </p>
          <p className="text-sm text-[var(--color-charcoal-light)] mt-0.5">
            Wants {l.fitting_type ? FITTING_LABELS[l.fitting_type] ?? l.fitting_type : "a fitting"}
            {" · for "}
            {l.shop_slug ? (
              <Link href={`/listing/${l.shop_slug}`} className="text-[var(--color-forest)] hover:underline">
                {l.shop_name ?? "shop"}
              </Link>
            ) : (
              l.shop_name ?? "shop (unlinked)"
            )}
          </p>
          <div className="mt-2 text-sm text-[var(--color-charcoal-light)] space-y-0.5">
            <p>
              ✉️ <a href={`mailto:${l.visitor_email}`} className="text-[var(--color-forest)] hover:underline">{l.visitor_email}</a>
              {l.visitor_phone && <> · 📞 <a href={`tel:${l.visitor_phone}`} className="text-[var(--color-forest)] hover:underline">{l.visitor_phone}</a></>}
            </p>
            {(l.preferred_date || l.preferred_time) && (
              <p>🗓 {[l.preferred_date, l.preferred_time ? TIME_LABELS[l.preferred_time] ?? l.preferred_time : null].filter(Boolean).join(" · ")}</p>
            )}
            {l.notes && <p className="italic">“{l.notes}”</p>}
            <p className="text-xs text-[var(--color-charcoal-light)]/70 pt-1">Received {fmtDate(l.created_at)}</p>
          </div>
        </div>

        {/* Right: status control */}
        <div className="shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-charcoal-light)] mb-1.5">Set status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => {
              const active = l.status === s
              return active ? (
                <span
                  key={s}
                  className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${STATUS_STYLE[s]}`}
                >
                  {s}
                </span>
              ) : (
                <ActionButton
                  key={s}
                  action={updateLeadStatus}
                  fields={{ id: l.id, status: s }}
                  className="px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer capitalize border border-[var(--color-border)] text-[var(--color-charcoal-light)] hover:bg-[var(--color-cream)]"
                >
                  {s}
                </ActionButton>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
