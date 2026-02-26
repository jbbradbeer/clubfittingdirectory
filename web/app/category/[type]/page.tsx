import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getAllShopTypes, getShopsForCategoryPage, getAllStatesWithShops } from "@/lib/supabase/queries/shops"
import { CategoryListings } from "@/components/category/CategoryListings"
import type { ListingCardProps } from "@/types/shop"

/* ─────────────────────────────────────────────────────────
   /category/[type] — Shop-type index page
   Off-white bg, green eyebrow, black heading.
   ───────────────────────────────────────────────────────── */

export const revalidate = 86400

import { SITE_URL } from "@/lib/constants"

const SLUG_TO_TYPE: Record<string, string> = {
  "club-fitters":   "Clubfitter",
  "golf-retailers": "Retailer",
  "golf-courses":   "Golf Course / Pro Shop",
  "simulators":     "Simulator",
  "instruction":    "Instruction",
  "driving-ranges": "Driving Range",
}

const TYPE_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_TO_TYPE).map(([slug, type]) => [type, slug]),
)

interface CategoryMeta {
  heading: string; subheading: string; description: string; metaTitle: string; metaDesc: string
}

const CATEGORY_CONTENT: Record<string, CategoryMeta> = {
  "Clubfitter": {
    heading: "Golf Club Fitters", subheading: "Precision fitting. Measurable improvement.",
    description: "A proper fitting session is the highest-return investment in golf. Our directory lists independent club fitters and boutique fitting studios across the United States — professionals who use launch monitors, shaft profiling, and decades of hands-on experience to match equipment to your swing.",
    metaTitle: "Find a Golf Club Fitter Near You — Club Fitting Directory",
    metaDesc: "Browse 500+ certified golf club fitters across the US. Find independent fitting studios, Trackman specialists, and custom club builders near you.",
  },
  "Retailer": {
    heading: "Golf Retailers", subheading: "The right equipment, from people who know the game.",
    description: "Independent golf retailers stock the brands the major chains overlook, offer knowledgeable service, and often provide fitting alongside purchase.",
    metaTitle: "Find Golf Retailers Near You — Club Fitting Directory",
    metaDesc: "Discover independent golf equipment retailers and pro shops across the US.",
  },
  "Golf Course / Pro Shop": {
    heading: "Golf Courses & Pro Shops", subheading: "Where the game is played — and properly equipped.",
    description: "Golf course pro shops sit at the intersection of play and purchase. Many offer club fitting services, club repair, and trade-in programmes.",
    metaTitle: "Golf Courses & Pro Shops with Fitting — Club Fitting Directory",
    metaDesc: "Find golf courses and pro shops that offer club fitting, equipment retail, and custom club services across the US.",
  },
  "Simulator": {
    heading: "Golf Simulator Venues", subheading: "Year-round practice, data-driven improvement.",
    description: "Indoor simulator venues have evolved well beyond arcade novelty. The best facilities run Trackman, Full Swing, or Foresight launch monitors.",
    metaTitle: "Golf Simulator Venues Near You — Club Fitting Directory",
    metaDesc: "Find golf simulator venues, indoor fitting bays, and Trackman facilities across the US.",
  },
  "Instruction": {
    heading: "Golf Instruction", subheading: "Better technique. Lower scores.",
    description: "Equipment can only take you so far — instruction fills the gap. This category covers dedicated golf teaching facilities and PGA professionals.",
    metaTitle: "Golf Instruction & Lessons Near You — Club Fitting Directory",
    metaDesc: "Find certified PGA golf instructors, teaching academies, and lesson facilities across the US.",
  },
  "Driving Range": {
    heading: "Driving Ranges", subheading: "The foundation of every great round.",
    description: "Driving ranges are where games are built and rebuilt. Many offer club demos, fitting services, and structured practice programmes.",
    metaTitle: "Driving Ranges Near You — Club Fitting Directory",
    metaDesc: "Find golf driving ranges, practice facilities, and ball-tracking ranges across the US.",
  },
}

