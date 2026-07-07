import { ListingCard } from "@/components/directory/ListingCard"
import type { Shop } from "@/types/shop"

/**
 * The standard 3-up listings grid used on the home, state, city, category,
 * repair, and listing (nearby) pages. `reveal` wraps each card for the
 * scroll-reveal observer (data-reveal-group / data-reveal).
 */
export function ListingGrid({
  shops,
  className = "mt-8",
  reveal = false,
}: {
  shops: Shop[]
  /** Spacing/extras prepended to the grid classes (default "mt-8"). */
  className?: string
  reveal?: boolean
}) {
  const grid = `${className} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`

  if (reveal) {
    return (
      <div className={grid} data-reveal-group>
        {shops.map((shop) => (
          <div key={shop.slug} data-reveal className="h-full">
            <ListingCard {...shop} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={grid}>
      {shops.map((shop) => (
        <ListingCard key={shop.slug} {...shop} />
      ))}
    </div>
  )
}
