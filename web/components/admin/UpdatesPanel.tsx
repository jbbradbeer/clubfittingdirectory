import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { markUpdateDone, rejectUpdateRequest } from "@/app/admin/actions"

/**
 * Update Requests tab — the owner self-serve "fix my listing" queue
 * (listing_update_requests, migration 013). The founder applies approved
 * changes by hand, then marks the request done (which also refreshes the
 * listing page).
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

export async function UpdatesPanel() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("listing_update_requests")
    .select("*, shops(name,slug,city,state_code,owner_email)")
    .order("created_at", { ascending: false })

  const requests = (data ?? []) as unknown as UpdateRequest[]
  const pending = requests.filter((r) => r.review_status === "new")
  const handled = requests.filter((r) => r.review_status !== "new")

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
        Update requests — pending ({pending.length})
      </h3>
      {error && (
        <p className="mb-6 text-sm text-red-600">
          Could not load update requests: {error.message} (has migration 013 been run?)
        </p>
      )}
      {pending.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal-light)] mb-10">No pending requests.</p>
      ) : (
        <div className="space-y-4 mb-10">
          {pending.map((r) => <RequestCard key={r.id} r={r} pending />)}
        </div>
      )}
      {handled.length > 0 && (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-3">
            Already handled ({handled.length})
          </h3>
          <div className="space-y-3">
            {handled.map((r) => <RequestCard key={r.id} r={r} />)}
          </div>
        </>
      )}
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
            <form action={markUpdateDone}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="shop_slug" value={r.shops?.slug ?? ""} />
              <button className="px-4 py-1.5 text-sm font-semibold bg-[var(--color-forest)] text-white rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer">
                Applied — done
              </button>
            </form>
            <form action={rejectUpdateRequest}>
              <input type="hidden" name="id" value={r.id} />
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
