"use client"

import { usePathname } from "next/navigation"
import { NewsletterForm } from "@/components/newsletter/NewsletterForm"

/**
 * Newsletter band shown at the top of the footer on every page EXCEPT the
 * homepage. The homepage has its own prominent newsletter signup (the closing
 * section), so showing this band there too would duplicate it.
 */
export function FooterNewsletterBand() {
  const pathname = usePathname()
  if (pathname === "/") return null

  return (
    <div className="border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-gold)] mb-3">
            The Tuxedo Collective
          </p>
          <h3
            className="text-2xl md:text-[1.75rem] text-white leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Private club golf, explained — every week.
          </h3>
          <p className="mt-2.5 text-sm text-white/60 leading-relaxed max-w-md">
            Join our free newsletter for the fittings, gear, and stories behind the
            game&apos;s most exclusive clubs.
          </p>
        </div>
        <div className="w-full md:max-w-md md:justify-self-end">
          <NewsletterForm variant="footer" />
        </div>
      </div>
    </div>
  )
}
