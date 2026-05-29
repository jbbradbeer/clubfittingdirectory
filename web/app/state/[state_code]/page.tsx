import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  getShopsForStatePage,
  getAllStateCodes,
  getAllStatesWithShops,
  toCitySlug,
} from "@/lib/supabase/queries/shops"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { ListingCard } from "@/components/directory/ListingCard"
import { Button } from "@/components/ui/Button"
import { SITE_NAME, SITE_URL } from "@/lib/constants"

interface PageProps {
  params: Promise<{ state_code: string }>
}

export const revalidate = 86400

export async function generateStaticParams() {
  const codes = await getAllStateCodes().catch(() => [])
  return codes.map((code) => ({ state_code: code.toLowerCase() }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state_code } = await params
  const code = state_code.toUpperCase()
  const states = await getAllStatesWithShops().catch(() => [])
  const stateInfo = states.find((s) => s.state_code === code)
  const stateName = stateInfo?.state ?? code

  return {
    title: `Golf Club Fitters in ${stateName}`,
    description: `Find ${stateInfo?.count ?? ""} independent golf club fitters, retailers, and pro shops in ${stateName}. Browse by city, filter by type, and find your perfect fit.`,
    alternates: { canonical: `${SITE_URL}/state/${state_code}` },
  }
}

export default async function StatePage({ params }: PageProps) {
  const { state_code } = await params
  const code = state_code.toUpperCase()

  const [result, states] = await Promise.all([
    getShopsForStatePage(code).catch(() => null),
    getAllStatesWithShops().catch(() => []),
  ])

  if (!result || result.shops.length === 0) notFound()

  const { shops, cityCount } = result
  const stateInfo = states.find((s) => s.state_code === code)
  const stateName = stateInfo?.state ?? code

  /* Build city breakdown */
  const cityMap: Record<string, { count: number; slug: string }> = {}
  for (const shop of shops) {
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

  const otherStates = states.filter((s) => s.state_code !== code).slice(0, 10)

  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--color-cream)] bg-grain py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "States", href: "/states" },
              { label: stateName },
            ]}
          />
          <div className="mt-6">
            <p className="section-label mb-2">Club Fitting Directory</p>
            <h1
              className="text-3xl md:text-5xl font-normal text-[var(--color-charcoal)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Golf Club Fitters in {stateName}
            </h1>
            <p className="mt-3 text-[var(--color-charcoal-light)] text-lg">
              {shops.length} fitters across {cityCount} cities — including{" "}
              {Object.entries(typeMap)
                .slice(0, 3)
                .map(([type, count]) => `${count} ${type.toLowerCase()}s`)
                .join(", ")}
              .
            </p>
          </div>
        </div>
      </section>

      {/* Cities */}
      {cities.length > 1 && (
        <section className="bg-[var(--color-ivory)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Browse by City"
              title={`Cities in ${stateName}`}
              centered={false}
            />
            <div className="mt-6 flex flex-wrap gap-2">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/city/${city.slug}`}
                  className="px-4 py-2 bg-white border border-[var(--color-border)] rounded-full text-sm hover:bg-[var(--color-forest)] hover:text-white hover:border-[var(--color-forest)] transition-all"
                >
                  {city.name}
                  <span className="ml-1.5 text-[var(--color-charcoal-light)]">
                    {city.count}
                  </span>
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
            title={`All Fitters in ${stateName}`}
            centered={false}
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shops.map((shop) => (
              <ListingCard key={shop.slug} {...shop} />
            ))}
          </div>
        </div>
      </section>

      {/* Browse Other States */}
      {otherStates.length > 0 && (
        <section className="bg-[var(--color-cream)] bg-grain py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <SectionHeader
              eyebrow="Explore More"
              title="Browse Other States"
            />
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {otherStates.map((s) => (
                <Link
                  key={s.state_code}
                  href={`/state/${s.state_code.toLowerCase()}`}
                  className="px-4 py-2 bg-white border border-[var(--color-border)] rounded-full text-sm hover:bg-[var(--color-forest)] hover:text-white hover:border-[var(--color-forest)] transition-all"
                >
                  {s.state}
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Button href="/states" variant="outline" size="sm">
                View All States
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
