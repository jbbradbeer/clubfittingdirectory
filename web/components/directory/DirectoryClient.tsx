"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MapPin, List, Map, Locate, X } from "lucide-react"
import { getListings, getNearMeListings } from "@/lib/supabase/queries/listings"
import type { Shop } from "@/types/shop"
import type { NearMeShop } from "@/lib/supabase/queries/listings"
import { SearchBar } from "./SearchBar"
import { FilterSidebar } from "./FilterSidebar"
import { ResultsGrid } from "./ResultsGrid"
import { MapView } from "./MapView"

interface DirectoryClientProps {
  stateOptions: { state_code: string; state: string; count: number }[]
  shopTypeOptions: string[]
}

type ViewMode = "grid" | "map"

export function DirectoryClient({ stateOptions, shopTypeOptions }: DirectoryClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  /* ── State from URL params ── */
  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const [selectedState, setSelectedState] = useState(searchParams.get("state") ?? "")
  const [selectedShopTypes, setSelectedShopTypes] = useState<string[]>(
    searchParams.get("types")?.split(",").filter(Boolean) ?? [],
  )
  const [fittingOnly, setFittingOnly] = useState(searchParams.get("fitting") === "true")
  const [minRating, setMinRating] = useState(parseFloat(searchParams.get("rating") ?? "0"))
  const [sort, setSort] = useState<"rating" | "name">(
    (searchParams.get("sort") as "rating" | "name") ?? "rating",
  )
  const [page, setPage] = useState(parseInt(searchParams.get("page") ?? "1", 10))
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

  /* ── Sync URL params ── */
  const syncUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (selectedState) params.set("state", selectedState)
    if (selectedShopTypes.length) params.set("types", selectedShopTypes.join(","))
    if (fittingOnly) params.set("fitting", "true")
    if (minRating > 0) params.set("rating", String(minRating))
    if (sort !== "rating") params.set("sort", sort)
    if (page > 1) params.set("page", String(page))
    const qs = params.toString()
    router.replace(`/directory${qs ? `?${qs}` : ""}`, { scroll: false })
  }, [query, selectedState, selectedShopTypes, fittingOnly, minRating, sort, page, router])

  /* ── Fetch results ── */
  const fetchResults = useCallback(async () => {
    if (nearMeActive) return
    setLoading(true)
    setLoadError(false)
    try {
      const result = await getListings({
        q: query || undefined,
        state: selectedState || undefined,
        shopTypes: selectedShopTypes.length ? selectedShopTypes : undefined,
        fitting: fittingOnly || undefined,
        minRating: minRating > 0 ? minRating : undefined,
        sort,
        page,
        perPage: 24,
      })
      setShops(result.shops)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (e) {
      // Surface the failure (Vercel logs) AND show a real error state, so a
      // broken connection is never disguised as "No results found".
      console.error("[directory] getListings failed:", e)
      setShops([])
      setTotal(0)
      setTotalPages(1)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [query, selectedState, selectedShopTypes, fittingOnly, minRating, sort, page, nearMeActive])

  useEffect(() => {
    fetchResults()
    syncUrl()
  }, [fetchResults, syncUrl])

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
    (fittingOnly ? 1 : 0) +
    (minRating > 0 ? 1 : 0)

  const resetFilters = () => {
    setSelectedState("")
    setSelectedShopTypes([])
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
                onClick={() => setFiltersOpen(!filtersOpen)}
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
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-56 shrink-0">
            <FilterSidebar
              stateOptions={stateOptions}
              shopTypeOptions={shopTypeOptions}
              selectedState={selectedState}
              selectedShopTypes={selectedShopTypes}
              fittingOnly={fittingOnly}
              minRating={minRating}
              onStateChange={(s) => { setSelectedState(s); setPage(1) }}
              onShopTypesChange={(t) => { setSelectedShopTypes(t); setPage(1) }}
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

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Filters
              </h2>
              <button onClick={() => setFiltersOpen(false)} className="p-1 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <FilterSidebar
              stateOptions={stateOptions}
              shopTypeOptions={shopTypeOptions}
              selectedState={selectedState}
              selectedShopTypes={selectedShopTypes}
              fittingOnly={fittingOnly}
              minRating={minRating}
              onStateChange={(s) => { setSelectedState(s); setPage(1) }}
              onShopTypesChange={(t) => { setSelectedShopTypes(t); setPage(1) }}
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
