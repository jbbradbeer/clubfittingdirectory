import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  getShopBySlug,
  getAllShopSlugs,
  getNearbyShops,
  toCitySlug,
} from "@/lib/supabase/queries/shops"
import { buildLocalBusinessSchema, buildBreadcrumbSchema } from "@/lib/structured-data"
import { Badge } from "@/components/ui/Badge"
import { RatingStars } from "@/components/ui/RatingStars"
import { ListingCard } from "@/components/directory/ListingCard"
import { MapPin, Phone, Globe, Clock, CheckCircle2 } from "lucide-react"
import type { Shop } from "@/types/shop"

/* ─────────────────────────────────────────────────────────
   /listing/[slug] — Individual shop profile page
   ───────────────────────────────────────────────────────── */

export const revalidate = 86400

import { SITE_URL } from "@/lib/constants"

export async function generateStaticParams() {
  const slugs = await getAllShopSlugs().catch(() => [])
  return slugs.map(({ slug }) => ({ slug }))
}

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
  ].filter(Boolean).join(". ").concat(".")

  return {
    title: `${shop.name} — Club Fitting Directory | The Tuxedo Collective`,
    description,
    alternates: { canonical: `${SITE_URL}/listing/${slug}` },
    openGraph: {
      title: `${shop.name} — Club Fitting Directory`,
      description, type: "website",
      url: `${SITE_URL}/listing/${slug}`,
      siteName: "Club Fitting Directory",
    },
    twitter: { card: "summary", title: shop.name, description },
  }
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [shop] = await Promise.all([
    getShopBySlug(slug),
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBizLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="min-h-screen bg-[var(--color-off-white)]">

        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" className="border-b border-[var(--color-gray-light)] bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <ol className="flex flex-wrap items-center gap-1.5 font-[family-name:var(--font-body)] text-xs text-[var(--color-gray)]">
              <BreadcrumbItem href="/" label="Home" />
              <BreadcrumbSep />
              <BreadcrumbItem href={`/state/${shop.state_code.toLowerCase()}`} label={shop.state} />
              {shop.city && (
                <>
                  <BreadcrumbSep />
                  <BreadcrumbItem
                    href={`/city/${toCitySlug(shop.city, shop.state_code)}`}
                    label={shop.city}
                  />
                </>
              )}
              <BreadcrumbSep />
              <li className="text-[var(--color-black)] truncate max-w-[200px]" aria-current="page">{shop.name}</li>
            </ol>
          </div>
        </nav>

        {/* ── Green header band ── */}
        <header className="bg-[var(--color-green-deep)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {shop.verified && <Badge variant="verified" className="!border-white/20 !text-white" />}
              {shop.shop_type && <Badge variant="default" className="!border-white/20 !text-white">{shop.shop_type}</Badge>}
              {shop.listing_tier === "featured" && (
                <Badge variant="highlight" className="!bg-white !text-[var(--color-green-deep)]">Featured</Badge>
              )}
            </div>

            <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-normal text-white leading-tight">
              {shop.name}
            </h1>

            <p className="font-[family-name:var(--font-body)] text-white/70 text-lg flex items-center gap-1.5">
              <MapPin size={15} className="text-white/50 shrink-0" aria-hidden="true" />
              {[shop.street, shop.city, shop.state].filter(Boolean).join(", ")}
            </p>

            {shop.rating && shop.rating > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <RatingStars rating={shop.rating} size="md" />
                <span className="font-[family-name:var(--font-body)] text-white font-medium tabular-nums">{shop.rating.toFixed(1)}</span>
                {shop.rating_tier && <span className="font-[family-name:var(--font-body)] text-sm text-white/60">{shop.rating_tier}</span>}
                {shop.reviews && shop.reviews > 0 ? (
                  <span className="font-[family-name:var(--font-body)] text-xs text-white/40">({shop.reviews.toLocaleString()} reviews)</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        {/* ── Two-column body ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">

            {/* Left */}
            <div className="space-y-10 min-w-0">
              {services.length > 0 && (
                <section>
                  <SectionHeading>Services Offered</SectionHeading>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {services.map((svc) => <Badge key={svc} variant="default" className="text-sm px-3 py-1">{svc}</Badge>)}
                  </div>
                  {shop.offers_fitting && (
                    <div className="mt-5 border border-[var(--color-green-deep)] rounded-md p-5 bg-[#1B43320A]">
                      <p className="font-[family-name:var(--font-body)] text-base font-semibold text-[var(--color-green-deep)] mb-2">Club Fitting Available</p>
                      <div className="space-y-1.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-gray)]">
                        {shop.fitting_environment && <p><span className="text-[var(--color-black)]">Environment:</span> {shop.fitting_environment}</p>}
                        {shop.public_fitting && (
                          <p className="flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-[var(--color-green-deep)]" aria-hidden="true" />
                            Open to the public — no membership required
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}

              <AccessibilitySection about={shop.about} />

              <section>
                <SectionHeading>Location</SectionHeading>
                <div className="mt-4 space-y-3">
                  <address className="not-italic font-[family-name:var(--font-body)] text-sm text-[var(--color-gray)] leading-relaxed tabular-nums">
                    {shop.street && <div>{shop.street}</div>}
                    <div>{shop.city}, {shop.state_code}{shop.postal_code ? ` ${shop.postal_code}` : ""}</div>
                    <div>United States</div>
                  </address>
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-green-deep)] hover:text-[var(--color-green-hover)] transition-colors group">
                      Get Directions
                      <span className="inline-block transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
                    </a>
                  )}
                </div>
              </section>
            </div>

            {/* Right sidebar */}
            <aside className="space-y-5">
              <div className="bg-white border border-[var(--color-gray-light)] rounded-md p-6 space-y-5">
                <p className="font-[family-name:var(--font-body)] text-[10px] tracking-[0.25em] uppercase text-[var(--color-green-deep)] font-semibold">Contact</p>

                {shop.phone && (
                  <a href={`tel:${shop.phone.replace(/\D/g, "")}`} className="flex items-center gap-2.5 group" aria-label={`Call ${shop.name}`}>
                    <Phone size={16} className="text-[var(--color-green-deep)] shrink-0" aria-hidden="true" />
                    <span className="font-[family-name:var(--font-body)] text-xl text-[var(--color-black)] group-hover:text-[var(--color-green-deep)] transition-colors tracking-wide tabular-nums">{shop.phone}</span>
                  </a>
                )}

                {shop.website && safeWebsiteUrl(shop.website) && (
                  <a href={safeWebsiteUrl(shop.website)!} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-md bg-[var(--color-green-deep)] text-white font-[family-name:var(--font-body)] text-sm font-semibold hover:bg-[var(--color-green-hover)] transition-colors">
                    <Globe size={15} aria-hidden="true" />
                    Visit Website
                  </a>
                )}

                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 font-[family-name:var(--font-body)] text-sm text-[var(--color-gray)] hover:text-[var(--color-green-deep)] transition-colors">
                    <MapPin size={14} aria-hidden="true" />
                    View on Google Maps
                  </a>
                )}

                {shop.working_hours && (
                  <>
                    <div aria-hidden="true"><span className="block border-t border-[var(--color-gray-light)]" /></div>
                    <WorkingHours hours={shop.working_hours} />
                  </>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* Nearby */}
        {nearbyShops.length > 0 && (
          <section className="border-t border-[var(--color-gray-light)] py-14">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex items-end justify-between mb-8 gap-4">
                <div>
                  <p className="font-[family-name:var(--font-body)] text-[10px] tracking-[0.3em] uppercase text-[var(--color-green-deep)] mb-1.5">More in {shop.state}</p>
                  <h2 className="font-[family-name:var(--font-display)] text-3xl font-normal text-[var(--color-black)]">More Fitters in {shop.state}</h2>
                </div>
                <Link href={`/state/${shop.state_code.toLowerCase()}`}
                  className="shrink-0 font-[family-name:var(--font-body)] text-sm text-[var(--color-green-deep)] hover:text-[var(--color-green-hover)] transition-colors whitespace-nowrap group">
                  View all in {shop.state_code}{" "}
                  <span className="inline-block transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {nearbyShops.map((nearby) => (
                  <ListingCard key={nearby.id} name={nearby.name} shop_type={nearby.shop_type} primary_service={nearby.primary_service}
                    city={nearby.city} state={nearby.state} state_code={nearby.state_code} rating={nearby.rating} rating_tier={nearby.rating_tier}
                    services={nearby.services} services_array={nearby.services_array ?? []} offers_fitting={nearby.offers_fitting}
                    fitting_environment={nearby.fitting_environment} phone={nearby.phone} website={nearby.website} verified={nearby.verified} slug={nearby.slug} />
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
          <Link href="/directory"
            className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-green-deep)] hover:text-[var(--color-green-hover)] transition-colors group">
            <span className="inline-block transition-transform group-hover:-translate-x-0.5" aria-hidden="true">←</span>
            Back to Directory
          </Link>
        </div>
      </div>
    </>
  )
}

/* ── Sub-components ── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-black)] flex items-center gap-3">
      {children}
      <span className="flex-1 h-px bg-[var(--color-gray-light)]" aria-hidden="true" />
    </h2>
  )
}

function BreadcrumbItem({ href, label }: { href: string; label: string }) {
  return <li><Link href={href} className="text-[var(--color-gray)] hover:text-[var(--color-green-deep)] transition-colors">{label}</Link></li>
}

function BreadcrumbSep() {
  return <li aria-hidden="true" className="text-[var(--color-gray-light)]">/</li>
}

function WorkingHours({ hours }: { hours: Record<string, string> }) {
  const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" })
  const ordered = DAY_ORDER.filter((d) => hours[d] !== undefined).map((d) => ({ day: d, hours: hours[d] }))
  if (ordered.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <Clock size={13} className="text-[var(--color-green-deep)]" aria-hidden="true" />
        <span className="font-[family-name:var(--font-body)] text-[10px] tracking-[0.2em] uppercase text-[var(--color-green-deep)] font-semibold">Hours</span>
      </div>
      <dl className="space-y-1.5">
        {ordered.map(({ day, hours: h }) => {
          const isToday = day === today
          return (
            <div key={day} className={`flex justify-between gap-3 ${isToday ? "text-[var(--color-black)]" : "text-[var(--color-gray)]"}`}>
              <dt className={`font-[family-name:var(--font-body)] text-xs shrink-0 ${isToday ? "font-semibold" : ""}`}>
                {day.slice(0, 3)}
                {isToday && <span className="ml-1 text-[var(--color-green-deep)] text-[9px]">●</span>}
              </dt>
              <dd className="font-[family-name:var(--font-body)] text-xs text-right tabular-nums">
                {h.toLowerCase().includes("closed") ? <span className="text-[var(--color-gray)]">Closed</span> : h}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

function AccessibilitySection({ about }: { about: Record<string, unknown> | null }) {
  if (!about) return null
  const acc = about["Accessibility"] as Record<string, boolean> | undefined
  if (!acc || typeof acc !== "object") return null
  const features = Object.entries(acc).filter(([, v]) => v === true).map(([k]) => k)
  if (features.length === 0) return null

  return (
    <section>
      <SectionHeading>Accessibility</SectionHeading>
      <ul className="mt-4 space-y-2">
        {features.map((feat) => (
          <li key={feat} className="flex items-center gap-2.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-gray)]">
            <CheckCircle2 size={14} className="text-[var(--color-green-deep)] shrink-0" aria-hidden="true" />
            {feat}
          </li>
        ))}
      </ul>
    </section>
  )
}

function safeWebsiteUrl(raw: string): string | null {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`)
    if (url.protocol !== "https:" && url.protocol !== "http:") return null
    return url.href
  } catch { return null }
}

function parseServices(shop: Shop): string[] {
  if (shop.services_array?.length) return shop.services_array
  if (shop.services) return shop.services.split("|").map((s) => s.trim()).filter(Boolean)
  return []
}
