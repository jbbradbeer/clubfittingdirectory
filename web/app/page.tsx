import Link from "next/link"
import { Search, Star, MapPin, Store, Wrench, ShoppingBag, Target, Warehouse, Users } from "lucide-react"
import { getTopRatedShops, getAllStatesWithShops, getShopTypeCounts, getDirectoryStats } from "@/lib/supabase/queries/shops"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { Button } from "@/components/ui/Button"
import { ListingCard } from "@/components/directory/ListingCard"
import { SITE_NAME } from "@/lib/constants"

export const revalidate = 3600

/* ─── Category metadata ─── */
const CATEGORY_META: Record<string, { icon: React.ReactNode; label: string; slug: string }> = {
  Clubfitter:       { icon: <Wrench size={24} />,       label: "Club Fitters",      slug: "club-fitters" },
  "Golf Retailer":  { icon: <ShoppingBag size={24} />,  label: "Golf Retailers",    slug: "golf-retailers" },
  "Pro Shop":       { icon: <Store size={24} />,        label: "Pro Shops",         slug: "pro-shops" },
  "Golf Simulator": { icon: <Target size={24} />,       label: "Golf Simulators",   slug: "golf-simulators" },
  "Golf Warehouse": { icon: <Warehouse size={24} />,    label: "Golf Warehouses",   slug: "golf-warehouses" },
  "Other":          { icon: <Users size={24} />,        label: "Other",             slug: "other" },
}

const STEPS = [
  { icon: <Search size={24} />, title: "Search your area", body: "Browse by city, state, or shop name to find fitters near you." },
  { icon: <Star size={24} />,   title: "Compare fitters",  body: "Check ratings, services, and fitting options side by side." },
  { icon: <MapPin size={24} />, title: "Visit & get fit",  body: "Contact the shop, book a session, and dial in your game." },
]

export default async function HomePage() {
  const [topShops, states, typeCounts, stats] = await Promise.all([
    getTopRatedShops(6).catch(() => []),
    getAllStatesWithShops().catch(() => []),
    getShopTypeCounts().catch(() => ({} as Record<string, number>)),
    getDirectoryStats().catch(() => ({ total: 1049, states: 50, fitters: 400 })),
  ])

  const categories = Object.entries(CATEGORY_META)
    .map(([type, meta]) => ({ ...meta, count: typeCounts[type] ?? 0 }))
    .filter((c) => c.count > 0)

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--color-ivory)] border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <p className="section-label mb-5">The Club Fitting Directory</p>
          <h1 className="display text-[clamp(2.5rem,7vw,5rem)] text-[var(--color-charcoal)]">
            Find your perfect club fitter.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-[var(--color-charcoal-light)] leading-relaxed">
            Search {stats.total.toLocaleString()}+ independent golf club fitters,
            retailers, and simulators across all 50 states.
          </p>

          {/* Search */}
          <form
            action="/directory"
            method="GET"
            className="mt-10 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
          >
            <div className="relative flex-1">
              <Search
                size={20}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)]"
              />
              <input
                type="text"
                name="q"
                placeholder="City or shop name..."
                className="w-full pl-12 pr-5 py-4 bg-[var(--color-paper)] border border-[var(--color-border)] shadow-card rounded-full text-base text-[var(--color-charcoal)] placeholder:text-[var(--color-charcoal-light)] focus:outline-none focus:border-[var(--color-forest)] focus:ring-2 focus:ring-[var(--color-forest)]/15 transition-all"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-[var(--color-forest)] text-white text-base font-semibold rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer"
            >
              <Search size={18} />
              Search
            </button>
          </form>

          {/* Trust line */}
          <div className="mt-7 flex items-center justify-center gap-x-3 gap-y-2 flex-wrap text-sm text-[var(--color-charcoal-light)]">
            <span>
              <strong className="text-[var(--color-charcoal)] font-semibold">{stats.total.toLocaleString()}</strong> Fitters
            </span>
            <span className="text-[var(--color-border)]">•</span>
            <span>
              <strong className="text-[var(--color-charcoal)] font-semibold">{stats.states}</strong> States
            </span>
            <span className="text-[var(--color-border)]">•</span>
            <span>Curated &amp; Independent</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CATEGORY CIRCLES
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--color-ivory)] py-12 md:py-16 border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-center gap-6 sm:gap-10 flex-wrap">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="group flex flex-col items-center gap-3 w-24"
              >
                <span className="flex items-center justify-center w-16 h-16 rounded-full border border-[var(--color-border)] bg-[var(--color-paper)] text-[var(--color-forest)] shadow-card group-hover:bg-[var(--color-forest)] group-hover:text-white group-hover:border-[var(--color-forest)] transition-colors">
                  {cat.icon}
                </span>
                <span className="text-xs font-semibold text-center text-[var(--color-charcoal)] leading-tight">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HIGHEST RATED
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--color-cream)] py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <SectionHeader eyebrow="Top Rated" title="Highest-rated fitters" centered={false} />
            <Button href="/directory" variant="outline" size="sm">
              View all fitters
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {topShops.map((shop) => (
              <ListingCard key={shop.slug} {...shop} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          BROWSE BY STATE
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--color-ivory)] py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <SectionHeader eyebrow="Explore" title="Browse by state" centered={false} />
            <Button href="/states" variant="outline" size="sm">
              View all states
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {states.map((s) => (
              <Link
                key={s.state_code}
                href={`/state/${s.state_code.toLowerCase()}`}
                className="flex flex-col items-center justify-center py-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] shadow-card hover:bg-[var(--color-forest)] hover:border-[var(--color-forest)] transition-colors group"
              >
                <span
                  className="text-base font-bold text-[var(--color-charcoal)] group-hover:text-white transition-colors"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.state_code}
                </span>
                <span className="text-[11px] text-[var(--color-charcoal-light)] group-hover:text-white/70 mt-0.5 transition-colors">
                  {s.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--color-cream)] py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="How It Works" title="Find your fit in three steps" />
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10">
            {STEPS.map((step, i) => (
              <div key={step.title} className="text-center">
                <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-forest-tint)] text-[var(--color-forest)] mb-5">
                  {step.icon}
                </span>
                <p className="text-sm font-semibold text-[var(--color-gold-ink)] mb-2">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="text-xl font-bold text-[var(--color-charcoal)]">{step.title}</h3>
                <p className="mt-2 text-[var(--color-charcoal-light)] leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CLOSING CTA
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--color-forest-deep)] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <p className="section-label mb-5" style={{ color: "var(--color-gold)" }}>
            About the Directory
          </p>
          <h2 className="text-3xl md:text-[2.6rem] font-bold text-white leading-[1.1]">
            The right fit changes the game.
          </h2>
          <p className="mt-6 max-w-xl mx-auto text-white/70 leading-relaxed">
            {SITE_NAME} brings together the finest independent club fitters and golf
            retailers across all 50 states — every listing curated, every detail verified.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button href="/directory" variant="secondary">
              Find a fitter
            </Button>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              About us
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
