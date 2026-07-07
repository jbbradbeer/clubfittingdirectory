import Link from "next/link"
import type { Shop } from "@/types/shop"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { ownershipLabel, formatFittingPrice } from "@/lib/fitter-classification"
import { LAST_UPDATED_LABEL } from "@/lib/seo-content"

/* ─────────────────────────────────────────────────────────
   TOP FITTERS COMPARISON TABLE — the "citable answer" block
   on state/city pages. AI engines and Google overwhelmingly
   cite pages shaped like a ranked, year-stamped list of ~10
   picks with a comparison table and a stated methodology
   (tasks/research/geo-ai-search-2026-07.md), so this renders
   the page's top shops as one server-rendered table.
   ───────────────────────────────────────────────────────── */

/* Structural subset — any shop-shaped row with these fields can be passed in. */
export interface TopFitterRow {
  slug: string
  name: string
  city: string | null
  rating: number | null
  reviews: number | null
  offers_fitting: boolean | null
  ownership_type: Shop["ownership_type"]
  launch_monitors: string[] | null
  fitting_price_min: number | null
  fitting_price_max: number | null
}

/* Review COUNTS are unpopulated for all but ~20 shops (ratings themselves
   cover ~99%), so a review-weighted score isn't possible yet. Rank by rating,
   break the (very common) 5.0 ties by verified fitting-data completeness —
   which is both an honest quality proxy and puts the rows with real price/tech
   values at the top of the comparison table — then by review count where one
   exists, then name for a deterministic order. */
function dataCompleteness(s: TopFitterRow): number {
  return (
    (s.launch_monitors?.length ? 1 : 0) +
    (s.fitting_price_min != null || s.fitting_price_max != null ? 1 : 0) +
    (s.offers_fitting ? 1 : 0)
  )
}

export function rankTopFitters<T extends TopFitterRow>(shops: T[], limit = 10): T[] {
  return [...shops]
    .filter((s) => s.rating != null)
    .sort(
      (a, b) =>
        (b.rating ?? 0) - (a.rating ?? 0) ||
        dataCompleteness(b) - dataCompleteness(a) ||
        (b.reviews ?? 0) - (a.reviews ?? 0) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, limit)
}

interface TopFittersTableProps {
  shops: TopFitterRow[]
  /** Place name for the heading, e.g. "Texas" or "Austin, TX" */
  place: string
  year: number
  /** Hide the city column when every row is the same city. */
  showCity?: boolean
}

const MIN_ROWS = 3

export function TopFittersTable({ shops, place, year, showCity = true }: TopFittersTableProps) {
  const top = rankTopFitters(shops)
  if (top.length < MIN_ROWS) return null

  return (
    <section className="bg-[var(--color-ivory)] pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={`Updated ${LAST_UPDATED_LABEL}`}
          title={`Top ${top.length} Club Fitters in ${place} for ${year}`}
          centered={false}
        />
        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-charcoal-light)]">
                <th scope="col" className="px-4 py-3 font-medium">#</th>
                <th scope="col" className="px-4 py-3 font-medium">Fitter</th>
                {showCity && <th scope="col" className="px-4 py-3 font-medium">City</th>}
                <th scope="col" className="px-4 py-3 font-medium">Type</th>
                <th scope="col" className="px-4 py-3 font-medium">Launch Monitor</th>
                <th scope="col" className="px-4 py-3 font-medium">Fitting Price</th>
                <th scope="col" className="px-4 py-3 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {top.map((shop, i) => (
                <tr
                  key={shop.slug}
                  className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-cream)] transition-colors"
                >
                  <td className="px-4 py-3 text-[var(--color-charcoal-light)]">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/listing/${shop.slug}`}
                      className="font-medium text-[var(--color-forest)] hover:underline"
                    >
                      {shop.name}
                    </Link>
                  </td>
                  {showCity && <td className="px-4 py-3">{shop.city ?? "—"}</td>}
                  <td className="px-4 py-3">{ownershipLabel(shop.ownership_type) ?? "—"}</td>
                  <td className="px-4 py-3">
                    {shop.launch_monitors?.length ? shop.launch_monitors.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatFittingPrice(shop.fitting_price_min, shop.fitting_price_max) ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <strong>{shop.rating?.toFixed(1)}</strong>
                    <span className="text-[var(--color-charcoal-light)]"> / 5</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-[var(--color-charcoal-light)]">
          Methodology: ranked by Google rating from the {shops.length} {place} shops in our
          directory, with ties broken by verified fitting details (published prices, launch
          monitor tech). Prices and launch monitor details come from each shop&apos;s own
          website; &ldquo;—&rdquo; means the shop hasn&rsquo;t published it yet. Last updated{" "}
          {LAST_UPDATED_LABEL}.
        </p>
      </div>
    </section>
  )
}
