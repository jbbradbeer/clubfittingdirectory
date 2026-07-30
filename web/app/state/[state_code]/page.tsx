import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  getShopsForStatePage,
  getAllStateCodes,
  getAllStatesWithShops,
  toCitySlug,
} from "@/lib/supabase/queries/shops"
import { PageHeader } from "@/components/layout/PageHeader"
import { IndexHead } from "@/components/ui/IndexHead"
import { ListingGrid } from "@/components/directory/ListingGrid"
import { LedgerList } from "@/components/directory/LedgerList"
import { Button } from "@/components/ui/Button"
import { ChipLink } from "@/components/ui/ChipLink"
import { SITE_NAME, SITE_URL } from "@/lib/constants"
import { logQueryError, rethrowQueryError } from "@/lib/utils"
import { buildItemListSchema, buildStateBreadcrumbSchema } from "@/lib/structured-data"
import { JsonLd } from "@/components/seo/JsonLd"
import { FaqSection } from "@/components/seo/FaqSection"
import { RelatedGuides } from "@/components/seo/RelatedGuides"
import { stateIntro, stateFaqs, DIRECTORY_YEAR, LAST_UPDATED_LABEL } from "@/lib/seo-content"
import { TopFittersTable } from "@/components/seo/TopFittersTable"
import { shopTypeCountPhrase } from "@/lib/shop-types"

interface PageProps {
  params: Promise<{ state_code: string }>
}

export const revalidate = 2592000 // 30 days — long window keeps ISR writes low; edits propagate via on-demand revalidation (app/api/revalidate)

