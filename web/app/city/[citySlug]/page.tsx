import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  getAllCitySlugs,
  getShopsForCityPage,
  getAllStatesWithShops,
} from "@/lib/supabase/queries/shops"
import { StateListings } from "@/components/state/StateFilterChips"
import type { ListingCardProps } from "@/types/shop"
import { SITE_URL } from "@/lib/constants"

/* ─────────────────────────────────────────────────────────
   /city/[citySlug] — City-level SEO landing page
   e.g. /city/austin-tx  /city/scottsdale-az
   ───────────────────────────────────────────────────────── */

export const revalidate = 86400

export async function generateStaticParams() {
  const slugs = await getAllCitySlugs().catch(() => [])
  return slugs
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string }>
}): Promise<Metadata> {
  const { citySlug } = await params
  const result = await getShopsForCityPage(citySlug).catch(() => null)
  if (!result) return { title: "City Not Found" }

  const { city, state, shops } = result
  const count       = shops.length
  const description = `Browse ${count} golf club fitter${count !== 1 ? "s" : ""}, simulators, and retailers in ${city}, ${state}. Find club fitting, custom builds, and golf retail near you.`

  return {
    title: `Golf Club Fitters in ${city}, ${state} — Club Fitting Directory`,
    description,
    alternates: { canonical: `${SITE_URL}/city/${citySlug}` },
    openGraph: {
      title: `Golf Club Fitters in ${city}, ${state}`,
      description,
      type: "website",
      url: `${SITE_URL}/city/${citySlug}`,
      siteName: "Club Fitting Directory",
    },
  }
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ citySlug: string }>
}) {
  const { citySlug } = await params

  const [result, allStates] = await Promise.all([
    getShopsForCityPage(citySlug).catch(() => null),
    getAllStatesWithShops().catch(() => []),
  ])

  if (!result || result.shops.length === 0) notFound()

  const { shops, city, state, stateCode } = result

  // Cities in the same state — for the "Browse other cities" section
  const cityCounts: Record<string, number> = {}
  for (const s of shops) {
    /* We need all state shops, but we already have the city shops.
       The Browse-by-City section on the state page covers the full list.
       Here we just show the current city highlighted + link back to state. */
    if (s.city) cityCounts[s.city] = (cityCounts[s.city] ?? 0) + 1
  }

  const shopTypes = [
    ...new Set(shops.map((s) => s.shop_type).filter(Boolean) as string[]),
  ].sort()

  const cardProps: ListingCardProps[] = shops.map((s) => ({
    name: s.name,
    shop_type: s.shop_type,
    primary_service: s.primary_service,
    city: s.city,
    state: s.state,
    state_code: s.state_code,
    rating: s.rating,
    rating_tier: s.rating_tier,
    services: s.services,
    services_array: s.services_array ?? [],
    offers_fitting: s.offers_fitting,
    fitting_environment: s.fitting_environment,
    phone: s.phone,
    website: s.website,
    verified: s.verified,
    slug: s.slug,
  }))

  // JSON-LD breadcrumb schema for this city page
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",            item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "States",          item: `${SITE_URL}/states` },
      { "@type": "ListItem", position: 3, name: state,             item: `${SITE_URL}/state/${stateCode.toLowerCase()}` },
      { "@type": "ListItem", position: 4, name: city,              item: `${SITE_URL}/city/${citySlug}` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="min-h-screen bg-[var(--color-off-white)]">

        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" className="border-b border-[var(--color-gray-light)] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <ol className="flex flex-wrap items-center gap-1.5 font-[family-name:var(--font-body)] text-xs text-[var(--color-gray)]">
              <li>
                <Link href="/" className="hover:text-[var(--color-green-deep)] transition-colors">Home</Link>
              </li>
              <li aria-hidden="true" className="text-[var(--color-gray-light)]">/</li>
              <li>
                <Link href="/states" className="hover:text-[var(--color-green-deep)] transition-colors">States</Link>
              </li>
              <li aria-hidden="true" className="text-[var(--color-gray-light)]">/</li>
              <li>
                <Link
                  href={`/state/${stateCode.toLowerCase()}`}
                  className="hover:text-[var(--color-green-deep)] transition-colors"
                >
                  {state}
                </Link>
              </li>
              <li aria-hidden="true" className="text-[var(--color-gray-light)]">/</li>
              <li className="text-[var(--color-black)]" aria-current="page">{city}</li>
            </ol>
          </div>
        </nav>

        {/* ── Page header ── */}
        <header className="border-b border-[var(--color-gray-light)] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.3em] uppercase text-[var(--color-green-deep)] mb-3">
              Club Fitting Directory
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-normal text-[var(--color-black)] leading-tight mb-4">
              Golf Club Fitters in{" "}
              <span className="text-[var(--color-green-deep)]">{city}, {stateCode}</span>
            </h1>
            <p className="font-[family-name:var(--font-body)] text-lg text-[var(--color-gray)]">
              <span className="text-[var(--color-black)] tabular-nums font-medium">
                {shops.length.toLocaleString()}
              </span>{" "}
              {shops.length === 1 ? "listing" : "listings"} in {city},{" "}
              <Link
                href={`/state/${stateCode.toLowerCase()}`}
                className="text-[var(--color-green-deep)] hover:text-[var(--color-green-hover)] transition-colors"
              >
                {state}
              </Link>
            </p>
          </div>
        </header>

        {/* ── Shop grid ── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <StateListings shops={cardProps} shopTypes={shopTypes} />
        </main>

        {/* ── Browse other cities in this state ── */}
        <section className="border-t border-[var(--color-gray-light)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-6 gap-4">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-black)]">
                All Fitters in {state}
              </h2>
              <Link
                href={`/state/${stateCode.toLowerCase()}`}
                className="shrink-0 font-[family-name:var(--font-body)] text-sm text-[var(--color-green-deep)] hover:text-[var(--color-green-hover)] transition-colors whitespace-nowrap group"
              >
                View all in {stateCode}{" "}
                <span className="inline-block transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
              </Link>
            </div>
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-gray)] mb-6">
              Browse all club fitters, retailers, and simulators across {state}.
            </p>
            <Link
              href={`/state/${stateCode.toLowerCase()}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-[var(--color-green-deep)] text-[var(--color-green-deep)] font-[family-name:var(--font-body)] text-sm font-medium hover:bg-[var(--color-green-deep)] hover:text-white transition-colors"
            >
              Browse all {state} listings
            </Link>
          </div>
        </section>

        {/* ── Browse other states ── */}
        <section className="border-t border-[var(--color-gray-light)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-black)] mb-6">
              Browse Other States
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {allStates.map((s) => (
                <Link
                  key={s.state_code}
                  href={`/state/${s.state_code.toLowerCase()}`}
                  title={s.state}
                  className={[
                    "flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-md text-center border transition-colors duration-150 group",
                    s.state_code === stateCode
                      ? "border-[var(--color-green-deep)] bg-[#1B43320A] cursor-default"
                      : "border-[var(--color-gray-light)] bg-white hover:border-[var(--color-green-deep)] hover:bg-[#1B43320A]",
                  ].join(" ")}
                  aria-current={s.state_code === stateCode ? "page" : undefined}
                >
                  <span className={[
                    "font-[family-name:var(--font-body)] text-xs font-semibold tracking-wide transition-colors tabular-nums",
                    s.state_code === stateCode
                      ? "text-[var(--color-green-deep)]"
                      : "text-[var(--color-black)] group-hover:text-[var(--color-green-deep)]",
                  ].join(" ")}>{s.state_code}</span>
                  <span className="font-[family-name:var(--font-body)] text-[9px] text-[var(--color-gray)] tabular-nums">
                    {s.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <Link
            href={`/state/${stateCode.toLowerCase()}`}
            className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-green-deep)] hover:text-[var(--color-green-hover)] transition-colors group"
          >
            <span className="inline-block transition-transform group-hover:-translate-x-0.5" aria-hidden="true">←</span>
            Back to {state}
          </Link>
        </div>

      </div>
    </>
  )
}

