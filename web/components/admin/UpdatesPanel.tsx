import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { sanitizeSearchTerm } from "@/lib/supabase/queries/shared"
import { markUpdateDone, rejectUpdateRequest } from "@/app/admin/actions"
import { ActionButton } from "@/components/admin/ActionButton"
import { FilterBar } from "@/components/admin/FilterBar"
import { Pagination } from "@/components/admin/Pagination"

/**
 * Update Requests tab — the owner self-serve "fix my listing" queue
 * (listing_update_requests, migration 013). The founder applies approved
 * changes by hand, then marks the request done (which also refreshes the
 * listing page). Filtered + paginated server-side from the URL.
 */

interface UpdateRequest {
  id: string
  shop_id: string
  requester_name: string
  requester_email: string
  payload: Record<string, string> | null
  message: string | null
  review_status: string
  created_at: string
  shops: { name: string; slug: string; city: string; state_code: string; owner_email: string | null } | null
}

const STATUS_OPTIONS = [
  { value: "new", label: "pending" },
  { value: "done", label: "done" },
  { value: "rejected", label: "rejected" },
]
const PAGE_SIZE = 25

const PAYLOAD_LABELS: Record<string, string> = {
  hours: "Hours",
  services: "Services",
  pricing: "Pricing",
  photos_url: "Photos / link",
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return iso
  }
}

export async function UpdatesPanel({
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
  const activeStatus = STATUS_OPTIONS.some((s) => s.value === status) ? status : ""
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1)

  let query = supabase
    .from("listing_update_requests")
    .select("*, shops(name,slug,city,state_code,owner_email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1)
  if (activeStatus) query = query.eq("review_status", activeStatus)
  if (term.length >= 2) {
    query = query.or(`requester_name.ilike.%${term}%,requester_email.ilike.%${term}%`)
  }
  const { data, count: total, error } = await query
  const requests = (data ?? []) as unknown as UpdateRequest[]

  return (
    <div>
      <FilterBar
        placeholder="Search by requester name or email…"
        statusOptions={STATUS_OPTIONS}
      />

      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
        Update requests ({total ?? 0})
      </h3>
      <p className="mb-4 text-xs text-[var(--color-charcoal-light)]">
        Free-text requests from anyone. Claimed shop? Point the owner at /portal
        instead — structured edits land in the Owner Edits tab with one-click apply.
      </p>
      {error && (
        <p className="mb-6 text-sm text-red-600">
          Could not load update requests: {error.message} (has migration 013 been run?)
        </p>
      )}
      {requests.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal-light)]">
          {term || activeStatus ? "No requests match these filters." : "No requests yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <RequestCard key={r.id} r={r} pending={r.review_status === "new"} />
          ))}
        </div>
      )}

      <Pagination page={pageNum} pageSize={PAGE_SIZE} total={total ?? 0} />
    </div>
  )
}

function RequestCard({ r, pending }: { r: UpdateRequest; pending?: boolean }) {
  const mismatch = Boolean(
    r.shops?.owner_email &&
    r.shops.owner_email.toLowerCase() !== r.requester_email.toLowerCase(),
  )
  const entries = Object.entries(r.payload ?? {}).filter(([, v]) => v)

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-[var(--color-charcoal)]">
            {r.shops ? (
              <Link href={`/listing/${r.shops.slug}`} className="hover:text-[var(--color-forest)]">
                {r.shops.name}
              </Link>
            ) : "Unknown shop"}
            {!pending && (
              <span
                className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                  r.review_status === "done"
                    ? "bg-[var(--color-forest-tint)] text-[var(--color-forest)]"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {r.review_status}
              </span>
            )}
            {mismatch && (
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                email ≠ owner
              </span>
            )}
          </p>
          <p className="text-sm text-[var(--color-charcoal-light)] mt-0.5">
            {r.shops ? `${r.shops.city}, ${r.shops.state_code} · ` : ""}
            from <span className="font-medium text-[var(--color-charcoal)]">{r.requester_name}</span>
            {" · "}
            <a href={`mailto:${r.requester_email}`} className="text-[var(--color-forest)] hover:underline">
              {r.requester_email}
            </a>
          </p>
          <div className="mt-2 text-sm text-[var(--color-charcoal-light)] space-y-0.5">
            {entries.map(([key, value]) => (
              <p key={key}>
                <span className="font-medium text-[var(--color-charcoal)]">
                  {PAYLOAD_LABELS[key] ?? key}:
                </span>{" "}
                {value}
              </p>
            ))}
            {r.message && <p className="italic">“{r.message}”</p>}
            <p className="text-xs text-[var(--color-charcoal-light)]/70 pt-1">Received {fmtDate(r.created_at)}</p>
          </div>
        </div>

        {pending && (
          <div className="flex flex-col gap-2 shrink-0">
            <ActionButton
              action={markUpdateDone}
              fields={{ id: r.id, shop_slug: r.shops?.slug ?? "" }}
              className="px-4 py-1.5 text-sm font-semibold bg-[var(--color-forest)] text-white rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer"
            >
              Applied — done
            </ActionButton>
            <ActionButton
              action={rejectUpdateRequest}
              fields={{ id: r.id }}
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
