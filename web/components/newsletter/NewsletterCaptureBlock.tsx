import { NewsletterForm } from "./NewsletterForm"

/**
 * Inline newsletter capture for high-intent pages — shown after the directory
 * search results, right before the footer. Visitors here are about to book a
 * $300+ fitting; this converts them into Tuxedo Collective subscribers.
 *
 * The FooterNewsletterBand is suppressed on /directory so this block and the
 * footer band never stack on the same screen.
 */
export function NewsletterCaptureBlock() {
  return (
    <section aria-label="Newsletter signup" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
      <div className="relative grain overflow-hidden bg-[var(--color-forest)] rounded-2xl p-8 md:p-10 grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <p className="section-label mb-3 text-[var(--color-gold)]!">
            The Tuxedo Collective
          </p>
          <h2 className="font-display text-2xl md:text-[1.75rem] text-white! leading-tight">
            You found your fitter. Now learn what to wear to the fitting.
          </h2>
          <p className="mt-3 text-sm text-white/70 leading-relaxed max-w-md">
            The Tuxedo Collective is the weekly newsletter for private club
            golfers: the culture, the gear, the unwritten rules. 6,500 members
            read it. Free.
          </p>
        </div>
        <div className="w-full md:max-w-md md:justify-self-end">
          <NewsletterForm variant="section" buttonLabel="Join" />
        </div>
      </div>
    </section>
  )
}
