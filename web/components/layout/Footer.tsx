"use client"

import Link from "next/link"

/* ─────────────────────────────────────────────────────────
   FOOTER
   Dark green background with a thin brass top border.
   3-column layout:
     Col 1 — Directory branding + one-line description
     Col 2 — Quick links
     Col 3 — Newsletter CTA (email input stub)
   Bottom bar — copyright + "A Tuxedo Collective Publication"
   ───────────────────────────────────────────────────────── */

const QUICK_LINKS = [
  { label: "Directory",     href: "/shops" },
  { label: "Browse States", href: "/states" },
  { label: "Categories",    href: "/categories" },
  { label: "About",         href: "/about" },
]

const NEWSLETTER_URL = "https://thetuxedocollective.com"
const CURRENT_YEAR   = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="bg-[var(--color-green-deep)] border-t border-[var(--color-brass)]">

      {/* ── Main 3-column grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">

          {/* ── Column 1: Branding ── */}
          <div className="space-y-4">
            <Link
              href="/"
              className="block font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-brass)] hover:text-[var(--color-brass-light)] transition-colors tracking-tight"
            >
              Club Fitting Directory
            </Link>
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)] leading-relaxed">
              The most complete directory of independent golf club fitting
              shops across the United States. Curated for the serious golfer.
            </p>
            <a
              href={NEWSLETTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-[family-name:var(--font-body)] text-[var(--color-ivory-warm)] hover:text-[var(--color-brass)] transition-colors tracking-wide uppercase"
            >
              A Tuxedo Collective Publication
              <span className="text-[var(--color-brass)]" aria-hidden="true">↗</span>
            </a>
          </div>

          {/* ── Column 2: Quick links ── */}
          <div className="space-y-4">
            <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-ivory)] uppercase tracking-widest">
              Quick Links
            </h3>
            <ul className="space-y-2.5" role="list">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)] hover:text-[var(--color-brass)] transition-colors relative group inline-block"
                  >
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[var(--color-brass)] transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Newsletter CTA stub ── */}
          <div className="space-y-4">
            <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-ivory)] uppercase tracking-widest">
              Get The Tuxedo Collective
            </h3>
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)] leading-relaxed">
              Premium golf writing on private club culture, fitting, equipment,
              and the game&apos;s finer details. Read by members and competitors.
            </p>

            <a
              href={NEWSLETTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={[
                "inline-flex items-center justify-center gap-2",
                "w-full px-5 py-2.5",
                "bg-[var(--color-brass)] text-[var(--color-charcoal)]",
                "font-[family-name:var(--font-body)] text-sm font-semibold",
                "rounded-sm",
                "hover:bg-[var(--color-brass-light)] transition-colors",
              ].join(" ")}
            >
              Read The Tuxedo Collective ↗
            </a>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-[color-mix(in_srgb,var(--color-brass)_20%,transparent)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[color-mix(in_srgb,var(--color-ivory-warm)_60%,transparent)] font-[family-name:var(--font-body)]">
            © {CURRENT_YEAR} Club Fitting Directory. All rights reserved.
          </p>
          <p className="text-xs text-[color-mix(in_srgb,var(--color-ivory-warm)_60%,transparent)] font-[family-name:var(--font-body)]">
            A{" "}
            <a
              href={NEWSLETTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-brass)] hover:text-[var(--color-brass-light)] transition-colors"
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
