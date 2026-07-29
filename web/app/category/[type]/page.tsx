import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getShopsForCategoryPage } from "@/lib/supabase/queries/shops"
import { SHOP_TYPES, slugToShopType } from "@/lib/shop-types"
import { PageHeader } from "@/components/layout/PageHeader"
import { IndexHead } from "@/components/ui/IndexHead"
import { ListingGrid } from "@/components/directory/ListingGrid"
import { LedgerList } from "@/components/directory/LedgerList"
import { Button } from "@/components/ui/Button"
import { ChipLink } from "@/components/ui/ChipLink"
import { SITE_URL } from "@/lib/constants"
import { rethrowQueryError } from "@/lib/utils"
import { buildItemListSchema, buildCategoryBreadcrumbSchema } from "@/lib/structured-data"
import { JsonLd } from "@/components/seo/JsonLd"
import { FaqSection } from "@/components/seo/FaqSection"
import { RelatedGuides } from "@/components/seo/RelatedGuides"
import { categoryIntro, categoryFaqs, DIRECTORY_YEAR, LAST_UPDATED_LABEL } from "@/lib/seo-content"
import { TopFittersTable } from "@/components/seo/TopFittersTable"

interface PageProps {
  params: Promise<{ type: string }>
}

export const revalidate = 2592000 // 30 days — long window keeps ISR writes low; edits propagate via on-demand revalidation (app/api/revalidate)

export async function generateStaticParams() {
  return SHOP_TYPES.map((t) => ({ type: t.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type: slug } = await params
  const shopType = slugToShopType(slug)
  // notFound() in generateMetadata is what sets a real 404 status — by the time
  // the page body runs, streaming has already sent a 200. slugToShopType is a
  // pure lookup, so a miss always means the URL is genuinely invalid.
  if (!shopType) notFound()

  const label = shopType.label
  return {
    // Year-stamped comparison format — the same treatment as state/city pages
    // (it's the format that wins both Google SERPs and AI citations).
    title: { absolute: `Top ${label} in the US for ${DIRECTORY_YEAR}` },
    description: `Compare ${label.toLowerCase()} across the US — ratings, fitting prices, launch monitor tech, and independent vs chain. Updated ${LAST_UPDATED_LABEL}.`,
    alternates: { canonical: `${SITE_URL}/category/${slug}` },
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { type: slug } = await params
  const shopType = slugToShopType(slug)
  if (!shopType) notFound()

  const result = await getShopsForCategoryPage(shopType.dbType).catch(rethrowQueryError("category getShopsForCategoryPage"))
  if (!result || result.shops.length === 0) notFound()

  const { shops, stateBreakdown } = result
  const label = shopType.label

  const itemListSchema = buildItemListSchema(shops, `${label} Directory`)
  const breadcrumbSchema = buildCategoryBreadcrumbSchema(label, slug)

  return (
    <>
      <JsonLd data={itemListSchema} />
      <JsonLd data={breadcrumbSchema} />
      {/* Hero */}
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: label }]}
        eyebrow={`Club Fitting Directory · Updated ${LAST_UPDATED_LABEL}`}
        title={label}
        subtitle={`${shops.length} listings across ${stateBreakdown.length} states.`}
      />

      {/* Intro copy */}
      <section className="bg-[var(--color-ivory)] pt-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-[var(--color-charcoal-light)] leading-relaxed">
            {categoryIntro(label, shops, stateBreakdown.length)}
          </p>
        </div>
      </section>

      {/* Ranked comparison table — the citable "top picks" answer block */}
      <TopFittersTable shops={shops} place="the US" year={DIRECTORY_YEAR} noun={label} />

      {/* State breakdown */}
      {stateBreakdown.length > 1 && (
        <section className="bg-[var(--color-cream)] py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal)] mb-4">
              By State
            </h2>
            <div className="flex flex-wrap gap-2">
              {stateBreakdown.slice(0, 20).map((s) => (
                <ChipLink
                  key={s.state_code}
                  href={`/state/${s.state_code.toLowerCase()}`}
                  label={s.state}
                  count={s.count}
                  size="sm"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Listings — ledger for long lists, cards for short ones */}
      <section className="bg-[var(--color-ivory)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <IndexHead value={shops.length}>
            {label.toLowerCase()}, all on record.
          </IndexHead>
          {shops.length > 9 ? (
            <LedgerList shops={shops} />
          ) : (
            <ListingGrid shops={shops} />
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--color-cream)] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <p className="text-lg text-[var(--color-charcoal)]">
            Need a different kind of shop? The full directory filters by service,
            rating, and distance.
          </p>
          <Button href="/directory" variant="primary" className="shrink-0">
            Search the Full Directory
          </Button>
        </div>
      </section>

      <FaqSection items={categoryFaqs(label, shops)} heading={`${label} — FAQ`} />

      <RelatedGuides />
    </>
  )
}
