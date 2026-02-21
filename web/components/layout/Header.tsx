"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"

/* ─────────────────────────────────────────────────────────
   HEADER
   Fixed top navigation bar with:
   • Left  : "Club Fitting Directory" logotype (Playfair, brass)
   • Center: nav links — Directory, Browse by State, Browse by Category
   • Right : "The Tuxedo Collective ↗" + brass Subscribe button
   • Mobile: hamburger → full-screen dark green slide-in drawer
   • Scroll: subtle backdrop-blur + deeper shadow
   ───────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "Directory",            href: "/shops" },
  { label: "Browse by State",      href: "/states" },
  { label: "Browse by Category",   href: "/categories" },
]

const NEWSLETTER_URL = "https://thetuxedocollective.com"

export function Header() {
  const [menuOpen, setMenuOpen]       = useState(false)
  const [scrolled,  setScrolled]      = useState(false)

  /* Detect scroll to apply blur + shadow */
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
          "bg-[var(--color-green-deep)]",
          "border-b border-[var(--color-brass)]",
          "transition-shadow duration-300",
          scrolled
            ? "shadow-[0_2px_24px_color-mix(in_srgb,#000_50%,transparent)] backdrop-blur-sm"
            : "",
        ].join(" ")}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logotype ── */}
            <Link
              href="/"
              className="shrink-0 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-brass)] tracking-tight hover:text-[var(--color-brass-light)] transition-colors"
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
                  className="font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)] tracking-wide hover:text-[var(--color-ivory)] transition-colors relative group"
                >
                  {link.label}
                  {/* Underline animation */}
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[var(--color-brass)] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* ── Right side: newsletter link + subscribe ── */}
            <div className="hidden md:flex items-center gap-4">
              <a
                href={NEWSLETTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)] hover:text-[var(--color-ivory)] transition-colors tracking-wide"
              >
                The Tuxedo Collective{" "}
                <span aria-hidden="true" className="text-[var(--color-brass)]">
                  ↗
                </span>
              </a>
              <Button variant="primary" size="sm" asChild>
                <a
                  href={NEWSLETTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Subscribe
                </a>
              </Button>
            </div>

            {/* ── Mobile hamburger ── */}
            <button
              className="md:hidden p-2 rounded-sm text-[var(--color-ivory)] hover:text-[var(--color-brass)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-brass)]"
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
          "bg-[var(--color-green-deep)]",
          "flex flex-col",
          "transition-all duration-300 ease-in-out",
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        {/* Spacer for fixed header */}
        <div className="h-16 shrink-0 border-b border-[var(--color-brass)]" />

        <nav
          className="flex-1 flex flex-col items-center justify-center gap-8 px-6"
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ivory)] hover:text-[var(--color-brass)] transition-colors tracking-wide"
            >
              {link.label}
            </Link>
          ))}

          {/* Brass divider */}
          <span className="brass-rule w-32 my-2" aria-hidden="true" />

          <a
            href={NEWSLETTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-[family-name:var(--font-body)] text-lg text-[var(--color-ivory-warm)] hover:text-[var(--color-brass-light)] transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            The Tuxedo Collective ↗
          </a>

          <Button
            variant="primary"
            size="lg"
            onClick={() => setMenuOpen(false)}
          >
            <a
              href={NEWSLETTER_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Subscribe to the Newsletter
            </a>
          </Button>
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
