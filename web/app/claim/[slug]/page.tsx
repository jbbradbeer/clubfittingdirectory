import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPin, ShieldCheck } from "lucide-react"
import { getShopBySlug } from "@/lib/supabase/queries/shops"
import { ClaimShopForm } from "@/components/submit/ClaimShopForm"

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
              free: you get your details corrected, photos added, and the fitting requests
              golfers submit through the page forwarded to you.
            </p>
            <ClaimShopForm shopSlug={shop.slug} shopName={shop.name} source={src === "outreach" ? "outreach" : "listing_page"} />
          </>
        )}
      </div>
    </section>
  )
}
