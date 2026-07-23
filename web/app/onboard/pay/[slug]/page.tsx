import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BadgeCheck, MapPin, ShieldCheck } from "lucide-react"
import { getShopBySlug } from "@/lib/supabase/queries/shops"
import { daysUntil } from "@/lib/verified-math"
import { PayButton } from "@/components/submit/PayButton"
import { Button } from "@/components/ui/Button"

export const metadata: Metadata = {
  title: "Activate Founding Verified — Club Fitting Directory",
  robots: { index: false, follow: false },
}

// The claimed/verified state must always be fresh — never serve a cached
// "pay now" page to a shop that just paid.
export const dynamic = "force-dynamic"

/* Renewals open this many days before expiry (mirrors /api/checkout). */
const EARLY_RENEW_WINDOW_DAYS = 60

const INCLUDED = [
  "Verified badge on your listing — the only paid marker on the directory",
  "Fitting requests from golfers forwarded straight to your inbox",
  "Gear Shelf rotation in The Tuxedo Collective newsletter (6,600 subscribers)",
  "Priority listing corrections — hours, services, photos, booking link",
]

/**
 * The payment page owners land on from the "Send payment link" email.
 * Gated on claimed_at: claiming (free) + founder approval come first, so by
 * the time someone can pay, we know they're the real owner.
 */
export default async function PayPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  const claimed = Boolean(shop.claimed_at)
  const expiresAt = shop.verified_expires_at ? new Date(shop.verified_expires_at) : null
  const daysLeft = shop.verified_expires_at ? daysUntil(shop.verified_expires_at) : null
  const verifiedWithRunway =
    shop.listing_tier === "verified" && daysLeft !== null && daysLeft > EARLY_RENEW_WINDOW_DAYS
  const renewal = shop.listing_tier === "verified" || Boolean(shop.verified_at)

  return (
    <section className="bg-[var(--color-ivory)] min-h-screen py-14">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <p className="section-label mb-3">Founding Verified</p>
        <h1 className="font-display text-3xl sm:text-4xl text-[var(--color-charcoal)]">
          {shop.name}
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-[var(--color-charcoal-light)]">
          <MapPin size={16} className="text-[var(--color-gold)]" />
          {shop.city}, {shop.state_code}
          <Link
            href={`/listing/${shop.slug}`}
            className="ml-2 text-sm text-[var(--color-forest)] hover:underline"
          >
            View the listing →
          </Link>
        </p>

        {!claimed ? (
          /* Pay-after-verify gate: no approved claim yet */
          <div className="mt-8 bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-8 text-center">
            <ShieldCheck size={44} className="mx-auto text-[var(--color-forest)] mb-4" />
            <h2 className="font-display text-2xl text-[var(--color-charcoal)]">
              One step first: claim this listing
            </h2>
            <p className="mt-3 text-[var(--color-charcoal-light)] leading-relaxed">
              We verify every owner before payment — claim the listing (free, two
              minutes) and we&apos;ll approve it, usually within a day.
            </p>
            <Button href={`/claim/${shop.slug}`} variant="primary" size="lg" className="mt-6">
              Claim {shop.name} — free
            </Button>
          </div>
        ) : verifiedWithRunway ? (
          /* Already paid with plenty of runway */
          <div className="mt-8 bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-8 text-center">
            <BadgeCheck size={44} className="mx-auto text-[var(--color-forest)] mb-4" />
            <h2 className="font-display text-2xl text-[var(--color-charcoal)]">
              You&apos;re already Verified
            </h2>
            <p className="mt-3 text-[var(--color-charcoal-light)] leading-relaxed">
              {shop.name} is Verified
              {expiresAt ? ` through ${expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}.
              Renewal opens 60 days before expiry — we&apos;ll email you. Nothing to
              do today.
            </p>
          </div>
        ) : (
          /* Ready to pay (first activation, renewal window, or lapsed) */
          <div className="mt-8 relative overflow-hidden bg-white border border-[var(--color-border)] rounded-2xl shadow-card">
            <span aria-hidden="true" className="block h-1 w-full bg-[var(--color-forest)]" />
            <div className="p-6 sm:p-8">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-2xl text-[var(--color-charcoal)]">
                  {renewal ? "Renew Founding Verified" : "Founding Verified"}
                </h2>
                <p className="shrink-0">
                  <span className="font-display text-3xl text-[var(--color-charcoal)]">$349</span>
                  <span className="text-sm text-[var(--color-charcoal-light)]">/year</span>
                </p>
              </div>
              <p className="mt-1 text-sm text-[var(--color-charcoal-light)]">
                Founding partner rate — grandfathered for as long as you stay.
              </p>

              <ul className="mt-6 space-y-3">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-[var(--color-charcoal)] leading-relaxed">
                    <BadgeCheck size={18} className="text-[var(--color-forest)] shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <PayButton shopSlug={shop.slug} renewal={renewal} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
