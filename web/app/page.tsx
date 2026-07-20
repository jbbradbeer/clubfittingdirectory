import Link from "next/link"
import { Store } from "lucide-react"
import { getTopRatedShops, getHomepageStats } from "@/lib/supabase/queries/shops"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { Button } from "@/components/ui/Button"
import { ListingGrid } from "@/components/directory/ListingGrid"
import { HeroSearch } from "@/components/home/HeroSearch"
import { CategoryChips } from "@/components/home/CategoryChips"
import { NewsletterForm } from "@/components/newsletter/NewsletterForm"
import { Reveal } from "@/lib/useReveal"
import { SHOP_TYPES } from "@/lib/shop-types"
import { SITE_URL } from "@/lib/constants"
import { logQueryError } from "@/lib/utils"
import { buildWebSiteSchema, buildOrganizationSchema } from "@/lib/structured-data"
import { JsonLd } from "@/components/seo/JsonLd"
import type { Metadata } from "next"

export const metadata: Metadata = {
  // `absolute` bypasses the layout's "%s | Club Fitting Directory" template so the
  // homepage gets a tight, keyword-led title rather than a long suffixed one.
  title: { absolute: "Golf Club Fitting Near You | Club Fitting Directory" },
  description:
    "Find independent golf club fitters, retailers, and simulators near you. Browse 700+ hand-vetted shops across all 50 states — compare ratings, services, and locations.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Golf Club Fitting Near You | Club Fitting Directory",
    description:
      "Find independent golf club fitters, retailers, and simulators near you across all 50 states.",
    url: SITE_URL,
    type: "website",
  },
}

// The homepage is rebuilt on-demand by /api/revalidate when a shop is added,
// removed, or has its rating / featured status changed (the only data shown
// here). The 30-day window is a self-healing safety net, NOT a refresh clock —
// it means a missed webhook still corrects itself within a month instead of
// rebuilding 24x/day on a timer.
export const revalidate = 2592000 // 30 days

const STEPS = [
  { title: "Search your area", body: "Browse by city, state, or shop name to find fitters near you." },
  { title: "Compare fitters",  body: "Check ratings, services, and fitting options side by side." },
  { title: "Visit & get fit",  body: "Contact the shop, book a session, and dial in your game." },
]

