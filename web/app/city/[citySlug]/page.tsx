import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  getShopsForCityPage,
  getAllCitySlugs,
  getCityLinksForState,
  getNearbyShopsByDistance,
} from "@/lib/supabase/queries/shops"
import { ChipLink } from "@/components/ui/ChipLink"
import { PageHeader } from "@/components/layout/PageHeader"
import { IndexHead } from "@/components/ui/IndexHead"
import { ListingGrid } from "@/components/directory/ListingGrid"
import { LedgerList } from "@/components/directory/LedgerList"
import { Button } from "@/components/ui/Button"
import { SITE_URL } from "@/lib/constants"
import { buildCityBreadcrumbSchema, buildItemListSchema } from "@/lib/structured-data"
import { JsonLd } from "@/components/seo/JsonLd"
import { FaqSection } from "@/components/seo/FaqSection"
import { RelatedGuides } from "@/components/seo/RelatedGuides"
import { cityIntro, cityFaqs, expandCityName, DIRECTORY_YEAR, LAST_UPDATED_LABEL } from "@/lib/seo-content"
import { TopFittersTable } from "@/components/seo/TopFittersTable"
import { logQueryError, rethrowQueryError } from "@/lib/utils"
import { shopTypeCountPhrase } from "@/lib/shop-types"
import type { Shop } from "@/types/shop"

interface PageProps {
  params: Promise<{ citySlug: string }>
}

export const revalidate = 2592000 // 30 days — long window keeps ISR writes low; edits propagate via on-demand revalidation (app/api/revalidate)

/* Nearest fitters in neighboring towns, anchored on the city's own first shop.
   Returns [] when that shop has no coordinates (≈31% of listings) — the caller
   then keeps a thin one-shop page noindexed. cache()'d underneath, so calling it
   in both generateMetadata and the body costs one query per request. */
async function nearbyForCity(
  citySlug: string,
  shops: Shop[],
): Promise<(Shop & { distanceMi: number })[]> {
  const anchor = shops[0]
  if (!anchor || anchor.latitude == null || anchor.longitude == null) return []
  return getNearbyShopsByDistance(anchor.latitude, anchor.longitude, citySlug).catch((e) =>
    logQueryError("city getNearbyShopsByDistance", e, []),
  )
}

export async function generateStaticParams() {
  const slugs = await getAllCitySlugs().catch((e) => logQueryError("city generateStaticParams getAllCitySlugs", e, []))
  return slugs
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug } = await params
  const result = await getShopsForCityPage(citySlug).catch((e) => logQueryError("city generateMetadata getShopsForCityPage", e, undefined))
  // notFound() in generateMetadata is what sets a real 404 status — by the time
  // the page body runs, streaming has already sent a 200. A thrown query error
  // keeps the soft fallback so a DB blip can't cache a live page as a 404.
  if (result === null) notFound()
  if (!result) return { title: "City Not Found" }

  const { state, shops } = result
  const city = expandCityName(result.city)
  // A thin one-shop page only earns indexing if the "Other fitters near {city}"
  // module can lift it to a real comparison (≥3 total fitters). Fetch nearby
  // only when we'd need it — multi-shop cities are already indexable.
  const nearby = shops.length < 2 ? await nearbyForCity(citySlug, shops) : []
  const totalFitters = shops.length + nearby.length
  // "Top …" framing only when there's a real field to rank; a one-shop town
  // gets an honest year-stamped title instead.
  const title =
    shops.length >= 3
      ? { absolute: `Top Golf Club Fitters in ${city}, ${state} for ${DIRECTORY_YEAR}` }
      : `Golf Club Fitting in ${city}, ${state} (${DIRECTORY_YEAR})`
  return {
    title,
    description: `Compare ${shops.length} golf club ${shops.length === 1 ? "fitter" : "fitters"} in ${city}, ${state} — ratings, fitting prices, and launch monitor tech. Updated ${LAST_UPDATED_LABEL}.`,
    alternates: { canonical: `${SITE_URL}/city/${citySlug}` },
    // A lone-shop city page is thin and dilutes site quality in Google's eyes,
    // so we keep it noindexed — UNLESS the nearby-fitters module makes it a
    // genuine comparison page (≥3 total fitters shown). Multi-shop cities stay
    // indexable as before. `follow` always keeps link equity flowing, and the
    // single shop still ranks via its own listing page regardless.
    ...(shops.length >= 2 || totalFitters >= 3
      ? {}
      : { robots: { index: false, follow: true } }),
  }
}

