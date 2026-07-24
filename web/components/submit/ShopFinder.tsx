"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SearchSuggestion } from "@/lib/supabase/queries/shops"

/**
 * Shop type-ahead picker (adapted from the homepage HeroSearch). Two modes:
 * - Navigate (default): picking a shop goes to `hrefFor(shop)` —
 *   /for-shops uses this to send owners to their claim page.
 * - Select: with `onSelect`, picking a shop hands it to the caller instead —
 *   the update-request form uses this to fill its shop field.
 */
export function ShopFinder({
  placeholder = "Search your shop name or city…",
  hrefFor = (s: SearchSuggestion) => `/claim/${s.slug}`,
  onSelect,
}: {
  placeholder?: string
  hrefFor?: (s: SearchSuggestion) => string
  onSelect?: (s: SearchSuggestion) => void
}) {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [results, setResults] = useState<SearchSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)

  const rootRef = useRef<HTMLDivElement>(null)

  /* ── Debounced fetch (mirrors HeroSearch) ── */
  useEffect(() => {
    const term = value.trim()
    if (term.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const ac = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: ac.signal,
        })
        if (!res.ok) throw new Error(`search failed: ${res.status}`)
        const data = await res.json()
        if (ac.signal.aborted) return
        setResults(data.suggestions ?? [])
        setOpen(true)
        setActive(-1)
      } catch {
        /* aborted or failed — ignore */
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    }, 180)

    return () => {
      clearTimeout(t)
      ac.abort()
    }
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

  const pick = (s: SearchSuggestion) => {
    if (onSelect) {
      onSelect(s)
      setValue(`${s.name} — ${[s.city, s.state_code].filter(Boolean).join(", ")}`)
      setOpen(false)
    } else {
      router.push(hrefFor(s))
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (active >= 0 && results[active]) pick(results[active])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search
          size={20}
          className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)] pointer-events-none"
        />
        <input
          type="text"
          value={value}
          autoComplete="off"
          placeholder={placeholder}
          aria-label="Find your shop"
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
          aria-controls="shop-finder-results"
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          className="w-full pl-12 pr-12 py-4 bg-white border border-[var(--color-border)] rounded-full text-base text-[var(--color-charcoal)] placeholder:text-[var(--color-charcoal-light)] focus:outline-none focus:border-[var(--color-forest)] focus:ring-2 focus:ring-[var(--color-forest)]/15 transition-all"
        />
        {loading && (
          <Loader2
            size={18}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)] animate-spin"
          />
        )}
      </div>

      {open && (results.length > 0 || (value.trim().length >= 2 && !loading)) && (
        <div
          id="shop-finder-results"
          role="listbox"
          className="absolute z-30 mt-2 w-full left-0 bg-white border border-[var(--color-border)] rounded-2xl shadow-card-hover overflow-hidden text-left"
        >
          {results.length === 0 ? (
            <div className="px-5 py-4 text-sm text-[var(--color-charcoal-light)]">
              No matches. Not listed yet?{" "}
              <a href="/submit" className="font-semibold text-[var(--color-forest)] hover:underline">
                Submit your shop →
              </a>
            </div>
          ) : (
            <ul className="py-1.5">
              {results.map((s, i) => (
                <li key={s.slug} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(s)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer",
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
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
