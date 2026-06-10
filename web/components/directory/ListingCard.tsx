import Link from "next/link"
import { MapPin, Wrench } from "lucide-react"
import { RatingStars } from "@/components/ui/RatingStars"
import type { ListingCardProps } from "@/types/shop"

export function ListingCard({
  name,
  shop_type,
  city,
  state_code,
  rating,
  rating_tier,
  services_array,
  offers_fitting,
  fitting_environment,
  verified,
  slug,
  is_featured,
  distance_km,
}: ListingCardProps & { reviews?: number | null; is_featured?: boolean }) {
  const monogram = name?.trim()?.charAt(0)?.toUpperCase() || "•"

  return (
    <Link
      href={`/listing/${slug}`}
      className="group flex flex-col bg-[var(--color-paper)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* ── Branded cover (photo-less) ── */}
      <div className="relative aspect-[16/10] bg-gradient-to-br from-[var(--color-forest-light)] via-[var(--color-forest)] to-[var(--color-forest-deep)] flex items-center justify-center overflow-hidden">
        {/* decorative ring */}
        <div className="absolute -right-8 -top-10 w-36 h-36 rounded-full border border-white/10" />
        <div className="absolute -right-2 -bottom-12 w-40 h-40 rounded-full border border-white/10" />
        <span
          aria-hidden="true"
          className="font-display font-extrabold text-white/95 text-6xl leading-none"
        >
          {monogram}
        </span>

        {/* tier pills (top-left) */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {is_featured && (
            <span className="px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] rounded-full bg-[var(--color-gold)] text-[var(--color-forest-deep)]">
              Featured
            </span>
          )}
          {!is_featured && rating_tier === "Top Rated" && (
            <span className="px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] rounded-full bg-white/90 text-[var(--color-forest)]">
              Top Rated
            </span>
          )}
          {verified && (
            <span className="px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] rounded-full bg-white/15 text-white backdrop-blur-sm">
              Verified
            </span>
          )}
        </div>

        {/* distance pill (top-right) */}
        {distance_km != null && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] rounded-full bg-white/90 text-[var(--color-forest)]">
              {distance_km < 1 ? "< 1 km" : `${Math.round(distance_km)} km`}
            </span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-6">
        {shop_type && (
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-gold-ink)]">
            {shop_type}
          </span>
        )}
        <h3 className="font-display mt-1.5 text-lg font-bold text-[var(--color-charcoal)] leading-snug group-hover:text-[var(--color-forest)] transition-colors">
          {name}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-charcoal-light)]">
          <MapPin size={14} className="text-[var(--color-gold)] shrink-0" />
          {city}, {state_code}
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
              <span className="text-xs px-2.5 py-1 text-[var(--color-charcoal-light)]">
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
