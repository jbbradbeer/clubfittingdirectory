import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { sanitizeSearchTerm } from "@/lib/supabase/queries/shared"
import { approveClaim, rejectClaim, sendPaymentLink } from "@/app/admin/actions"
import { ActionButton } from "@/components/admin/ActionButton"
import { FilterBar } from "@/components/admin/FilterBar"
import { Pagination } from "@/components/admin/Pagination"
import { SubmissionReview } from "@/components/admin/SubmissionReview"
import { loadShopsForDuplicateCheck } from "@/lib/moderation/apply"
import { findDuplicates, type DuplicateMatch, type ExistingShop } from "@/lib/moderation/duplicates"
import { normalizeWebsite } from "@/lib/moderation/normalize"
import { log } from "@/lib/logger"

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

const STATUS_OPTIONS = [
  { value: "new", label: "pending" },
  { value: "approved", label: "approved" },
  { value: "rejected", label: "rejected" },
]
const PAGE_SIZE = 25

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return iso
  }
}

/**
 * Submissions & Claims tab — both queues filtered + paginated server-side
 * from the URL. One search box covers both lists (claims match on claimant
 * name/email, submissions on shop name/city); each list paginates
 * independently (?cpage= / ?spage=). Pending rows sort first in both.
 */
export async function SubmissionsPanel({
  q,
  status,
  cpage,
  spage,
}: {
  q?: string
  status?: string
  cpage?: string
  spage?: string
}) {
  const supabase = createAdminClient()
  const term = sanitizeSearchTerm(q ?? "")
  const activeStatus = STATUS_OPTIONS.some((s) => s.value === status) ? status : ""
  const claimPage = Math.max(1, parseInt(cpage ?? "1", 10) || 1)
  const subPage = Math.max(1, parseInt(spage ?? "1", 10) || 1)

  let claimsQuery = supabase
    .from("shop_claims")
    .select("*, shops(name,slug,city,state_code)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((claimPage - 1) * PAGE_SIZE, claimPage * PAGE_SIZE - 1)
  let subsQuery = supabase
    .from("shop_submissions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((subPage - 1) * PAGE_SIZE, subPage * PAGE_SIZE - 1)

  if (activeStatus) {
    claimsQuery = claimsQuery.eq("review_status", activeStatus)
    subsQuery = subsQuery.eq("review_status", activeStatus)
  }
  if (term.length >= 2) {
    claimsQuery = claimsQuery.or(
      `claimant_name.ilike.%${term}%,claimant_email.ilike.%${term}%`,
    )
    subsQuery = subsQuery.or(`name.ilike.%${term}%,city.ilike.%${term}%`)
  }

  const [claimsRes, subsRes] = await Promise.all([claimsQuery, subsQuery])

  const claims = (claimsRes.data ?? []) as unknown as Claim[]
  const subs = (subsRes.data ?? []) as Submission[]

  // Duplicate hints, only when something is waiting. A failed lookup must not
  // take down the queue — approval re-checks for duplicates anyway.
  let shops: ExistingShop[] = []
  let dupCheckFailed = false
  if (subs.some((s) => s.review_status === "new")) {
    try {
      shops = await loadShopsForDuplicateCheck()
    } catch (e) {
      dupCheckFailed = true
      log.error("admin/submissions", "duplicate lookup failed", { error: e })
    }
  }

  return (
    <div>
      <FilterBar
        placeholder="Search claims (name/email) & submissions (shop/city)…"
        statusOptions={STATUS_OPTIONS}
      />

      {/* ── Ownership claims ── */}
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
        Ownership claims ({claimsRes.count ?? 0})
      </h3>
      {claimsRes.error && (
        <p className="mb-6 text-sm text-red-600">
          Could not load claims: {claimsRes.error.message} (has migration 009 been run?)
        </p>
      )}
      {claims.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal-light)] mb-10">
          {term || activeStatus ? "No claims match these filters." : "No claims yet."}
        </p>
      ) : (
        <div className="space-y-4 mb-4">
          {claims.map((c) => <ClaimCard key={c.id} c={c} pending={c.review_status === "new"} />)}
        </div>
      )}
      <Pagination page={claimPage} pageSize={PAGE_SIZE} total={claimsRes.count ?? 0} paramName="cpage" />

      {/* ── New-shop submissions ── */}
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3 mt-10 pt-6 border-t border-[var(--color-border)]">
        New-shop submissions ({subsRes.count ?? 0})
      </h3>
      {subsRes.error && (
        <p className="mb-6 text-sm text-red-600">Could not load submissions: {subsRes.error.message}</p>
      )}
      {subs.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal-light)]">
          {term || activeStatus ? "No submissions match these filters." : "No submissions yet. 🎉"}
        </p>
      ) : (
        <div className="space-y-4">
          {dupCheckFailed && (
            <p className="text-sm text-amber-700">
              Duplicate hints couldn&apos;t load. Approving still checks for duplicates.
            </p>
          )}
          {subs.map((s) => {
            const pending = s.review_status === "new"
            return (
              <SubmissionCard
                key={s.id}
                s={s}
                pending={pending}
                duplicates={pending ? findDuplicates(s, shops).slice(0, 3) : []}
              />
            )
          })}
        </div>
      )}
      <Pagination page={subPage} pageSize={PAGE_SIZE} total={subsRes.count ?? 0} paramName="spage" />
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
            <ActionButton
              action={approveClaim}
              fields={{ id: c.id }}
              className="px-4 py-1.5 text-sm font-semibold bg-[var(--color-forest)] text-white rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer"
            >
              Approve
            </ActionButton>
            <ActionButton
              action={rejectClaim}
              fields={{ id: c.id }}
              className="px-4 py-1.5 text-sm font-semibold border border-[var(--color-border)] text-[var(--color-charcoal)] rounded-full hover:bg-[var(--color-cream)] transition-colors cursor-pointer"
            >
              Reject
            </ActionButton>
          </div>
        )}

        {/* Approved claim → next step in the funnel: email the owner their
            Stripe payment link ($49/mo or $499/yr, /onboard/pay/[slug]). */}
        {!pending && c.review_status === "approved" && c.shops && (
          <div className="shrink-0">
            <ActionButton
              action={sendPaymentLink}
              fields={{ slug: c.shops.slug }}
              successLabel="Sent ✓"
              className="px-4 py-1.5 text-sm font-semibold border border-[var(--color-forest)] text-[var(--color-forest)] rounded-full hover:bg-[var(--color-forest-tint)] transition-colors cursor-pointer"
            >
              Send payment link
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  )
}