export async function generateStaticParams() {
  const codes = await getAllStateCodes().catch((e) => logQueryError("state generateStaticParams getAllStateCodes", e, []))
  return codes.map((code) => ({ state_code: code.toLowerCase() }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state_code } = await params
  const code = state_code.toUpperCase()
  const states = await getAllStatesWithShops().catch((e) => logQueryError("state generateMetadata getAllStatesWithShops", e, []))
  const stateInfo = states.find((s) => s.state_code === code)
  // notFound() in generateMetadata is what sets a real 404 status — by the time
  // the page body runs, streaming has already sent a 200. Only when the states
  // list actually loaded (non-empty) can "not in it" mean the state is invalid;
  // an empty list from a DB blip keeps the soft fallback below.
  if (states.length > 0 && !stateInfo) notFound()
  const stateName = stateInfo?.state ?? code

  return {
    // Absolute: the year-stamped comparison format needs the full 60-char
    // budget, so we skip the "| Club Fitting Directory" template suffix here.
    title: { absolute: `Top Golf Club Fitters in ${stateName} for ${DIRECTORY_YEAR}` },
    description: `Compare ${stateInfo?.count ?? ""} golf club fitters in ${stateName} — fitting prices, launch monitor tech, and independent vs chain. Updated ${LAST_UPDATED_LABEL}.`,
    // Always lowercase: /state/TX renders too (dynamicParams), and a raw-param
    // canonical would let Google index both casings as separate pages.
    alternates: { canonical: `${SITE_URL}/state/${state_code.toLowerCase()}` },
  }
}

export default async function StatePage({ params }: PageProps) {
  const { state_code } = await params
  const code = state_code.toUpperCase()

  const [result, states] = await Promise.all([
    getShopsForStatePage(code).catch(rethrowQueryError("state getShopsForStatePage")),
    getAllStatesWithShops().catch((e) => logQueryError("state getAllStatesWithShops", e, [])),
  ])

  if (!result || result.shops.length === 0) notFound()

  const { shops, cityCount } = result
  const stateInfo = states.find((s) => s.state_code === code)
  const stateName = stateInfo?.state ?? code

  /* Build city breakdown */
  const cityMap: Record<string, { count: number; slug: string }> = {}
  for (const shop of shops) {
    if (!shop.city) continue // a shop with no city can't anchor a city link/slug
    if (!cityMap[shop.city]) {
      cityMap[shop.city] = { count: 0, slug: toCitySlug(shop.city, code) }
    }
    cityMap[shop.city].count++
  }
  const cities = Object.entries(cityMap)
    .map(([name, { count, slug }]) => ({ name, count, slug }))
    .sort((a, b) => b.count - a.count)

  /* Shop type breakdown */
  const typeMap: Record<string, number> = {}
  for (const shop of shops) {
    const t = shop.shop_type ?? "Other"
    typeMap[t] = (typeMap[t] ?? 0) + 1
  }

  /* Classification / tech tallies — render only once the data exists */
  const independentCount = shops.filter((s) => s.ownership_type === "independent").length
  const launchMonitorCount = shops.filter((s) => (s.launch_monitors?.length ?? 0) > 0).length

  const otherStates = states.filter((s) => s.state_code !== code).slice(0, 10)

  const itemListSchema = buildItemListSchema(shops, `Top Golf Club Fitters in ${stateName} (${DIRECTORY_YEAR})`)
  const breadcrumbSchema = buildStateBreadcrumbSchema(stateName, code)

  return (
    <>
      <JsonLd data={itemListSchema} />
      <JsonLd data={breadcrumbSchema} />
      {/* Hero */}
      <PageHeader
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "States", href: "/states" },
          { label: stateName },
        ]}
        eyebrow={`Club Fitting Directory · Updated ${LAST_UPDATED_LABEL}`}
        title={`Top Golf Club Fitters in ${stateName} (${DIRECTORY_YEAR})`}
        subtitle={`${shops.length} fitters across ${cityCount} cities — including ${Object.entries(
          typeMap,
        )
          .slice(0, 3)
          .map(([type, count]) => shopTypeCountPhrase(type, count))
          .join(", ")}.${independentCount > 0 ? ` ${independentCount} independently owned.` : ""}${
          launchMonitorCount > 0 ? ` ${launchMonitorCount} with launch monitor details.` : ""
        }`}
      />

      {/* Intro copy */}
      <section className="bg-[var(--color-ivory)] pt-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-[var(--color-charcoal-light)] leading-relaxed">
            {stateIntro(stateName, shops, cityCount)}
          </p>
          {/* Deep link into the flagship data report — routes authority to the
              page we pitch for citations, and gives readers national context. */}
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
        </div>
      </section>

      {/* Ranked comparison table — the citable "top picks" answer block */}
      <TopFittersTable shops={shops} place={stateName} year={DIRECTORY_YEAR} />

      {/* Cities — number-led head, no eyebrow (PageHeader holds the page's one) */}
      {cities.length > 1 && (
        <section className="bg-[var(--color-cream)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <IndexHead value={cities.length}>cities in {stateName}.</IndexHead>
            <div className="mt-6 flex flex-wrap gap-2">
              {cities.map((city) => (
                <ChipLink
                  key={city.slug}
                  href={`/city/${city.slug}`}
                  label={city.name}
                  count={city.count}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Listings — the ledger for long lists, cards for short ones */}
      <section className="bg-[var(--color-ivory)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <IndexHead value={shops.length}>
            {shops.length === 1 ? "fitter" : "fitters"} in {stateName}, all on record.
          </IndexHead>
          {shops.length > 9 ? (
            <LedgerList shops={shops} />
          ) : (
            <ListingGrid shops={shops} />
          )}
        </div>
      </section>

      {/* Browse Other States — quiet footer strip, not another display head */}
      {otherStates.length > 0 && (
        <section className="bg-[var(--color-cream)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-[var(--color-charcoal)]">
              Browse other states
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {otherStates.map((s) => (
                <ChipLink
                  key={s.state_code}
                  href={`/state/${s.state_code.toLowerCase()}`}
                  label={s.state}
                />
              ))}
            </div>
            <div className="mt-6">
              <Button href="/states" variant="outline" size="sm">
                View All States
              </Button>
            </div>
          </div>
        </section>
      )}

      <FaqSection items={stateFaqs(stateName, shops)} heading={`Club fitting in ${stateName} — FAQ`} />

      <RelatedGuides slugs={["golf-club-fitting-cost", "club-champion-vs-independent-fitter", "is-golf-club-fitting-worth-it"]} />
    </>
  )
}
