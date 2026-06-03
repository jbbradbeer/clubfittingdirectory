import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  MapPin, Phone, Globe, ExternalLink, Clock, CheckCircle, Wrench, Navigation,
} from "lucide-react"
import { getShopBySlug, getNearbyShops, getAllShopSlugs, toCitySlug } from "@/lib/supabase/queries/shops"
import { buildLocalBusinessSchema, buildBreadcrumbSchema } from "@/lib/structured-data"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ListingMap } from "@/components/directory/ListingMap"
import { ShopHours } from "@/components/shop-profile/ShopHours"
import { Badge } from "@/components/ui/Badge"
import { RatingStars } from "@/components/ui/RatingStars"
import { Button } from "@/components/ui/Button"
import { ListingCard } from "@/components/directory/ListingCard"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { SITE_URL } from "@/lib/constants"
import { logQueryError } from "@/lib/utils"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 86400

export async function generateStaticParams() {
  const slugs = await getAllShopSlugs().catch((e) => logQueryError("listing generateStaticParams getAllShopSlugs", e, []))
  return slugs
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const shop = await getShopBySlug(slug).catch((e) => logQueryError("listing generateMetadata getShopBySlug", e, null))
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
  const shop = await getShopBySlug(slug).catch((e) => logQueryError("listing getShopBySlug", e, null))
  if (!shop) notFound()

  const nearby = await getNearbyShops(shop.state_code, shop.slug, 3).catch((e) => logQueryError("listing getNearbyShops", e, []))

  const localBusinessSchema = buildLocalBusinessSchema(shop)
  const breadcrumbSchema = buildBreadcrumbSchema(shop)
  // Guard against rows with a null city/state_code so a single bad row can't
  // crash the whole page (mirrors the defensive handling in structured-data.ts).
  const citySlug = shop.city && shop.state_code ? toCitySlug(shop.city, shop.state_code) : ""

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumb + Header */}
      <section className="hero-surface grain border-b border-[var(--color-border)]">
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
                <p className="section-label mb-3 inline-flex items-center gap-3">
                  <span className="gold-rule" />
                  {shop.shop_type}
                </p>
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
                <div className="flex flex-wrap gap-2">
                  {shop.verified && <Badge variant="verified">Verified</Badge>}
                  {shop.is_featured && <Badge variant="gold">Featured</Badge>}
                </div>
              </div>
            </div>

            {/* Quick actions (desktop) */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {shop.phone && (
                <Button href={`tel:${shop.phone}`} variant="primary" external>
                  <Phone size={15} className="mr-1.5" />
                  Call Now
                </Button>
              )}
              {shop.website && (
                <Button
                  href={shop.website.startsWith("http") ? shop.website : `https://${shop.website}`}
                  variant="secondary"
                  external
                >
                  <Globe size={15} className="mr-1.5" />
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
              {/* Services */}
              {shop.services_array && shop.services_array.length > 0 && (
                <div>
                  <h2
                    className="text-xl font-semibold text-[var(--color-charcoal)] mb-4"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Services Offered
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {shop.services_array.map((service) => (
                      <Badge key={service}>{service}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Club Fitting Details */}
              {shop.offers_fitting && (
                <div>
                  <h2
                    className="text-xl font-semibold text-[var(--color-charcoal)] mb-4"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Club Fitting Details
                  </h2>
                  <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Wrench size={16} className="text-[var(--color-gold)]" />
                      <span className="text-sm font-medium">Club Fitting Available</span>
                    </div>
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
                  </div>
                </div>
              )}

              {/* About */}
              {aboutEntries.length > 0 && (
                <div>
                  <h2
                    className="text-xl font-semibold text-[var(--color-charcoal)] mb-4"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    About
                  </h2>
                  <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-5">
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
                <h2
                  className="text-xl font-semibold text-[var(--color-charcoal)] mb-4"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Location
                </h2>
                <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-5">
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
                      className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-[var(--color-forest)] hover:text-[var(--color-gold)] transition-colors"
                    >
                      <Navigation size={14} />
                      Open in Google Maps &rarr;
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: sidebar */}
            <aside className="lg:w-80 shrink-0 space-y-6">
              {/* Contact card */}
              <div className="bg-[var(--color-forest)] text-white rounded-2xl shadow-card p-6">
                <h3
                  className="text-lg font-bold mb-4 text-white!"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Contact
                </h3>
                <div className="space-y-3">
                  {shop.phone && (
                    <a
                      href={`tel:${shop.phone}`}
                      className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                    >
                      <Phone size={16} />
                      {shop.phone}
                    </a>
                  )}
                  {shop.website && (
                    <a
                      href={shop.website.startsWith("http") ? shop.website : `https://${shop.website}`}
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
                  {shop.phone && (
                    <a
                      href={`tel:${shop.phone}`}
                      className="block w-full text-center py-2.5 bg-white text-[var(--color-forest)]! font-semibold text-sm rounded-full hover:bg-[var(--color-cream)] transition-colors"
                    >
                      Call Now
                    </a>
                  )}
                  {shop.website && (
                    <a
                      href={shop.website.startsWith("http") ? shop.website : `https://${shop.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center py-2.5 bg-[var(--color-gold)] text-[var(--color-forest-deep)] font-semibold text-sm rounded-full hover:bg-[var(--color-gold-dark)] transition-colors"
                    >
                      Visit Website
                    </a>
                  )}
                </div>
              </div>

              {/* Hours card */}
              {shop.working_hours && Object.keys(shop.working_hours).length > 0 && (
                <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6">
                  <h3
                    className="text-lg font-bold text-[var(--color-charcoal)] mb-4 flex items-center gap-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    <Clock size={18} className="text-[var(--color-gold)]" />
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
                {shop.website && (
                  <Button
                    href={shop.website.startsWith("http") ? shop.website : `https://${shop.website}`}
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

      {/* Nearby Fitters */}
      {nearby.length > 0 && (
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Also in this area"
              title={`More Fitters in ${shop.state}`}
            />
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
              {nearby.map((s) => (
                <ListingCard key={s.slug} {...s} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
