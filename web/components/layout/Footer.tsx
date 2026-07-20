import Link from "next/link"
import { SITE_NAME } from "@/lib/constants"
import { FooterNewsletterBand } from "@/components/layout/FooterNewsletterBand"

const QUICK_LINKS = [
  { label: "Find a Fitter", href: "/directory" },
  { label: "Browse by State", href: "/states" },
  { label: "Club Fitters", href: "/category/club-fitters" },
  { label: "Golf Retailers", href: "/category/golf-retailers" },
  { label: "Club Repair", href: "/repair" },
  { label: "Fitting Guides", href: "/guides" },
  { label: "Club Length Calculator", href: "/tools/golf-club-length-calculator" },
  { label: "Distance Calculator", href: "/tools/golf-club-distance-calculator" },
  { label: "Shaft Flex Calculator", href: "/tools/golf-shaft-flex-calculator" },
  { label: "Grip Size Calculator", href: "/tools/golf-grip-size-calculator" },
  { label: "Submit a Shop", href: "/submit" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

const POPULAR_STATES = [
  { label: "Texas", href: "/state/tx" },
  { label: "Florida", href: "/state/fl" },
  { label: "California", href: "/state/ca" },
  { label: "New York", href: "/state/ny" },
  { label: "Georgia", href: "/state/ga" },
  { label: "Pennsylvania", href: "/state/pa" },
]

export function Footer() {
  return (
    <footer className="relative grain bg-[var(--color-forest-deep)] text-white/80">
      {/* Gold accent line */}
      <div className="h-px bg-[var(--color-gold)]" />

      {/* Newsletter signup band — hidden on the homepage (it has its own) */}
      <FooterNewsletterBand />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {/* Column 1: Branding */}
          <div>
            <h3 className="font-display text-2xl text-white! mb-4 tracking-[-0.01em]">
              {SITE_NAME}
            </h3>
            <p className="text-sm leading-relaxed text-white/60 mb-6">
              Independent golf club fitters, retailers, and studios across all 50
              states — every listing reviewed by hand, and culled when it goes stale.
            </p>
            <a
              href="https://thetuxedocollective.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[var(--color-gold)] text-sm font-semibold hover:text-[var(--color-gold-dark)] transition-colors"
            >
              A Tuxedo Collective Publication
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          {/* Link columns — side by side on mobile, flattened into the 3-col
              grid on md+ so they don't stack into a tall empty band on phones. */}
          <div className="grid grid-cols-2 gap-8 md:contents">
            {/* Quick Links */}
            <div>
              {/* `!` needed: the global h1–h6 charcoal rule is unlayered and
                  otherwise beats this utility (see CSS layer gotcha) */}
              <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-gold)]! mb-5">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular States */}
            <div>
              {/* `!` needed: the global h1–h6 charcoal rule is unlayered and
                  otherwise beats this utility (see CSS layer gotcha) */}
              <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-gold)]! mb-5">
                Popular States
              </h4>
              <ul className="space-y-3">
                {POPULAR_STATES.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-white/40">
            Independent fitters. Honest listings.
          </p>
        </div>
      </div>
    </footer>
  )
}
