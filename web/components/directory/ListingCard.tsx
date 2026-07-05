import Link from "next/link"
import { MapPin, Wrench } from "lucide-react"
import { RatingStars } from "@/components/ui/RatingStars"
import { getCover } from "@/lib/cover"
import { getShopTag } from "@/lib/badges"
import type { ListingCardProps } from "@/types/shop"

export function ListingCard({
  name,
  shop_type,
  city,
  state_code,
  rating,
  reviews,
  services_array,
  offers_fitting,
  fitting_environment,
  slug,
  is_featured,
  listing_tier,
  verified_expires_at,
  distance_km,
}: ListingCardProps & { reviews?: number | null; is_featured?: boolean; listing_tier?: string | null; verified_expires_at?: string | null }) {
  const { paletteIndex: p } = getCover(slug, shop_type)

  // Single-source badge logic — Verified (paid) > Featured > Top Rated (earned)
  const tierTag = getShopTag({ listing_tier, verified_expires_at, is_featured, rating, reviews })

  return (
    <Link
      href={`/listing/${slug}`}
      className="group relative flex flex-col h-full bg-[var(--color-paper)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Thin palette accent — keeps per-shop identity without a heavy image */}
      <span
        aria-hidden="true"
        className="h-1 w-full shrink-0"
        style={{ backgroundImage: `linear-gradient(90deg, var(--cover-${p}-a), var(--cover-${p}-b))` }}
      />

      <div className="flex flex-col flex-1 p-6">
        {/* ── Header: shop type, with tier tag at right ── */}
        <div className="flex items-center justify-between gap-3 min-h-[1.25rem]">
          {shop_type ? (
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-gold-ink)] leading-tight">
              {shop_type}
            </span>
          ) : (
            <span />
          )}
          {tierTag && (
            <span
              className={`shrink-0 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] rounded-[3px] ${tierTag.className}`}
            >
              {tierTag.label}
            </span>
          )}
        </div>

        <h3 className="font-display mt-3 text-lg font-bold text-[var(--color-charcoal)] leading-snug group-hover:text-[var(--color-forest)] transition-colors">
          {name}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-charcoal-light)]">
          <MapPin size={14} className="text-[var(--color-gold)] shrink-0" />
          <span>
            {city}, {state_code}
          </span>
          {distance_km != null && (
            <span className="data ml-1 text-xs text-[var(--color-charcoal-light)]">
              · {distance_km < 1 ? "<1 km" : `${Math.round(distance_km)} km`}
            </span>
          )}
        </div>

        {rating && (
          <div className="mt-2.5">
            <RatingStars rating={rating} size="sm" />
          </div>
        )}

        {offers_fitting && (
          <div className="mt-2.5 flex items-center gap-1.5 text-sm text-[var(--color-charcoal)]">
            <Wrench size={14} className="text-[var(--color-forest)] shrink-0" />
            <span>
              Club fitting
              {fitting_environment ? ` · ${fitting_environment}` : ""}
            </span>
          </div>
        )}

        {services_array && services_array.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--color-line)] flex flex-wrap gap-1.5">
            {services_array.slice(0, 3).map((service) => (
              <span
                key={service}
                className="text-xs px-2.5 py-1 bg-[var(--color-cream)] text-[var(--color-charcoal-light)] rounded-full"
              >
                {service}
              </span>
            ))}
            {services_array.length > 3 && (
              <span className="data text-xs px-2.5 py-1 text-[var(--color-charcoal-light)]">
                +{services_array.length - 3}
              </span>
            )}
          </div>
        )}

        {/* CTA hint pinned to bottom */}
        <div className="mt-auto pt-4 flex items-center gap-1 text-sm font-semibold text-[var(--color-forest)] group-hover:gap-2 transition-all">
          View details
          <span aria-hidden="true">&rarr;</span>
        </div>
      </div>
    </Link>
  )
}
