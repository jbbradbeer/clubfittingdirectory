"use client"

import Link from "next/link"
import { ListingCard } from "./ListingCard"
import type { DirectoryFilters, DirectoryResult } from "@/lib/supabase/queries/listings"
import { ChevronLeft, ChevronRight } from "lucide-react"

/* ─────────────────────────────────────────────────────────
   RESULTS GRID
   Sort bar, 2-column listing grid, pagination, empty state.
   All editorial in tone — not a SaaS table.
   ───────────────────────────────────────────────────────── */

interface ResultsGridProps {
  result: DirectoryResult | null
  loading: boolean
  error: string | null
  filters: DirectoryFilters
  onSort: (sort: DirectoryFilters["sort"]) => void
  onPage: (page: number) => void
}

const SORT_OPTIONS: { value: NonNullable<DirectoryFilters["sort"]>; label: string }[] = [
  { value: "rating",   label: "Best Rated"     },
  { value: "name",     label: "A–Z"            },
  { value: "services", label: "Most Services"  },
  { value: "fitting",  label: "Fitting First"  },
]

export function ResultsGrid({
  result,
  loading,
  error,
  filters,
  onSort,
  onPage,
}: ResultsGridProps) {
  const currentSort = filters.sort ?? "rating"
  const currentPage = filters.page ?? 1

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div>
        <SortBar total={null} currentSort={currentSort} onSort={onSort} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ivory)]">
          Something went wrong.
        </p>
        <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)]">
          Could not load listings. Please try again.
        </p>
      </div>
    )
  }

  /* ── Empty state ── */
  if (result && result.shops.length === 0) {
    return (
      <div>
        <SortBar total={0} currentSort={currentSort} onSort={onSort} />
        <EmptyState />
      </div>
    )
  }

  const total      = result?.total      ?? 0
  const totalPages = result?.totalPages ?? 1

  return (
    <div>
      {/* Sort / count bar */}
      <SortBar total={total} currentSort={currentSort} onSort={onSort} />

      {/* 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {(result?.shops ?? []).map((shop) => (
          <ListingCard
            key={shop.id}
            name={shop.name}
            shop_type={shop.shop_type}
            primary_service={shop.primary_service}
            city={shop.city}
            state={shop.state}
            state_code={shop.state_code}
            rating={shop.rating}
            rating_tier={shop.rating_tier}
            services={shop.services}
            services_array={shop.services_array ?? []}
            offers_fitting={shop.offers_fitting}
            fitting_environment={shop.fitting_environment}
            phone={shop.phone}
            website={shop.website}
            verified={shop.verified}
            slug={shop.slug}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPage={onPage}
        />
      )}
    </div>
  )
}

/* ── Sort / result count bar ── */
function SortBar({
  total,
  currentSort,
  onSort,
}: {
  total: number | null
  currentSort: NonNullable<DirectoryFilters["sort"]>
  onSort: (sort: DirectoryFilters["sort"]) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 pb-4 border-b border-[color-mix(in_srgb,var(--color-brass)_15%,transparent)]">
      {/* Result count */}
      <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)]">
        {total === null ? (
          <span className="inline-block w-20 h-4 rounded bg-[var(--color-green-mid)] animate-pulse" />
        ) : (
          <>
            <span className="font-[family-name:var(--font-mono)] text-[var(--color-ivory)] tabular-nums">
              {total.toLocaleString()}
            </span>{" "}
            {total === 1 ? "result" : "results"}
          </>
        )}
      </p>

      {/* Sort select */}
      <div className="flex items-center gap-2 shrink-0">
        <label
          htmlFor="sort-select"
          className="font-[family-name:var(--font-body)] text-xs text-[var(--color-ivory-warm)] hidden sm:inline"
        >
          Sort:
        </label>
        <div className="relative">
          <select
            id="sort-select"
            value={currentSort}
            onChange={(e) => onSort(e.target.value as DirectoryFilters["sort"])}
            className={[
              "appearance-none pl-3 pr-7 py-1.5",
              "bg-[var(--color-green-mid)]",
              "border border-[color-mix(in_srgb,var(--color-brass)_30%,transparent)]",
              "rounded-sm",
              "font-[family-name:var(--font-body)] text-xs text-[var(--color-ivory)]",
              "focus:outline-none focus:border-[var(--color-brass)]",
              "cursor-pointer transition-colors",
            ].join(" ")}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom chevron */}
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-brass)]">
            <ChevronRight size={12} className="rotate-90" />
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Editorial empty state ── */
function EmptyState() {
  return (
    <div className="py-24 flex flex-col items-center text-center max-w-md mx-auto">
      {/* Decorative brass rule */}
      <div className="flex items-center gap-3 mb-8 w-full max-w-xs" aria-hidden="true">
        <span className="flex-1 h-px bg-[color-mix(in_srgb,var(--color-brass)_30%,transparent)]" />
        <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-brass)] tracking-widest">
          ✦
        </span>
        <span className="flex-1 h-px bg-[color-mix(in_srgb,var(--color-brass)_30%,transparent)]" />
      </div>

      <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--color-ivory)] mb-3">
        No fitters found.
      </h2>
      <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)] leading-relaxed mb-8">
        Your current filters returned no results. Try widening your search —
        remove a state filter, lower the minimum rating, or browse all listings.
      </p>
      <Link
        href="/directory"
        className="font-[family-name:var(--font-body)] text-sm text-[var(--color-brass)] hover:text-[var(--color-brass-light)] transition-colors underline underline-offset-4 decoration-[color-mix(in_srgb,var(--color-brass)_40%,transparent)]"
      >
        Browse all listings →
      </Link>
    </div>
  )
}

