"use client"

import { ChevronDown } from "lucide-react"
import { fieldClass, labelClass, checkboxClass } from "@/lib/form-styles"

interface FilterSidebarProps {
  /* Available options */
  stateOptions: { state_code: string; state: string; count: number }[]
  shopTypeOptions: string[]
  /* Current filter values */
  selectedState: string
  selectedShopTypes: string[]
  fittingOnly: boolean
  minRating: number
  /* Handlers */
  onStateChange: (state: string) => void
  onShopTypesChange: (types: string[]) => void
  onFittingChange: (fitting: boolean) => void
  onRatingChange: (rating: number) => void
  onReset: () => void
  activeFilterCount: number
}

export function FilterSidebar({
  stateOptions,
  shopTypeOptions,
  selectedState,
  selectedShopTypes,
  fittingOnly,
  minRating,
  onStateChange,
  onShopTypesChange,
  onFittingChange,
  onRatingChange,
  onReset,
  activeFilterCount,
}: FilterSidebarProps) {
  const toggleShopType = (type: string) => {
    if (selectedShopTypes.includes(type)) {
      onShopTypesChange(selectedShopTypes.filter((t) => t !== type))
    } else {
      onShopTypesChange([...selectedShopTypes, type])
    }
  }

  return (
    <aside className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-charcoal)]">
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-[var(--color-gold)] text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-[var(--color-charcoal-light)] hover:text-[var(--color-forest)] transition-colors cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* State filter */}
      <div>
        <label htmlFor="filter-state" className={labelClass}>
          State
        </label>
        <div className="relative">
          <select
            id="filter-state"
            value={selectedState}
            onChange={(e) => onStateChange(e.target.value)}
            className={`${fieldClass} appearance-none pr-8 cursor-pointer`}
          >
            <option value="">All States</option>
            {stateOptions.map((s) => (
              <option key={s.state_code} value={s.state_code}>
                {s.state} ({s.count})
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)] pointer-events-none" />
        </div>
      </div>

      {/* Shop Type checkboxes */}
      <div>
        <label className={labelClass}>
          Shop Type
        </label>
        <div className="space-y-2">
          {shopTypeOptions.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedShopTypes.includes(type)}
                onChange={() => toggleShopType(type)}
                className={checkboxClass}
              />
              <span className="text-sm text-[var(--color-charcoal)] group-hover:text-[var(--color-forest)] transition-colors">
                {type}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Fitting toggle */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={fittingOnly}
            onChange={(e) => onFittingChange(e.target.checked)}
            className={checkboxClass}
          />
          <span className="text-sm font-medium text-[var(--color-charcoal)] group-hover:text-[var(--color-forest)] transition-colors">
            Offers Club Fitting
          </span>
        </label>
      </div>

      {/* Rating filter */}
      <div>
        <label htmlFor="filter-rating" className={labelClass}>
          Minimum Rating
        </label>
        <div className="flex items-center gap-3">
          <input
            id="filter-rating"
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={minRating}
            aria-label="Minimum rating"
            onChange={(e) => onRatingChange(parseFloat(e.target.value))}
            className="flex-1 accent-[var(--color-gold)] cursor-pointer"
          />
          <span className="text-sm font-semibold text-[var(--color-charcoal)] min-w-[2rem] text-right">
            {minRating > 0 ? `${minRating}+` : "Any"}
          </span>
        </div>
      </div>
    </aside>
  )
}
