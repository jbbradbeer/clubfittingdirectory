"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MapPin, List, Map, Locate, X } from "lucide-react"
import { getListings, getNearMeListings } from "@/lib/supabase/queries/listings"
import type { Shop } from "@/types/shop"
import type { NearMeShop } from "@/lib/supabase/queries/listings"
import { SearchBar } from "./SearchBar"
import { FilterSidebar } from "./FilterSidebar"
import { ResultsGrid } from "./ResultsGrid"
import { MapView } from "./MapView"
import { NewsletterCaptureBlock } from "@/components/newsletter/NewsletterCaptureBlock"

interface DirectoryClientProps {
  stateOptions: { state_code: string; state: string; count: number }[]
  shopTypeOptions: string[]
}

type ViewMode = "grid" | "map"
type SortMode = "rating" | "name"

/* Safe parsers for URL params — a malformed value (e.g. ?page=abc, ?rating=xyz,
   ?sort=bogus) must never produce NaN/invalid state that breaks the fetch. */
function parsePage(v: string | null): number {
  const n = parseInt(v ?? "1", 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}
function parseRating(v: string | null): number {
  const n = parseFloat(v ?? "0")
  return Number.isFinite(n) && n > 0 ? n : 0
}
function parseSort(v: string | null): SortMode {
  return v === "name" ? "name" : "rating"
}

export function DirectoryClient({ stateOptions, shopTypeOptions }: DirectoryClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  /* ── State from URL params ── */
  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  /* Debounced copy of `query`. Fetching and URL sync key off this instead of
     the raw input, so typing "scottsdale" costs one DB round-trip instead of
     ten. 180ms matches the HeroSearch debounce. */
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [selectedState, setSelectedState] = useState(searchParams.get("state") ?? "")
  const [selectedShopTypes, setSelectedShopTypes] = useState<string[]>(
    searchParams.get("types")?.split(",").filter(Boolean) ?? [],
  )
  const [selectedServices, setSelectedServices] = useState<string[]>(
    searchParams.get("services")?.split(",").filter(Boolean) ?? [],
  )
  const [fittingOnly, setFittingOnly] = useState(searchParams.get("fitting") === "true")
  const [minRating, setMinRating] = useState(parseRating(searchParams.get("rating")))
  const [sort, setSort] = useState<SortMode>(parseSort(searchParams.get("sort")))
  const [page, setPage] = useState(parsePage(searchParams.get("page")))
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  /* ── Results ── */
  const [shops, setShops] = useState<Shop[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  /* ── Near Me ── */
  const [nearMeActive, setNearMeActive] = useState(false)
  const [nearMeShops, setNearMeShops] = useState<NearMeShop[]>([])
  const [nearMeLoading, setNearMeLoading] = useState(false)
  const [nearMeError, setNearMeError] = useState<string | null>(null)

  /* ── Mobile filter drawer ── */
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersToggleRef = useRef<HTMLButtonElement>(null)
  const drawerCloseRef = useRef<HTMLButtonElement>(null)

  /* Drawer a11y: move focus in on open, close on Escape, lock body scroll,
     and hand focus back to the Filters toggle on close. */
  useEffect(() => {
    if (!filtersOpen) return
    drawerCloseRef.current?.focus()
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      document.removeEventListener("keydown", onKey)
      filtersToggleRef.current?.focus()
    }
  }, [filtersOpen])

  /* Sequence counter: each fetch gets a number; only the latest one is allowed
     to write its results. Prevents a slow earlier request from overwriting the
     correct newer one when filters change quickly. */
  const fetchSeq = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 180)
    return () => clearTimeout(t)
  }, [query])

  /* ── Sync URL params ── */
  const syncUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (debouncedQuery) params.set("q", debouncedQuery)
    if (selectedState) params.set("state", selectedState)
    if (selectedShopTypes.length) params.set("types", selectedShopTypes.join(","))
    if (selectedServices.length) params.set("services", selectedServices.join(","))
    if (fittingOnly) params.set("fitting", "true")
    if (minRating > 0) params.set("rating", String(minRating))
    if (sort !== "rating") params.set("sort", sort)
    if (page > 1) params.set("page", String(page))
    const qs = params.toString()
    router.replace(`/directory${qs ? `?${qs}` : ""}`, { scroll: false })
  }, [debouncedQuery, selectedState, selectedShopTypes, selectedServices, fittingOnly, minRating, sort, page, router])

  /* ── Fetch results ── */
  const fetchResults = useCallback(async () => {
    if (nearMeActive) return
    const seq = ++fetchSeq.current
    setLoading(true)
    setLoadError(false)
    try {
      const result = await getListings({
        q: debouncedQuery || undefined,
        state: selectedState || undefined,
        shopTypes: selectedShopTypes.length ? selectedShopTypes : undefined,
        services: selectedServices.length ? selectedServices : undefined,
        fitting: fittingOnly || undefined,
        minRating: minRating > 0 ? minRating : undefined,
        sort,
        page,
        perPage: 24,
      })
      if (seq !== fetchSeq.current) return // a newer request superseded this one
      setShops(result.shops)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (e) {
      if (seq !== fetchSeq.current) return // ignore errors from stale requests
      // Surface the failure (Vercel logs) AND show a real error state, so a
      // broken connection is never disguised as "No results found".
      console.error("[directory] getListings failed:", e)
      setShops([])
      setTotal(0)
      setTotalPages(1)
      setLoadError(true)
    } finally {
      if (seq === fetchSeq.current) setLoading(false)
    }
  }, [debouncedQuery, selectedState, selectedShopTypes, selectedServices, fittingOnly, minRating, sort, page, nearMeActive])

  useEffect(() => {
    fetchResults()
    syncUrl()
  }, [fetchResults, syncUrl])

  /* ── Keep the controls in sync when the URL changes from OUTSIDE this
     component (browser Back/Forward, or an external link with query params).
     Each setter only updates when the value actually differs, so our own
     syncUrl() router.replace() can't trigger a feedback loop. ── */
  useEffect(() => {
    const urlTypes = searchParams.get("types")?.split(",").filter(Boolean) ?? []
    const urlServices = searchParams.get("services")?.split(",").filter(Boolean) ?? []
    setQuery((prev) => (prev !== (searchParams.get("q") ?? "") ? (searchParams.get("q") ?? "") : prev))
    setSelectedState((prev) => (prev !== (searchParams.get("state") ?? "") ? (searchParams.get("state") ?? "") : prev))
    setSelectedShopTypes((prev) => (prev.join(",") !== urlTypes.join(",") ? urlTypes : prev))
    setSelectedServices((prev) => (prev.join(",") !== urlServices.join(",") ? urlServices : prev))
    setFittingOnly((prev) => (prev !== (searchParams.get("fitting") === "true") ? searchParams.get("fitting") === "true" : prev))
    setMinRating((prev) => { const v = parseRating(searchParams.get("rating")); return prev !== v ? v : prev })
    setSort((prev) => { const v = parseSort(searchParams.get("sort")); return prev !== v ? v : prev })
    setPage((prev) => { const v = parsePage(searchParams.get("page")); return prev !== v ? v : prev })
  }, [searchParams])

  /* ── Auto-trigger Near Me when the page is opened via /directory?near=1
     (e.g. the homepage "Near me" quick link). Runs once on mount. ── */
  useEffect(() => {
    if (searchParams.get("near") === "1") handleNearMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Near Me handler ── */
  const handleNearMe = async () => {
    if (!navigator.geolocation) {
      setNearMeError("Geolocation is not supported by your browser.")
      return
    }
    setNearMeLoading(true)
    setNearMeError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await getNearMeListings(pos.coords.latitude, pos.coords.longitude, 80, 50)
          setNearMeShops(result)
          setNearMeActive(true)
        } catch {
          setNearMeError("Could not find shops near you. Try again.")
        } finally {
          setNearMeLoading(false)
        }
      },
      () => {
        setNearMeError("Location access denied. Please enable location services.")
        setNearMeLoading(false)
      },
    )
  }

  const clearNearMe = () => {
    setNearMeActive(false)
    setNearMeShops([])
    fetchResults()
  }

  /* ── Filter helpers ── */
  const activeFilterCount =
    (selectedState ? 1 : 0) +
    selectedShopTypes.length +
    selectedServices.length +
    (fittingOnly ? 1 : 0) +
    (minRating > 0 ? 1 : 0)

  const resetFilters = () => {
    setSelectedState("")
    setSelectedShopTypes([])
    setSelectedServices([])
    setFittingOnly(false)
    setMinRating(0)
    setPage(1)
  }

  const handleSearchSubmit = () => {
    setPage(1)
  }

  const displayShops = nearMeActive ? (nearMeShops as unknown as Shop[]) : shops

  return (
    <div>
      {/* Top bar: search + controls */}
      <div className="hero-surface grain border-b border-[var(--color-border)]">
        <div className="hero-contours" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-5 max-w-2xl">
            <p className="section-label mb-2 inline-flex items-center gap-3">
              <span className="gold-rule" />
              Find a Fitter
            </p>
            <h1 className="display text-[clamp(1.8rem,3.6vw,2.6rem)] text-[var(--color-charcoal)]">
              Search the directory
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <SearchBar value={query} onChange={setQuery} onSubmit={handleSearchSubmit} />
            </div>
            <div className="flex items-center gap-2">
              {/* Near Me */}
              {nearMeActive ? (
                <button
                  onClick={clearNearMe}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-[var(--color-gold)] text-[var(--color-forest-deep)] rounded-full hover:bg-[var(--color-gold-dark)] transition-colors cursor-pointer"
                >
                  <MapPin size={14} />
                  Near Me
                  <X size={14} />
                </button>
              ) : (
                <button
                  onClick={handleNearMe}
                  disabled={nearMeLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border border-[var(--color-border)] bg-white text-[var(--color-charcoal)] rounded-full hover:bg-[var(--color-cream)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Locate size={14} />
                  {nearMeLoading ? "Locating..." : "Near Me"}
                </button>
              )}

              {/* View toggle */}
              <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[var(--color-forest)] text-white"
                      : "text-[var(--color-charcoal-light)] hover:bg-[var(--color-cream)]"
                  }`}
                  aria-label="Grid view"
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`p-2.5 transition-colors cursor-pointer ${
                    viewMode === "map"
                      ? "bg-[var(--color-forest)] text-white"
                      : "text-[var(--color-charcoal-light)] hover:bg-[var(--color-cream)]"
                  }`}
                  aria-label="Map view"
                >
                  <Map size={16} />
                </button>
              </div>

              {/* Sort */}
              <select
                value={sort}
                aria-label="Sort results"
                onChange={(e) => {
                  setSort(e.target.value as "rating" | "name")
                  setPage(1)
                }}
                className="hidden sm:block px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-lg bg-white text-[var(--color-charcoal)] focus:outline-none focus:border-[var(--color-gold)] cursor-pointer"
              >
                <option value="rating">Top Rated</option>
                <option value="name">Alphabetical</option>
              </select>

              {/* Mobile filter toggle */}
              <button
                ref={filtersToggleRef}
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
                className="lg:hidden inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border border-[var(--color-border)] bg-white rounded-full hover:bg-[var(--color-cream)] transition-colors cursor-pointer"
              >
                Filters
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-[var(--color-gold)] text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {nearMeError && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
              <span>{nearMeError}</span>
              <button
                onClick={handleNearMe}
                className="text-xs font-semibold underline cursor-pointer"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content: sidebar + results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop sidebar — sticks alongside the scrolling results */}
          <div className="hidden lg:block w-60 xl:w-64 shrink-0 self-start sticky top-[88px]">
            <FilterSidebar
              stateOptions={stateOptions}
              shopTypeOptions={shopTypeOptions}
              selectedState={selectedState}
              selectedShopTypes={selectedShopTypes}
              selectedServices={selectedServices}
              fittingOnly={fittingOnly}
              minRating={minRating}
              onStateChange={(s) => { setSelectedState(s); setPage(1) }}
              onShopTypesChange={(t) => { setSelectedShopTypes(t); setPage(1) }}
              onServicesChange={(s) => { setSelectedServices(s); setPage(1) }}
              onFittingChange={(f) => { setFittingOnly(f); setPage(1) }}
              onRatingChange={(r) => { setMinRating(r); setPage(1) }}
              onReset={resetFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>

          {/* Results area */}
          <div className="flex-1 min-w-0">
            {viewMode === "grid" ? (
              <ResultsGrid
                shops={displayShops}
                total={nearMeActive ? nearMeShops.length : total}
                page={nearMeActive ? 1 : page}
                totalPages={nearMeActive ? 1 : totalPages}
                onPageChange={setPage}
                loading={loading && !nearMeActive}
                error={loadError && !nearMeActive}
                onRetry={fetchResults}
              />
            ) : (
              <MapView shops={displayShops} />
            )}
          </div>
        </div>
      </div>

      {/* Post-results newsletter capture (replaces the footer band on this page) */}
      <NewsletterCaptureBlock />

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="absolute right-0 top-0 bottom-0 w-[min(20rem,85vw)] bg-white p-6 overflow-y-auto shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold">
                Filters
              </h2>
              <button
                ref={drawerCloseRef}
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <FilterSidebar
              stateOptions={stateOptions}
              shopTypeOptions={shopTypeOptions}
              selectedState={selectedState}
              selectedShopTypes={selectedShopTypes}
              selectedServices={selectedServices}
              fittingOnly={fittingOnly}
              minRating={minRating}
              onStateChange={(s) => { setSelectedState(s); setPage(1) }}
              onShopTypesChange={(t) => { setSelectedShopTypes(t); setPage(1) }}
              onServicesChange={(s) => { setSelectedServices(s); setPage(1) }}
              onFittingChange={(f) => { setFittingOnly(f); setPage(1) }}
              onRatingChange={(r) => { setMinRating(r); setPage(1) }}
              onReset={resetFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>
        </div>
      )}
    </div>
  )
}
