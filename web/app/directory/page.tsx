import type { Metadata } from "next"
import { Suspense } from "react"
import { getAllStatesWithShops, getAllShopTypes, getDirectoryFirstPage } from "@/lib/supabase/queries/shops"
import { DirectoryClient } from "@/components/directory/DirectoryClient"
import { ListingCard } from "@/components/directory/ListingCard"
import { SITE_URL } from "@/lib/constants"
import { logQueryError } from "@/lib/utils"
import type { DirectoryResult } from "@/lib/supabase/queries/shared"

export const metadata: Metadata = {
  title: "Search Golf Fitters & Retailers",
  description:
    "Search and filter 1,000+ independent golf club fitters, retailers, simulators, and pro shops across all 50 US states.",
  alternates: { canonical: `${SITE_URL}/directory` },
}

// Cache the server-rendered shell (header, filter options, first page of
// results). Filtered/paged views are fetched client-side as before.
export const revalidate = 2592000 // 30 days — long window keeps ISR writes low; edits propagate via on-demand revalidation (app/api/revalidate)

const EMPTY_RESULT: DirectoryResult = { shops: [], total: 0, page: 1, perPage: 24, totalPages: 1 }

export default async function DirectoryPage() {
  const [stateOptions, shopTypeOptions, initial] = await Promise.all([
    getAllStatesWithShops().catch((e) => logQueryError("directory getAllStatesWithShops", e, [])),
    getAllShopTypes().catch((e) => logQueryError("directory getAllShopTypes", e, [])),
    getDirectoryFirstPage().catch((e) => logQueryError("directory getDirectoryFirstPage", e, EMPTY_RESULT)),
  ])

  return (
    <div>
      {/* Header lives OUTSIDE the Suspense boundary: DirectoryClient uses
          useSearchParams, which bails the whole boundary to its fallback at
          prerender time — anything inside it never reaches crawler HTML. */}
      <div className="hero-surface grain">
        <div className="hero-contours" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="max-w-2xl">
            <p className="section-label mb-2">Find a Fitter</p>
            <h1 className="display text-[clamp(1.8rem,3.6vw,2.6rem)] text-[var(--color-charcoal)]">
              Search the directory
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[var(--color-charcoal-light)] leading-relaxed">
              Every independent club fitter, golf retailer, simulator studio, and pro shop in
              the directory — 1,000+ hand-vetted listings across all 50 states. Filter by
              state, services, fitting environment, or rating, or use Near Me to see who&rsquo;s
              within driving distance.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<DirectoryFallback initial={initial} />}>
        <DirectoryClient
          stateOptions={stateOptions}
          shopTypeOptions={shopTypeOptions}
          initialShops={initial.shops}
          initialTotal={initial.total}
          initialTotalPages={initial.totalPages}
        />
      </Suspense>
    </div>
  )
}

/* Prerendered stand-in for DirectoryClient: real first-page listing cards
   (crawlable, matches what the hydrated client shows) under a skeleton search
   bar. The client seeds from the same data, so the swap is invisible. */
function DirectoryFallback({ initial }: { initial: DirectoryResult }) {
  return (
    <div>
      <div className="hero-surface grain border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-12 bg-[var(--color-cream)] rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className="hidden lg:block w-60 xl:w-64 shrink-0 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-[var(--color-cream)] rounded animate-pulse" />
            ))}
          </div>
          <div className="flex-1 min-w-0">
            {/* Cards render as H3 — this keeps the H1→H2→H3 ladder intact */}
            <h2 className="sr-only">Directory results</h2>
            {initial.shops.length > 0 && (
              <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-[var(--color-line)] pb-3">
                <p className="text-sm text-[var(--color-charcoal-light)]">
                  <span className="data font-semibold text-[var(--color-charcoal)]">{initial.shops.length}</span>
                  {" of "}
                  <span className="data font-semibold text-[var(--color-charcoal)]">
                    {initial.total.toLocaleString()}
                  </span>{" "}
                  fitters
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {initial.shops.map((shop) => (
                <div key={shop.slug} className="h-full">
                  <ListingCard {...shop} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
