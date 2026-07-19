import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  MapPin, Phone, Globe, ExternalLink, Clock, CheckCircle, Wrench, Navigation,
} from "lucide-react"
import { getShopBySlug, getNearbyShops, getAllShopSlugs, toCitySlug } from "@/lib/supabase/queries/shops"
import { getListingVerification } from "@/lib/supabase/queries/provenance"
import { buildLocalBusinessSchema, buildBreadcrumbSchema } from "@/lib/structured-data"
import { JsonLd } from "@/components/seo/JsonLd"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ListingMap } from "@/components/directory/ListingMap"
import { ShopHours } from "@/components/shop-profile/ShopHours"
import { Badge } from "@/components/ui/Badge"
import { RatingStars } from "@/components/ui/RatingStars"
import { Button } from "@/components/ui/Button"
import { ListingGrid } from "@/components/directory/ListingGrid"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { TuxedoInlineLink } from "@/components/newsletter/TuxedoInlineLink"
import { RequestFittingButton } from "@/components/booking/RequestFittingButton"
import { ProvenanceBadge } from "@/components/shop-profile/ProvenanceBadge"
import { Reveal } from "@/lib/useReveal"
import { getCover } from "@/lib/cover"
import { isTopRated, isVerified } from "@/lib/badges"
import { ownershipLabel, formatFittingPrice } from "@/lib/fitter-classification"
import { listingQuickFacts, listingFaqs } from "@/lib/seo-content"
import { FaqSection } from "@/components/seo/FaqSection"
import { SITE_URL } from "@/lib/constants"
import { logQueryError, rethrowQueryError } from "@/lib/utils"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 2592000 // 30 days — long window keeps ISR writes low; edits propagate via on-demand revalidation (app/api/revalidate)

