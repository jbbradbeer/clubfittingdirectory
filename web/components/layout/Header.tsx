"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

/* ─────────────────────────────────────────────────────────
   HEADER
   Fixed top navigation bar with:
   • Left  : "Club Fitting Directory" logotype (Instrument Serif, black)
   • Center: nav links — Directory, Browse by State, Browse by Category
   • Mobile: hamburger → full-screen white slide-in drawer
   • Scroll: subtle shadow
   ───────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "Directory",            href: "/directory" },
  { label: "Browse by State",      href: "/states" },
  { label: "Browse by Category",   href: "/category/club-fitters" },
]

export function Header() {
  const [menuOpen, setMenuOpen]       = useState(false)
  const [scrolled,  setScrolled]      = useState(false)

  /* Detect scroll to apply shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* Prevent body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  return (
    <>
      <header
        className={[
          "fixed top-0 inset-x-0 z-50",
          "bg-white",
          "border-b border-[var(--color-gray-light)]",
          "transition-shadow duration-300",
          scrolled ? "shadow-sm" : "",
        ].join(" ")}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logotype ── */}
            <Link
              href="/"
              className="shrink-0 font-[family-name:var(--font-display)] text-lg font-normal text-[var(--color-black)] tracking-tight hover:text-[var(--color-green-deep)] transition-colors"
            >
              Club Fitting Directory
            </Link>

            {/* ── Desktop nav (hidden on mobile) ── */}
            <nav
              className="hidden md:flex items-center gap-8"
              aria-label="Primary navigation"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-[family-name:var(--font-body)] text-sm text-[var(--color-gray)] tracking-wide hover:text-[var(--color-green-deep)] transition-colors relative group"
                >
                  {link.label}
                  {/* Underline animation */}
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[var(--color-green-deep)] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* ── Mobile hamburger ── */}
            <button
              className="md:hidden p-2 rounded-md text-[var(--color-black)] hover:text-[var(--color-green-deep)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-green-deep)]"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <IconClose /> : <IconHamburger />}
            </button>

          </div>
        </div>
      </header>

      {/* ── Mobile full-screen drawer ── */}
      <div
        aria-hidden={!menuOpen}
        className={[
          "fixed inset-0 z-40 md:hidden",
          "bg-white",
          "flex flex-col",
          "transition-all duration-300 ease-in-out",
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        {/* Spacer for fixed header */}
        <div className="h-16 shrink-0 border-b border-[var(--color-gray-light)]" />

        <nav
          className="flex-1 flex flex-col items-center justify-center gap-8 px-6"
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-[family-name:var(--font-display)] text-3xl font-normal text-[var(--color-black)] hover:text-[var(--color-green-deep)] transition-colors tracking-wide"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Page-content offset so content isn't hidden under the fixed header */}
      <div className="h-16" aria-hidden="true" />
    </>
  )
}

/* ── Icon components ── */
function IconHamburger() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <line x1="2" y1="6"  x2="20" y2="6"  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="2" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="2" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18" y1="4" x2="4"  y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
