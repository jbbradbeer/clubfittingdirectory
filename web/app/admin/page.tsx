import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { approveSubmission, rejectSubmission, logout } from "./actions"
import { updateLeadStatus } from "./leads/actions"

export const metadata: Metadata = {
  title: "Admin — Dashboard",
  robots: { index: false, follow: false },
}

// Always render fresh (never cache the review queues)
export const dynamic = "force-dynamic"

interface Submission {
  id: string
  name: string
  shop_type: string | null
  city: string
  state_code: string
  website: string | null
  phone: string | null
  offers_fitting: boolean | null
  notes: string | null
  submitter_email: string | null
  review_status: string
  created_at: string
}

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

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login")

  const supabase = createAdminClient()
  const [leadsRes, subsRes] = await Promise.all([
    supabase.from("fitting_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("shop_submissions").select("*").order("created_at", { ascending: false }),
  ])

  const leads = (leadsRes.data ?? []) as Lead[]
  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = leads.filter((l) => l.status === s).length
    return acc
  }, {})
  const open = leads.filter((l) => l.status === "new" || l.status === "contacted")
  const done = leads.filter((l) => l.status === "booked" || l.status === "closed")

  const subs = (subsRes.data ?? []) as Submission[]
  const pending = subs.filter((s) => s.review_status === "new")
  const handled = subs.filter((s) => s.review_status !== "new")

  return (
    <section className="bg-[var(--color-ivory)] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl text-[var(--color-charcoal)]">Dashboard</h1>
          <form action={logout}>
            <button className="text-sm text-[var(--color-charcoal-light)] hover:text-[var(--color-forest)] cursor-pointer">
              Log out
            </button>
          </form>
        </div>

        {/* ── Fitting requests ── */}
        <h2 className="font-display text-xl text-[var(--color-charcoal)] mb-4">Fitting Requests</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {STATUSES.map((s) => (
            <div key={s} className="bg-white border border-[var(--color-border)] rounded-xl p-4">
              <p className="text-2xl font-display text-[var(--color-charcoal)]">{counts[s]}</p>
              <p className="text-xs uppercase tracking-wider text-[var(--color-charcoal-light)] capitalize">{s}</p>
            </div>
          ))}
        </div>

        {leadsRes.error && (
          <p className="mb-6 text-sm text-red-600">Could not load requests: {leadsRes.error.message}</p>
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
            <div className="space-y-3 mb-12">
              {done.map((l) => <LeadCard key={l.id} l={l} />)}
            </div>
          </>
        )}

        {/* ── Shop submissions ── */}
        <h2 className="font-display text-xl text-[var(--color-charcoal)] mb-4 pt-8 border-t border-[var(--color-border)]">
          Shop Submissions
        </h2>

        {subsRes.error && (
          <p className="mb-6 text-sm text-red-600">
            Could not load submissions: {subsRes.error.message}
          </p>
        )}

        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
          Pending review ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className="text-sm text-[var(--color-charcoal-light)] mb-10">No new submissions. 🎉</p>
        ) : (
          <div className="space-y-4 mb-12">
            {pending.map((s) => (
              <SubmissionCard key={s.id} s={s} pending />
            ))}
          </div>
        )}

        {handled.length > 0 && (
          <>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
              Already handled ({handled.length})
            </h3>
            <div className="space-y-3">
              {handled.map((s) => (
                <SubmissionCard key={s.id} s={s} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
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

function SubmissionCard({ s, pending }: { s: Submission; pending?: boolean }) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-[var(--color-charcoal)]">
            {s.name}
            {!pending && (
              <span
                className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                  s.review_status === "approved"
                    ? "bg-[var(--color-forest-tint)] text-[var(--color-forest)]"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {s.review_status}
              </span>
            )}
          </p>
          <p className="text-sm text-[var(--color-charcoal-light)] mt-0.5">
            {s.city}, {s.state_code}
            {s.shop_type ? ` · ${s.shop_type}` : ""}
            {s.offers_fitting ? " · offers fitting" : ""}
          </p>
          <div className="mt-2 text-sm text-[var(--color-charcoal-light)] space-y-0.5">
            {s.website && <p>🌐 {s.website}</p>}
            {s.phone && <p>📞 {s.phone}</p>}
            {s.submitter_email && <p>✉️ {s.submitter_email}</p>}
            {s.notes && <p className="italic">“{s.notes}”</p>}
          </div>
        </div>

        {pending && (
          <div className="flex flex-col gap-2 shrink-0">
            <form action={approveSubmission}>
              <input type="hidden" name="id" value={s.id} />
              <button className="px-4 py-1.5 text-sm font-semibold bg-[var(--color-forest)] text-white rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer">
                Approve
              </button>
            </form>
            <form action={rejectSubmission}>
              <input type="hidden" name="id" value={s.id} />
              <button className="px-4 py-1.5 text-sm font-semibold border border-[var(--color-border)] text-[var(--color-charcoal)] rounded-full hover:bg-[var(--color-cream)] transition-colors cursor-pointer">
                Reject
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
