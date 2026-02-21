import Link from "next/link"
import { Card, CardFooter } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { RatingStars } from "@/components/ui/RatingStars"
import type { ListingCardProps } from "@/types/shop"

/* ─────────────────────────────────────────────────────────
   LISTING CARD
   The primary display unit for every shop in the directory.
   Designed to feel like a magazine listing — not a database
   row. Editorial, legible, and distinctive.
   ───────────────────────────────────────────────────────── */

export function ListingCard({
  name,
  shop_type,
  primary_service,
  city,
  state,
  state_code,
  rating,
  rating_tier,
  services,
  services_array,
  offers_fitting,
  fitting_environment,
  phone,
  website,
  verified,
  slug,
}: ListingCardProps) {
  /* Parse services — prefer the array, fall back to pipe-split string */
  const serviceList: string[] =
    services_array?.length
      ? services_array
      : services
        ? services.split("|").map((s) => s.trim()).filter(Boolean)
        : []

  const visibleServices = serviceList.slice(0, 4)
  const extraCount      = Math.max(0, serviceList.length - 4)

  return (
    <Card
      interactive
      className="group relative overflow-hidden flex flex-col"
    >
      {/* ── Left edge: 3px vertical brass accent bar ── */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--color-brass)] opacity-70 group-hover:opacity-100 transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* ── Top badges row ── */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-0 pl-7">
        {/* Fitting callout — most important signal, shown first */}
        {offers_fitting ? (
          <span className="font-[family-name:var(--font-body)] text-xs text-[var(--color-brass)] tracking-wide">
            <span aria-hidden="true">✦</span> Fitting Available
            {fitting_environment ? (
              <span className="text-[var(--color-ivory-warm)] font-normal">
                {" "}({fitting_environment})
              </span>
            ) : null}
          </span>
        ) : (
          <span />
        )}

        {/* Right side: shop_type + verified */}
        <div className="flex items-center gap-1.5 shrink-0">
          {verified && <Badge variant="verified" />}
          {shop_type && (
            <Badge variant="default">{shop_type}</Badge>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 px-5 pt-3 pb-4 pl-7 space-y-2.5">

        {/* Headline: listing name */}
        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold leading-tight">
          <Link
            href={`/listing/${slug}`}
            className="text-[var(--color-ivory)] group-hover:text-[var(--color-brass-light)] transition-colors duration-200 decoration-[var(--color-brass)] underline-offset-3 group-hover:underline"
          >
            {name}
          </Link>
        </h3>

        {/* Subheadline: location */}
        <p className="font-[family-name:var(--font-body)] text-sm italic text-[var(--color-ivory-warm)]">
          {city}, {state}
        </p>

        {/* Rating row */}
        {rating !== null && rating > 0 ? (
          <div className="flex items-center gap-2.5 flex-wrap">
            <RatingStars rating={rating} size="sm" />
            <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-brass)] tabular-nums">
              {rating.toFixed(1)}
            </span>
            {rating_tier && (
              <span className="font-[family-name:var(--font-body)] text-xs text-[var(--color-ivory-warm)]">
                · {rating_tier}
              </span>
            )}
          </div>
        ) : null}

        {/* Services pills */}
        {visibleServices.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {visibleServices.map((svc) => (
              <Badge key={svc} variant="default" className="text-[10px] px-2 py-px">
                {svc}
              </Badge>
            ))}
            {extraCount > 0 && (
              <span className="inline-flex items-center text-[10px] text-[var(--color-ivory-warm)] font-[family-name:var(--font-body)] px-1">
                +{extraCount} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Footer: phone left, website right ── */}
      <CardFooter className="pl-7 flex items-center justify-between gap-4">
        {phone ? (
          <a
            href={`tel:${phone.replace(/\D/g, "")}`}
            className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ivory-warm)] hover:text-[var(--color-ivory)] transition-colors tracking-wide"
            aria-label={`Call ${name}`}
          >
            {phone}
          </a>
        ) : (
          <span />
        )}

        {website ? (
          <a
            href={website.startsWith("http") ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-[family-name:var(--font-body)] text-xs text-[var(--color-brass)] hover:text-[var(--color-brass-light)] transition-colors group/link"
          >
            Visit Website{" "}
            <span
              className="inline-block transition-transform duration-150 group-hover/link:translate-x-0.5"
              aria-hidden="true"
            >
              →
            </span>
          </a>
        ) : null}
      </CardFooter>
    </Card>
  )
}
