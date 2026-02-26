"use client"

import { useState } from "react"
import { RatingStars } from "@/components/ui/RatingStars"
import { Button } from "@/components/ui/Button"
import type { DirectoryFilters } from "@/lib/supabase/queries/listings"
import { ChevronDown, ChevronUp } from "lucide-react"

/* ─────────────────────────────────────────────────────────
   FILTER SIDEBAR
   All filter controls for the directory.
   White background, green accents, clean editorial style.
   ───────────────────────────────────────────────────────── */

interface FilterSidebarProps {
  filters: DirectoryFilters
  updateFilter: (partial: Partial<DirectoryFilters>) => void
  clearAll: () => void
  states: { state_code: string; state: string; count: number }[]
  typeCounts: Record<string, number>
  shopTypes: string[]
  primaryServices: string[]
  activeFilterCount: number
  onApply?: () => void   // mobile: close drawer on apply
}

/* ── Collapsible section wrapper ── */
function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[var(--color-gray-light)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left group"
      >
        <span className="font-[family-name:var(--font-body)] text-[10px] tracking-[0.25em] uppercase text-[var(--color-green-deep)] font-semibold">
          {title}
        </span>
        <span className="text-[var(--color-gray)] group-hover:text-[var(--color-green-deep)] transition-colors">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

/* ── Green-styled checkbox ── */
function GreenCheckbox({
  id,
  checked,
  onChange,
  label,
  count,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  count?: number
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between gap-2 py-1.5 cursor-pointer group"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Custom checkbox */}
        <div className="relative shrink-0">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
          />
          <div
            className={[
              "w-4 h-4 rounded-[2px] border transition-colors duration-150 flex items-center justify-center",
              checked
                ? "bg-[var(--color-green-deep)] border-[var(--color-green-deep)]"
                : "border-[var(--color-gray-light)] group-hover:border-[var(--color-green-deep)]",
            ].join(" ")}
          >
            {checked && (
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
                <path
                  d="M1 3.5L3.5 6L8 1"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
        <span
          className={[
            "font-[family-name:var(--font-body)] text-sm leading-tight truncate transition-colors",
            checked ? "text-[var(--color-black)]" : "text-[var(--color-gray)] group-hover:text-[var(--color-black)]",
          ].join(" ")}
        >
          {label}
        </span>
      </div>
      {count !== undefined && (
        <span className="font-[family-name:var(--font-body)] text-[10px] text-[var(--color-gray)] shrink-0 tabular-nums">
          {count}
        </span>
      )}
    </label>
  )
}

export function FilterSidebar({
  filters,
  updateFilter,
  clearAll,
  states,
  typeCounts,
  shopTypes,
  primaryServices,
  activeFilterCount,
  onApply,
}: FilterSidebarProps) {

  /* ── State filter: searchable dropdown ── */
  const [stateSearch, setStateSearch] = useState("")
  const [stateOpen,   setStateOpen]   = useState(false)

  const filteredStates = stateSearch
    ? states.filter(
        (s) =>
          s.state.toLowerCase().includes(stateSearch.toLowerCase()) ||
          s.state_code.toLowerCase().includes(stateSearch.toLowerCase()),
      )
    : states

  const selectedState = states.find((s) => s.state_code === filters.state)

  /* ── Helper to toggle a value in an array filter ── */
  const toggleArrayFilter = (
    key: "shopTypes" | "services",
    value: string,
    checked: boolean,
  ) => {
    const current = filters[key] ?? []
    const next = checked
      ? [...current, value]
      : current.filter((v) => v !== value)
    updateFilter({ [key]: next.length ? next : undefined })
  }

  return (
    <div className="bg-white flex flex-col h-full">

      {/* ── STATE FILTER ── */}
      <FilterSection title="State">
        <div className="relative">
          {/* Selected state display / trigger */}
          <button
            type="button"
            onClick={() => setStateOpen((v) => !v)}
            className={[
              "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-left",
              "border transition-colors duration-150",
              "font-[family-name:var(--font-body)] text-sm",
              stateOpen || filters.state
                ? "border-[var(--color-green-deep)] text-[var(--color-black)]"
                : "border-[var(--color-gray-light)] text-[var(--color-gray)]",
              "bg-white",
            ].join(" ")}
          >
            <span className="truncate">
              {selectedState
                ? `${selectedState.state_code} — ${selectedState.state}`
                : "All States"}
            </span>
            <ChevronDown
              size={14}
              className={`shrink-0 transition-transform ${stateOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown */}
          {stateOpen && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-[var(--color-gray-light)] rounded-md shadow-lg max-h-56 flex flex-col">
              {/* Search */}
              <div className="p-2 border-b border-[var(--color-gray-light)]">
                <input
                  type="text"
                  placeholder="Search states..."
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  autoFocus
                  className={[
                    "w-full px-3 py-1.5 text-xs",
                    "bg-[var(--color-off-white)] rounded-md",
                    "border border-[var(--color-gray-light)]",
                    "text-[var(--color-black)] placeholder:text-[var(--color-gray)]",
                    "font-[family-name:var(--font-body)]",
                    "focus:outline-none focus:border-[var(--color-green-deep)]",
                  ].join(" ")}
                />
              </div>
              {/* Options */}
              <ul className="overflow-y-auto flex-1" role="listbox">
                {/* Clear option */}
                <li>
                  <button
                    type="button"
                    onClick={() => { updateFilter({ state: undefined }); setStateOpen(false); setStateSearch("") }}
                    className={[
                      "w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors",
                      !filters.state
                        ? "bg-[#1B43320A] text-[var(--color-green-deep)]"
                        : "text-[var(--color-gray)] hover:bg-[var(--color-off-white)]",
                    ].join(" ")}
                  >
                    <span className="font-[family-name:var(--font-body)]">All States</span>
                  </button>
                </li>
                {filteredStates.map((s) => (
                  <li key={s.state_code}>
                    <button
                      type="button"
                      onClick={() => {
                        updateFilter({ state: s.state_code })
                        setStateOpen(false)
                        setStateSearch("")
                      }}
                      className={[
                        "w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors",
                        filters.state === s.state_code
                          ? "bg-[#1B43320A] text-[var(--color-green-deep)]"
                          : "text-[var(--color-gray)] hover:bg-[var(--color-off-white)]",
                      ].join(" ")}
                    >
                      <span className="font-[family-name:var(--font-body)]">{s.state}</span>
                      <span className="font-[family-name:var(--font-body)] text-[10px] opacity-60 tabular-nums">
                        {s.state_code} · {s.count}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </FilterSection>

      {/* ── SHOP TYPE ── */}
      <FilterSection title="Shop Type">
        <div className="space-y-0.5">
          {shopTypes.map((type) => (
            <GreenCheckbox
              key={type}
              id={`type-${type}`}
              label={type}
              count={typeCounts[type]}
              checked={(filters.shopTypes ?? []).includes(type)}
              onChange={(checked) => toggleArrayFilter("shopTypes", type, checked)}
            />
          ))}
        </div>
      </FilterSection>

      {/* ── PRIMARY SERVICE ── */}
      <FilterSection title="Service" defaultOpen={false}>
        <div className="space-y-0.5">
          {primaryServices.map((svc) => (
            <GreenCheckbox
              key={svc}
              id={`svc-${svc}`}
              label={svc}
              checked={(filters.services ?? []).includes(svc)}
              onChange={(checked) => toggleArrayFilter("services", svc, checked)}
            />
          ))}
        </div>
      </FilterSection>

      {/* ── FITTING AVAILABLE ── */}
      <FilterSection title="Fitting">
        {/* Toggle switch */}
        <label className="flex items-center justify-between gap-3 mb-4 cursor-pointer group">
          <span
            className={[
              "font-[family-name:var(--font-body)] text-sm transition-colors",
              filters.fitting ? "text-[var(--color-black)]" : "text-[var(--color-gray)]",
            ].join(" ")}
          >
            Fitting Available Only
          </span>
          {/* Toggle pill */}
          <button
            type="button"
            role="switch"
            aria-checked={!!filters.fitting}
            onClick={() => updateFilter({ fitting: filters.fitting ? undefined : true, fittingEnv: undefined })}
            className={[
              "relative shrink-0 w-10 h-5.5 rounded-full border transition-all duration-200",
              filters.fitting
                ? "bg-[var(--color-green-deep)] border-[var(--color-green-deep)]"
                : "bg-[var(--color-gray-light)] border-[var(--color-gray-light)]",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                filters.fitting ? "translate-x-5" : "translate-x-0.5",
              ].join(" ")}
            />
          </button>
        </label>

        {/* Environment radio — only visible when fitting is on */}
        {filters.fitting && (
          <div className="space-y-1.5 pl-1 border-l-2 border-[var(--color-green-deep)]">
            <p className="font-[family-name:var(--font-body)] text-[10px] tracking-[0.2em] uppercase text-[var(--color-green-deep)] mb-2">
              Environment
            </p>
            {["Indoor", "Outdoor", "Indoor & Outdoor"].map((env) => (
              <label
                key={env}
                className="flex items-center gap-2.5 py-1 cursor-pointer group"
              >
                <div className="relative shrink-0">
                  <input
                    type="radio"
                    name="fittingEnv"
                    value={env}
                    checked={filters.fittingEnv === env}
                    onChange={() => updateFilter({ fittingEnv: env })}
                    className="sr-only"
                  />
                  <div
                    className={[
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                      filters.fittingEnv === env
                        ? "border-[var(--color-green-deep)]"
                        : "border-[var(--color-gray-light)] group-hover:border-[var(--color-green-deep)]",
                    ].join(" ")}
                  >
                    {filters.fittingEnv === env && (
                      <div className="w-2 h-2 rounded-full bg-[var(--color-green-deep)]" />
                    )}
                  </div>
                </div>
                <span
                  className={[
                    "font-[family-name:var(--font-body)] text-sm transition-colors",
                    filters.fittingEnv === env
                      ? "text-[var(--color-black)]"
                      : "text-[var(--color-gray)] group-hover:text-[var(--color-black)]",
                  ].join(" ")}
                >
                  {env}
                </span>
                {filters.fittingEnv === env && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); updateFilter({ fittingEnv: undefined }) }}
                    className="ml-auto text-[10px] text-[var(--color-gray)] hover:text-[var(--color-green-deep)] transition-colors"
                  >
                    ✕
                  </button>
                )}
              </label>
            ))}
          </div>
        )}
      </FilterSection>

      {/* ── MINIMUM RATING ── */}
      <FilterSection title="Minimum Rating" defaultOpen={false}>
        <div className="space-y-4">
          {/* Stars preview */}
          <div className="flex items-center gap-3">
            {(filters.minRating ?? 0) > 0 ? (
              <>
                <RatingStars rating={filters.minRating ?? 0} size="sm" />
                <span className="font-[family-name:var(--font-body)] text-xs text-[var(--color-green-deep)] tabular-nums">
                  {(filters.minRating ?? 0).toFixed(1)}+
                </span>
              </>
            ) : (
              <span className="font-[family-name:var(--font-body)] text-xs text-[var(--color-gray)] italic">
                Any rating
              </span>
            )}
          </div>

          {/* Slider */}
          <div className="relative">
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={filters.minRating ?? 0}
              onChange={(e) =>
                updateFilter({
                  minRating: Number(e.target.value) || undefined,
                })
              }
              className={[
                "w-full h-1.5 rounded-full appearance-none cursor-pointer",
                "bg-[var(--color-gray-light)]",
                "[&::-webkit-slider-thumb]:appearance-none",
                "[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
                "[&::-webkit-slider-thumb]:rounded-full",
                "[&::-webkit-slider-thumb]:bg-[var(--color-green-deep)]",
                "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white",
                "[&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing",
                "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4",
                "[&::-moz-range-thumb]:rounded-full",
                "[&::-moz-range-thumb]:bg-[var(--color-green-deep)]",
                "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white",
              ].join(" ")}
              aria-label="Minimum rating"
            />
            {/* Step labels */}
            <div className="flex justify-between mt-1">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className="font-[family-name:var(--font-body)] text-[9px] text-[var(--color-gray)] tabular-nums"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      </FilterSection>

      {/* ── CLEAR ALL + APPLY (mobile) ── */}
      <div className="p-5 mt-auto space-y-2">
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { clearAll(); onApply?.() }}
            className="w-full text-[var(--color-gray)] hover:text-[var(--color-green-deep)] border border-[var(--color-gray-light)]"
          >
            Clear {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}
          </Button>
        )}
        {onApply && (
          <Button variant="primary" size="sm" onClick={onApply} className="w-full">
            Show Results
          </Button>
        )}
      </div>
    </div>
  )
}