function SubmissionCard({
  s,
  pending,
  duplicates,
}: {
  s: Submission
  pending: boolean
  duplicates: DuplicateMatch[]
}) {
  // Only ever link to a real web address — the submitter typed this text.
  const website = normalizeWebsite(s.website)
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
            {website ? (
              <p>
                🌐{" "}
                <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="text-[var(--color-forest)] hover:underline break-all">
                  {s.website}
                </a>
              </p>
            ) : (
              s.website && <p className="break-all">🌐 {s.website}</p>
            )}
            {s.phone && <p>📞 {s.phone}</p>}
            {s.submitter_email && <p>✉️ {s.submitter_email}</p>}
            {s.notes && <p className="italic">“{s.notes}”</p>}
          </div>
        </div>
      </div>

      {duplicates.length > 0 && (
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">
            {duplicates[0].likely ? "Probably already listed" : "Possibly related"}
          </p>
          <ul className="mt-1 space-y-0.5">
            {duplicates.map((d) => (
              <li key={d.shop.id}>
                <Link href={`/listing/${d.shop.slug}`} className="underline">
                  {d.shop.name}
                </Link>
                {d.shop.city ? `, ${d.shop.city} ${d.shop.state_code ?? ""}` : ""}
                {d.shop.status !== "active" ? " (removed listing)" : ""} — {d.reasons.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pending && (
        <SubmissionReview
          id={s.id}
          city={s.city}
          stateCode={s.state_code}
          shopType={s.shop_type}
          likelyDuplicate={duplicates.some((d) => d.likely)}
        />
      )}
    </div>
  )
}
