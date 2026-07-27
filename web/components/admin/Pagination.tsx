"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

/**
 * Prev/next pagination for admin lists. Page number lives in the URL (?page=)
 * alongside the FilterBar's q/status params, so filters carry across pages.
 */
export function Pagination({
  page,
  pageSize,
  total,
  paramName = "page",
}: {
  page: number
  pageSize: number
  total: number
  /** Override when two independent lists paginate on one page. */
  paramName?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (pageCount <= 1) return null

  function go(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (p <= 1) params.delete(paramName)
    else params.set(paramName, String(p))
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false })
  }

  const btn =
    "px-3 py-1.5 text-xs font-semibold border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] hover:bg-[var(--color-cream)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"

  return (
    <div className="mt-5 flex items-center gap-3">
      <button type="button" className={btn} disabled={page <= 1} onClick={() => go(page - 1)}>
        ← Prev
      </button>
      <p className="text-xs text-[var(--color-charcoal-light)]">
        Page {page} of {pageCount} · {total.toLocaleString()} total
      </p>
      <button
        type="button"
        className={btn}
        disabled={page >= pageCount}
        onClick={() => go(page + 1)}
      >
        Next →
      </button>
    </div>
  )
}
