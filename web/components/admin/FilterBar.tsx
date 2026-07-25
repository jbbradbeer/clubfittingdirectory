"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"

/**
 * Shared search + status-filter bar for admin list pages. State lives in the
 * URL (?q=&status=&page=), so the pages stay server components and filters
 * survive refresh/back. Typing is debounced 300ms; changing any filter resets
 * to page 1.
 */
export function FilterBar({
  placeholder,
  statusOptions,
}: {
  placeholder: string
  statusOptions?: { value: string; label: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get("q") ?? "")
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeStatus = searchParams.get("status") ?? ""

  function setParams(next: { q?: string; status?: string }) {
    const params = new URLSearchParams(searchParams.toString())
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q)
      else params.delete("q")
    }
    if (next.status !== undefined) {
      if (next.status) params.set("status", next.status)
      else params.delete("status")
    }
    params.delete("page") // any filter change restarts at page 1
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false })
  }

  function onType(value: string) {
    setQ(value)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => setParams({ q: value }), 300)
  }

  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current)
  }, [])

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      <div className="relative flex-1 max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)]"
        />
        <input
          value={q}
          onChange={(e) => onType(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-forest)]"
        />
      </div>
      {statusOptions && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setParams({ status: "" })}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
              activeStatus === ""
                ? "bg-[var(--color-forest)] text-white"
                : "border border-[var(--color-border)] text-[var(--color-charcoal-light)] hover:bg-[var(--color-cream)]"
            }`}
          >
            All
          </button>
          {statusOptions.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setParams({ status: s.value })}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer capitalize ${
                activeStatus === s.value
                  ? "bg-[var(--color-forest)] text-white"
                  : "border border-[var(--color-border)] text-[var(--color-charcoal-light)] hover:bg-[var(--color-cream)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
