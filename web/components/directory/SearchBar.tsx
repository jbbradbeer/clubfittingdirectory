"use client"

import { useRef, useEffect, useState } from "react"
import { Search, X } from "lucide-react"

/* ─────────────────────────────────────────────────────────
   SEARCH BAR
   Debounced text input — waits 300ms after the user stops
   typing before calling onChange. This prevents a Supabase
   query on every single keystroke.
   ───────────────────────────────────────────────────────── */

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SearchBar({ value, onChange, className = "" }: SearchBarProps) {
  /* Local draft — shown instantly; parent notified after debounce */
  const [draft, setDraft] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Sync if parent resets the value (e.g. Clear All) */
  useEffect(() => {
    setDraft(value)
  }, [value])

  const handleChange = (raw: string) => {
    setDraft(raw)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(raw), 300)
  }

  const handleClear = () => {
    setDraft("")
    if (timerRef.current) clearTimeout(timerRef.current)
    onChange("")
  }

  /* Cleanup on unmount */
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Search icon */}
      <span
        className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-brass)] pointer-events-none"
        aria-hidden="true"
      >
        <Search size={17} strokeWidth={1.8} />
      </span>

      <input
        type="search"
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search fitters, cities, or shops..."
        autoComplete="off"
        spellCheck={false}
        className={[
          "w-full",
          "pl-11 pr-10 py-3",
          "bg-[var(--color-green-mid)]",
          "border border-[color-mix(in_srgb,var(--color-brass)_25%,transparent)]",
          "rounded-sm",
          "font-[family-name:var(--font-display)] text-[var(--color-ivory)] text-sm",
          "placeholder:font-[family-name:var(--font-display)] placeholder:text-[color-mix(in_srgb,var(--color-ivory-warm)_40%,transparent)] placeholder:italic",
          "focus:outline-2 focus:outline-[var(--color-brass)] focus:outline-offset-0",
          "focus:border-[var(--color-brass)]",
          "transition-colors duration-150",
          /* Remove browser default search cancel button */
          "[&::-webkit-search-cancel-button]:appearance-none",
        ].join(" ")}
        aria-label="Search the directory"
      />

      {/* Custom clear button */}
      {draft && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-ivory-warm)] hover:text-[var(--color-brass)] transition-colors"
          aria-label="Clear search"
          type="button"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}
