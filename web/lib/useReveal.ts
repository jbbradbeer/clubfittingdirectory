"use client"

import { useEffect } from "react"

/**
 * Scroll-reveal — replaces the blanket `.stagger-children` default with
 * deliberate, on-enter reveals. Any element marked `data-reveal` starts hidden
 * (see the `.reveal` rules in globals.css) and gets `data-reveal="in"` the first
 * time it scrolls into view, which plays the spring-eased fade-up.
 *
 * Children of a `[data-reveal-group]` cascade with a small per-index delay so a
 * row of cards arrives like a dealt hand rather than all at once.
 *
 * Reduced-motion is honored: those users get the content shown immediately with
 * no animation (handled in CSS via `prefers-reduced-motion`).
 *
 * Mount this ONCE near the top of a page (it scans the whole document). It is a
 * client component side-effect only — it renders nothing.
 */
export function useReveal() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal='in'])"),
    )
    if (els.length === 0) return

    // Stagger members of each reveal group by their position within the group.
    for (const el of els) {
      const group = el.closest<HTMLElement>("[data-reveal-group]")
      if (group) {
        const siblings = Array.from(group.querySelectorAll<HTMLElement>("[data-reveal]"))
        const i = siblings.indexOf(el)
        if (i > 0) el.style.setProperty("--reveal-delay", `${Math.min(i, 8) * 60}ms`)
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-reveal", "in")
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    )

    for (const el of els) io.observe(el)
    return () => io.disconnect()
  }, [])
}

/** Drop-in component form for server-component pages: `<Reveal />` near the top. */
export function Reveal() {
  useReveal()
  return null
}
