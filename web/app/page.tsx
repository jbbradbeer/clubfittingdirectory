import Link from "next/link"
import { SITE_URL } from "@/lib/constants"
import { Button } from "@/components/ui/Button"
import { ListingCard } from "@/components/directory/ListingCard"
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
    canonical: SITE_URL,
  },
}

export const revalidate = 3600

export default async function HomePage() {
  const [topShops, stateData, typeCounts, stats] = await Promise.all([
    getTopRatedShops(6).catch(() => []),
    getAllStatesWithShops().catch(() => []),
    getShopTypeCounts().catch(() => ({})),
    getDirectoryStats().catch(() => ({ total: 0, states: 0, fitters: 0 })),
  ])

  const totalListings = stats.total ?? 0

  return (
    <div className="flex flex-col">
      <HeroSection total={totalListings} />
      {topShops.length > 0 && <TopRatedSection shops={topShops} />}
      <CategorySection typeCounts={typeCounts} />
      <StateGridSection states={stateData} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   1. HERO — deep green bg, white text, centered search bar
   ───────────────────────────────────────────────────────── */
function HeroSection({ total }: { total: number }) {
  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden bg-[var(--color-green-deep)] px-4 sm:px-6 py-24 sm:py-32">
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
        <h1
          className="font-[family-name:var(--font-display)] font-normal text-white leading-[1.1]"
          style={{ fontSize: "clamp(2.75rem,8vw,5rem)" }}
        >
          Find Your Fitter.
        </h1>

        <p className="font-[family-name:var(--font-body)] text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          {total.toLocaleString()}+ independent fitters, clubmakers, and golf
          retailers across all 50 states.
        </p>

        {/* Search bar CTA */}
        <div className="max-w-lg mx-auto w-full">
          <Link
            href="/directory"
            className="flex items-center gap-3 w-full bg-white/10 border border-white/20 rounded-md px-5 py-4 text-left hover:bg-white/15 transition-colors group"
          >
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-gray-300 shrink-0" aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="font-[family-name:var(--font-body)] text-gray-300 text-sm">
              Search fitters, cities, or shops...
            </span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button variant="outline" size="lg" asChild>
            <Link href="/directory" className="!text-white !border-white/40 hover:!bg-white/10">
              Search the Directory
            </Link>
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link href="/states" className="!text-gray-300 hover:!text-white">
              Browse by State
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   2. TOP RATED — off-white bg, white cards
   ───────────────────────────────────────────────────────── */
async function TopRatedSection({
  shops,
}: {
  shops: Awaited<ReturnType<typeof getTopRatedShops>>
}) {
  return (
    <section className="bg-[var(--color-off-white)] py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.3em] uppercase text-[var(--color-green-deep)] mb-2">
              Top Rated
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-normal text-[var(--color-black)]">
              Highest Rated Fitters
            </h2>
            <p className="font-[family-name:var(--font-body)] text-[var(--color-gray)] mt-2 text-sm">
              The highest-rated club fitting studios in the directory
            </p>
          </div>
          <Link
            href="/directory"
            className="shrink-0 font-[family-name:var(--font-body)] text-sm text-[var(--color-green-deep)] hover:text-[var(--color-green-hover)] transition-colors whitespace-nowrap group"
          >
            View All{" "}
            <span className="inline-block transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
          </Link>
        </div>

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
   3. CATEGORIES — white cards, gray borders, green icons
   ───────────────────────────────────────────────────────── */
const CATEGORIES: { type: string; label: string; icon: ReactNode; href: string }[] = [
  { type: "Clubfitter", label: "Club Fitters", icon: <Club size={28} strokeWidth={1.5} />, href: "/category/club-fitters" },
  { type: "Retailer", label: "Retailers", icon: <ShoppingBag size={28} strokeWidth={1.5} />, href: "/category/golf-retailers" },
  { type: "Simulator", label: "Simulators", icon: <Monitor size={28} strokeWidth={1.5} />, href: "/category/simulators" },
  { type: "Instruction", label: "Instruction", icon: <GraduationCap size={28} strokeWidth={1.5} />, href: "/category/instruction" },
  { type: "Driving Range", label: "Driving Ranges", icon: <Target size={28} strokeWidth={1.5} />, href: "/category/driving-ranges" },
  { type: "Golf Course / Pro Shop", label: "Pro Shops", icon: <Flag size={28} strokeWidth={1.5} />, href: "/category/golf-courses" },
]

function CategorySection({ typeCounts }: { typeCounts: Record<string, number> }) {
  return (
    <section className="bg-white py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.3em] uppercase text-[var(--color-green-deep)] mb-2">
            Browse the Directory
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-normal text-[var(--color-black)]">
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
                className="group flex flex-col gap-3 p-6 bg-white border border-[var(--color-gray-light)] rounded-md hover:border-[var(--color-green-deep)] transition-colors duration-200"
              >
                <span className="text-[var(--color-green-deep)]">{cat.icon}</span>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-normal text-[var(--color-black)] leading-tight mb-1">
                    {cat.label}
                  </h3>
                  <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-gray)] tabular-nums">
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
   4. STATES — white tiles, green highlights
   ───────────────────────────────────────────────────────── */
function StateGridSection({
  states,
}: {
  states: { state_code: string; state: string; count: number }[]
}) {
  return (
    <section className="bg-[var(--color-off-white)] py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.3em] uppercase text-[var(--color-green-deep)] mb-2">
              Browse the Directory
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-normal text-[var(--color-black)]">
              By State
            </h2>
          </div>
          <Link
            href="/states"
            className="shrink-0 font-[family-name:var(--font-body)] text-sm text-[var(--color-green-deep)] hover:text-[var(--color-green-hover)] transition-colors whitespace-nowrap group"
          >
            All States{" "}
            <span className="inline-block transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
          </Link>
        </div>

        {states.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {states.map((s) => {
              const isHighlighted = s.count >= 40
              return (
                <Link
                  key={s.state_code}
                  href={`/state/${s.state_code.toLowerCase()}`}
                  title={`${s.state} — ${s.count} listings`}
                  className={[
                    "flex flex-col items-center justify-center gap-0.5 py-3 px-2 rounded-md text-center",
                    "border transition-colors duration-150 group",
                    isHighlighted
                      ? "border-[var(--color-green-deep)] bg-[#1B43320A]"
                      : "border-[var(--color-gray-light)] bg-white",
                    "hover:border-[var(--color-green-deep)] hover:bg-[#1B43320A]",
                  ].join(" ")}
                >
                  <span className={[
                    "font-[family-name:var(--font-body)] text-sm font-semibold tracking-wide transition-colors tabular-nums",
                    isHighlighted ? "text-[var(--color-green-deep)]" : "text-[var(--color-black)] group-hover:text-[var(--color-green-deep)]",
                  ].join(" ")}>
                    {s.state_code}
                  </span>
                  <span className="font-[family-name:var(--font-body)] text-[9px] text-[var(--color-gray)] tabular-nums">
                    {s.count}
                  </span>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="font-[family-name:var(--font-body)] text-[var(--color-gray)] text-sm">
            State listings will appear once shop data has been loaded into the database.
          </p>
        )}
      </div>
    </section>
  )
}
