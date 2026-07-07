import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getShopsForCategoryPage } from "@/lib/supabase/queries/shops"
import { SHOP_TYPES, slugToShopType } from "@/lib/shop-types"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { ListingGrid } from "@/components/directory/ListingGrid"
import { Button } from "@/components/ui/Button"
import { ChipLink } from "@/components/ui/ChipLink"
import { SITE_URL } from "@/lib/constants"
import { rethrowQueryError } from "@/lib/utils"
import { buildItemListSchema } from "@/lib/structured-data"
import { JsonLd } from "@/components/seo/JsonLd"
import { FaqSection } from "@/components/seo/FaqSection"
import { RelatedGuides } from "@/components/seo/RelatedGuides"
import { categoryIntro, categoryFaqs } from "@/lib/seo-content"

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
  if (!shopType) return { title: "Category Not Found" }

  const label = shopType.label
  return {
    title: `${label} Directory`,
    description: `Browse all ${label.toLowerCase()} in our directory. Find ratings, services, contact info, and more.`,
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

  return (
    <>
      <JsonLd data={itemListSchema} />
      {/* Hero */}
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: label }]}
        eyebrow="Category"
        title={label}
        subtitle={`${shops.length} listings across ${stateBreakdown.length} states.`}
      />

      {/* Intro copy */}
      <section className="bg-[var(--color-ivory)] pt-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-[var(--color-charcoal-light)] leading-relaxed">
            {categoryIntro(label, shops.length, stateBreakdown.length)}
          </p>
        </div>
      </section>

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

      {/* Listings */}
      <section className="bg-[var(--color-ivory)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={`${shops.length} Listings`}
            title={`All ${label}`}
            centered={false}
          />
          <ListingGrid shops={shops} />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--color-cream)] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Button href="/directory" variant="primary">
            Search the Full Directory
          </Button>
        </div>
      </section>

      <FaqSection items={categoryFaqs(label)} heading={`${label} — FAQ`} />

      <RelatedGuides />
    </>
  )
}
