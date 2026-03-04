"use client"

import Link from "next/link"

/* ─────────────────────────────────────────────────────────
   FOOTER
   Black background, white text, green accents.
   3-column layout:
     Col 1 — Branding + description
     Col 2 — Quick links
     Col 3 — Newsletter signup
   Bottom bar — copyright + Tuxedo Collective attribution
   ───────────────────────────────────────────────────────── */

const QUICK_LINKS = [
  { label: "Directory",     href: "/directory" },
  { label: "Browse States", href: "/states" },
  { label: "Club Fitters",  href: "/category/club-fitters" },
  { label: "Retailers",     href: "/category/golf-retailers" },
]

const TUXEDO_URL   = "https://thetuxedocollective.com"
const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="bg-[var(--color-black)] border-t border-[#222]">

      {/* ── Main grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">

          {/* ── Column 1: Branding ── */}
          <div className="space-y-4">
            <Link
              href="/"
              className="block font-[family-name:var(--font-display)] text-xl font-normal text-white hover:text-[var(--color-green-deep)] transition-colors tracking-tight"
            >
              Club Fitting Directory
            </Link>
            <p className="font-[family-name:var(--font-body)] text-sm text-gray-400 leading-relaxed">
              The most complete directory of independent golf club fitting
              shops across the United States. Curated for the serious golfer.
            </p>
            <a
              href={TUXEDO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-[family-name:var(--font-body)] text-gray-400 hover:text-white transition-colors tracking-wide uppercase"
            >
              A Tuxedo Collective Publication
              <span className="text-[var(--color-green-deep)]" aria-hidden="true">↗</span>
            </a>
          </div>

          {/* ── Column 2: Quick links ── */}
          <div className="space-y-4">
            <h3 className="font-[family-name:var(--font-body)] text-xs font-semibold text-white uppercase tracking-widest">
              Quick Links
            </h3>
            <ul className="space-y-2.5" role="list">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-[family-name:var(--font-body)] text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: About the directory ── */}
          <div className="space-y-4">
            <h3 className="font-[family-name:var(--font-body)] text-xs font-semibold text-white uppercase tracking-widest">
              About the Directory
            </h3>
            <p className="font-[family-name:var(--font-body)] text-sm text-gray-400 leading-relaxed">
              New fitters and retailers added regularly. Built for golfers who take equipment seriously.
            </p>
            <a
              href={TUXEDO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-[family-name:var(--font-body)] text-[var(--color-green-deep)] hover:text-white transition-colors"
            >
              Visit The Tuxedo Collective
              <span aria-hidden="true">↗</span>
            </a>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500 font-[family-name:var(--font-body)]">
            © {CURRENT_YEAR} Club Fitting Directory. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 font-[family-name:var(--font-body)]">
            A{" "}
            <a
              href={TUXEDO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-green-deep)] hover:text-white transition-colors"
            >
              Tuxedo Collective
            </a>{" "}
            Publication
          </p>
        </div>
      </div>

    </footer>
  )
}