export default async function CityPage({ params }: PageProps) {
  const { citySlug } = await params
  const result = await getShopsForCityPage(citySlug).catch(rethrowQueryError("city getShopsForCityPage"))

  if (!result) notFound()

  const { shops, state, stateCode } = result
  const city = expandCityName(result.city)

  // Closest fitters in neighboring towns — real, unique, internally-linked
  // content that turns a sparse city page into a useful comparison (and is what
  // lets a one-shop page shed its noindex; see generateMetadata above).
  const nearby = await nearbyForCity(citySlug, shops)

  const siblingCities = (
    await getCityLinksForState(stateCode).catch((e) =>
      logQueryError("city getCityLinksForState", e, []),
    )
  ).filter((c) => c.slug !== citySlug)

  /* Shop type breakdown */
  const typeMap: Record<string, number> = {}
  for (const shop of shops) {
    const t = shop.shop_type ?? "Other"
    typeMap[t] = (typeMap[t] ?? 0) + 1
  }

  /* Classification tally — renders only once the data exists */
  const independentCount = shops.filter((s) => s.ownership_type === "independent").length

  const breadcrumbSchema = buildCityBreadcrumbSchema(city, state, stateCode, citySlug)
  const itemListSchema = buildItemListSchema(
    shops,
    shops.length >= 3
      ? `Top Golf Club Fitters in ${city}, ${stateCode} (${DIRECTORY_YEAR})`
      : `Golf Club Fitters in ${city}, ${stateCode}`,
  )

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />

      {/* Hero */}
      <PageHeader
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: state, href: `/state/${stateCode.toLowerCase()}` },
          { label: city },
        ]}
        eyebrow={`Club Fitting Directory · Updated ${LAST_UPDATED_LABEL}`}
        title={
          shops.length >= 3
            ? `Top Golf Club Fitters in ${city}, ${stateCode} (${DIRECTORY_YEAR})`
            : `Golf Club Fitters in ${city}, ${stateCode}`
        }
        subtitle={`${shops.length} ${shops.length === 1 ? "listing" : "listings"} — ${Object.entries(
          typeMap,
        )
          .map(([type, count]) => shopTypeCountPhrase(type, count))
          .join(", ")}.${
          independentCount > 0
            ? ` ${independentCount === shops.length ? "All" : independentCount} independently owned.`
            : ""
        }`}
      />

      {/* Intro copy */}
      <section className="bg-[var(--color-ivory)] pt-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-[var(--color-charcoal-light)] leading-relaxed">
            {cityIntro(city, state, shops)}
          </p>
          {/* Deep link into the flagship data report — routes authority to the
              page we pitch for citations, and gives readers national context.
              Multi-shop pages only: one-shop city pages are noindexed and kept
              deliberately lean. */}
          {shops.length >= 2 && (
            <p className="mt-3 text-sm text-[var(--color-charcoal-light)]">
              For national pricing and technology benchmarks, see our{" "}
              <Link
                href="/guides/state-of-club-fitting-2026"
                className="font-semibold text-[var(--color-forest)] hover:underline"
              >
                State of Club Fitting {DIRECTORY_YEAR} report
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      {/* Ranked comparison table — renders only with 3+ rated shops */}
      <TopFittersTable shops={shops} place={`${city}, ${stateCode}`} year={DIRECTORY_YEAR} showCity={false} />

      {/* Listings — ledger for long lists, cards for short ones */}
      <section className="bg-[var(--color-cream)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <IndexHead value={shops.length}>
            {shops.length === 1 ? "fitter" : "fitters"} in {city}, all on record.
          </IndexHead>
          {shops.length > 9 ? (
            <LedgerList shops={shops} showCity={false} />
          ) : (
            <ListingGrid shops={shops} />
          )}
        </div>
      </section>

      {/* Other fitters nearby — genuine comparison content + internal links to
          neighboring-town listings. Renders only when the anchor shop has
          coordinates and real fitters sit within ~60 miles. */}
      {nearby.length > 0 && (
        <section className="bg-[var(--color-ivory)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-[var(--color-charcoal)]">
              Other fitters near {city}
            </h2>
            <p className="mt-2 text-[var(--color-charcoal-light)]">
              The closest club fitters in neighboring towns, by distance.
            </p>
            <ListingGrid shops={nearby} />
          </div>
        </section>
      )}

      {/* Sibling cities — sideways links so city pages aren't crawl dead-ends */}
      <section className="bg-[var(--color-cream)] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {siblingCities.length > 0 && (
            <>
              <h2 className="font-display text-2xl font-bold text-[var(--color-charcoal)]">
                More cities in {state}
              </h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {siblingCities.slice(0, 16).map((c) => (
                  <ChipLink
                    key={c.slug}
                    href={`/city/${c.slug}`}
                    label={expandCityName(c.name)}
                    count={c.count}
                    size="sm"
                  />
                ))}
              </div>
            </>
          )}
          <div className={`text-center ${siblingCities.length > 0 ? "mt-8" : ""}`}>
            <Button href={`/state/${stateCode.toLowerCase()}`} variant="outline" size="sm">
              &larr; All fitters in {state}
            </Button>
          </div>
        </div>
      </section>

      <FaqSection items={cityFaqs(city, state, shops)} heading={`Club fitting in ${city} — FAQ`} />

      <RelatedGuides slugs={["golf-club-fitting-cost", "how-to-choose-a-club-fitter", "what-to-expect-at-a-golf-club-fitting"]} />
    </>
  )
}
