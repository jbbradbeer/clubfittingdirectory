import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { ListingCard } from "@/components/directory/ListingCard"
import { NewsletterCTA } from "@/components/layout/NewsletterCTA"
import {
  getTopRatedShops,
  getAllStatesWithShops,
  getShopTypeCounts,
  getDirectoryStats,
} from "@/lib/supabase/queries/shops"
import {
  Club,
  ShoppingBag,
  Monitor,
  GraduationCap,
  Target,
  Flag,
} from "lucide-react"
import type { ReactNode } from "react"
import type { Metadata } from "next"

/* ─────────────────────────────────────────────────────────
   HOMEPAGE
   Server Component — all data fetched at build time / request
   time on the server. No client-side loading states needed.
   ───────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Club Fitting Directory — Independent Golf Fitters Across the US",
  description:
    "Find independent golf club fitting shops near you. Browse over 1,000 fitters, simulators, and retailers across all 50 states — curated by The Tuxedo Collective.",
  alternates: {
    canonical: "https://clubfittingdirectory.com",
  },
}

export const revalidate = 3600 // Regenerate every hour

export default async function HomePage() {
  /* Fetch all data in parallel — faster than sequential awaits */
  const [topShops, stateData, typeCounts, stats] = await Promise.all([
    getTopRatedShops(6).catch(() => []),
    getAllStatesWithShops().catch(() => []),
    getShopTypeCounts().catch(() => ({})),
    getDirectoryStats().catch(() => ({ total: 0, states: 0, fitters: 0 })),
  ])

  const totalListings = stats.total || 1200

  return (
    <div className="flex flex-col">
      {/* ── 1. HERO ── */}
      <HeroSection total={totalListings} />

      {/* ── 2. STATS BAR ── */}
      <StatsBar stats={stats} />

      {/* ── 3. TOP RATED FITTERS ── */}
      {topShops.length > 0 && (
        <TopRatedSection shops={topShops} />
      )}

      {/* ── 4. BROWSE BY CATEGORY ── */}
      <CategorySection typeCounts={typeCounts} />

      {/* ── 5. BROWSE BY STATE ── */}
      <StateGridSection states={stateData} />

      {/* ── 6. NEWSLETTER CTA ── */}
      <section className="bg-[var(--color-green-mid)] py-4">
        <NewsletterCTA variant="hero" />
      </section>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   1. HERO SECTION
   ───────────────────────────────────────────────────────── */
function HeroSection({ total }: { total: number }) {
  return (
    <section className="relative min-h-svh flex flex-col items-center justify-center overflow-hidden bg-[var(--color-green-deep)] px-4 sm:px-6 py-24">

      {/* Decorative watermark: "EST. 2024" */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 flex items-center justify-center"
      >
        <span
          className="font-[family-name:var(--font-display)] font-black leading-none tracking-widest opacity-30 rotate-[-8deg] whitespace-nowrap"
          style={{
            fontSize: "clamp(6rem,22vw,16rem)",
            color: "var(--color-green-mid)",
          }}
        >
          EST. 2024
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">

        {/* Eyebrow */}
        <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.35em] uppercase text-[var(--color-brass)]">
          A Tuxedo Collective Directory
        </p>

        {/* Headline */}
        <h1
          className="font-[family-name:var(--font-display)] font-black text-[var(--color-ivory)] leading-[1.05]"
          style={{ fontSize: "clamp(2.75rem,8vw,5.5rem)" }}
        >
          Find Your Fitter.
          <br />
          <span className="text-[var(--color-brass)]">The Definitive Directory</span>
          <br />
          of Golf&rsquo;s Finest{" "}
          <em className="not-italic text-[var(--color-ivory-warm)]">
            Club Fitting Studios.
          </em>
        </h1>

        {/* Subtext */}
        <p className="font-[family-name:var(--font-body)] text-lg sm:text-xl text-[var(--color-ivory-warm)] max-w-2xl mx-auto leading-relaxed">
          {total.toLocaleString()}+ vetted fitters, clubmakers, and golf
          retailers across all 50 states.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button variant="primary" size="lg" asChild>
            <Link href="/shops">Search the Directory</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/states">Browse by State</Link>
          </Button>
        </div>

        {/* Brass rule separator */}
        <div className="flex items-center gap-4 pt-4 max-w-xs mx-auto" aria-hidden="true">
          <span className="flex-1 brass-rule" />
          <span className="w-1 h-1 rounded-full bg-[var(--color-brass)]" />
          <span className="flex-1 brass-rule" />
        </div>

        {/* Inline newsletter prompt */}
        <div className="pt-2">
          <NewsletterCTA variant="hero" />
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   2. STATS BAR
   ───────────────────────────────────────────────────────── */
function StatsBar({
  stats,
}: {
  stats: { total: number; states: number; fitters: number }
}) {
  const items = [
    { number: `${(stats.total || 1200).toLocaleString()}+`, label: "Listings" },
    { number: "All 50",                                      label: "States" },
    { number: "6",                                           label: "Shop Categories" },
    { number: "Free",                                        label: "To Search" },
  ]

  return (
    <section className="bg-[var(--color-green-deep)] border-y border-[color-mix(in_srgb,var(--color-brass)_25%,transparent)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={[
                "flex flex-col items-center justify-center py-6 px-4 text-center",
                i < items.length - 1
                  ? "border-r border-[color-mix(in_srgb,var(--color-brass)_20%,transparent)]"
                  : "",
              ].join(" ")}
            >
              <dt className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-[var(--color-brass)] leading-none mb-1">
                {item.number}
              </dt>
              <dd className="font-[family-name:var(--font-body)] text-xs text-[var(--color-ivory-warm)] tracking-[0.15em] uppercase">
                {item.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   3. TOP RATED FITTERS
   ───────────────────────────────────────────────────────── */
async function TopRatedSection({
  shops,
}: {
  shops: Awaited<ReturnType<typeof getTopRatedShops>>
}) {
  return (
    <section className="bg-[var(--color-green-deep)] py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.3em] uppercase text-[var(--color-brass)] mb-2">
              Editor&rsquo;s Selection
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--color-ivory)]">
              Top Rated Fitters
            </h2>
            <p className="font-[family-name:var(--font-body)] text-[var(--color-ivory-warm)] mt-2 text-sm">
              The highest-rated club fitting studios in the directory
            </p>
          </div>
          <Link
            href="/shops"
            className="shrink-0 font-[family-name:var(--font-body)] text-sm text-[var(--color-brass)] hover:text-[var(--color-brass-light)] transition-colors whitespace-nowrap group"
          >
            View All{" "}
            <span className="inline-block transition-transform group-hover:translate-x-0.5" aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shops.map((shop) => (
            <ListingCard
              key={shop.id}
              name={shop.name}
              shop_type={shop.shop_type}
              primary_service={shop.primary_service}
              city={shop.city}
              state={shop.state}
              state_code={shop.state_code}
              rating={shop.rating}
              rating_tier={shop.rating_tier}
              services={shop.services}
              services_array={shop.services_array ?? []}
              offers_fitting={shop.offers_fitting}
              fitting_environment={shop.fitting_environment}
              phone={shop.phone}
              website={shop.website}
              verified={shop.verified}
              slug={shop.slug}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   4. BROWSE BY CATEGORY
   ───────────────────────────────────────────────────────── */

const CATEGORIES: {
  type: string
  label: string
  icon: ReactNode
  href: string
}[] = [
  {
    type: "Clubfitter",
    label: "Club Fitters",
    icon: <Club size={28} strokeWidth={1.5} />,
    href: "/category/clubfitter",
  },
  {
    type: "Retailer",
    label: "Retailers",
    icon: <ShoppingBag size={28} strokeWidth={1.5} />,
    href: "/category/retailer",
  },
  {
    type: "Simulator",
    label: "Simulators",
    icon: <Monitor size={28} strokeWidth={1.5} />,
    href: "/category/simulator",
  },
  {
    type: "Instruction",
    label: "Instruction",
    icon: <GraduationCap size={28} strokeWidth={1.5} />,
    href: "/category/instruction",
  },
  {
    type: "Driving Range",
    label: "Driving Ranges",
    icon: <Target size={28} strokeWidth={1.5} />,
    href: "/category/driving-range",
  },
  {
    type: "Golf Course / Pro Shop",
    label: "Pro Shops",
    icon: <Flag size={28} strokeWidth={1.5} />,
    href: "/category/pro-shop",
  },
]

function CategorySection({ typeCounts }: { typeCounts: Record<string, number> }) {
  return (
    <section className="bg-[var(--color-green-mid)] py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.3em] uppercase text-[var(--color-brass)] mb-2">
            Browse the Directory
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--color-ivory)]">
            By Category
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const count = typeCounts[cat.type] ?? 0
            return (
              <Link
                key={cat.type}
                href={cat.href}
                className={[
                  "group flex flex-col gap-3 p-6",
                  "bg-[var(--color-green-deep)]",
                  "border border-[color-mix(in_srgb,var(--color-brass)_18%,transparent)]",
                  "rounded-sm",
                  "hover:border-[color-mix(in_srgb,var(--color-brass)_55%,transparent)]",
                  "hover:bg-[color-mix(in_srgb,var(--color-green-mid)_60%,var(--color-green-deep))]",
                  "transition-all duration-200",
                  "shadow-[0_2px_8px_color-mix(in_srgb,#000_20%,transparent)]",
                  "hover:-translate-y-0.5 hover:shadow-[0_6px_20px_color-mix(in_srgb,#000_30%,transparent)]",
                ].join(" ")}
              >
                <span className="text-[var(--color-brass)] group-hover:text-[var(--color-brass-light)] transition-colors">
                  {cat.icon}
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ivory)] leading-tight mb-1">
                    {cat.label}
                  </h3>
                  <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ivory-warm)]">
                    {count > 0 ? `${count.toLocaleString()} listings` : "Listings"}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   5. BROWSE BY STATE
   ───────────────────────────────────────────────────────── */
function StateGridSection({
  states,
}: {
  states: { state_code: string; state: string; count: number }[]
}) {
  return (
    <section className="bg-[var(--color-green-deep)] py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.3em] uppercase text-[var(--color-brass)] mb-2">
              Browse the Directory
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--color-ivory)]">
              By State
            </h2>
          </div>
          <Link
            href="/states"
            className="shrink-0 font-[family-name:var(--font-body)] text-sm text-[var(--color-brass)] hover:text-[var(--color-brass-light)] transition-colors whitespace-nowrap group"
          >
            All States{" "}
            <span className="inline-block transition-transform group-hover:translate-x-0.5" aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        {states.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {states.map((s) => {
              const isHighlighted = s.count >= 40
              return (
                <Link
                  key={s.state_code}
                  href={`/states/${s.state_code.toLowerCase()}`}
                  title={`${s.state} — ${s.count} listings`}
                  className={[
                    "flex flex-col items-center justify-center gap-0.5",
                    "py-3 px-2 rounded-sm text-center",
                    "border transition-all duration-150",
                    isHighlighted
                      ? "border-[color-mix(in_srgb,var(--color-brass)_50%,transparent)] bg-[color-mix(in_srgb,var(--color-brass)_6%,transparent)]"
                      : "border-[color-mix(in_srgb,var(--color-ivory)_10%,transparent)] bg-[var(--color-green-mid)]",
                    "hover:border-[var(--color-brass)] hover:bg-[color-mix(in_srgb,var(--color-brass)_10%,transparent)]",
                    "group",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "font-[family-name:var(--font-mono)] text-sm font-bold tracking-wide transition-colors",
                      isHighlighted
                        ? "text-[var(--color-brass)]"
                        : "text-[var(--color-ivory)] group-hover:text-[var(--color-brass)]",
                    ].join(" ")}
                  >
                    {s.state_code}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--color-ivory-warm)] tabular-nums">
                    {s.count}
                  </span>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="font-[family-name:var(--font-body)] text-[var(--color-ivory-warm)] text-sm">
            State listings will appear once shop data has been loaded into the database.
          </p>
        )}
      </div>
    </section>
  )
}
