"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ListingCard } from "@/components/directory/ListingCard"
import type { ListingCardProps } from "@/types/shop"

/* ─────────────────────────────────────────────────────────
   CATEGORY LISTINGS — client component
   Green active chips, clean pagination.
   ───────────────────────────────────────────────────────── */

const PER_PAGE = 24

interface StateChip {
  state_code: string
  state: string
  count: number
}

interface CategoryListingsProps {
  shops: ListingCardProps[]
  stateBreakdown: StateChip[]
}

export function CategoryListings({ shops, stateBreakdown }: CategoryListingsProps) {
  const [activeState, setActiveState] = useState<string | null>(null)
  const [page, setPage]               = useState(1)

  const filtered = useMemo(
    () => activeState ? shops.filter((s) => s.state_code === activeState) : shops,
    [shops, activeState],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const visible    = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const handleStateChange = (code: string | null) => {
    setActiveState(code)
    setPage(1)
  }

  return (
    <div>
      {/* State filter chips */}
      {stateBreakdown.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by state">
          <StateChipButton label="All States" count={shops.length} active={activeState === null} onClick={() => handleStateChange(null)} />
          {stateBreakdown.map((s) => (
            <StateChipButton key={s.state_code} label={s.state_code} count={s.count} active={activeState === s.state_code} onClick={() => handleStateChange(s.state_code)} />
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-gray)] mb-6">
        Showing{" "}
        <span className="text-[var(--color-black)] tabular-nums font-medium">
          {filtered.length.toLocaleString()}
        </span>{" "}
        listing{filtered.length !== 1 ? "s" : ""}
        {activeState && (
          <>
            {" "}in{" "}
            <Link href={`/state/${activeState.toLowerCase()}`}
              className="text-[var(--color-green-deep)] hover:text-[var(--color-green-hover)] transition-colors">
              {stateBreakdown.find((s) => s.state_code === activeState)?.state ?? activeState}
            </Link>
          </>
        )}
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
        <CategoryPagination currentPage={safePage} totalPages={totalPages}
          onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }) }} />
      )}
    </div>
  )
}

/* ── State chip button ── */
function StateChipButton({
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
        "font-[family-name:var(--font-body)] text-xs tracking-wide uppercase",
        "border transition-colors duration-150",
        active
          ? "bg-[var(--color-green-deep)] border-[var(--color-green-deep)] text-white font-medium"
          : "bg-transparent border-[var(--color-gray-light)] text-[var(--color-gray)] hover:border-[var(--color-green-deep)] hover:text-[var(--color-black)]",
      ].join(" ")}
    >
      {label}
      <span className={["text-[10px] tabular-nums", active ? "text-white/70" : "text-[var(--color-gray)]"].join(" ")}>
        {count}
      </span>
    </button>
  )
}

/* ── Pagination ── */
function CategoryPagination({
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
