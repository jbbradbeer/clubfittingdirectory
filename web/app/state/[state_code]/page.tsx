import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getAllStateCodes, getShopsForStatePage, getAllStatesWithShops, toCitySlug } from "@/lib/supabase/queries/shops"
import { StateListings } from "@/components/state/StateFilterChips"
import type { ListingCardProps } from "@/types/shop"

/* ─────────────────────────────────────────────────────────
   /state/[state_code] — State index page
   Off-white bg, green accent on state name.
   ───────────────────────────────────────────────────────── */

export const revalidate = 86400

import { SITE_URL } from "@/lib/constants"

export async function generateStaticParams() {
  const codes = await getAllStateCodes().catch(() => [])
  return codes.map((state_code) => ({ state_code: state_code.toLowerCase() }))
}

export async function generateMetadata({ params }: { params: Promise<{ state_code: string }> }): Promise<Metadata> {
  const { state_code } = await params
  const upper = state_code.toUpperCase()
  const allStates = await getAllStatesWithShops().catch(() => [])
  const stateInfo = allStates.find((s) => s.state_code === upper)
  if (!stateInfo) return { title: "State Not Found" }

  const { state, count } = stateInfo
  const description = `Browse ${count} golf club fitters, retailers, and simulators in ${state}. Find club fitting, lessons, and custom club building near you.`

  return {
    title: `Golf Club Fitters in ${state} — Club Fitting Directory`,
    description,
    alternates: { canonical: `${SITE_URL}/state/${state_code}` },
    openGraph: { title: `Golf Club Fitters in ${state}`, description, type: "website", url: `${SITE_URL}/state/${state_code}`, siteName: "Club Fitting Directory" },
  }
}

export default async function StatePage({ params }: { params: Promise<{ state_code: string }> }) {
  const { state_code } = await params
  const upper = state_code.toUpperCase()

  const [{ shops, cityCount }, allStates] = await Promise.all([
    getShopsForStatePage(upper).catch(() => ({ shops: [], cityCount: 0 })),
    getAllStatesWithShops().catch(() => []),
  ])

  const stateInfo = allStates.find((s) => s.state_code === upper)
  if (!stateInfo || shops.length === 0) notFound()

  const { state } = stateInfo
  const shopTypes = [...new Set(shops.map((s) => s.shop_type).filter(Boolean) as string[])].sort()

  // Build city list with counts for the Browse by City section
  const cityCountMap: Record<string, number> = {}
  for (const s of shops) {
    if (s.city) cityCountMap[s.city] = (cityCountMap[s.city] ?? 0) + 1
  }
  const cities = Object.entries(cityCountMap)
    .map(([city, count]) => ({ city, count, slug: toCitySlug(city, upper) }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))

  const cardProps: ListingCardProps[] = shops.map((s) => ({
    name: s.name, shop_type: s.shop_type, primary_service: s.primary_service,
    city: s.city, state: s.state, state_code: s.state_code, rating: s.rating,
    rating_tier: s.rating_tier, services: s.services, services_array: s.services_array ?? [],
    offers_fitting: s.offers_fitting, fitting_environment: s.fitting_environment,
    phone: s.phone, website: s.website, verified: s.verified, slug: s.slug,
  }))

  return (
    <div className="min-h-screen bg-[var(--color-off-white)]">
      <nav aria-label="Breadcrumb" className="border-b border-[var(--color-gray-light)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <ol className="flex flex-wrap items-center gap-1.5 font-[family-name:var(--font-body)] text-xs text-[var(--color-gray)]">
            <li><Link href="/" className="hover:text-[var(--color-green-deep)] transition-colors">Home</Link></li>
            <li aria-hidden="true" className="text-[var(--color-gray-light)]">/</li>
            <li><Link href="/states" className="hover:text-[var(--color-green-deep)] transition-colors">States</Link></li>
            <li aria-hidden="true" className="text-[var(--color-gray-light)]">/</li>
            <li className="text-[var(--color-black)]" aria-current="page">{state}</li>
          </ol>
        </div>
      </nav>

      <header className="border-b border-[var(--color-gray-light)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.3em] uppercase text-[var(--color-green-deep)] mb-3">Club Fitting Directory</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-normal text-[var(--color-black)] leading-tight mb-4">
            Golf Club Fitters in <span className="text-[var(--color-green-deep)]">{state}</span>
          </h1>
          <p className="font-[family-name:var(--font-body)] text-lg text-[var(--color-gray)]">
            <span className="text-[var(--color-black)] tabular-nums font-medium">{shops.length.toLocaleString()}</span>{" "}listings across{" "}
            <span className="text-[var(--color-black)] tabular-nums font-medium">{cityCount}</span>{" "}{cityCount === 1 ? "city" : "cities"} in {state}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <StateListings shops={cardProps} shopTypes={shopTypes} />
      </main>

      {/* ── Browse by City ── */}
      {cities.length > 1 && (
        <section className="border-t border-[var(--color-gray-light)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-black)] mb-6">
              Browse by City in {state}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {cities.map(({ city, count, slug }) => (
                <Link
                  key={slug}
                  href={`/city/${slug}`}
                  className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-md border border-[var(--color-gray-light)] bg-white hover:border-[var(--color-green-deep)] hover:bg-[#1B43320A] transition-colors duration-150 group"
                >
                  <span className="font-[family-name:var(--font-body)] text-sm text-[var(--color-black)] group-hover:text-[var(--color-green-deep)] transition-colors truncate">
                    {city}
                  </span>
                  <span className="font-[family-name:var(--font-body)] text-[10px] text-[var(--color-gray)] tabular-nums shrink-0">
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-[var(--color-gray-light)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-black)] mb-6">Browse Other States</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {allStates.map((s) => (
              <Link key={s.state_code} href={`/state/${s.state_code.toLowerCase()}`} title={s.state}
                className={[
                  "flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-md text-center border transition-colors duration-150 group",
                  s.state_code === upper
                    ? "border-[var(--color-green-deep)] bg-[#1B43320A] cursor-default"
                    : "border-[var(--color-gray-light)] bg-white hover:border-[var(--color-green-deep)] hover:bg-[#1B43320A]",
                ].join(" ")}
                aria-current={s.state_code === upper ? "page" : undefined}>
                <span className={[
                  "font-[family-name:var(--font-body)] text-xs font-semibold tracking-wide transition-colors tabular-nums",
                  s.state_code === upper ? "text-[var(--color-green-deep)]" : "text-[var(--color-black)] group-hover:text-[var(--color-green-deep)]",
                ].join(" ")}>{s.state_code}</span>
                <span className="font-[family-name:var(--font-body)] text-[9px] text-[var(--color-gray)] tabular-nums">{s.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <Link href="/directory" className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-green-deep)] hover:text-[var(--color-green-hover)] transition-colors group">
          <span className="inline-block transition-transform group-hover:-translate-x-0.5" aria-hidden="true">←</span>
          Back to Directory
        </Link>
      </div>
    </div>
  )
}
