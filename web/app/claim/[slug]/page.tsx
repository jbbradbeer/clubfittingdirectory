import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BadgeCheck, MapPin, ShieldCheck } from "lucide-react"
import { getShopBySlug } from "@/lib/supabase/queries/shops"
import { ClaimShopForm } from "@/components/submit/ClaimShopForm"
import { VERIFIED_PERKS } from "@/lib/plans"

export const metadata: Metadata = {
  title: "Claim your listing — Club Fitting Directory",
  robots: { index: false, follow: false },
}

/**
 * The claim landing page — where outreach emails ({{claim_url}}) and the
 * "Own this shop?" link on listings send shop owners. Free, always.
 */
export default async function ClaimPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ src?: string }>
}) {
  const { slug } = await params
  const { src } = await searchParams
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  const alreadyClaimed = Boolean((shop as { claimed_at?: string | null }).claimed_at)

  return (
    <section className="bg-[var(--color-ivory)] min-h-screen py-14">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <p className="section-label mb-3">Claim your listing</p>
        <h1 className="font-display text-3xl sm:text-4xl text-[var(--color-charcoal)]">
          {shop.name}
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-[var(--color-charcoal-light)]">
          <MapPin size={16} className="text-[var(--color-gold)]" />
          {shop.city}, {shop.state_code}
          <Link href={`/listing/${shop.slug}`} className="ml-2 text-sm text-[var(--color-forest)] hover:underline">
            View the listing →
          </Link>
        </p>

        {alreadyClaimed ? (
          <div className="mt-8 bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-8 text-center">
            <ShieldCheck size={44} className="mx-auto text-[var(--color-forest)] mb-4" />
            <h2 className="font-display text-2xl text-[var(--color-charcoal)]">
              This listing is already owner-managed
            </h2>
            <p className="mt-3 text-[var(--color-charcoal-light)] leading-relaxed">
              If that&apos;s you and something needs changing, reply to any email from us or
              use the contact details on your listing page. If you believe this claim is
              in error, let us know the same way.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-4 mb-8 text-[var(--color-charcoal-light)] leading-relaxed">
              This listing is live in front of golfers searching for fitters. Claiming it is
              free — and always will be: your details corrected, photos added, and every
              fitting request golfers submit through the page forwarded straight to your
              inbox.
            </p>
            <ClaimShopForm shopSlug={shop.slug} shopName={shop.name} source={src === "outreach" ? "outreach" : "listing_page"} />

            {/* ── The paid offer — shown below the free claim so the free/paid
                line stays clean: claiming = free forever, Verified = growth. ── */}
            <div className="mt-10 relative overflow-hidden bg-[var(--color-forest)] text-white rounded-2xl shadow-card">
              <span aria-hidden="true" className="block h-1 w-full bg-[var(--color-gold)]" />
              <div className="p-6 sm:p-8">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)] font-semibold">
                  When you&apos;re ready to grow
                </p>
                <h2 className="mt-2 font-display text-2xl">
                  Verified — make {shop.name} the shop golfers pick
                </h2>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">
                  Claiming gets you the leads. Verified makes sure more golfers land on
                  your listing in the first place:
                </p>
                <ul className="mt-5 space-y-3">
                  {VERIFIED_PERKS.map((perk) => (
                    <li key={perk.title} className="flex gap-2.5 text-sm leading-relaxed">
                      <BadgeCheck size={18} className="text-[var(--color-gold)] shrink-0 mt-0.5" />
                      <span>
                        <span className="font-semibold">{perk.title}.</span>{" "}
                        <span className="text-white/80">{perk.body}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-white/70">
                  <span className="font-display text-xl text-white">$49</span>/month or{" "}
                  <span className="font-display text-xl text-white">$499</span>/year (two
                  months free) · secured by Stripe · cancel anytime.{" "}
                  <Link href="/for-shops" className="font-semibold text-[var(--color-gold)] hover:underline">
                    Full details →
                  </Link>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
