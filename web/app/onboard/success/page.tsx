import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"

export const metadata: Metadata = {
  title: "Payment received — Club Fitting Directory",
  robots: { index: false, follow: false },
}

/**
 * Stripe Checkout success landing. Purely informational — activation happens
 * server-side via the webhook, so nothing here needs the session verified.
 */
export default function OnboardSuccessPage() {
  return (
    <section className="bg-[var(--color-ivory)] min-h-screen py-14">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden bg-white border border-[var(--color-border)] rounded-2xl shadow-card">
          <span aria-hidden="true" className="block h-1 w-full bg-[var(--color-forest)]" />
          <div className="p-8 text-center">
            <CheckCircle size={44} className="mx-auto text-[var(--color-forest)] mb-4" />
            <h1 className="font-display text-2xl sm:text-3xl text-[var(--color-charcoal)]">
              Payment received — welcome aboard
            </h1>
            <p className="mt-3 text-[var(--color-charcoal-light)] leading-relaxed">
              Your Featured placement goes live within a few minutes, and a welcome
              email with everything included is on its way to your inbox.
            </p>

            <div className="mt-6 pt-6 border-t border-[var(--color-border)] text-left">
              <p className="font-display text-lg text-[var(--color-charcoal)] text-center">
                What happens next
              </p>
              <ol className="mt-4 space-y-2.5 text-sm text-[var(--color-charcoal-light)] leading-relaxed list-decimal pl-5">
                <li>Your shop moves to the top of its state, city, and category pages with the gold Featured tag.</li>
                <li>
                  Anything to fix or add — hours, services, photos, booking link?{" "}
                  <Link href="/onboard/request-changes" className="text-[var(--color-forest)] font-semibold hover:underline">
                    Send us the changes
                  </Link>{" "}
                  and we&apos;ll apply them.
                </li>
                <li>
                  You join the Gear Shelf rotation in The Tuxedo Collective
                  newsletter — we&apos;ll email you when your slot runs.
                </li>
              </ol>
            </div>

            <Button href="/onboard/request-changes" variant="primary" size="lg" className="mt-8">
              Request listing updates
            </Button>
            <p className="mt-4 text-xs text-[var(--color-charcoal-light)]">
              Questions? Reply to any email from us — it reaches the founder directly.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
