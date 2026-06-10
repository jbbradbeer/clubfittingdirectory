import Link from "next/link"
import { Store } from "lucide-react"
import { getTopRatedShops, getHomepageStats } from "@/lib/supabase/queries/shops"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { Button } from "@/components/ui/Button"
import { ListingCard } from "@/components/directory/ListingCard"
import { HeroSearch } from "@/components/home/HeroSearch"
import { CategoryChips } from "@/components/home/CategoryChips"
import { NewsletterForm } from "@/components/newsletter/NewsletterForm"
import { SITE_URL } from "@/lib/constants"
import { logQueryError } from "@/lib/utils"
import { buildWebSiteSchema, buildOrganizationSchema } from "@/lib/structured-data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  // `absolute` bypasses the layout's "%s | Club Fitting Directory" template so the
  // homepage gets a tight, keyword-led title rather than a long suffixed one.
  title: { absolute: "Golf Club Fitting Near You | Club Fitting Directory" },
  description:
    "Find independent golf club fitters, retailers, and simulators near you. Browse 1,000+ shops across all 50 states — compare ratings, services, and locations.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Golf Club Fitting Near You | Club Fitting Directory",
    description:
      "Find independent golf club fitters, retailers, and simulators near you across all 50 states.",
    url: SITE_URL,
    type: "website",
  },
}

export const revalidate = 3600

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

  return (
    <>
      {/* JSON-LD: WebSite (sitelinks search box) + Organization (brand) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationSchema()) }}
      />

      {/* ═══════════════════════════════════════════════════
          HERO — compact, with the Search Command Panel front
          and center. Everything funnels into search.
          ═══════════════════════════════════════════════════ */}
      <section className="hero-surface grain border-b border-[var(--color-border)]">
        <div className="hero-contours" aria-hidden="true" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 text-center">
          <p className="section-label mb-5 inline-flex items-center gap-3 animate-fade-in-up">
            <span className="gold-rule" />
            The Club Fitting Directory
            <span className="gold-rule rotate-180" />
          </p>

          <h1
            className="display text-[clamp(2.4rem,6vw,4.25rem)] text-[var(--color-charcoal)] animate-fade-in-up"
            style={{ animationDelay: "60ms" }}
          >
            Find your{" "}
            <span className="relative whitespace-nowrap text-[var(--color-forest)]">
              perfect fit
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
            className="mt-5 max-w-2xl mx-auto text-lg md:text-xl text-[var(--color-charcoal-light)] leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "120ms" }}
          >
            Search {hasStats ? `${stats.total.toLocaleString()}+ ` : ""}independent golf club fitters,
            retailers, and simulators across all 50 states.
          </p>

          {/* ── Search Command Panel — search + category chips on one
                 elevated surface ── */}
          <div
            className="mt-9 max-w-3xl mx-auto text-left bg-white rounded-2xl shadow-card-hover ring-1 ring-black/5 p-3 sm:p-4 animate-fade-in-up"
            style={{ animationDelay: "180ms" }}
          >
            <HeroSearch />
            <div className="rule my-3" aria-hidden="true" />
            <CategoryChips typeCounts={typeCounts} />
          </div>

          {/* Trust line */}
          <div
            className="mt-8 flex items-center justify-center gap-x-3 gap-y-2 flex-wrap text-sm text-[var(--color-charcoal-light)] animate-fade-in-up"
            style={{ animationDelay: "240ms" }}
          >
            {hasStats && (
              <>
                <span>
                  <strong className="text-[var(--color-charcoal)] font-semibold">{stats.total.toLocaleString()}</strong> Fitters
                </span>
                <span className="text-[var(--color-border)]">•</span>
                <span>
                  <strong className="text-[var(--color-charcoal)] font-semibold">{stats.states}</strong> States
                </span>
                <span className="text-[var(--color-border)]">•</span>
              </>
            )}
            <span>Curated &amp; Independent</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HIGHEST RATED — real listings, straight after the hero
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--color-cream)] grain py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <SectionHeader eyebrow="Top Rated" title="Highest-rated fitters" centered={false} />
            <Button href="/directory" variant="outline" size="sm">
              View all {hasStats ? `${stats.total.toLocaleString()} ` : ""}shops
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
      <section className="bg-[var(--color-ivory)] py-16 md:py-20">
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
                <span className="font-display text-base font-bold text-[var(--color-charcoal)] group-hover:text-white transition-colors">
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
          SPLIT CTA BAND — fitting primer + submit-a-shop
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--color-cream)] py-16 border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A — what happens in a fitting */}
          <div className="bg-white rounded-2xl shadow-card p-8 flex flex-col">
            <p className="section-label with-rule mb-4">New to fitting?</p>
            <h3 className="font-display text-2xl text-[var(--color-charcoal)]">
              What happens in a fitting
            </h3>
            <ol className="mt-6 space-y-5 flex-1">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="font-display text-lg font-bold text-[var(--color-gold-ink)] leading-snug">
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
            <p className="section-label with-rule mb-4 text-[var(--color-gold)]!">Help us grow</p>
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <p className="section-label mb-5 text-[var(--color-gold)]!">
            The Tuxedo Collective
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
