"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { getListings } from "@/lib/supabase/queries/listings"
import type { DirectoryFilters, DirectoryResult } from "@/lib/supabase/queries/listings"
import { FilterSidebar } from "./FilterSidebar"
import { SearchBar } from "./SearchBar"
import { ResultsGrid } from "./ResultsGrid"
import { SlidersHorizontal, X } from "lucide-react"

/* ─────────────────────────────────────────────────────────
   DIRECTORY CLIENT
   Owns all interactive state for the /directory page:
   • URL params ↔ filter state (fully synced)
   • Supabase data fetching (client-side, reactive)
   • Mobile filter drawer open/close
   ───────────────────────────────────────────────────────── */

interface Props {
  states: { state_code: string; state: string; count: number }[]
  typeCounts: Record<string, number>
}

const SHOP_TYPES = [
  "Clubfitter",
  "Retailer",
  "Simulator",
  "Instruction",
  "Driving Range",
  "Golf Course / Pro Shop",
]

const PRIMARY_SERVICES = [
  "Club Fitting",
  "Golf Retail",
  "Golf Instruction",
  "Golf Simulator",
  "Club Repair",
  "Custom Club Building",
  "Driving Range",
]

/* Parse URL params into a DirectoryFilters object */
function paramsToFilters(params: URLSearchParams): DirectoryFilters {
  const shopTypes = params.getAll("type")
  const services  = params.getAll("svc")
  return {
    q:          params.get("q") ?? undefined,
    state:      params.get("state") ?? undefined,
    shopTypes:  shopTypes.length  ? shopTypes  : undefined,
    services:   services.length   ? services   : undefined,
    fitting:    params.get("fitting") === "true" ? true : undefined,
    fittingEnv: params.get("env") ?? undefined,
    minRating:  params.get("rating") ? Number(params.get("rating")) : undefined,
    sort:       (params.get("sort") as DirectoryFilters["sort"]) ?? "rating",
    page:       params.get("page") ? Number(params.get("page")) : 1,
  }
}

/* Serialize filters back into URL search params */
function filtersToParams(filters: DirectoryFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.q)          p.set("q",       filters.q)
  if (filters.state)      p.set("state",   filters.state)
  filters.shopTypes?.forEach((t) => p.append("type", t))
  filters.services?.forEach((s)  => p.append("svc",  s))
  if (filters.fitting)    p.set("fitting", "true")
  if (filters.fittingEnv) p.set("env",     filters.fittingEnv)
  if (filters.minRating)  p.set("rating",  String(filters.minRating))
  if (filters.sort && filters.sort !== "rating") p.set("sort", filters.sort)
  if (filters.page && filters.page > 1)          p.set("page", String(filters.page))
  return p
}

