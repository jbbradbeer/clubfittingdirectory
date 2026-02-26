"use client"

import { useState, useMemo } from "react"
import { ListingCard } from "@/components/directory/ListingCard"
import type { ListingCardProps } from "@/types/shop"

/* ─────────────────────────────────────────────────────────
   STATE FILTER CHIPS + PAGINATED GRID
   Client component — filter interactions are instant.
   Green active chips, clean pagination.
   ───────────────────────────────────────────────────────── */

const PER_PAGE = 24

interface StateListingsProps {
  shops: ListingCardProps[]
  shopTypes: string[]
}

export function StateListings({ shops, shopTypes }: StateListingsProps) {
  const [activeType, setActiveType] = useState<string | null>(null)
  const [page, setPage]             = useState(1)

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
      {/* Filter chips */}
      {shopTypes.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by shop type">
          <FilterChip label="All" count={shops.length} active={activeType === null} onClick={() => handleTypeChange(null)} />
          {shopTypes.map((type) => {
            const count = shops.filter((s) => s.shop_type === type).length
            return (
              <FilterChip key={type} label={type} count={count} active={activeType === type} onClick={() => handleTypeChange(type)} />
            )
          })}
        </div>
      )}

      {/* Results count */}
      <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-gray)] mb-6">
        Showing{" "}
        <span className="text-[var(--color-black)] tabular-nums font-medium">
          {filtered.length.toLocaleString()}
        </span>{" "}
        {activeType ? activeType.toLowerCase() : "listing"}
        {filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((shop) => (
            <ListingCard key={shop.slug} {...shop} />
          ))}
        </div>
      ) : (
        <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-black)] py-16 text-center">
          No listings found for this filter.
        </p>
      )}

      {/* Pagination */}
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

/* ── Filter chip ── */
function FilterChip({
  label, count, active, onClick,
}: {
  label: string; count: number; active: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full",
        "font-[family-name:var(--font-body)] text-sm",
        "border transition-colors duration-150",
        active
          ? "bg-[var(--color-green-deep)] border-[var(--color-green-deep)] text-white font-medium"
          : "bg-transparent border-[var(--color-gray-light)] text-[var(--color-gray)] hover:border-[var(--color-green-deep)] hover:text-[var(--color-black)]",
      ].join(" ")}
    >
      {label}
      <span className={[
        "text-[10px] tabular-nums",
        active ? "text-white/70" : "text-[var(--color-gray)]",
      ].join(" ")}>
        {count}
      </span>
    </button>
  )
}

/* ── Pagination ── */
function StatePagination({
  currentPage, totalPages, onPage,
}: {
  currentPage: number; totalPages: number; onPage: (p: number) => void
}) {
  const pages: (number | "…")[] = []
  const delta = 2
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > delta + 2) pages.push("…")
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) pages.push(i)
    if (currentPage < totalPages - delta - 1) pages.push("…")
    pages.push(totalPages)
  }

  const btn = "min-w-[36px] h-9 px-2 flex items-center justify-center rounded-md border font-[family-name:var(--font-body)] text-sm tabular-nums transition-all duration-150"

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-12" aria-label="Pagination">
      <button onClick={() => onPage(currentPage - 1)} disabled={currentPage <= 1}
        className={`${btn} border-[var(--color-gray-light)] text-[var(--color-gray)] hover:border-[var(--color-green-deep)] hover:text-[var(--color-green-deep)] disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label="Previous page">‹</button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="min-w-[36px] h-9 flex items-center justify-center text-[var(--color-gray)] font-[family-name:var(--font-body)] text-sm">…</span>
        ) : (
          <button key={p} onClick={() => onPage(p)} aria-current={p === currentPage ? "page" : undefined}
            className={`${btn} ${p === currentPage
              ? "bg-[var(--color-green-deep)] border-[var(--color-green-deep)] text-white font-medium"
              : "bg-transparent border-[var(--color-gray-light)] text-[var(--color-gray)] hover:border-[var(--color-green-deep)] hover:text-[var(--color-green-deep)]"
            }`}>{p}</button>
        ),
      )}
      <button onClick={() => onPage(currentPage + 1)} disabled={currentPage >= totalPages}
        className={`${btn} border-[var(--color-gray-light)] text-[var(--color-gray)] hover:border-[var(--color-green-deep)] hover:text-[var(--color-green-deep)] disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label="Next page">›</button>
    </nav>
  )
}
