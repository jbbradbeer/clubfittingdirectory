"use client"

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
            className="h-56 bg-[var(--color-cream)] border border-[var(--color-border)] rounded-2xl animate-pulse"
          />
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
      <div className="py-16 text-center">
        <p className="font-display text-2xl text-[var(--color-charcoal)]">
          No results found
        </p>
        <p className="mt-2 text-sm text-[var(--color-charcoal-light)]">
          Try adjusting your search or filters.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Results count */}
      <p className="mb-4 text-sm text-[var(--color-charcoal-light)]">
        Showing{" "}
        <span className="font-semibold text-[var(--color-charcoal)]">
          {shops.length}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-[var(--color-charcoal)]">
          {total.toLocaleString()}
        </span>{" "}
        results
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shops.map((shop) => (
          <ListingCard key={shop.slug} {...shop} />
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