export function DirectoryClient({ states, typeCounts }: Props) {
  const router     = useRouter()
  const pathname   = usePathname()
  const searchParams = useSearchParams()

  /* Mobile filter drawer */
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [, startTransition]         = useTransition()

  /* Filter state initialised from URL */
  const [filters, setFilters] = useState<DirectoryFilters>(() =>
    paramsToFilters(searchParams),
  )

  /* Results state */
  const [result, setResult]     = useState<DirectoryResult | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState<string | null>(null)

  /* ── Sync URL → filters when params change externally ── */
  useEffect(() => {
    setFilters(paramsToFilters(searchParams))
  }, [searchParams])

  /* ── Fetch results whenever filters change ── */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getListings(filters)
      .then((data) => { if (!cancelled) { setResult(data); setLoading(false) } })
      .catch((err)  => { if (!cancelled) { setError(String(err)); setLoading(false) } })

    return () => { cancelled = true }
  }, [filters])

  /* ── Push filter changes to URL ── */
  const applyFilters = useCallback(
    (next: DirectoryFilters) => {
      const params = filtersToParams({ ...next, page: 1 })
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [router, pathname],
  )

  /* Merge a partial change and push */
  const updateFilter = useCallback(
    (partial: Partial<DirectoryFilters>) => {
      const next = { ...filters, ...partial, page: 1 }
      setFilters(next)
      applyFilters(next)
    },
    [filters, applyFilters],
  )

  const setPage = useCallback(
    (page: number) => {
      const next = { ...filters, page }
      setFilters(next)
      const params = filtersToParams(next)
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: true })
      })
    },
    [filters, router, pathname],
  )

  const clearAll = useCallback(() => {
    const next: DirectoryFilters = { sort: "rating", page: 1 }
    setFilters(next)
    router.push(pathname, { scroll: false })
  }, [router, pathname])

  /* Prevent body scroll when drawer is open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [drawerOpen])

  /* Count active filters (for badge on mobile button) */
  const activeFilterCount = [
    filters.q,
    filters.state,
    ...(filters.shopTypes ?? []),
    ...(filters.services  ?? []),
    filters.fitting,
    filters.minRating && filters.minRating > 0 ? true : undefined,
  ].filter(Boolean).length

  /* ── Shared sidebar props ── */
  const sidebarProps = {
    filters,
    updateFilter,
    clearAll,
    states,
    typeCounts,
    shopTypes: SHOP_TYPES,
    primaryServices: PRIMARY_SERVICES,
    activeFilterCount,
  }

  return (
    <div className="min-h-screen bg-[var(--color-off-white)]">

      {/* ── Page header ── */}
      <div className="border-b border-[var(--color-gray-light)] bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
          <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.3em] uppercase text-[var(--color-green-deep)] mb-2">
            Club Fitting Directory
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-normal text-[var(--color-black)]">
            Find Your Fitter
          </h1>
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-gray)] mt-1">
            Search 1,200+ independent golf club fitting shops across all 50 states
          </p>
        </div>
      </div>

      {/* ── Search bar (full width, above sidebar+content) ── */}
      <div className="border-b border-[var(--color-gray-light)] bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <SearchBar
            value={filters.q ?? ""}
            onChange={(q) => updateFilter({ q: q || undefined })}
            className="flex-1"
          />
          {/* Mobile: Filter toggle button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={[
              "lg:hidden shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-md",
              "border font-[family-name:var(--font-body)] text-sm transition-colors",
              activeFilterCount > 0
                ? "border-[var(--color-green-deep)] text-[var(--color-green-deep)] bg-[#1B43320A]"
                : "border-[var(--color-gray-light)] text-[var(--color-gray)]",
            ].join(" ")}
            aria-label="Open filters"
          >
            <SlidersHorizontal size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="font-[family-name:var(--font-body)] text-xs bg-[var(--color-green-deep)] text-white rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Main layout: sidebar + results ── */}
      <div className="max-w-[1400px] mx-auto flex">

        {/* Sticky left sidebar — desktop only */}
        <aside className="hidden lg:block w-[280px] shrink-0 border-r border-[var(--color-gray-light)]">
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <FilterSidebar {...sidebarProps} />
          </div>
        </aside>

        {/* Results area */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          <ResultsGrid
            result={result}
            loading={loading}
            error={error}
            filters={filters}
            onSort={(sort) => updateFilter({ sort })}
            onPage={setPage}
          />
        </main>
      </div>

      {/* ── Mobile filter drawer overlay ── */}
      <>
        {/* Backdrop */}
        <div
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
          className={[
            "fixed inset-0 z-40 bg-black/60 lg:hidden transition-opacity duration-300",
            drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
          ].join(" ")}
        />

        {/* Drawer panel */}
        <div
          role="dialog"
          aria-label="Filter options"
          aria-modal="true"
          className={[
            "fixed inset-y-0 left-0 z-50 w-[300px] lg:hidden",
            "bg-white",
            "border-r border-[var(--color-gray-light)]",
            "overflow-y-auto",
            "transition-transform duration-300 ease-in-out",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          {/* Drawer header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-[var(--color-gray-light)]">
            <span className="font-[family-name:var(--font-body)] text-lg font-semibold text-[var(--color-black)]">
              Filters
            </span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 text-[var(--color-gray)] hover:text-[var(--color-green-deep)] transition-colors"
              aria-label="Close filters"
            >
              <X size={20} />
            </button>
          </div>

          <FilterSidebar {...sidebarProps} onApply={() => setDrawerOpen(false)} />
        </div>
      </>
    </div>
  )
}

/* Export filter/service constants so other components can import them */
export { SHOP_TYPES, PRIMARY_SERVICES }
