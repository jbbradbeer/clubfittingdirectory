import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  getAllStateCodes,
  getShopsForStatePage,
  getAllStatesWithShops,
} from "@/lib/supabase/queries/shops"
import { StateListings } from "@/components/state/StateFilterChips"
import type { ListingCardProps } from "@/types/shop"

/* ─────────────────────────────────────────────────────────
   /state/[state_code] — State index page
   Primary long-tail SEO targets:
   "club fitters in Texas", "golf fitters near me Ohio" etc.
   All listings are fetched server-side and passed to a client
   component that handles filter chips + pagination locally —
   no additional DB calls on interaction.
   ───────────────────────────────────────────────────────── */

export const revalidate = 86400

const SITE_URL = "https://clubfittingdirectory.com"

/* ── generateStaticParams — pre-build a page for every state ── */
export async function generateStaticParams() {
  const codes = await getAllStateCodes().catch(() => [])
  return codes.map((state_code) => ({
    state_code: state_code.toLowerCase(),
  }))
}

/* ── generateMetadata — unique SEO title + description per state ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ state_code: string }>
}): Promise<Metadata> {
  const { state_code } = await params
  const upper          = state_code.toUpperCase()

  // Get state full name and count
  const allStates = await getAllStatesWithShops().catch(() => [])
  const stateInfo = allStates.find((s) => s.state_code === upper)
  if (!stateInfo) return { title: "State Not Found" }

  const { state, count } = stateInfo
  const description = `Browse ${count} golf club fitters, retailers, and simulators in ${state}. ` +
    `Find club fitting, lessons, and custom club building near you.`

  return {
    title:       `Golf Club Fitters in ${state} — Club Fitting Directory`,
    description,
    alternates:  { canonical: `${SITE_URL}/state/${state_code}` },
    openGraph: {
      title:       `Golf Club Fitters in ${state}`,
      description,
      type:        "website",
      url:         `${SITE_URL}/state/${state_code}`,
      siteName:    "Club Fitting Directory",
    },
  }
}

/* ── Page ── */
export default async function StatePage({
  params,
}: {
  params: Promise<{ state_code: string }>
}) {
  const { state_code } = await params
  const upper          = state_code.toUpperCase()

  const [{ shops, cityCount }, allStates] = await Promise.all([
    getShopsForStatePage(upper).catch(() => ({ shops: [], cityCount: 0 })),
    getAllStatesWithShops().catch(() => []),
  ])

  const stateInfo = allStates.find((s) => s.state_code === upper)
  if (!stateInfo || shops.length === 0) notFound()

  const { state } = stateInfo

  /* Derive distinct shop types present in this state */
  const shopTypes = [
    ...new Set(shops.map((s) => s.shop_type).filter(Boolean) as string[]),
  ].sort()

  /* Shape into ListingCardProps for the client component */
  const cardProps: ListingCardProps[] = shops.map((s) => ({
    name:               s.name,
    shop_type:          s.shop_type,
    primary_service:    s.primary_service,
    city:               s.city,
    state:              s.state,
    state_code:         s.state_code,
    rating:             s.rating,
    rating_tier:        s.rating_tier,
    services:           s.services,
    services_array:     s.services_array ?? [],
    offers_fitting:     s.offers_fitting,
    fitting_environment: s.fitting_environment,
    phone:              s.phone,
    website:            s.website,
    verified:           s.verified,
    slug:               s.slug,
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
            <li>
              <Link href="/states" className="hover:text-[var(--color-brass)] transition-colors">
                States
              </Link>
            </li>
            <li aria-hidden="true" className="text-[color-mix(in_srgb,var(--color-ivory-warm)_30%,transparent)]">/</li>
            <li className="text-[var(--color-ivory)]" aria-current="page">{state}</li>
          </ol>
        </div>
      </nav>

      {/* ── Header ── */}
      <header className="border-b border-[color-mix(in_srgb,var(--color-brass)_15%,transparent)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.3em] uppercase text-[var(--color-brass)] mb-3">
            Club Fitting Directory
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-black text-[var(--color-ivory)] leading-tight mb-4">
            Golf Club Fitters in{" "}
            <span className="text-[var(--color-brass)]">{state}</span>
          </h1>
          <p className="font-[family-name:var(--font-body)] text-lg text-[var(--color-ivory-warm)]">
            <span className="font-[family-name:var(--font-mono)] text-[var(--color-ivory)] tabular-nums">
              {shops.length.toLocaleString()}
            </span>{" "}
            listings across{" "}
            <span className="font-[family-name:var(--font-mono)] text-[var(--color-ivory)] tabular-nums">
              {cityCount}
            </span>{" "}
            {cityCount === 1 ? "city" : "cities"} in {state}
          </p>
        </div>
      </header>

      {/* ── Listings with client-side filter chips ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <StateListings shops={cardProps} shopTypes={shopTypes} />
      </main>

      {/* ── Browse other states ── */}
      <section className="border-t border-[color-mix(in_srgb,var(--color-brass)_15%,transparent)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-ivory)] mb-6">
            Browse Other States
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {allStates.map((s) => (
              <Link
                key={s.state_code}
                href={`/state/${s.state_code.toLowerCase()}`}
                title={s.state}
                className={[
                  "flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-sm text-center",
                  "border transition-all duration-150",
                  s.state_code === upper
                    ? "border-[var(--color-brass)] bg-[color-mix(in_srgb,var(--color-brass)_10%,transparent)] cursor-default"
                    : "border-[color-mix(in_srgb,var(--color-ivory)_10%,transparent)] bg-[var(--color-green-mid)] hover:border-[var(--color-brass)] hover:bg-[color-mix(in_srgb,var(--color-brass)_8%,transparent)]",
                  "group",
                ].join(" ")}
                aria-current={s.state_code === upper ? "page" : undefined}
              >
                <span
                  className={[
                    "font-[family-name:var(--font-mono)] text-xs font-bold tracking-wide transition-colors",
                    s.state_code === upper
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
