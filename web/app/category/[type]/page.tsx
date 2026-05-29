import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getShopsForCategoryPage, getAllShopTypes } from "@/lib/supabase/queries/shops"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { ListingCard } from "@/components/directory/ListingCard"
import { Button } from "@/components/ui/Button"
import { SITE_URL } from "@/lib/constants"

interface PageProps {
  params: Promise<{ type: string }>
}

/* Map URL slugs to actual shop_type values in the database */
const SLUG_TO_TYPE: Record<string, string> = {
  "club-fitters":    "Clubfitter",
  "golf-retailers":  "Golf Retailer",
  "pro-shops":       "Pro Shop",
  "golf-simulators": "Golf Simulator",
  "golf-warehouses": "Golf Warehouse",
  other:             "Other",
}

const TYPE_TO_LABEL: Record<string, string> = {
  Clubfitter:       "Club Fitters",
  "Golf Retailer":  "Golf Retailers",
  "Pro Shop":       "Pro Shops",
  "Golf Simulator": "Golf Simulators",
  "Golf Warehouse": "Golf Warehouses",
  Other:            "Other",
}

export const revalidate = 86400

export async function generateStaticParams() {
  const types = await getAllShopTypes().catch(() => [])
  const reverseMap: Record<string, string> = {}
  for (const [slug, type] of Object.entries(SLUG_TO_TYPE)) {
    reverseMap[type] = slug
  }
  return types
    .map((t) => ({ type: reverseMap[t] }))
    .filter((p) => p.type)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type: slug } = await params
  const shopType = SLUG_TO_TYPE[slug]
  if (!shopType) return { title: "Category Not Found" }

  const label = TYPE_TO_LABEL[shopType] ?? shopType
  return {
    title: `${label} Directory`,
    description: `Browse all ${label.toLowerCase()} in our directory. Find ratings, services, contact info, and more.`,
    alternates: { canonical: `${SITE_URL}/category/${slug}` },
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { type: slug } = await params
  const shopType = SLUG_TO_TYPE[slug]
  if (!shopType) notFound()

  const result = await getShopsForCategoryPage(shopType).catch(() => null)
  if (!result || result.shops.length === 0) notFound()

  const { shops, stateBreakdown } = result
  const label = TYPE_TO_LABEL[shopType] ?? shopType

  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--color-cream)] bg-grain py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: label },
            ]}
          />
          <div className="mt-6">
            <p className="section-label mb-2">Category</p>
            <h1
              className="text-3xl md:text-5xl font-normal text-[var(--color-charcoal)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {label}
            </h1>
            <p className="mt-3 text-[var(--color-charcoal-light)] text-lg">
              {shops.length} listings across {stateBreakdown.length} states.
            </p>
          </div>
        </div>
      </section>

      {/* State breakdown */}
      {stateBreakdown.length > 1 && (
        <section className="bg-[var(--color-ivory)] py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2
              className="text-lg font-semibold text-[var(--color-charcoal)] mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
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
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={`${shops.length} Listings`}
            title={`All ${label}`}
            centered={false}
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
    </>
  )
}
