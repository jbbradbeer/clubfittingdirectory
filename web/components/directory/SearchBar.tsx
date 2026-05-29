"use client"

import { Search } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex items-stretch gap-2"
    >
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)]"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by name or city..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--color-border)] shadow-card rounded-full text-sm text-[var(--color-charcoal)] placeholder:text-[var(--color-charcoal-light)] focus:outline-none focus:border-[var(--color-forest)] focus:ring-2 focus:ring-[var(--color-forest)]/15 transition-all"
        />
      </div>
      <button
        type="submit"
        className="px-6 py-2.5 bg-[var(--color-forest)] text-white text-sm font-semibold rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer"
      >
        Search
      </button>
    </form>
  )
}