export async function generateStaticParams() {
  const types = await getAllShopTypes().catch(() => [])
  return types.filter((t) => TYPE_TO_SLUG[t]).map((t) => ({ type: TYPE_TO_SLUG[t] }))
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params
  const shopType = SLUG_TO_TYPE[type]
  if (!shopType) return { title: "Category Not Found" }
  const content = CATEGORY_CONTENT[shopType]
  if (!content) return { title: shopType }

  return {
    title: content.metaTitle, description: content.metaDesc,
    alternates: { canonical: `${SITE_URL}/category/${type}` },
    openGraph: { title: content.heading, description: content.metaDesc, type: "website", url: `${SITE_URL}/category/${type}`, siteName: "Club Fitting Directory" },
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const shopType = SLUG_TO_TYPE[type]
  if (!shopType) notFound()

  const [{ shops, stateBreakdown }] = await Promise.all([
    getShopsForCategoryPage(shopType).catch(() => ({ shops: [], stateBreakdown: [] })),
    getAllStatesWithShops().catch(() => []),
  ])

  if (shops.length === 0) notFound()

  const content = CATEGORY_CONTENT[shopType] ?? { heading: shopType, subheading: "", description: "", metaTitle: shopType, metaDesc: "" }

  const cardProps: ListingCardProps[] = shops.map((s) => ({
    name: s.name, shop_type: s.shop_type, primary_service: s.primary_service,
    city: s.city, state: s.state, state_code: s.state_code, rating: s.rating,
    rating_tier: s.rating_tier, services: s.services, services_array: s.services_array ?? [],
    offers_fitting: s.offers_fitting, fitting_environment: s.fitting_environment,
    phone: s.phone, website: s.website, verified: s.verified, slug: s.slug,
  }))

  const otherCategories = Object.entries(SLUG_TO_TYPE)
    .filter(([, t]) => t !== shopType)
    .map(([slug, t]) => ({ slug, label: CATEGORY_CONTENT[t]?.heading ?? t }))

  return (
    <div className="min-h-screen bg-[var(--color-off-white)]">

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-[var(--color-gray-light)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <ol className="flex flex-wrap items-center gap-1.5 font-[family-name:var(--font-body)] text-xs text-[var(--color-gray)]">
            <li><Link href="/" className="hover:text-[var(--color-green-deep)] transition-colors">Home</Link></li>
            <li aria-hidden="true" className="text-[var(--color-gray-light)]">/</li>
            <li className="text-[var(--color-black)]" aria-current="page">{content.heading}</li>
          </ol>
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-[var(--color-gray-light)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.3em] uppercase text-[var(--color-green-deep)] mb-3">Club Fitting Directory</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-normal text-[var(--color-black)] leading-tight mb-3">{content.heading}</h1>
          {content.subheading && (
            <p className="font-[family-name:var(--font-body)] text-lg italic text-[var(--color-green-deep)] mb-5">{content.subheading}</p>
          )}
          <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-gray)] max-w-3xl leading-relaxed mb-6">{content.description}</p>
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-gray)]">
            <span className="text-[var(--color-black)] tabular-nums font-medium">{shops.length.toLocaleString()}</span>{" "}listings across{" "}
            <span className="text-[var(--color-black)] tabular-nums font-medium">{stateBreakdown.length}</span>{" "}{stateBreakdown.length === 1 ? "state" : "states"}
          </p>
        </div>
      </header>

      {/* Listings */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <CategoryListings shops={cardProps} stateBreakdown={stateBreakdown} />
      </main>

      {/* Top states */}
      {stateBreakdown.length > 0 && (
        <section className="border-t border-[var(--color-gray-light)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-black)] mb-6">Browse by State</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {stateBreakdown.slice(0, 24).map((s) => (
                <Link key={s.state_code} href={`/state/${s.state_code.toLowerCase()}`}
                  className="flex flex-col gap-0.5 p-3 rounded-md border border-[var(--color-gray-light)] bg-white hover:border-[var(--color-green-deep)] hover:bg-[#1B43320A] transition-colors duration-150 group">
                  <span className="font-[family-name:var(--font-body)] text-xs font-semibold tracking-wide text-[var(--color-black)] group-hover:text-[var(--color-green-deep)] transition-colors tabular-nums">{s.state_code}</span>
                  <span className="font-[family-name:var(--font-body)] text-[10px] text-[var(--color-gray)] leading-tight">{s.state}</span>
                  <span className="font-[family-name:var(--font-body)] text-[9px] text-[var(--color-gray)] tabular-nums mt-0.5">{s.count} listing{s.count !== 1 ? "s" : ""}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other categories */}
      <section className="border-t border-[var(--color-gray-light)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-black)] mb-6">Browse Other Categories</h2>
          <div className="flex flex-wrap gap-3">
            {otherCategories.map(({ slug, label }) => (
              <Link key={slug} href={`/category/${slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-[var(--color-gray-light)] bg-white hover:border-[var(--color-green-deep)] font-[family-name:var(--font-body)] text-sm text-[var(--color-gray)] hover:text-[var(--color-black)] transition-colors duration-150">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Back */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <Link href="/directory" className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-green-deep)] hover:text-[var(--color-green-hover)] transition-colors group">
          <span className="inline-block transition-transform group-hover:-translate-x-0.5" aria-hidden="true">←</span>
          Back to Directory
        </Link>
      </div>
    </div>
  )
}
