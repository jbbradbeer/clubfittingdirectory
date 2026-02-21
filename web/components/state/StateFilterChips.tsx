"use client"

import { useState, useMemo } from "react"
import { ListingCard } from "@/components/directory/ListingCard"
import type { ListingCardProps } from "@/types/shop"

/* ─────────────────────────────────────────────────────────
   STATE FILTER CHIPS + PAGINATED GRID
   Client component so filter interactions are instant —
   no additional DB call needed because all state listings
   are passed in as props from the server page.
   ───────────────────────────────────────────────────────── */

const PER_PAGE = 24

interface StateListingsProps {
  shops: ListingCardProps[]
  shopTypes: string[]        // distinct types present in this state
}

export function StateListings({ shops, shopTypes }: StateListingsProps) {
  const [activeType, setActiveType] = useState<string | null>(null)
  const [page, setPage]             = useState(1)

  /* Filter client-side — no DB hit */
  const filtered = useMemo(
    () => activeType ? shops.filter((s) => s.shop_type === activeType) : shops,
    [shops, activeType],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const visible    = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const handleTypeChange = (type: string | null) => {
    setActiveType(type)
    setPage(1)
  }

  return (
    <div>
      {/* ── Filter chips ── */}
      {shopTypes.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by shop type">
          <FilterChip
            label="All"
            count={shops.length}
            active={activeType === null}
            onClick={() => handleTypeChange(null)}
          />
          {shopTypes.map((type) => {
            const count = shops.filter((s) => s.shop_type === type).length
            return (
              <FilterChip
                key={type}
                label={type}
                count={count}
                active={activeType === type}
                onClick={() => handleTypeChange(type)}
              />
            )
          })}
        </div>
      )}

      {/* ── Results count ── */}
      <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)] mb-6">
        Showing{" "}
        <span className="font-[family-name:var(--font-mono)] text-[var(--color-ivory)] tabular-nums">
          {filtered.length.toLocaleString()}
        </span>{" "}
        {activeType ? activeType.toLowerCase() : "listing"}
        {filtered.length !== 1 ? "s" : ""}
      </p>

      {/* ── 3-column grid ── */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((shop) => (
            <ListingCard key={shop.slug} {...shop} />
          ))}
        </div>
      ) : (
        <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ivory)] py-16 text-center">
          No listings found for this filter.
        </p>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <StatePagination
          currentPage={safePage}
          totalPages={totalPages}
          onPage={(p) => {
            setPage(p)
            window.scrollTo({ top: 0, behavior: "smooth" })
          }}
        />
      )}
    </div>
  )
}

/* ── Filter chip button ── */
function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full",
        "font-[family-name:var(--font-body)] text-sm",
        "border transition-all duration-150",
        active
          ? "bg-[var(--color-brass)] border-[var(--color-brass)] text-[var(--color-charcoal)] font-semibold"
          : "bg-transparent border-[color-mix(in_srgb,var(--color-brass)_30%,transparent)] text-[var(--color-ivory-warm)] hover:border-[var(--color-brass)] hover:text-[var(--color-ivory)]",
      ].join(" ")}
    >
      {label}
      <span
        className={[
          "font-[family-name:var(--font-mono)] text-[10px] tabular-nums",
          active ? "text-[var(--color-charcoal)]" : "text-[color-mix(in_srgb,var(--color-ivory-warm)_60%,transparent)]",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  )
}

/* ── Simple pagination (re-used pattern from ResultsGrid) ── */
function StatePagination({
  currentPage,
  totalPages,
  onPage,
}: {
  currentPage: number
  totalPages: number
  onPage: (p: number) => void
}) {
  const pages: (number | "…")[] = []
  const delta = 2
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > delta + 2) pages.push("…")
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++)
      pages.push(i)
    if (currentPage < totalPages - delta - 1) pages.push("…")
    pages.push(totalPages)
  }

  const btn = "min-w-[36px] h-9 px-2 flex items-center justify-center rounded-sm border font-[family-name:var(--font-mono)] text-sm transition-all duration-150"

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-12" aria-label="Pagination">
      <button
        onClick={() => onPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`${btn} border-[color-mix(in_srgb,var(--color-ivory)_15%,transparent)] text-[var(--color-ivory-warm)] hover:border-[var(--color-brass)] hover:text-[var(--color-brass)] disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label="Previous page"
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="min-w-[36px] h-9 flex items-center justify-center text-[color-mix(in_srgb,var(--color-ivory-warm)_40%,transparent)] font-[family-name:var(--font-mono)] text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={`${btn} ${p === currentPage
              ? "bg-[var(--color-brass)] border-[var(--color-brass)] text-[var(--color-charcoal)] font-bold"
              : "bg-transparent border-[color-mix(in_srgb,var(--color-ivory)_15%,transparent)] text-[var(--color-ivory-warm)] hover:border-[var(--color-brass)] hover:text-[var(--color-brass)]"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`${btn} border-[color-mix(in_srgb,var(--color-ivory)_15%,transparent)] text-[var(--color-ivory-warm)] hover:border-[var(--color-brass)] hover:text-[var(--color-brass)] disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  )
}
