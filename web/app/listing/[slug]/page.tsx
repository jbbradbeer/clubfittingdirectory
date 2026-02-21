import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  getShopBySlug,
  getAllShopSlugs,
  getNearbyShops,
} from "@/lib/supabase/queries/shops"
import { buildLocalBusinessSchema, buildBreadcrumbSchema } from "@/lib/structured-data"
import { Badge } from "@/components/ui/Badge"
import { RatingStars } from "@/components/ui/RatingStars"
import { ListingCard } from "@/components/directory/ListingCard"
import { NewsletterCTA } from "@/components/layout/NewsletterCTA"
import { MapPin, Phone, Globe, Clock, CheckCircle2 } from "lucide-react"
import type { Shop } from "@/types/shop"

/* ─────────────────────────────────────────────────────────
   /listing/[slug] — Individual shop profile page
   Pre-rendered at build time for all known slugs (ISR).
   Designed for SEO: LocalBusiness schema, rich metadata,
   enough content that Google treats it as substantive.
   ───────────────────────────────────────────────────────── */

export const revalidate = 86400 // Regenerate once every 24 hours

import { SITE_URL } from "@/lib/constants"

/* ── generateStaticParams: tell Next.js which slugs to pre-build ── */
export async function generateStaticParams() {
  const slugs = await getAllShopSlugs().catch(() => [])
  return slugs.map(({ slug }) => ({ slug }))
}

/* ── generateMetadata: per-page SEO meta tags ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const shop     = await getShopBySlug(slug)
  if (!shop) return { title: "Listing Not Found" }

  const servicesList = parseServices(shop).slice(0, 3).join(", ")
  const description  = [
    `${shop.name} is a ${shop.shop_type ?? "golf shop"} in ${shop.city}, ${shop.state}`,
    servicesList ? `offering ${servicesList}` : null,
    shop.rating ? `Rated ${shop.rating}/5` : null,
    "View hours, phone, and directions.",
  ]
    .filter(Boolean)
    .join(". ")
    .concat(".")

  return {
    title:       `${shop.name} — Club Fitting Directory | The Tuxedo Collective`,
    description,
    alternates:  { canonical: `${SITE_URL}/listing/${slug}` },
    openGraph: {
      title:       `${shop.name} — Club Fitting Directory`,
      description,
      type:        "website",
      url:         `${SITE_URL}/listing/${slug}`,
      siteName:    "Club Fitting Directory",
    },
    twitter: { card: "summary", title: shop.name, description },
  }
}

/* ─────────────────────────────────────────────────────────
   PAGE COMPONENT
   ───────────────────────────────────────────────────────── */
