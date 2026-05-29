"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Loader2, CornerDownLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SearchSuggestion } from "@/lib/supabase/queries/shops"

/**
 * Homepage hero search with live type-ahead suggestions.
 * - Debounced fetch to /api/search
 * - Keyboard navigation (↑ ↓ Enter Esc)
 * - Select a suggestion → shop profile; Enter on free text → directory search
 */
export function HeroSearch() {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [results, setResults] = useState<SearchSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)

  const rootRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  /* ── Debounced fetch ── */
  useEffect(() => {
    const term = value.trim()
    if (term.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: ac.signal,
        })
        const data = await res.json()
        setResults(data.suggestions ?? [])
        setOpen(true)
        setActive(-1)
      } catch {
        /* aborted or failed — ignore */
      } finally {
        setLoading(false)
      }
    }, 180)

    return () => clearTimeout(t)
  }, [value])

  /* ── Close on outside click ── */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const goToDirectory = (term: string) => {
    const q = term.trim()
    router.push(q ? `/directory?q=${encodeURIComponent(q)}` : "/directory")
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) {
      if (e.key === "Enter") goToDirectory(value)
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (active >= 0 && results[active]) {
        router.push(`/listing/${results[active].slug}`)
      } else {
        goToDirectory(value)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative max-w-2xl mx-auto">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          goToDirectory(value)
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search
            size={20}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)] pointer-events-none"
          />
          <input
            type="text"
            name="q"
            value={value}
            autoComplete="off"
            placeholder="Search a city or shop name…"
            aria-label="Search fitters by city or shop name"
            aria-expanded={open}
            aria-autocomplete="list"
            role="combobox"
            aria-controls="hero-search-results"
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            onKeyDown={onKeyDown}
            className="w-full pl-12 pr-12 py-4 bg-white border border-[var(--color-border)] shadow-card rounded-full text-base text-[var(--color-charcoal)] placeholder:text-[var(--color-charcoal-light)] focus:outline-none focus:border-[var(--color-forest)] focus:ring-2 focus:ring-[var(--color-forest)]/15 transition-all"
          />
          {loading && (
            <Loader2
              size={18}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)] animate-spin"
            />
          )}
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-[var(--color-forest)] text-white text-base font-semibold rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer shrink-0"
        >
          <Search size={18} />
          Search
        </button>
      </form>

      {/* ── Suggestions popover ── */}
      {open && (results.length > 0 || (value.trim().length >= 2 && !loading)) && (
        <div
          id="hero-search-results"
          role="listbox"
          className="absolute z-30 mt-2 w-full sm:w-[calc(100%-9.5rem)] sm:left-0 left-0 bg-white border border-[var(--color-border)] rounded-2xl shadow-card-hover overflow-hidden text-left animate-fade-in-up"
          style={{ animationDuration: "0.2s" }}
        >
          {results.length === 0 ? (
            <div className="px-5 py-4 text-sm text-[var(--color-charcoal-light)]">
              No matches. Press{" "}
              <span className="font-semibold text-[var(--color-charcoal)]">Enter</span>{" "}
              to search the full directory.
            </div>
          ) : (
            <ul className="py-1.5">
              {results.map((s, i) => (
                <li key={s.slug} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => router.push(`/listing/${s.slug}`)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      i === active ? "bg-[var(--color-cream)]" : "hover:bg-[var(--color-cream)]",
                    )}
                  >
                    <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-forest-tint)] text-[var(--color-forest)] shrink-0">
                      <MapPin size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[var(--color-charcoal)] truncate">
                        {s.name}
                      </span>
                      <span className="block text-xs text-[var(--color-charcoal-light)] truncate">
                        {[s.city, s.state_code].filter(Boolean).join(", ")}
                        {s.shop_type ? ` · ${s.shop_type}` : ""}
                      </span>
                    </span>
                    {s.rating != null && (
                      <span className="text-xs font-semibold text-[var(--color-gold-ink)] shrink-0">
                        ★ {s.rating.toFixed(1)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
              <li className="border-t border-[var(--color-line)]">
                <button
                  type="button"
                  onClick={() => goToDirectory(value)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-[var(--color-forest)] hover:bg-[var(--color-cream)] transition-colors"
                >
                  <span>
                    Search all fitters for “{value.trim()}”
                  </span>
                  <CornerDownLeft size={15} className="shrink-0 opacity-60" />
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
