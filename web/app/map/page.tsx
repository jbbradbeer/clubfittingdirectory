import type { Metadata } from "next"
import Link from "next/link"
import { getMapShops, getAllStatesWithShops } from "@/lib/supabase/queries/shops"
import { MapExplorer } from "@/components/map/MapExplorer"
import { PageHeader } from "@/components/layout/PageHeader"
import { JsonLd } from "@/components/seo/JsonLd"
import { NewsletterCaptureBlock } from "@/components/newsletter/NewsletterCaptureBlock"
import { SITE_NAME, SITE_URL } from "@/lib/constants"
import { logQueryError } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Interactive Map of Every Golf Club Fitting Shop in America",
  description:
    "Explore an interactive map of golf club fitting shops and retailers across all 50 US states — from a directory of 1,000+ listings. Zoom to your area, filter for club fitting, and find verified fitters near you.",
  alternates: { canonical: `${SITE_URL}/map` },
}

export const revalidate = 2592000 // 30 days — matches other index pages; on-demand revalidation handles edits

const FAQ = [
  {
    q: "How many shops are on this map?",
    a: "Every active listing in the directory with verified map coordinates — hundreds of pins, drawn from a directory of more than 1,000 club fitting shops, retailers, and repair specialists across all 50 states. New pins appear as coordinates are verified.",
  },
  {
    q: "What do the gold pins mean?",
    a: "Gold pins are shops that have claimed and verified their listing, or are featured partners. Green pins are standard listings.",
  },
  {
    q: "How do I find shops near me?",
    a: "Click the “Near me” button in the top-right corner of the map and allow location access — the map will fly to your area. You can also just zoom into your city.",
  },
  {
    q: "How is this data collected?",
    a: "Listings are gathered from public sources, then enriched and reviewed before going live. Shop owners can claim their listing to keep hours, services, and contact details current.",
  },
]

export default async function MapPage() {
  const [shops, states] = await Promise.all([
    getMapShops().catch((e) => logQueryError("map getMapShops", e, [])),
    getAllStatesWithShops().catch((e) => logQueryError("map getAllStatesWithShops", e, [])),
  ])

  const fitters = shops.filter((s) => s.offers_fitting).length
  // DC is in the state grid but isn't a state — exclude it from the stat,
  // same convention as the homepage. Fall back to 50 if the query failed.
  const stateCount = states.filter((s) => s.state_code !== "DC").length || 50
  // If the shops query failed it falls back to [] — render a friendly notice
  // instead of an empty map, and skip the Dataset JSON-LD (don't claim "0 shops").
  const mapReady = shops.length > 0

  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "US Golf Club Fitting Shop Map",
    description: `Interactive map and dataset of ${shops.length} golf club fitting shops and retailers across the United States, maintained by ${SITE_NAME}.`,
    url: `${SITE_URL}/map`,
    creator: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    spatialCoverage: "United States",
    license: `${SITE_URL}/about`,
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }

  return (
    <>
      {mapReady && <JsonLd data={datasetJsonLd} />}
      <JsonLd data={faqJsonLd} />

      <PageHeader
        align="center"
        eyebrow="The Club Fitting Directory"
        title="Every Club Fitting Shop in America, on One Map"
        subtitle={
          mapReady
            ? `${shops.length.toLocaleString()} shops across all 50 states. Zoom in, tap a pin, and find your fitter.`
            : "Zoom in, tap a pin, and find your fitter."
        }
      />

      <section className="bg-[var(--color-ivory)] py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {mapReady ? (
            <MapExplorer shops={shops} />
          ) : (
            <div className="flex h-[40vh] items-center justify-center border border-[var(--color-border)] rounded-lg bg-white text-center px-6">
              <p className="text-sm text-[var(--color-charcoal-light)]">
                The map is temporarily unavailable. Please refresh in a moment, or{" "}
                <Link href="/directory" className="underline text-[var(--color-forest)]">
                  browse the full directory
                </Link>{" "}
                instead.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-[var(--color-forest)] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-3 gap-6 text-center">
          {[
            { value: shops.length.toLocaleString(), label: "Shops mapped" },
            { value: stateCount.toString(), label: "States covered" },
            { value: fitters.toLocaleString(), label: "Offer club fitting" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl md:text-4xl text-white!">{s.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/60">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* State grid */}
      <section className="bg-[var(--color-ivory)] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-label mb-3">Browse by state</p>
          <h2 className="font-display text-2xl md:text-3xl mb-8">
            Prefer a list? Every state has its own page.
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {states.map((s) => (
              <Link
                key={s.state_code}
                href={`/state/${s.state_code.toLowerCase()}`}
                className="flex items-center justify-between p-3.5 bg-white border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-forest)] hover:text-white hover:border-[var(--color-forest)] transition-all duration-300 group"
              >
                <span className="text-sm font-semibold">{s.state}</span>
                <span className="data text-xs font-semibold text-[var(--color-gold-ink)] group-hover:text-white/80">
                  {s.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology + FAQ */}
      <section className="bg-white py-14 border-t border-[var(--color-border)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-label mb-3">About this map</p>
          <h2 className="font-display text-2xl md:text-3xl mb-4">How the map is built</h2>
          <p className="text-sm leading-relaxed text-[var(--color-charcoal-light)] mb-10">
            Every pin is an active listing in the {SITE_NAME} — gathered from public
            sources, enriched with services, ratings, and contact details, and reviewed
            before publishing. Shops that claim their listing get a verified gold pin.
            The map refreshes as listings are added, corrected, or retired, so it stays
            an accurate picture of where custom club fitting actually happens in America.
          </p>

          <h2 className="font-display text-2xl md:text-3xl mb-6">Common questions</h2>
          <div className="space-y-6">
            {FAQ.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold text-[var(--color-charcoal)] mb-1.5">{f.q}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-charcoal-light)]">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-white pt-2">
        <NewsletterCaptureBlock />
      </div>
    </>
  )
}
