import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getShopsForCategoryPage } from "@/lib/supabase/queries/shops"
import { SHOP_TYPES, slugToShopType } from "@/lib/shop-types"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { ListingCard } from "@/components/directory/ListingCard"
import { Button } from "@/components/ui/Button"
import { SITE_URL } from "@/lib/constants"
import { logQueryError } from "@/lib/utils"
import { buildItemListSchema } from "@/lib/structured-data"
import { FaqSection } from "@/components/seo/FaqSection"
import { RelatedGuides } from "@/components/seo/RelatedGuides"
import { categoryIntro, categoryFaqs } from "@/lib/seo-content"

interface PageProps {
  params: Promise<{ type: string }>
}

export const revalidate = 86400

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

  const result = await getShopsForCategoryPage(shopType.dbType).catch((e) => logQueryError("category getShopsForCategoryPage", e, null))
  if (!result || result.shops.length === 0) notFound()

  const { shops, stateBreakdown } = result
  const label = shopType.label

  const itemListSchema = buildItemListSchema(shops, `${label} Directory`)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
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
                <Link
                  key={s.state_code}
                  href={`/state/${s.state_code.toLowerCase()}`}
                  className="px-3 py-1.5 bg-white border border-[var(--color-border)] rounded-full text-xs font-medium hover:bg-[var(--color-forest)] hover:text-white hover:border-[var(--color-forest)] transition-all"
                >
                  {s.state}{" "}
                  <span className="text-[var(--color-charcoal-light)]">{s.count}</span>
                </Link>
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
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <ListingCard key={shop.slug} {...shop} />
            ))}
          </div>
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