export default async function ListingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [shop, nearby] = await Promise.all([
    getShopBySlug(slug),
    // We fetch nearby after we know the shop exists — handled below
    Promise.resolve(null as Shop[] | null),
  ])

  if (!shop) notFound()

  const nearbyShops = await getNearbyShops(shop.state_code, shop.slug, 3).catch(() => [])

  const services    = parseServices(shop)
  const localBizLd  = buildLocalBusinessSchema(shop)
  const breadcrumbLd = buildBreadcrumbSchema(shop)
  const mapsUrl     = shop.latitude && shop.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`
    : shop.location_link ?? null

  return (
    <>
      {/* ── JSON-LD Schema in <head> ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBizLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="min-h-screen bg-[var(--color-green-deep)]">

        {/* ── 1. BREADCRUMB NAV ── */}
        <nav
          aria-label="Breadcrumb"
          className="border-b border-[color-mix(in_srgb,var(--color-brass)_15%,transparent)]"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <ol className="flex flex-wrap items-center gap-1.5 font-[family-name:var(--font-body)] text-xs text-[var(--color-ivory-warm)]">
              <BreadcrumbItem href="/" label="Home" />
              <BreadcrumbSep />
              <BreadcrumbItem
                href={`/states/${shop.state_code.toLowerCase()}`}
                label={shop.state}
              />
              <BreadcrumbSep />
              <BreadcrumbItem
                href={`/directory?state=${shop.state_code}`}
                label={shop.shop_type ?? "Listings"}
              />
              <BreadcrumbSep />
              <li className="text-[var(--color-ivory)] truncate max-w-[200px]" aria-current="page">
                {shop.name}
              </li>
            </ol>
          </div>
        </nav>

        {/* ── 2. LISTING HEADER ── */}
        <header className="border-b border-[color-mix(in_srgb,var(--color-brass)_18%,transparent)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-4">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              {shop.verified && <Badge variant="verified" />}
              {shop.shop_type && <Badge variant="default">{shop.shop_type}</Badge>}
              {shop.listing_tier === "featured" && (
                <Badge variant="brass">Featured</Badge>
              )}
            </div>

            {/* Name */}
            <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-black text-[var(--color-ivory)] leading-tight">
              {shop.name}
            </h1>

            {/* Location */}
            <p className="font-[family-name:var(--font-body)] italic text-[var(--color-ivory-warm)] text-lg flex items-center gap-1.5">
              <MapPin size={15} className="text-[var(--color-brass)] shrink-0" aria-hidden="true" />
              {[shop.street, shop.city, shop.state].filter(Boolean).join(", ")}
            </p>

            {/* Rating row */}
            {shop.rating && shop.rating > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <RatingStars rating={shop.rating} size="md" />
                <span className="font-[family-name:var(--font-mono)] text-[var(--color-brass)] font-bold tabular-nums">
                  {shop.rating.toFixed(1)}
                </span>
                {shop.rating_tier && (
                  <span className="font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)]">
                    {shop.rating_tier}
                  </span>
                )}
                {shop.reviews && shop.reviews > 0 ? (
                  <span className="font-[family-name:var(--font-body)] text-xs text-[color-mix(in_srgb,var(--color-ivory-warm)_60%,transparent)]">
                    ({shop.reviews.toLocaleString()} reviews)
                  </span>
                ) : null}
              </div>
            ) : null}

            {/* Brass rule */}
            <div className="pt-2" aria-hidden="true">
              <span className="brass-rule block" />
            </div>
          </div>
        </header>

        {/* ── 3. MAIN BODY: two-column layout ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">

            {/* ── LEFT COLUMN ── */}
            <div className="space-y-10 min-w-0">

              {/* Services */}
              {services.length > 0 && (
                <section>
                  <SectionHeading>Services Offered</SectionHeading>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {services.map((svc) => (
                      <Badge key={svc} variant="default" className="text-sm px-3 py-1">
                        {svc}
                      </Badge>
                    ))}
                  </div>

                  {/* Fitting callout */}
                  {shop.offers_fitting && (
                    <div className="mt-5 border border-[var(--color-brass)] rounded-sm p-5 bg-[color-mix(in_srgb,var(--color-brass)_5%,transparent)]">
                      <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-brass)] mb-2">
                        <span aria-hidden="true">✦</span> Club Fitting Available
                      </p>
                      <div className="space-y-1.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)]">
                        {shop.fitting_environment && (
                          <p>
                            <span className="text-[var(--color-ivory)]">Environment:</span>{" "}
                            {shop.fitting_environment}
                          </p>
                        )}
                        {shop.public_fitting && (
                          <p className="flex items-center gap-1.5 text-[var(--color-ivory-warm)]">
                            <CheckCircle2 size={14} className="text-[var(--color-brass)]" aria-hidden="true" />
                            Open to the public — no membership required
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Accessibility / About */}
              <AccessibilitySection about={shop.about} />

              {/* Location */}
              <section>
                <SectionHeading>Location</SectionHeading>
                <div className="mt-4 space-y-3">
                  <address className="not-italic font-[family-name:var(--font-mono)] text-sm text-[var(--color-ivory-warm)] leading-relaxed">
                    {shop.street && <div>{shop.street}</div>}
                    <div>
                      {shop.city}, {shop.state_code}
                      {shop.postal_code ? ` ${shop.postal_code}` : ""}
                    </div>
                    <div>United States</div>
                  </address>

                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-brass)] hover:text-[var(--color-brass-light)] transition-colors group"
                    >
                      Get Directions
                      <span className="inline-block transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                        →
                      </span>
                    </a>
                  )}
                </div>
              </section>
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <aside className="space-y-5">

              {/* Contact card */}
              <div className="bg-[var(--color-green-mid)] border border-[color-mix(in_srgb,var(--color-brass)_25%,transparent)] rounded-sm p-6 space-y-5">
                <p className="font-[family-name:var(--font-body)] text-[10px] tracking-[0.25em] uppercase text-[var(--color-brass)]">
                  Contact
                </p>

                {/* Phone */}
                {shop.phone && (
                  <a
                    href={`tel:${shop.phone.replace(/\D/g, "")}`}
                    className="flex items-center gap-2.5 group"
                    aria-label={`Call ${shop.name}`}
                  >
                    <Phone
                      size={16}
                      className="text-[var(--color-brass)] shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-[family-name:var(--font-mono)] text-xl text-[var(--color-ivory)] group-hover:text-[var(--color-brass)] transition-colors tracking-wide">
                      {shop.phone}
                    </span>
                  </a>
                )}

                {/* Website button */}
                {shop.website && safeWebsiteUrl(shop.website) && (
                  <a
                    href={safeWebsiteUrl(shop.website)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={[
                      "flex items-center justify-center gap-2 w-full",
                      "px-5 py-3 rounded-sm",
                      "bg-[var(--color-brass)] text-[var(--color-charcoal)]",
                      "font-[family-name:var(--font-body)] text-sm font-semibold",
                      "hover:bg-[var(--color-brass-light)] transition-colors",
                      "hover:-translate-y-px hover:shadow-[0_4px_16px_color-mix(in_srgb,var(--color-brass)_30%,transparent)]",
                      "transition-all duration-200",
                    ].join(" ")}
                  >
                    <Globe size={15} aria-hidden="true" />
                    Visit Website
                  </a>
                )}

                {/* Google Maps link */}
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)] hover:text-[var(--color-brass)] transition-colors"
                  >
                    <MapPin size={14} aria-hidden="true" />
                    View on Google Maps
                  </a>
                )}

                {/* Divider */}
                {shop.working_hours && (
                  <div aria-hidden="true">
                    <span className="brass-rule block" />
                  </div>
                )}

                {/* Working hours */}
                {shop.working_hours && (
                  <WorkingHours hours={shop.working_hours} />
                )}
              </div>

              {/* Newsletter CTA (sidebar variant) */}
              <NewsletterCTA variant="sidebar" />
            </aside>
          </div>
        </div>

        {/* ── 4. NEARBY LISTINGS ── */}
        {nearbyShops.length > 0 && (
          <section className="border-t border-[color-mix(in_srgb,var(--color-brass)_15%,transparent)] py-14">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex items-end justify-between mb-8 gap-4">
                <div>
                  <p className="font-[family-name:var(--font-body)] text-[10px] tracking-[0.3em] uppercase text-[var(--color-brass)] mb-1.5">
                    More in {shop.state}
                  </p>
                  <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--color-ivory)]">
                    More Fitters in {shop.state}
                  </h2>
                </div>
                <Link
                  href={`/states/${shop.state_code.toLowerCase()}`}
                  className="shrink-0 font-[family-name:var(--font-body)] text-sm text-[var(--color-brass)] hover:text-[var(--color-brass-light)] transition-colors whitespace-nowrap group"
                >
                  View all in {shop.state_code}{" "}
                  <span className="inline-block transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {nearbyShops.map((nearby) => (
                  <ListingCard
                    key={nearby.id}
                    name={nearby.name}
                    shop_type={nearby.shop_type}
                    primary_service={nearby.primary_service}
                    city={nearby.city}
                    state={nearby.state}
                    state_code={nearby.state_code}
                    rating={nearby.rating}
                    rating_tier={nearby.rating_tier}
                    services={nearby.services}
                    services_array={nearby.services_array ?? []}
                    offers_fitting={nearby.offers_fitting}
                    fitting_environment={nearby.fitting_environment}
                    phone={nearby.phone}
                    website={nearby.website}
                    verified={nearby.verified}
                    slug={nearby.slug}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 5. BACK LINK ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
          <Link
            href="/directory"
            className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-brass)] hover:text-[var(--color-brass-light)] transition-colors group"
          >
            <span
              className="inline-block transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            >
              ←
            </span>
            Back to Directory
          </Link>
        </div>

      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTS
   ───────────────────────────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-ivory)] flex items-center gap-3">
      {children}
      <span
        className="flex-1 h-px bg-[color-mix(in_srgb,var(--color-brass)_20%,transparent)]"
        aria-hidden="true"
      />
    </h2>
  )
}

function BreadcrumbItem({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="text-[var(--color-ivory-warm)] hover:text-[var(--color-brass)] transition-colors"
      >
        {label}
      </Link>
    </li>
  )
}

function BreadcrumbSep() {
  return (
    <li aria-hidden="true" className="text-[color-mix(in_srgb,var(--color-ivory-warm)_30%,transparent)]">
      /
    </li>
  )
}

/* Working hours table */
function WorkingHours({ hours }: { hours: Record<string, string> }) {
  const DAY_ORDER = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  ]
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" })

  const ordered = DAY_ORDER
    .filter((d) => hours[d] !== undefined)
    .map((d) => ({ day: d, hours: hours[d] }))

  if (ordered.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <Clock size={13} className="text-[var(--color-brass)]" aria-hidden="true" />
        <span className="font-[family-name:var(--font-body)] text-[10px] tracking-[0.2em] uppercase text-[var(--color-brass)]">
          Hours
        </span>
      </div>
      <dl className="space-y-1.5">
        {ordered.map(({ day, hours: h }) => {
          const isToday = day === today
          return (
            <div
              key={day}
              className={[
                "flex justify-between gap-3",
                isToday
                  ? "text-[var(--color-ivory)]"
                  : "text-[var(--color-ivory-warm)]",
              ].join(" ")}
            >
              <dt
                className={[
                  "font-[family-name:var(--font-body)] text-xs shrink-0",
                  isToday ? "font-semibold" : "",
                ].join(" ")}
              >
                {day.slice(0, 3)}
                {isToday && (
                  <span className="ml-1 text-[var(--color-brass)] text-[9px]">
                    ●
                  </span>
                )}
              </dt>
              <dd className="font-[family-name:var(--font-mono)] text-xs text-right">
                {h.toLowerCase().includes("closed") ? (
                  <span className="text-[color-mix(in_srgb,var(--color-ivory-warm)_50%,transparent)]">
                    Closed
                  </span>
                ) : (
                  h
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

/* Parse accessibility features from Outscraper's about JSON */
function AccessibilitySection({
  about,
}: {
  about: Record<string, unknown> | null
}) {
  if (!about) return null

  // Outscraper stores accessibility as about.Accessibility = { "Wheelchair accessible entrance": true, ... }
  const acc = about["Accessibility"] as Record<string, boolean> | undefined
  if (!acc || typeof acc !== "object") return null

  const features = Object.entries(acc)
    .filter(([, v]) => v === true)
    .map(([k]) => k)

  if (features.length === 0) return null

  return (
    <section>
      <SectionHeading>Accessibility</SectionHeading>
      <ul className="mt-4 space-y-2">
        {features.map((feat) => (
          <li
            key={feat}
            className="flex items-center gap-2.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)]"
          >
            <CheckCircle2
              size={14}
              className="text-[var(--color-brass)] shrink-0"
              aria-hidden="true"
            />
            {feat}
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────── */

/** Validate a website URL — only allow http/https, return null if unsafe */
function safeWebsiteUrl(raw: string): string | null {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`)
    if (url.protocol !== "https:" && url.protocol !== "http:") return null
    return url.href
  } catch {
    return null
  }
}

/** Parse services from array or pipe-delimited string */
function parseServices(shop: Shop): string[] {
  if (shop.services_array?.length) return shop.services_array
  if (shop.services) return shop.services.split("|").map((s) => s.trim()).filter(Boolean)
  return []
}
