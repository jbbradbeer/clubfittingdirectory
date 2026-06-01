import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  getShopsForCityPage,
  getAllCitySlugs,
} from "@/lib/supabase/queries/shops"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { ListingCard } from "@/components/directory/ListingCard"
import { Button } from "@/components/ui/Button"
import { SITE_URL } from "@/lib/constants"
import { buildCityBreadcrumbSchema, buildItemListSchema } from "@/lib/structured-data"
import { logQueryError } from "@/lib/utils"

interface PageProps {
  params: Promise<{ citySlug: string }>
}

export const revalidate = 86400

export async function generateStaticParams() {
  const slugs = await getAllCitySlugs().catch((e) => logQueryError("city generateStaticParams getAllCitySlugs", e, []))
  return slugs
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug } = await params
  const result = await getShopsForCityPage(citySlug).catch((e) => logQueryError("city generateMetadata getShopsForCityPage", e, null))
  if (!result) return { title: "City Not Found" }

  const { city, state, shops } = result
  return {
    title: `Golf Club Fitters in ${city}, ${state}`,
    description: `Find ${shops.length} independent golf club fitters and retailers in ${city}, ${state}. Compare ratings, services, and contact information.`,
    alternates: { canonical: `${SITE_URL}/city/${citySlug}` },
  }
}

export default async function CityPage({ params }: PageProps) {
  const { citySlug } = await params
  const result = await getShopsForCityPage(citySlug).catch((e) => logQueryError("city getShopsForCityPage", e, null))

  if (!result) notFound()

  const { shops, city, state, stateCode } = result

  /* Shop type breakdown */
  const typeMap: Record<string, number> = {}
  for (const shop of shops) {
    const t = shop.shop_type ?? "Other"
    typeMap[t] = (typeMap[t] ?? 0) + 1
  }

  const breadcrumbSchema = buildCityBreadcrumbSchema(city, state, stateCode, citySlug)
  const itemListSchema = buildItemListSchema(shops, `Golf Club Fitters in ${city}, ${stateCode}`)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Hero */}
      <PageHeader
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: state, href: `/state/${stateCode.toLowerCase()}` },
          { label: city },
        ]}
        eyebrow="Club Fitting Directory"
        title={`Golf Club Fitters in ${city}, ${stateCode}`}
        subtitle={`${shops.length} ${shops.length === 1 ? "listing" : "listings"} — ${Object.entries(
          typeMap,
        )
          .map(([type, count]) => `${count} ${type.toLowerCase()}${count > 1 ? "s" : ""}`)
          .join(", ")}.`}
      />

      {/* Listings */}
      <section className="bg-[var(--color-ivory)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={`${shops.length} Listings`}
            title={`All Fitters in ${city}`}
            centered={false}
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shops.map((shop) => (
              <ListingCard key={shop.slug} {...shop} />
            ))}
          </div>
        </div>
      </section>

      {/* Back to state */}
      <section className="bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Button href={`/state/${stateCode.toLowerCase()}`} variant="outline" size="sm">
            &larr; All fitters in {state}
          </Button>
        </div>
      </section>
    </>
  )
}