export default async function HomePage() {
  // One combined query (getHomepageStats) returns the states list, per-type
  // counts, and headline stats from a single table scan instead of three.
  // No fabricated fallback: if it can't load we show honest copy (see below)
  // rather than invented numbers that won't match reality.
  const [topShops, home] = await Promise.all([
    getTopRatedShops(6).catch((e) => logQueryError("homepage getTopRatedShops", e, [])),
    getHomepageStats().catch((e) => logQueryError("homepage getHomepageStats", e, {
      states: [] as { state_code: string; state: string; count: number }[],
      typeCounts: {} as Record<string, number>,
      stats: { total: 0, states: 0, fitters: 0 },
    })),
  ])
  const { states, typeCounts, stats } = home

  const hasStats = stats.total > 0
  const categoryCount = SHOP_TYPES.filter((t) => (typeCounts[t.dbType] ?? 0) > 0).length

  return (
    <>
      {/* JSON-LD: WebSite (sitelinks search box) + Organization (brand) */}
      <JsonLd data={buildWebSiteSchema()} />
      <JsonLd data={buildOrganizationSchema()} />

      {/* Scroll-reveal observer — deliberate on-enter motion below the fold */}
      <Reveal />

      {/* ═══════════════════════════════════════════════════
          HERO — editorial, left-anchored. Oversized headline +
          search panel on the left; a yardage-book "Index" of the
          directory's stats on the right.
          ═══════════════════════════════════════════════════ */}
      <section className="hero-surface grain border-b border-[var(--color-border)]">
        <div className="hero-contours" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* ── Left: headline + search command panel ── */}
            <div className={`min-w-0 ${hasStats ? "lg:col-span-7" : "lg:col-span-12 max-w-3xl"}`}>
              <p className="section-label mb-5 animate-fade-in-up">
                The Club Fitting Directory
              </p>

              <h1
                className="display text-[clamp(2.6rem,6.2vw,4.75rem)] text-[var(--color-charcoal)] animate-fade-in-up"
                style={{ animationDelay: "60ms" }}
              >
                Golf&apos;s best fitters,{" "}
                <span className="relative whitespace-nowrap text-[var(--color-forest)]">
                  on record
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    height="10"
                    viewBox="0 0 200 10"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 7C45 3 120 2 198 6"
                      stroke="var(--color-gold)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
              </h1>

              <p
                className="mt-5 max-w-xl text-lg md:text-xl text-[var(--color-charcoal-light)] leading-relaxed animate-fade-in-up"
                style={{ animationDelay: "120ms" }}
              >
                Search {hasStats ? `${stats.total.toLocaleString()}+ ` : ""}independent golf club fitters,
                retailers, and simulators across all 50 states.
              </p>

              {/* Search Command Panel — search + category chips on one surface */}
              <div
                className="mt-8 max-w-2xl bg-white rounded-2xl shadow-card-hover ring-1 ring-black/5 p-3 sm:p-4 animate-fade-in-up"
                style={{ animationDelay: "180ms" }}
              >
                <HeroSearch />
                <div className="rule my-3" aria-hidden="true" />
                <CategoryChips typeCounts={typeCounts} />
              </div>
            </div>

            {/* ── Right: "The Index" — almanac stat panel ── */}
            {hasStats && (
              <aside
                className="min-w-0 lg:col-span-5 animate-fade-in-up"
                style={{ animationDelay: "240ms" }}
                aria-label="Directory at a glance"
              >
                <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-card">
                  <div className="flex items-center justify-between px-5 py-3 bg-[var(--color-forest)]">
                    <span className="section-label text-[var(--color-gold)]!">The Index</span>
                    <span className="data text-[0.7rem] text-white/60">EST. 2025</span>
                  </div>
                  <dl>
                    {[
                      { label: "Fitters listed", value: stats.total.toLocaleString() },
                      { label: "States covered", value: stats.states.toString() },
                      { label: "Categories", value: categoryCount.toString() },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-baseline justify-between gap-4 px-5 py-4 border-t border-[var(--color-line)] first:border-t-0"
                      >
                        <dt className="text-sm text-[var(--color-charcoal-light)]">{row.label}</dt>
                        <dd className="data text-[1.7rem] font-semibold leading-none text-[var(--color-forest)]">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="px-5 py-3 border-t border-[var(--color-line)] bg-[var(--color-cream)] text-xs text-[var(--color-charcoal-light)]">
                    Curated &amp; independent — every entry reviewed
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HIGHEST RATED — real listings, straight after the hero
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--color-cream)] grain py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
            data-reveal
          >
            <SectionHeader title="Highest-rated fitters" centered={false} />
            <Button href="/directory" variant="outline" size="sm">
              View all {hasStats ? `${stats.total.toLocaleString()} ` : ""}shops
            </Button>
          </div>
          <ListingGrid shops={topShops} className="mt-12" reveal />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          BROWSE BY STATE
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--color-ivory)] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
            data-reveal
          >
            {/* Number-led opening — the yardage-book "data" voice carries this
                section head instead of another uppercase kicker. */}
            <h2 className="font-display text-[2rem] sm:text-4xl md:text-[2.6rem] font-bold leading-[1.05] tracking-[-0.025em]">
              <span className="data font-semibold text-[var(--color-gold-ink)]">
                {hasStats ? stats.states : 50}
              </span>{" "}
              states, every one covered.
            </h2>
            <Button href="/states" variant="outline" size="sm">
              View all states
            </Button>
          </div>
          <div
            className="mt-12 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
            data-reveal
          >
            {states.map((s) => (
              <Link
                key={s.state_code}
                href={`/state/${s.state_code.toLowerCase()}`}
                className="group flex items-center justify-between gap-2 px-3.5 py-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] shadow-card hover:bg-[var(--color-forest)] hover:border-[var(--color-forest)] transition-colors"
              >
                <span className="font-display text-base font-bold text-[var(--color-charcoal)] group-hover:text-white transition-colors">
                  {s.state_code}
                </span>
                <span className="data text-xs text-[var(--color-gold-ink)] group-hover:text-[var(--color-gold)] transition-colors">
                  {s.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SPLIT CTA BAND — fitting primer + submit-a-shop
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--color-cream)] py-16 border-t border-[var(--color-border)]">
        <div
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6"
          data-reveal
        >
          {/* Card A — what happens in a fitting */}
          <div className="bg-white rounded-2xl shadow-card p-8 flex flex-col">
            <h3 className="font-display text-2xl text-[var(--color-charcoal)]">
              New to fitting? Here&apos;s how it works.
            </h3>
            <ol className="mt-6 space-y-5 flex-1">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="data text-base font-semibold text-[var(--color-gold-ink)] leading-snug pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block font-semibold text-[var(--color-charcoal)]">{step.title}</span>
                    <span className="block text-sm text-[var(--color-charcoal-light)] leading-relaxed">{step.body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-7">
              <Button href="/guides/golf-club-fitting" variant="outline" size="md">
                Read the fitting guide
              </Button>
            </div>
          </div>

          {/* Card B — submit a shop */}
          <div className="bg-[var(--color-forest)] grain text-white rounded-2xl p-8 flex flex-col">
            <h3 className="font-display text-2xl text-white!">
              Know a fitter we&apos;re missing?
            </h3>
            <p className="mt-4 text-white/70 leading-relaxed flex-1">
              Help golfers everywhere find the best independent shops. Submit a club fitter,
              retailer, or simulator in under a minute — we review every entry before it
              goes live.
            </p>
            <div className="mt-7">
              <Button href="/submit" variant="secondary" size="md">
                <Store size={16} />
                Submit a Shop
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CLOSING CTA — Newsletter signup (the homepage's single signup)
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--color-forest)] grain text-white">
        <div
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center"
          data-reveal
        >
          {/* Normal-case sign-off, not another tracked-caps kicker — the hero
              keeps the only uppercase label on the page. */}
          <p className="mb-5 text-sm font-semibold text-[var(--color-gold)]">
            The Tuxedo Collective — the free weekly newsletter
          </p>
          <h2 className="text-3xl md:text-[2.6rem] font-bold text-white! leading-[1.1]">
            Private club golf, explained.
          </h2>
          <p className="mt-6 max-w-xl mx-auto text-white/70 leading-relaxed">
            Get the free weekly newsletter on the fittings, gear, and stories behind the
            game&apos;s most exclusive clubs — from the team that curates this directory.
          </p>
          <div className="mt-9 max-w-lg mx-auto text-left">
            <NewsletterForm variant="section" />
          </div>
        </div>
      </section>
    </>
  )
}
