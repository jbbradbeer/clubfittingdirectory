import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { approveOwnerEdits, rejectOwnerEdits } from "@/app/admin/owner-edits/actions"
import { EDITABLE_FIELDS } from "@/lib/portal-editable"
import { ActionButton } from "@/components/admin/ActionButton"
import { FilterBar } from "@/components/admin/FilterBar"
import { Pagination } from "@/components/admin/Pagination"

/**
 * Owner Edits tab — structured edit batches from the /portal edit form.
 * Approving writes owner facts through applyOwnerFact (the ONLY path into
 * listing_facts for owner data) and refreshes the affected pages. Rejecting
 * only marks the batch. Diffs render current-from-`previous` (snapshot at
 * submit time) with a drift warning if the live value moved since.
 */

interface EditBatch {
  id: string
  shop_id: string
  owner_email: string
  kind: string
  proposed: Record<string, unknown>
  previous: Record<string, unknown>
  message: string | null
  review_status: string
  review_note: string | null
  created_at: string
  shops: { name: string; slug: string; city: string; state_code: string } | null
}

const STATUS_OPTIONS = [
  { value: "new", label: "pending" },
  { value: "approved", label: "approved" },
  { value: "rejected", label: "rejected" },
]
const PAGE_SIZE = 25

const LABELS = new Map(EDITABLE_FIELDS.map((f) => [f.attribute, f.label]))

function fmtValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—"
  if (Array.isArray(v)) return v.join(", ") || "—"
  if (typeof v === "boolean") return v ? "Yes" : "No"
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return iso
  }
}

export async function OwnerEditsPanel({
  q,
  status,
  page,
}: {
  q?: string
  status?: string
  page?: string
}) {
  const supabase = createAdminClient()
  const activeStatus = STATUS_OPTIONS.some((s) => s.value === status) ? status : "new"
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1)

  let query = supabase
    .from("owner_edit_batches")
    .select("*, shops(name,slug,city,state_code)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1)
  if (activeStatus) query = query.eq("review_status", activeStatus)
  if (q && q.trim().length >= 2) {
    query = query.ilike("owner_email", `%${q.trim()}%`)
  }
  const { data, count: total, error } = await query
  const batches = (data ?? []) as unknown as EditBatch[]

  return (
    <div>
      <FilterBar placeholder="Search by owner email…" statusOptions={STATUS_OPTIONS} />

      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
        Owner edits ({total ?? 0})
      </h3>
      {error && (
        <p className="mb-6 text-sm text-red-600">
          Could not load owner edits: {error.message} (has migration 016 been run?)
        </p>
      )}
      {batches.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal-light)]">No owner edits here.</p>
      ) : (
        <div className="space-y-4">
          {batches.map((b) => (
            <BatchCard key={b.id} b={b} pending={b.review_status === "new"} />
          ))}
        </div>
      )}

      <Pagination page={pageNum} pageSize={PAGE_SIZE} total={total ?? 0} />
    </div>
  )
}

function BatchCard({ b, pending }: { b: EditBatch; pending?: boolean }) {
  const entries = Object.entries(b.proposed ?? {})

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--color-charcoal)]">
            {b.shops ? (
              <Link href={`/listing/${b.shops.slug}`} className="hover:text-[var(--color-forest)]">
                {b.shops.name}
              </Link>
            ) : "Unknown shop"}
            {!pending && (
              <span
                className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                  b.review_status === "approved"
                    ? "bg-[var(--color-forest-tint)] text-[var(--color-forest)]"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {b.review_status}
              </span>
            )}
            {b.kind === "identity_request" && (
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                identity request
              </span>
            )}
          </p>
          <p className="text-sm text-[var(--color-charcoal-light)] mt-0.5">
            {b.shops ? `${b.shops.city}, ${b.shops.state_code} · ` : ""}
            <a href={`mailto:${b.owner_email}`} className="text-[var(--color-forest)] hover:underline">
              {b.owner_email}
            </a>
            {" · "}
            {fmtDate(b.created_at)}
          </p>

          {entries.length > 0 && (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[var(--color-charcoal-light)]">
                  <th className="py-1 pr-3 font-semibold">Field</th>
                  <th className="py-1 pr-3 font-semibold">Current</th>
                  <th className="py-1 font-semibold">Proposed</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(([attr, value]) => (
                  <tr key={attr} className="border-t border-[var(--color-border)]">
                    <td className="py-1.5 pr-3 font-medium text-[var(--color-charcoal)]">
                      {LABELS.get(attr) ?? attr}
                    </td>
                    <td className="py-1.5 pr-3 text-[var(--color-charcoal-light)]">
                      {fmtValue(b.previous?.[attr])}
                    </td>
                    <td className="py-1.5 text-[var(--color-gold-dark,#a3823c)] font-medium">
                      {fmtValue(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {b.message && <p className="mt-2 text-sm italic text-[var(--color-charcoal-light)]">“{b.message}”</p>}
          {b.review_note && (
            <p className="mt-1 text-xs text-red-600">Rejection note: {b.review_note}</p>
          )}
        </div>

        {pending && (
          <div className="flex flex-col gap-2 shrink-0">
            <ActionButton
              action={approveOwnerEdits}
              fields={{ id: b.id }}
              className="px-4 py-1.5 text-sm font-semibold bg-[var(--color-forest)] text-white rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer"
            >
              {b.kind === "identity_request" ? "Mark handled" : "Approve & publish"}
            </ActionButton>
            <ActionButton
              action={rejectOwnerEdits}
              fields={{ id: b.id }}
              className="px-4 py-1.5 text-sm font-semibold border border-[var(--color-border)] text-[var(--color-charcoal)] rounded-full hover:bg-[var(--color-cream)] transition-colors cursor-pointer"
            >
              Reject
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  )
}
