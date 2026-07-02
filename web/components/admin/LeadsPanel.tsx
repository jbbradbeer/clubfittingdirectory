import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { updateLeadStatus } from "@/app/admin/leads/actions"

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

export async function LeadsPanel() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("fitting_requests")
    .select("*")
    .order("created_at", { ascending: false })

  const leads = (data ?? []) as Lead[]
  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = leads.filter((l) => l.status === s).length
    return acc
  }, {})
  const open = leads.filter((l) => l.status === "new" || l.status === "contacted")
  const done = leads.filter((l) => l.status === "booked" || l.status === "closed")

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

      {error && (
        <p className="mb-6 text-sm text-red-600">Could not load requests: {error.message}</p>
      )}

      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
        Active ({open.length})
      </h3>
      {open.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal-light)] mb-10">No active requests right now.</p>
      ) : (
        <div className="space-y-4 mb-12">
          {open.map((l) => <LeadCard key={l.id} l={l} />)}
        </div>
      )}

      {done.length > 0 && (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
            Booked &amp; closed ({done.length})
          </h3>
          <div className="space-y-3">
            {done.map((l) => <LeadCard key={l.id} l={l} />)}
          </div>
        </>
      )}
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
              return (
                <form key={s} action={updateLeadStatus}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer capitalize ${
                      active
                        ? STATUS_STYLE[s]
                        : "border border-[var(--color-border)] text-[var(--color-charcoal-light)] hover:bg-[var(--color-cream)]"
                    }`}
                    disabled={active}
                  >
                    {s}
                  </button>
                </form>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
