import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  getAllShopTypes,
  getShopsForCategoryPage,
  getAllStatesWithShops,
} from "@/lib/supabase/queries/shops"
import { CategoryListings } from "@/components/category/CategoryListings"
import type { ListingCardProps } from "@/types/shop"

/* ─────────────────────────────────────────────────────────
   /category/[type] — Shop-type index page
   Primary long-tail SEO targets:
   "golf club fitters near me", "golf simulators in Texas" etc.

   URL slugs are kebab-case; DB values are Title Case.
   All listings fetched server-side and passed to a client
   component that handles state-filter chips + pagination.
   ───────────────────────────────────────────────────────── */

export const revalidate = 86400

import { SITE_URL } from "@/lib/constants"

/* ── Slug ↔ DB value mapping ── */
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

/* ── Editorial content per category ── */
interface CategoryMeta {
  heading:     string
  subheading:  string
  description: string
  metaTitle:   string
  metaDesc:    string
}

const CATEGORY_CONTENT: Record<string, CategoryMeta> = {
  "Clubfitter": {
    heading:    "Golf Club Fitters",
    subheading: "Precision fitting. Measurable improvement.",
    description:
      "A proper fitting session is the highest-return investment in golf. Our directory lists independent club fitters and boutique fitting studios across the United States — professionals who use launch monitors, shaft profiling, and decades of hands-on experience to match equipment to your swing. Whether you're a scratch player optimising spin and dispersion or a beginner getting fitted for the first time, the right fitter makes the difference.",
    metaTitle: "Find a Golf Club Fitter Near You — Club Fitting Directory",
    metaDesc:  "Browse 500+ certified golf club fitters across the US. Find independent fitting studios, Trackman specialists, and custom club builders near you.",
  },
  "Retailer": {
    heading:    "Golf Retailers",
    subheading: "The right equipment, from people who know the game.",
    description:
      "Independent golf retailers stock the brands the major chains overlook, offer knowledgeable service, and often provide fitting alongside purchase. This category covers dedicated golf equipment shops — from single-location boutiques that carry curated shafts and heads to regional multi-door retailers with in-house fitting bays. If you want more than a box off a shelf, these are your people.",
    metaTitle: "Find Golf Retailers Near You — Club Fitting Directory",
    metaDesc:  "Discover independent golf equipment retailers and pro shops across the US. Shop for clubs, shafts, and custom builds with expert guidance.",
  },
  "Golf Course / Pro Shop": {
    heading:    "Golf Courses & Pro Shops",
    subheading: "Where the game is played — and properly equipped.",
    description:
      "Golf course pro shops sit at the intersection of play and purchase. Many offer club fitting services, club repair, and trade-in programmes in addition to equipment retail. For golfers who prefer to buy from a facility they already trust and play, these listings cover courses with active, well-staffed pro shops across the country.",
    metaTitle: "Golf Courses & Pro Shops with Fitting — Club Fitting Directory",
    metaDesc:  "Find golf courses and pro shops that offer club fitting, equipment retail, and custom club services across the US.",
  },
  "Simulator": {
    heading:    "Golf Simulator Venues",
    subheading: "Year-round practice, data-driven improvement.",
    description:
      "Indoor simulator venues have evolved well beyond arcade novelty. The best facilities run Trackman, Full Swing, or Foresight launch monitors and offer fitting sessions, league play, and private coaching in climate-controlled bays. This category covers standalone simulator venues, simulator bars, and mixed-use facilities where technology meets the love of the game.",
    metaTitle: "Golf Simulator Venues Near You — Club Fitting Directory",
    metaDesc:  "Find golf simulator venues, indoor fitting bays, and Trackman facilities across the US. Practice and get fitted year-round.",
  },
  "Instruction": {
    heading:    "Golf Instruction",
    subheading: "Better technique. Lower scores.",
    description:
      "Equipment can only take you so far — instruction fills the gap. This category covers dedicated golf teaching facilities, PGA professionals offering private lessons, and academies with structured curriculum. Many listed professionals integrate club fitting into their teaching programmes, ensuring the equipment matches the technique being developed.",
    metaTitle: "Golf Instruction & Lessons Near You — Club Fitting Directory",
    metaDesc:  "Find certified PGA golf instructors, teaching academies, and lesson facilities across the US. Improve your swing with expert coaching.",
  },
  "Driving Range": {
    heading:    "Driving Ranges",
    subheading: "The foundation of every great round.",
    description:
      "Driving ranges are where games are built and rebuilt. This category covers stand-alone ranges, technology-enabled facilities with ball-tracking systems, and ranges attached to fitting studios. Many offer club demos, fitting services, and structured practice programmes. A great range is an underrated resource — and there are more of them than you think.",
    metaTitle: "Driving Ranges Near You — Club Fitting Directory",
    metaDesc:  "Find golf driving ranges, practice facilities, and ball-tracking ranges across the US. Discover ranges with fitting, demos, and structured practice.",
  },
}

