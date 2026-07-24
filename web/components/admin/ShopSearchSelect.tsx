"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck, Loader2, Search, X } from "lucide-react"
import { activateVerified } from "@/app/admin/actions"
import type { PlanKey } from "@/lib/plans"

/**
 * Verified activation via search — replaces the old paste-a-slug input.
 * Type a shop name or city, pick from the dropdown (same /api/search endpoint
 * the public site uses), choose the plan, activate. Debounced 250ms.
 */
type Suggestion = { slug: string; name: string; city: string; state_code: string }

export function ShopSearchSelect() {
  const [q, setQ] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Suggestion | null>(null)
  const [plan, setPlan] = useState<PlanKey>("annual")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [activated, setActivated] = useState("")
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  function onType(value: string) {
    setQ(value)
    setSelected(null)
    if (debounce.current) clearTimeout(debounce.current)
    if (value.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`)
        const data = await res.json().catch(() => ({}))
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : [])
        setOpen(true)
      } catch {
        setSuggestions([])
      }
    }, 250)
  }

  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current)
  }, [])

  async function activate() {
    if (!selected) return
    setBusy(true)
    setError("")
    setActivated("")
    const fd = new FormData()
    fd.set("slug", selected.slug)
    fd.set("plan", plan)
    const result = await activateVerified(fd)
    setBusy(false)
    if (result && "error" in result && result.error) {
      setError(result.error)
      return
    }
    setActivated(selected.name)
    setSelected(null)
    setQ("")
    router.refresh()
  }

  return (
    <div className="mt-4">
      {!selected ? (
        <div className="relative max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)]"
          />
          <input
            value={q}
            onChange={(e) => onType(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Search shop by name or city…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-forest)]"
          />
          {open && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-[var(--color-border)] rounded-lg shadow-card overflow-hidden">
              {suggestions.map((s) => (
                <li key={s.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(s)
                      setOpen(false)
                      setActivated("")
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-cream)] cursor-pointer"
                  >
                    <span className="font-medium text-[var(--color-charcoal)]">{s.name}</span>
                    <span className="text-[var(--color-charcoal-light)]">
                      {" "}
                      — {s.city}, {s.state_code}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-[var(--color-forest-tint)] border border-[var(--color-forest)] rounded-lg text-[var(--color-charcoal)]">
            <span className="font-medium">{selected.name}</span>
            <span className="text-[var(--color-charcoal-light)]">
              — {selected.city}, {selected.state_code}
            </span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Clear selection"
              className="ml-1 text-[var(--color-charcoal-light)] hover:text-[var(--color-charcoal)] cursor-pointer"
            >
              <X size={14} />
            </button>
          </span>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value === "monthly" ? "monthly" : "annual")}
            className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--color-forest)]"
          >
            <option value="annual">Annual — $499/yr</option>
            <option value="monthly">Monthly — $49/mo</option>
          </select>
          <button
            type="button"
            onClick={activate}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[var(--color-forest)] text-white rounded-lg hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer disabled:opacity-60"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
            Activate Verified
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {activated && (
        <p className="mt-2 text-xs text-[var(--color-forest)] font-medium">
          ✓ {activated} is now Verified.
        </p>
      )}
    </div>
  )
}
