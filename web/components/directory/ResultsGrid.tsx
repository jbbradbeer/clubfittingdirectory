"use client"

import { track } from "@vercel/analytics"
import { ListingCard } from "./ListingCard"
import type { Shop } from "@/types/shop"

interface ResultsGridProps {
  shops: Shop[]
  total: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  loading?: boolean
  error?: boolean
  onRetry?: () => void
}

export function ResultsGrid({
  shops,
  total,
  page,
  totalPages,
  onPageChange,
  loading,
  error,
  onRetry,
}: ResultsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] overflow-hidden shadow-card"
          >
            <div className="h-1 w-full bg-[var(--color-cream-dark)]" />
            <div className="p-6 animate-pulse">
              <div className="h-3 w-20 bg-[var(--color-cream)] rounded" />
              <div className="mt-4 h-5 w-3/4 bg-[var(--color-cream)] rounded" />
              <div className="mt-3 h-3 w-1/2 bg-[var(--color-cream)] rounded" />
              <div className="mt-3 h-3 w-2/3 bg-[var(--color-cream)] rounded" />
              <div className="mt-5 pt-4 border-t border-[var(--color-line)] flex gap-2">
                <div className="h-6 w-16 bg-[var(--color-cream)] rounded-full" />
                <div className="h-6 w-20 bg-[var(--color-cream)] rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-2xl text-[var(--color-charcoal)]">
          Couldn&apos;t load listings
        </p>
        <p className="mt-2 text-sm text-[var(--color-charcoal-light)]">
          Something went wrong reaching the directory. Please try again.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-5 inline-flex items-center px-5 py-2.5 text-sm font-semibold bg-[var(--color-forest)] text-white rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer"
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  if (shops.length === 0) {
    return (
      <div className="py-20 text-center">
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          fill="none"
          aria-hidden="true"
          className="mx-auto text-[var(--color-forest)] opacity-25"
        >
          <g stroke="currentColor" strokeWidth="1.5">
            <circle cx="36" cy="34" r="9" />
            <circle cx="36" cy="34" r="18" />
            <circle cx="36" cy="34" r="27" />
          </g>
          <line x1="36" y1="34" x2="36" y2="62" stroke="currentColor" strokeWidth="2" />
          <path d="M36 36 L52 41 L36 47 Z" fill="currentColor" stroke="none" opacity="0.6" />
        </svg>
        <p className="mt-6 font-display text-2xl text-[var(--color-charcoal)]">
          No fitters match those filters
        </p>
        <p className="mt-2 text-sm text-[var(--color-charcoal-light)]">
          Try widening your search — clear a filter or search a nearby city.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Almanac result header — tabular counts */}
      <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-[var(--color-line)] pb-3">
        <p className="text-sm text-[var(--color-charcoal-light)]">
          <span className="data font-semibold text-[var(--color-charcoal)]">{shops.length}</span>
          {" of "}
          <span className="data font-semibold text-[var(--color-charcoal)]">
            {total.toLocaleString()}
          </span>{" "}
          fitters
        </p>
        {totalPages > 1 && (
          <p className="data text-xs text-[var(--color-charcoal-light)]">
            Page {page} / {totalPages}
          </p>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shops.map((shop) => (
          /* onClickCapture: record which listings directory searches open,
             without making ListingCard itself a client component. */
          <div key={shop.slug} className="h-full" onClickCapture={() => track("listing_open", { slug: shop.slug })}>
            <ListingCard {...shop} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 text-sm text-[var(--color-charcoal)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-cream)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Prev
          </button>

          {getPageNumbers(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-2 text-sm text-[var(--color-charcoal-light)]">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`px-3 py-1.5 text-sm rounded-lg cursor-pointer transition-colors ${
                  p === page
                    ? "bg-[var(--color-gold)] text-[var(--color-forest-deep)] font-semibold border border-[var(--color-gold)]"
                    : "text-[var(--color-charcoal)] border border-[var(--color-border)] hover:bg-[var(--color-cream)]"
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 text-sm text-[var(--color-charcoal)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-cream)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  )
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "...")[] = [1]
  if (current > 3) pages.push("...")
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push("...")
  pages.push(total)
  return pages
}
