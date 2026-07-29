"use client"

import { usePathname } from "next/navigation"
import { NewsletterForm } from "@/components/newsletter/NewsletterForm"

/**
 * Newsletter band shown at the top of the footer on every page EXCEPT pages
 * that already have their own prominent signup directly above the footer:
 * the homepage (closing section), /directory, and /map (capture blocks).
 * Showing the band there too would stack two identical forms.
 */
export function FooterNewsletterBand() {
  const pathname = usePathname()
  if (pathname === "/" || pathname === "/directory" || pathname === "/map") return null

  // Context-matched copy so the band doesn't read as the same boilerplate on
  // every page: listing pages get the "you found your fitter" angle, guides
  // get the "keep reading" angle, everything else keeps the brand line.
  const variant = pathname.startsWith("/listing/")
    ? {
        heading: "Found your fitter? The visit is the next skill.",
        body: "What to wear, what to ask, what the numbers mean — free, every week, from the team behind this directory.",
      }
    : pathname.startsWith("/guides")
      ? {
          heading: "The guides are the theory. This is the weekly practice.",
          body: "Fittings, gear, and stories from the game's most exclusive clubs — free, every week.",
        }
      : {
          heading: "Private club golf, explained — every week.",
          body: "Join our free newsletter for the fittings, gear, and stories behind the game's most exclusive clubs.",
        }

  return (
    <div className="border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-gold)] mb-3">
            The Tuxedo Collective
          </p>
          {/* Not a heading: footer chrome, not document structure — a stray H3
              here caused heading-level skips on pages with no body H2. */}
          <p className="font-display text-2xl md:text-[1.75rem] text-white! leading-tight">
            {variant.heading}
          </p>
          <p className="mt-2.5 text-sm text-white/60 leading-relaxed max-w-md">
            {variant.body}
          </p>
        </div>
        <div className="w-full md:max-w-md md:justify-self-end">
          <NewsletterForm variant="footer" />
        </div>
      </div>
    </div>
  )
}