/* ── generateStaticParams — pre-build a page for every known type ── */
export async function generateStaticParams() {
  const types = await getAllShopTypes().catch(() => [])
  return types
    .filter((t) => TYPE_TO_SLUG[t])
    .map((t) => ({ type: TYPE_TO_SLUG[t] }))
}

/* ── generateMetadata — unique SEO meta per category ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>
}): Promise<Metadata> {
  const { type } = await params
  const shopType = SLUG_TO_TYPE[type]
  if (!shopType) return { title: "Category Not Found" }

  const content = CATEGORY_CONTENT[shopType]
  if (!content) return { title: shopType }

  return {
    title:       content.metaTitle,
    description: content.metaDesc,
    alternates:  { canonical: `${SITE_URL}/category/${type}` },
    openGraph: {
      title:       content.heading,
      description: content.metaDesc,
      type:        "website",
      url:         `${SITE_URL}/category/${type}`,
      siteName:    "Club Fitting Directory",
    },
  }
}

/* ── Page ── */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = await params
  const shopType = SLUG_TO_TYPE[type]
  if (!shopType) notFound()

  const [{ shops, stateBreakdown }, allStates] = await Promise.all([
    getShopsForCategoryPage(shopType).catch(() => ({ shops: [], stateBreakdown: [] })),
    getAllStatesWithShops().catch(() => []),
  ])

  if (shops.length === 0) notFound()

  const content = CATEGORY_CONTENT[shopType] ?? {
    heading:     shopType,
    subheading:  "",
    description: "",
    metaTitle:   shopType,
    metaDesc:    "",
  }

  /* Shape into ListingCardProps */
  const cardProps: ListingCardProps[] = shops.map((s) => ({
    name:                s.name,
    shop_type:           s.shop_type,
    primary_service:     s.primary_service,
    city:                s.city,
    state:               s.state,
    state_code:          s.state_code,
    rating:              s.rating,
    rating_tier:         s.rating_tier,
    services:            s.services,
    services_array:      s.services_array ?? [],
    offers_fitting:      s.offers_fitting,
    fitting_environment: s.fitting_environment,
    phone:               s.phone,
    website:             s.website,
    verified:            s.verified,
    slug:                s.slug,
  }))

  /* Other categories for the "Browse" section */
  const otherCategories = Object.entries(SLUG_TO_TYPE)
    .filter(([, t]) => t !== shopType)
    .map(([slug, t]) => ({
      slug,
      label: CATEGORY_CONTENT[t]?.heading ?? t,
    }))

  return (
    <div className="min-h-screen bg-[var(--color-green-deep)]">

      {/* ── Breadcrumb ── */}
      <nav
        aria-label="Breadcrumb"
        className="border-b border-[color-mix(in_srgb,var(--color-brass)_15%,transparent)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <ol className="flex flex-wrap items-center gap-1.5 font-[family-name:var(--font-body)] text-xs text-[var(--color-ivory-warm)]">
            <li>
              <Link href="/" className="hover:text-[var(--color-brass)] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-[color-mix(in_srgb,var(--color-ivory-warm)_30%,transparent)]">/</li>
            <li className="text-[var(--color-ivory)]" aria-current="page">{content.heading}</li>
          </ol>
        </div>
      </nav>

      {/* ── Header ── */}
      <header className="border-b border-[color-mix(in_srgb,var(--color-brass)_15%,transparent)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.3em] uppercase text-[var(--color-brass)] mb-3">
            Club Fitting Directory
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-black text-[var(--color-ivory)] leading-tight mb-3">
            {content.heading}
          </h1>
          {content.subheading && (
            <p className="font-[family-name:var(--font-body)] text-lg italic text-[var(--color-brass)] mb-5">
              {content.subheading}
            </p>
          )}
          <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-ivory-warm)] max-w-3xl leading-relaxed mb-6">
            {content.description}
          </p>
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)]">
            <span className="font-[family-name:var(--font-mono)] text-[var(--color-ivory)] tabular-nums">
              {shops.length.toLocaleString()}
            </span>{" "}
            listings across{" "}
            <span className="font-[family-name:var(--font-mono)] text-[var(--color-ivory)] tabular-nums">
              {stateBreakdown.length}
            </span>{" "}
            {stateBreakdown.length === 1 ? "state" : "states"}
          </p>
        </div>
      </header>

      {/* ── Listings with client-side state filter ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <CategoryListings shops={cardProps} stateBreakdown={stateBreakdown} />
      </main>

      {/* ── Top states for this category ── */}
      {stateBreakdown.length > 0 && (
        <section className="border-t border-[color-mix(in_srgb,var(--color-brass)_15%,transparent)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-ivory)] mb-6">
              Browse by State
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {stateBreakdown.slice(0, 24).map((s) => (
                <Link
                  key={s.state_code}
                  href={`/state/${s.state_code.toLowerCase()}`}
                  className="flex flex-col gap-0.5 p-3 rounded-sm border border-[color-mix(in_srgb,var(--color-ivory)_10%,transparent)] bg-[var(--color-green-mid)] hover:border-[var(--color-brass)] hover:bg-[color-mix(in_srgb,var(--color-brass)_8%,transparent)] transition-all duration-150 group"
                >
                  <span className="font-[family-name:var(--font-mono)] text-xs font-bold tracking-wide text-[var(--color-ivory)] group-hover:text-[var(--color-brass)] transition-colors">
                    {s.state_code}
                  </span>
                  <span className="font-[family-name:var(--font-body)] text-[10px] text-[var(--color-ivory-warm)] leading-tight">
                    {s.state}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--color-ivory-warm)] tabular-nums mt-0.5">
                    {s.count} listing{s.count !== 1 ? "s" : ""}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Browse other categories ── */}
      <section className="border-t border-[color-mix(in_srgb,var(--color-brass)_15%,transparent)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-ivory)] mb-6">
            Browse Other Categories
          </h2>
          <div className="flex flex-wrap gap-3">
            {otherCategories.map(({ slug, label }) => (
              <Link
                key={slug}
                href={`/category/${slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm border border-[color-mix(in_srgb,var(--color-ivory)_15%,transparent)] bg-[var(--color-green-mid)] hover:border-[var(--color-brass)] hover:bg-[color-mix(in_srgb,var(--color-brass)_8%,transparent)] font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)] hover:text-[var(--color-ivory)] transition-all duration-150"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Back link ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <Link
          href="/directory"
          className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-brass)] hover:text-[var(--color-brass-light)] transition-colors group"
        >
          <span className="inline-block transition-transform group-hover:-translate-x-0.5" aria-hidden="true">←</span>
          Back to Directory
        </Link>
      </div>

    </div>
  )
}