export async function generateStaticParams() {
  const slugs = await getAllShopSlugs().catch((e) => logQueryError("listing generateStaticParams getAllShopSlugs", e, []))
  return slugs
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const shop = await getShopBySlug(slug).catch((e) => logQueryError("listing generateMetadata getShopBySlug", e, undefined))
  // notFound() here (not only in the page body) because generateMetadata runs
  // before the response starts streaming — it's the only place that can still
  // set a real 404 status (the root loading.tsx makes the body stream after a
  // 200 is already sent). A thrown query error stays a soft fallback so a DB
  // blip can't get a live page cached as a 404.
  if (shop === null) notFound()
  if (!shop) return { title: "Fitter Not Found" }

  const title = `${shop.name} — ${shop.city}, ${shop.state_code}`
  const description = `${shop.name} is a ${shop.shop_type ?? "golf shop"} in ${shop.city}, ${shop.state}. ${
    shop.offers_fitting ? "Club fitting available. " : ""
  }${shop.rating ? `Rated ${shop.rating}/5.` : ""}`

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/listing/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/listing/${slug}`,
      type: "website",
    },
  }
}

export default async function ListingPage({ params }: PageProps) {
  const { slug } = await params
  const shop = await getShopBySlug(slug).catch(rethrowQueryError("listing getShopBySlug"))
  if (!shop) notFound()

  const nearby = await getNearbyShops(shop.state_code, shop.slug, 3).catch((e) => logQueryError("listing getNearbyShops", e, []))
  // Provenance/confidence level for the "Owner-verified / Unverified" badge.
  const verification = await getListingVerification(shop.id)

  const localBusinessSchema = buildLocalBusinessSchema(shop)
  const breadcrumbSchema = buildBreadcrumbSchema(shop)
  // Guard against rows with a null city/state_code so a single bad row can't
  // crash the whole page (mirrors the defensive handling in structured-data.ts).
  const citySlug = shop.city && shop.state_code ? toCitySlug(shop.city, shop.state_code) : ""
  // Stored websites sometimes lack a protocol — normalize once for every link below.
  const websiteUrl = shop.website
    ? shop.website.startsWith("http") ? shop.website : `https://${shop.website}`
    : null
  const { paletteIndex: coverPalette } = getCover(shop.slug, shop.shop_type)

  /* Parse about JSON for display */
  const aboutEntries: { key: string; value: string }[] = []
  if (shop.about && typeof shop.about === "object") {
    for (const [key, value] of Object.entries(shop.about)) {
      if (typeof value === "string" && value.trim()) {
        aboutEntries.push({ key, value })
      }
    }
  }

  return (
    <>
      {/* JSON-LD */}
      <JsonLd data={localBusinessSchema} />
      <JsonLd data={breadcrumbSchema} />

      <Reveal />

      {/* Breadcrumb + Header */}
      <section className="hero-surface grain border-b border-[var(--color-border)]">
        {/* Thin palette accent — ties the profile to its directory card */}
        <span
          aria-hidden="true"
          className="block h-1 w-full"
          style={{
            backgroundImage: `linear-gradient(90deg, var(--cover-${coverPalette}-a), var(--cover-${coverPalette}-b))`,
          }}
        />
        <div className="hero-contours" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: shop.state, href: `/state/${(shop.state_code ?? "").toLowerCase()}` },
              { label: shop.city, href: `/city/${citySlug}` },
              { label: shop.name },
            ]}
          />

          <div className="mt-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              {shop.shop_type && (
                <p className="section-label mb-3">{shop.shop_type}</p>
              )}
              <h1 className="display text-[clamp(2.1rem,4.5vw,3.1rem)] text-[var(--color-charcoal)]">
                {shop.name}
              </h1>

              <p className="mt-3 flex items-center gap-1.5 text-[var(--color-charcoal-light)]">
                <MapPin size={16} className="text-[var(--color-gold)]" />
                {[shop.street, shop.city, `${shop.state_code} ${shop.postal_code ?? ""}`]
                  .filter(Boolean)
                  .join(", ")}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {shop.rating && (
                  <RatingStars rating={shop.rating} reviews={shop.reviews} />
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Paid Verified tier — the product. The scraped `verified`
                      boolean is deliberately not shown (free lookalike). */}
                  {isVerified(shop) && <Badge variant="forest">Verified</Badge>}
                  {shop.is_featured && <Badge variant="gold">Featured</Badge>}
                  {isTopRated(shop.rating, shop.reviews) && (
                    <Badge variant="verified">Top Rated</Badge>
                  )}
                  {/* Descriptive classification, not a quality tier — default
                      (soft) variant keeps it visually below the paid badges. */}
                  {ownershipLabel(shop.ownership_type) && (
                    <Badge>{ownershipLabel(shop.ownership_type)}</Badge>
                  )}
                  <ProvenanceBadge level={verification.level} />
                </div>
              </div>
            </div>

            {/* Quick actions (desktop) */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {shop.phone && (
                <Button href={`tel:${shop.phone}`} variant="primary" external>
                  <Phone size={16} className="mr-1.5" />
                  Call Now
                </Button>
              )}
              {websiteUrl && (
                <Button
                  href={websiteUrl}
                  variant="secondary"
                  external
                >
                  <Globe size={16} className="mr-1.5" />
                  Visit Website
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="bg-[var(--color-ivory)] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: main content */}
            <div className="flex-1 min-w-0 space-y-10">
              {/* Quick facts — a plain, self-contained summary sentence that
                  answer engines (Google snippets, ChatGPT, Perplexity) can
                  quote verbatim. Built from the same data shown below. */}
              <p className="text-lg text-[var(--color-charcoal-light)] leading-relaxed">
                {listingQuickFacts(shop)}
              </p>

              {/* Services */}
              {shop.services_array && shop.services_array.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-semibold text-[var(--color-charcoal)] mb-4">
                    Services Offered
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {shop.services_array.map((service) => (
                      <Badge key={service}>{service}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Club Fitting Details — render on ANY fitting signal. ~100
                  shops have crawled launch monitor / price facts while
                  offers_fitting is still false; gating on the flag alone hid
                  their data entirely. */}
              {(shop.offers_fitting ||
                (shop.launch_monitors?.length ?? 0) > 0 ||
                shop.fitting_price_min != null ||
                shop.fitting_price_max != null) && (
                <div>
                  <h2 className="font-display text-xl font-semibold text-[var(--color-charcoal)] mb-4">
                    Club Fitting Details
                  </h2>
                  <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6 space-y-3">
                    {shop.offers_fitting && (
                      <div className="flex items-center gap-2">
                        <Wrench size={16} className="text-[var(--color-gold)]" />
                        <span className="text-sm font-medium">Club Fitting Available</span>
                      </div>
                    )}
                    {shop.fitting_environment && (
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-[var(--color-forest)]" />
                        <span className="text-sm">
                          Fitting Environment: <strong>{shop.fitting_environment}</strong>
                        </span>
                      </div>
                    )}
                    {shop.public_fitting && (
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-[var(--color-forest)]" />
                        <span className="text-sm">Public Fitting Available</span>
                      </div>
                    )}
                    {shop.launch_monitors && shop.launch_monitors.length > 0 && (
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-[var(--color-forest)]" />
                        <span className="text-sm">
                          Launch Monitors: <strong>{shop.launch_monitors.join(" · ")}</strong>
                        </span>
                      </div>
                    )}
                    {formatFittingPrice(shop.fitting_price_min, shop.fitting_price_max) ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-[var(--color-forest)]" />
                        <span className="text-sm">
                          Fitting Price:{" "}
                          <strong>{formatFittingPrice(shop.fitting_price_min, shop.fitting_price_max)}</strong>
                          <span className="text-[var(--color-charcoal-light)]"> (reported from shop website)</span>
                        </span>
                      </div>
                    ) : (
                      /* Missing price = claim driver: owners add pricing via the
                         claim funnel. Hidden once the shop is claimed. */
                      !shop.claimed_at && (
                        <p className="pt-1 text-sm border-t border-[var(--color-line)]">
                          <Link
                            href={`/claim/${shop.slug}`}
                            className="text-[var(--color-charcoal-light)] hover:text-[var(--color-forest)] transition-colors"
                          >
                            Own this shop?{" "}
                            <span className="font-semibold text-[var(--color-forest)]">
                              Add your fitting prices →
                            </span>
                          </Link>
                        </p>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* About */}
              {aboutEntries.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-semibold text-[var(--color-charcoal)] mb-4">
                    About
                  </h2>
                  <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6">
                    <dl className="space-y-3">
                      {aboutEntries.map(({ key, value }) => (
                        <div key={key}>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)]">
                            {key.replace(/_/g, " ")}
                          </dt>
                          <dd className="text-sm text-[var(--color-charcoal)] mt-0.5">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <h2 className="font-display text-xl font-semibold text-[var(--color-charcoal)] mb-4">
                  Location
                </h2>
                <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6">
                  {shop.latitude != null && shop.longitude != null && (
                    <div className="mb-4">
                      <ListingMap
                        latitude={shop.latitude}
                        longitude={shop.longitude}
                        name={shop.name}
                      />
                    </div>
                  )}
                  <p className="text-sm text-[var(--color-charcoal)]">
                    {[shop.street, shop.city, `${shop.state} ${shop.postal_code ?? ""}`]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {shop.location_link && (
                    <a
                      href={shop.location_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-[var(--color-forest)] hover:text-[var(--color-gold-ink)] transition-colors"
                    >
                      <Navigation size={14} />
                      Open in Google Maps &rarr;
                    </a>
                  )}
                </div>
              </div>

              {/* Tuxedo Collective plug */}
              <TuxedoInlineLink />
            </div>

            {/* Right: sidebar — sticks while the main column scrolls */}
            <aside className="lg:w-80 shrink-0 space-y-6 lg:self-start lg:sticky lg:top-[88px]">
              {/* Contact card */}
              <div className="bg-[var(--color-forest)] text-white rounded-2xl shadow-card p-6">
                <h3 className="font-display text-lg font-bold mb-4 text-white!">
                  Contact
                </h3>
                <div className="space-y-3">
                  {shop.phone && (
                    <a
                      href={`tel:${shop.phone}`}
                      className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                    >
                      <Phone size={16} />
                      <span className="data">{shop.phone}</span>
                    </a>
                  )}
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                    >
                      <ExternalLink size={16} />
                      Visit Website
                    </a>
                  )}
                  {shop.location_link && (
                    <a
                      href={shop.location_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                    >
                      <MapPin size={16} />
                      Google Maps
                    </a>
                  )}
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  {/* Primary CTA — the booking engine. Captures a fitting lead. */}
                  <RequestFittingButton
                    shopId={shop.id}
                    shopName={shop.name}
                    shopSlug={shop.slug}
                  />
                  {shop.phone && (
                    <a
                      href={`tel:${shop.phone}`}
                      className="block w-full text-center py-2.5 bg-white text-[var(--color-forest)]! font-semibold text-sm rounded-full hover:bg-[var(--color-cream)] transition-colors"
                    >
                      Call Now
                    </a>
                  )}
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center py-2.5 border border-white/30 text-white! font-semibold text-sm rounded-full hover:bg-white/10 transition-colors"
                    >
                      Visit Website
                    </a>
                  )}
                </div>
              </div>

              {/* Claim hook — free, feeds the outreach funnel. Hidden once claimed. */}
              {shop.claimed_at ? (
                <p className="text-center text-xs text-[var(--color-charcoal-light)]">
                  Owner-managed listing
                </p>
              ) : (
                <p className="text-center text-sm">
                  <Link
                    href={`/claim/${shop.slug}`}
                    className="text-[var(--color-charcoal-light)] hover:text-[var(--color-forest)] transition-colors"
                  >
                    Own this shop? <span className="font-semibold text-[var(--color-forest)]">Claim it free →</span>
                  </Link>
                </p>
              )}

              {/* Hours card */}
              {shop.working_hours && Object.keys(shop.working_hours).length > 0 && (
                <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6">
                  <h3 className="font-display text-lg font-bold text-[var(--color-charcoal)] mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-[var(--color-gold)]" />
                    Hours
                  </h3>
                  <ShopHours workingHours={shop.working_hours} />
                </div>
              )}

              {/* Mobile contact buttons */}
              <div className="lg:hidden flex flex-col gap-3">
                {shop.phone && (
                  <Button href={`tel:${shop.phone}`} variant="primary" size="lg" external>
                    <Phone size={16} className="mr-2" />
                    Call {shop.name}
                  </Button>
                )}
                {websiteUrl && (
                  <Button
                    href={websiteUrl}
                    variant="secondary"
                    size="lg"
                    external
                  >
                    <Globe size={16} className="mr-2" />
                    Visit Website
                  </Button>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <FaqSection items={listingFaqs(shop)} heading={`${shop.name} — FAQ`} />

      {/* Nearby Fitters */}
      {nearby.length > 0 && (
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader title={`More Fitters in ${shop.state}`} />
            <ListingGrid shops={nearby} reveal />
          </div>
        </section>
      )}
    </>
  )
}
