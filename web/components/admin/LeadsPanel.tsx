import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { sanitizeSearchTerm } from "@/lib/supabase/queries/shared"
import { updateLeadStatus } from "@/app/admin/leads/actions"
import { ActionButton } from "@/components/admin/ActionButton"
import { FilterBar } from "@/components/admin/FilterBar"
import { Pagination } from "@/components/admin/Pagination"
import { LeadRelay } from "@/components/admin/LeadRelay"
import { setLeadOutcome, sendToOwner, shopOptedOut } from "@/app/admin/leads/actions"
import { knownShopEmails } from "@/lib/leads/relay"
import { buildShopMessage } from "@/lib/leads/message"
import { normalizeWebsite } from "@/lib/moderation/normalize"
import { log } from "@/lib/logger"

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
  shop_email: string | null
  shop_sent_at: string | null
  owner_forwarded_at: string | null
  outcome: string | null
  shops: {
    name: string; slug: string; status: string; phone: string | null; website: string | null
    claimed_at: string | null; owner_email: string | null
  } | null
}

const OUTCOMES = [
  { value: "shop_replied", label: "Shop replied" },
  { value: "connected", label: "Golfer connected" },
  { value: "booked", label: "Booked" },
  { value: "no_response", label: "No response" },
  { value: "closed", label: "Close" },
]

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
  const waiting = status === "waiting"
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
    .select("*, shops(name, slug, status, phone, website, claimed_at, owner_email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1)
  if (activeStatus) query = query.eq("status", activeStatus)
  // Waiting = nobody with the golfer's details yet, and no result recorded.
  if (waiting) {
    query = query.is("outcome", null).is("owner_forwarded_at", null).in("status", ["new", "contacted"])
  }
  if (term.length >= 2) {
    query = query.or(
      `visitor_name.ilike.%${term}%,visitor_email.ilike.%${term}%,shop_name.ilike.%${term}%`,
    )
  }
  const { data, count: total, error } = await query
  const leads = (data ?? []) as unknown as Lead[]

  // A failed lookup only loses the prefilled address, never the list.
  let emails: Awaited<ReturnType<typeof knownShopEmails>> = new Map()
  try {
    emails = await knownShopEmails(leads.flatMap((l) => (l.shop_id ? [l.shop_id] : [])))
  } catch (e) {
    log.error("admin/leads", "shop email lookup failed", { error: e })
  }

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
        statusOptions={[{ value: "waiting", label: "waiting" }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
      />

      {error && (
        <p className="mb-6 text-sm text-red-600">Could not load requests: {error.message}</p>
      )}

      {leads.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal-light)]">
          {term || activeStatus || waiting ? "No requests match these filters." : "No requests yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {leads.map((l) => (
            <LeadCard key={l.id} l={l} known={l.shop_id ? emails.get(l.shop_id) : undefined} />
          ))}
        </div>
      )}

      <Pagination page={pageNum} pageSize={PAGE_SIZE} total={total ?? 0} />
    </div>
  )
}

function LeadCard({ l, known }: { l: Lead; known?: { email: string; verified: boolean } }) {
  const shop = l.shops
  const open = !l.outcome && (l.status === "new" || l.status === "contacted")
  const owned = Boolean(shop?.claimed_at && shop.owner_email)
  const canRelay = open && !l.shop_sent_at && !l.owner_forwarded_at && shop?.status === "active"
  const website = normalizeWebsite(shop?.website)
  // Marked contacted before sends were tracked: we can't tell if it was handled.
  const unclear = open && l.status === "contacted" && !l.shop_sent_at && !l.owner_forwarded_at
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

      <div className="mt-4 pt-4 border-t border-[var(--color-border)] text-sm text-[var(--color-charcoal-light)] space-y-3">
        {l.owner_forwarded_at && <p>Sent to the verified owner on {fmtDate(l.owner_forwarded_at)}.</p>}
        {l.shop_sent_at && (
          <p>
            Request sent to {l.shop_email} on {fmtDate(l.shop_sent_at)} (no golfer contact details).
          </p>
        )}
        {l.outcome && <p>Result: {OUTCOMES.find((o) => o.value === l.outcome)?.label ?? l.outcome}</p>}
        {unclear && (
          <p className="text-amber-700">
            Please check: marked contacted, but there&apos;s no record the shop or golfer was reached.
          </p>
        )}
        {open && !shop && <p className="text-amber-700">No shop is linked. Help this golfer directly.</p>}
        {open && shop && shop.status !== "active" && (
          <p className="text-amber-700">This shop is no longer listed. Help this golfer directly.</p>
        )}
        {shop && (shop.phone || website) && open && (
          <p>
            Shop:{" "}
            {shop.phone && <a href={`tel:${shop.phone}`} className="text-[var(--color-forest)] hover:underline">{shop.phone}</a>}
            {shop.phone && website && " · "}
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="text-[var(--color-forest)] hover:underline break-all">
                {website}
              </a>
            )}
          </p>
        )}

        {canRelay && owned && (
          <ActionButton
            action={sendToOwner}
            fields={{ id: l.id }}
            className="px-4 py-1.5 text-sm font-semibold bg-[var(--color-forest)] text-white rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer"
          >
            Send full request to the owner
          </ActionButton>
        )}
        {canRelay && shop && !owned && (
          <LeadRelay
            id={l.id}
            knownEmail={known?.email ?? ""}
            verified={known?.verified ?? false}
            message={buildShopMessage({
              shopName: shop.name, shopSlug: shop.slug, fittingType: l.fitting_type,
              preferredDate: l.preferred_date, preferredTime: l.preferred_time, notes: l.notes,
            })}
          />
        )}

        {open && (
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-1.5">What happened?</p>
            <div className="flex flex-wrap gap-1.5">
              {OUTCOMES.map((o) => (
                <ActionButton
                  key={o.value}
                  action={setLeadOutcome}
                  fields={{ id: l.id, outcome: o.value }}
                  className="px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer border border-[var(--color-border)] text-[var(--color-charcoal-light)] hover:bg-[var(--color-cream)]"
                >
                  {o.label}
                </ActionButton>
              ))}
              {l.shop_id && l.shop_sent_at && (
                <ActionButton
                  action={shopOptedOut}
                  fields={{ shop_id: l.shop_id }}
                  successLabel="Recorded ✓"
                  className="px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer border border-red-200 text-red-600 hover:bg-red-50"
                >
                  Shop said no thanks
                </ActionButton>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
