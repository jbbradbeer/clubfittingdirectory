"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Search, Menu, X } from "lucide-react"
import { SITE_NAME } from "@/lib/constants"

const NAV_ITEMS = [
  { label: "Find a Fitter", href: "/directory" },
  { label: "Browse by State", href: "/states" },
  { label: "Submit a Shop", href: "/submit" },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
        scrolled ? "shadow-sm border-b border-[var(--color-forest)]" : "border-b border-[var(--color-cream-dark)]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex flex-col group leading-none">
            <span
              className="text-[1.5rem] font-extrabold tracking-[-0.03em] text-[var(--color-forest)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {SITE_NAME}
            </span>
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-gold-ink)] mt-0.5">
              Find Your Fit
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-9">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-charcoal)] hover:text-[var(--color-forest)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/directory"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--color-forest)] text-[var(--color-paper)]! text-xs font-semibold uppercase tracking-[0.12em] rounded-full hover:bg-[var(--color-forest-dark)] transition-colors"
            >
              <Search size={14} />
              Search
            </Link>
          </nav>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 text-[var(--color-charcoal)]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[var(--color-cream-dark)] animate-fade-in-up">
          <nav className="flex flex-col px-6 py-6 gap-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-charcoal)] hover:text-[var(--color-forest)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/directory"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 mt-2 bg-[var(--color-forest)] text-[var(--color-paper)]! text-xs font-semibold uppercase tracking-[0.12em] rounded-full hover:bg-[var(--color-forest-dark)] transition-colors"
            >
              <Search size={15} />
              Search Directory
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
