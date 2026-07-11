import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  getShopsForCityPage,
  getAllCitySlugs,
  getCityLinksForState,
} from "@/lib/supabase/queries/shops"
import { ChipLink } from "@/components/ui/ChipLink"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { ListingGrid } from "@/components/directory/ListingGrid"
import { Button } from "@/components/ui/Button"
import { SITE_URL } from "@/lib/constants"
import { buildCityBreadcrumbSchema, buildItemListSchema } from "@/lib/structured-data"
import { JsonLd } from "@/components/seo/JsonLd"
import { FaqSection } from "@/components/seo/FaqSection"
import { RelatedGuides } from "@/components/seo/RelatedGuides"
import { cityIntro, cityFaqs, DIRECTORY_YEAR, LAST_UPDATED_LABEL } from "@/lib/seo-content"
import { TopFittersTable } from "@/components/seo/TopFittersTable"
import { logQueryError, rethrowQueryError } from "@/lib/utils"

interface PageProps {
  params: Promise<{ citySlug: string }>
}

export const revalidate = 2592000 // 30 days — long window keeps ISR writes low; edits propagate via on-demand revalidation (app/api/revalidate)

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

  const { city, state, shops } = result
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
    // One-shop city pages are thin (a single listing, no comparison table) and
    // dilute the site's overall content quality in Google's eyes. Keep them
    // for visitors and internal links, but don't ask Google to index them —
    // the shop itself still ranks via its listing page. `follow` keeps link
    // equity flowing through. Flips back to indexable once a 2nd shop exists.
    ...(shops.length < 2 ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function CityPage({ params }: PageProps) {
  const { citySlug } = await params
  const result = await getShopsForCityPage(citySlug).catch(rethrowQueryError("city getShopsForCityPage"))

  if (!result) notFound()

  const { shops, city, state, stateCode } = result

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
          .map(([type, count]) => `${count} ${type.toLowerCase()}${count > 1 ? "s" : ""}`)
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
        </div>
      </section>

      {/* Ranked comparison table — renders only with 3+ rated shops */}
      <TopFittersTable shops={shops} place={`${city}, ${stateCode}`} year={DIRECTORY_YEAR} showCity={false} />

      {/* Listings */}
      <section className="bg-[var(--color-cream)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={`${shops.length} Listings`}
            title={`All Fitters in ${city}`}
            centered={false}
          />
          <ListingGrid shops={shops} />
        </div>
      </section>

      {/* Sibling cities — sideways links so city pages aren't crawl dead-ends */}
      <section className="bg-[var(--color-ivory)] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {siblingCities.length > 0 && (
            <>
              <SectionHeader
                eyebrow="Nearby"
                title={`More cities in ${state}`}
                centered={false}
              />
              <div className="mt-6 flex flex-wrap gap-2">
                {siblingCities.slice(0, 16).map((c) => (
                  <ChipLink
                    key={c.slug}
                    href={`/city/${c.slug}`}
                    label={c.name}
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

      <RelatedGuides />
    </>
  )
}