/* ── Skeleton loading card ── */
function SkeletonCard() {
  return (
    <div className="rounded-sm bg-[var(--color-green-mid)] border border-[color-mix(in_srgb,var(--color-brass)_10%,transparent)] p-5 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-3 w-20 rounded bg-[var(--color-green-light)]" />
        <div className="h-5 w-16 rounded-full bg-[var(--color-green-light)]" />
      </div>
      <div className="h-6 w-3/4 rounded bg-[var(--color-green-light)]" />
      <div className="h-3 w-1/3 rounded bg-[var(--color-green-light)]" />
      <div className="h-3 w-1/2 rounded bg-[var(--color-green-light)]" />
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-full bg-[var(--color-green-light)]" />
        <div className="h-5 w-20 rounded-full bg-[var(--color-green-light)]" />
        <div className="h-5 w-14 rounded-full bg-[var(--color-green-light)]" />
      </div>
      <div className="flex justify-between pt-2 border-t border-[color-mix(in_srgb,var(--color-brass)_8%,transparent)]">
        <div className="h-3 w-28 rounded bg-[var(--color-green-light)]" />
        <div className="h-3 w-20 rounded bg-[var(--color-green-light)]" />
      </div>
    </div>
  )
}

/* ── Numbered pagination ── */
function Pagination({
  currentPage,
  totalPages,
  onPage,
}: {
  currentPage: number
  totalPages: number
  onPage: (page: number) => void
}) {
  /* Build page number array with ellipsis logic */
  const pages: (number | "…")[] = []
  const delta = 2

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > delta + 2) pages.push("…")
    const start = Math.max(2, currentPage - delta)
    const end   = Math.min(totalPages - 1, currentPage + delta)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - delta - 1) pages.push("…")
    pages.push(totalPages)
  }

  const btnBase = [
    "min-w-[36px] h-9 px-2 flex items-center justify-center",
    "rounded-sm border text-sm",
    "font-[family-name:var(--font-mono)] tabular-nums",
    "transition-all duration-150",
  ].join(" ")

  const activeBtn = [
    "bg-[var(--color-brass)] border-[var(--color-brass)]",
    "text-[var(--color-charcoal)] font-bold",
  ].join(" ")

  const inactiveBtn = [
    "bg-transparent border-[color-mix(in_srgb,var(--color-ivory)_15%,transparent)]",
    "text-[var(--color-ivory-warm)]",
    "hover:border-[var(--color-brass)] hover:text-[var(--color-brass)]",
  ].join(" ")

  const navBtn = [
    "bg-transparent border-[color-mix(in_srgb,var(--color-ivory)_15%,transparent)]",
    "text-[var(--color-ivory-warm)]",
    "hover:border-[var(--color-brass)] hover:text-[var(--color-brass)]",
    "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[color-mix(in_srgb,var(--color-ivory)_15%,transparent)] disabled:hover:text-[var(--color-ivory-warm)]",
  ].join(" ")

  return (
    <nav
      className="flex items-center justify-center gap-1.5 mt-10"
      aria-label="Results pagination"
    >
      {/* Previous */}
      <button
        onClick={() => onPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`${btnBase} ${navBtn}`}
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
      </button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="min-w-[36px] h-9 flex items-center justify-center font-[family-name:var(--font-mono)] text-sm text-[color-mix(in_srgb,var(--color-ivory-warm)_40%,transparent)]"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`${btnBase} ${p === currentPage ? activeBtn : inactiveBtn}`}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </button>
        ),
      )}

      {/* Next */}
      <button
        onClick={() => onPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`${btnBase} ${navBtn}`}
        aria-label="Next page"
      >
        <ChevronRight size={14} />
      </button>
    </nav>
  )
}
