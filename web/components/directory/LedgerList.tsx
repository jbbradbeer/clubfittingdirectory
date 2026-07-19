import Link from "next/link"
import { Star } from "lucide-react"
import { getShopTag } from "@/lib/badges"
import type { Shop } from "@/types/shop"

/**
 * The "ledger" — a compact yardage-book row list for long collections
 * (state/city/category/repair pages). Replaces the endless 3-up card river:
 * mono rank, serif name, tier tag, city, rating in the `.data` voice.
 * Cards stay for short lists and search results; the ledger is the signature
 * treatment for the long tail.
 */
export function LedgerList({
  shops,
  className = "mt-8",
  showCity = true,
}: {
  shops: Shop[]
  className?: string
  /** Hide the city column when every row is the same city. */
  showCity?: boolean
}) {
  return (
    <ol className={`${className} border-y border-[var(--color-border)]`}>
      {shops.map((shop, i) => {
        const tierTag = getShopTag(shop)
        return (
          <li key={shop.slug} className="border-b border-[var(--color-line)] last:border-b-0">
            <Link
              href={`/listing/${shop.slug}`}
              className="group flex items-center gap-3 sm:gap-6 py-3.5 px-2 -mx-2 hover:bg-[var(--color-paper)] transition-colors"
            >
              <span className="data w-9 shrink-0 text-sm text-[var(--color-gold-ink)]">
                {String(i + 1).padStart(2, "0")}
              </span>

              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="font-display font-bold text-[var(--color-charcoal)] leading-snug truncate group-hover:text-[var(--color-forest)] transition-colors">
                    {shop.name}
                  </span>
                  {tierTag && (
                    <span
                      className={`hidden sm:inline-block shrink-0 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] rounded-[3px] ${tierTag.className}`}
                    >
                      {tierTag.label}
                    </span>
                  )}
                </span>
                {/* Mobile: city folds under the name */}
                {showCity && (
                  <span className="sm:hidden block text-xs text-[var(--color-charcoal-light)] truncate">
                    {shop.city}, {shop.state_code}
                  </span>
                )}
              </span>

              {showCity && (
                <span className="hidden sm:block w-44 shrink-0 text-sm text-[var(--color-charcoal-light)] truncate">
                  {shop.city}, {shop.state_code}
                </span>
              )}

              <span className="hidden md:block w-28 shrink-0 text-xs uppercase tracking-[0.12em] text-[var(--color-charcoal-light)] truncate">
                {shop.shop_type ?? ""}
              </span>

              <span className="data w-12 shrink-0 text-sm text-[var(--color-charcoal)] text-right">
                {shop.rating ? (
                  <span className="inline-flex items-center gap-1">
                    {shop.rating.toFixed(1)}
                    <Star
                      size={12}
                      className="text-[var(--color-gold-dark)]"
                      fill="var(--color-gold-dark)"
                      aria-hidden="true"
                    />
                  </span>
                ) : (
                  <span className="text-[var(--color-charcoal-light)]">—</span>
                )}
              </span>

              <span
                aria-hidden="true"
                className="hidden sm:block shrink-0 text-[var(--color-charcoal-light)] group-hover:text-[var(--color-forest)] group-hover:translate-x-0.5 transition-all"
              >
                &rarr;
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
