import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { approveSubmission, rejectSubmission, logout } from "./actions"

export const metadata: Metadata = {
  title: "Admin — Submissions",
  robots: { index: false, follow: false },
}

// Always render fresh (never cache the review queue)
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

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login")

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("shop_submissions")
    .select("*")
    .order("created_at", { ascending: false })

  const subs = (data ?? []) as Submission[]
  const pending = subs.filter((s) => s.review_status === "new")
  const handled = subs.filter((s) => s.review_status !== "new")

  return (
    <section className="bg-[var(--color-ivory)] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl text-[var(--color-charcoal)]">
            Submissions
          </h1>
          <form action={logout}>
            <button className="text-sm text-[var(--color-charcoal-light)] hover:text-[var(--color-forest)] cursor-pointer">
              Log out
            </button>
          </form>
        </div>

        {error && (
          <p className="mb-6 text-sm text-red-600">
            Could not load submissions: {error.message}
          </p>
        )}

        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
          Pending review ({pending.length})
        </h2>
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
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
              Already handled ({handled.length})
            </h2>
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
