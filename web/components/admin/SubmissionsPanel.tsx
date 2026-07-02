import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { approveSubmission, rejectSubmission, approveClaim, rejectClaim } from "@/app/admin/actions"

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

interface Claim {
  id: string
  shop_id: string
  claimant_name: string
  claimant_role: string | null
  claimant_email: string
  claimant_phone: string | null
  message: string | null
  source: string | null
  review_status: string
  created_at: string
  shops: { name: string; slug: string; city: string; state_code: string } | null
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return iso
  }
}

export async function SubmissionsPanel() {
  const supabase = createAdminClient()
  const [subsRes, claimsRes] = await Promise.all([
    supabase.from("shop_submissions").select("*").order("created_at", { ascending: false }),
    supabase.from("shop_claims")
      .select("*, shops(name,slug,city,state_code)")
      .order("created_at", { ascending: false }),
  ])

  const subs = (subsRes.data ?? []) as Submission[]
  const pending = subs.filter((s) => s.review_status === "new")
  const handled = subs.filter((s) => s.review_status !== "new")

  const claims = (claimsRes.data ?? []) as unknown as Claim[]
  const newClaims = claims.filter((c) => c.review_status === "new")
  const handledClaims = claims.filter((c) => c.review_status !== "new")

  return (
    <div>
      {/* ── Ownership claims ── */}
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
        Ownership claims — pending ({newClaims.length})
      </h3>
      {claimsRes.error && (
        <p className="mb-6 text-sm text-red-600">
          Could not load claims: {claimsRes.error.message} (has migration 009 been run?)
        </p>
      )}
      {newClaims.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal-light)] mb-10">No pending claims.</p>
      ) : (
        <div className="space-y-4 mb-10">
          {newClaims.map((c) => <ClaimCard key={c.id} c={c} pending />)}
        </div>
      )}
      {handledClaims.length > 0 && (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
            Claims already handled ({handledClaims.length})
          </h3>
          <div className="space-y-3 mb-12">
            {handledClaims.map((c) => <ClaimCard key={c.id} c={c} />)}
          </div>
        </>
      )}

      {/* ── New-shop submissions ── */}
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3 pt-6 border-t border-[var(--color-border)]">
        New-shop submissions — pending ({pending.length})
      </h3>
      {subsRes.error && (
        <p className="mb-6 text-sm text-red-600">Could not load submissions: {subsRes.error.message}</p>
      )}
      {pending.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal-light)] mb-10">No new submissions. 🎉</p>
      ) : (
        <div className="space-y-4 mb-12">
          {pending.map((s) => <SubmissionCard key={s.id} s={s} pending />)}
        </div>
      )}
      {handled.length > 0 && (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
            Submissions already handled ({handled.length})
          </h3>
          <div className="space-y-3">
            {handled.map((s) => <SubmissionCard key={s.id} s={s} />)}
          </div>
        </>
      )}
    </div>
  )
}

function ClaimCard({ c, pending }: { c: Claim; pending?: boolean }) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-[var(--color-charcoal)]">
            {c.shops ? (
              <Link href={`/listing/${c.shops.slug}`} className="hover:text-[var(--color-forest)]">
                {c.shops.name}
              </Link>
            ) : "Unknown shop"}
            {!pending && (
              <span
                className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                  c.review_status === "approved"
                    ? "bg-[var(--color-forest-tint)] text-[var(--color-forest)]"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {c.review_status}
              </span>
            )}
            {c.source === "outreach" && (
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-gold)] text-[var(--color-forest-deep)]">
                via outreach
              </span>
            )}
          </p>
          <p className="text-sm text-[var(--color-charcoal-light)] mt-0.5">
            {c.shops ? `${c.shops.city}, ${c.shops.state_code} · ` : ""}
            claimed by <span className="font-medium text-[var(--color-charcoal)]">{c.claimant_name}</span>
            {c.claimant_role ? ` (${c.claimant_role})` : ""}
          </p>
          <div className="mt-2 text-sm text-[var(--color-charcoal-light)] space-y-0.5">
            <p>
              ✉️ <a href={`mailto:${c.claimant_email}`} className="text-[var(--color-forest)] hover:underline">{c.claimant_email}</a>
              {c.claimant_phone && <> · 📞 {c.claimant_phone}</>}
            </p>
            {c.message && <p className="italic">“{c.message}”</p>}
            <p className="text-xs text-[var(--color-charcoal-light)]/70 pt-1">Received {fmtDate(c.created_at)}</p>
          </div>
        </div>

        {pending && (
          <div className="flex flex-col gap-2 shrink-0">
            <form action={approveClaim}>
              <input type="hidden" name="id" value={c.id} />
              <button className="px-4 py-1.5 text-sm font-semibold bg-[var(--color-forest)] text-white rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer">
                Approve
              </button>
            </form>
            <form action={rejectClaim}>
              <input type="hidden" name="id" value={c.id} />
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
