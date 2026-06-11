import Link from "next/link"

/**
 * One-line editorial plug for The Tuxedo Collective, shown at the end of each
 * fitter's detail content. Links to the /newsletter landing page rather than
 * embedding a second form on the page (the footer band already has one).
 */
export function TuxedoInlineLink() {
  return (
    <p className="border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-charcoal-light)]">
      Gear coverage you can trust: The Tuxedo Collective reviews what fitters
      actually build.{" "}
      <Link href="/newsletter" className="link-gold font-semibold whitespace-nowrap">
        Subscribe free &rarr;
      </Link>
    </p>
  )
}
