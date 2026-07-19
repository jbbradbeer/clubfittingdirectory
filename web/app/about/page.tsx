import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/Button"
import { getHomepageStats } from "@/lib/supabase/queries/shops"
import { logQueryError } from "@/lib/utils"
import { SHOP_TYPES } from "@/lib/shop-types"
import { SITE_NAME, SITE_URL, SITE_AUTHOR } from "@/lib/constants"

export const metadata: Metadata = {
  title: "About",
  description: `Learn about ${SITE_NAME} — the most comprehensive directory of independent golf club fitters and retailers across the United States.`,
  alternates: { canonical: `${SITE_URL}/about` },
}

// Same ISR window as the homepage — the stat panel stays honest without
// per-request queries; /api/revalidate refreshes it when listings change.
export const revalidate = 2592000 // 30 days

export default async function AboutPage() {
  const { typeCounts, stats } = await getHomepageStats().catch((e) =>
    logQueryError("about getHomepageStats", e, {
      states: [] as { state_code: string; state: string; count: number }[],
      typeCounts: {} as Record<string, number>,
      stats: { total: 0, states: 0, fitters: 0 },
    }),
  )
  const hasStats = stats.total > 0
  const categoryCount = SHOP_TYPES.filter((t) => (typeCounts[t.dbType] ?? 0) > 0).length

  return (
    <>
      {/* Hero */}
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "About" }]}
        eyebrow="About"
        title="A directory kept by hand"
        subtitle={`${SITE_NAME} is a working record of the club fitters, retailers, and studios worth a golfer's time — every entry reviewed by a person before it's published.`}
      />

      {/* Editorial: manifesto prose + the Index panel, asymmetric like the homepage */}
      <section className="bg-[var(--color-ivory)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left: the story, in prose — not feature cards */}
          <div className="lg:col-span-7 max-w-2xl">
            <h2 className="font-display text-[1.7rem] sm:text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-[var(--color-charcoal)]">
              Most golfers buy clubs off the rack. The fix is a fitting — if you
              can find a good fitter.
            </h2>
            <div className="mt-6 space-y-5 text-lg text-[var(--color-charcoal-light)] leading-relaxed">
              <p>
                There was no reliable national list of who actually does this work
                well — just scattered map results and brand locators that only show
                their own partners. So we built the record ourselves: independent
                fitters, retailers, simulators, and pro shops in every state, each
                with its services, hours, ratings, and fitting details in one place.
              </p>
              <p>
                Listings are researched and reviewed by hand before they go live,
                and culled when they go stale — we&apos;ve removed over 500 entries
                that no longer met the bar. Where a shop publishes fitting prices
                or launch monitor equipment, we record it; where it doesn&apos;t,
                we say so rather than guess.
              </p>
            </div>

            {/* Founder note — the guide bylines' Person schema links here, so
                the author identity has to actually resolve on this page. */}
            <div className="mt-10 pt-8 border-t border-[var(--color-border)]">
              <p className="text-[var(--color-charcoal)] leading-relaxed">
                Founded and maintained by <strong>{SITE_AUTHOR}</strong>, who
                researches and hand-vets every listing and writes the fitting
                guides.
              </p>
              <p className="mt-2 text-sm text-[var(--color-charcoal-light)]">
                A{" "}
                <a
                  href="https://thetuxedocollective.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-gold"
                >
                  Tuxedo Collective
                </a>{" "}
                Publication
              </p>
            </div>
          </div>

          {/* Right: the Index — the same almanac panel the homepage carries,
              with live counts instead of marketing claims */}
          {hasStats && (
            <aside className="lg:col-span-5" aria-label="Directory at a glance">
              <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-card lg:sticky lg:top-24">
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
      </section>

      {/* Quiet close — one clear next step, no display head */}
      <section className="bg-[var(--color-cream)] py-12 border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <p className="text-lg text-[var(--color-charcoal)]">
            Start with your state — or add a shop we&apos;re missing.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button href="/states" variant="primary">
              Browse by State
            </Button>
            <Button href="/submit" variant="outline">
              Submit a Shop
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
