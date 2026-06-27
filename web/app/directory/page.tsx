import type { Metadata } from "next"
import { Suspense } from "react"
import { getAllStatesWithShops, getAllShopTypes } from "@/lib/supabase/queries/shops"
import { DirectoryClient } from "@/components/directory/DirectoryClient"
import { SITE_NAME, SITE_URL } from "@/lib/constants"
import { logQueryError } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Search Golf Club Fitters & Retailers — All 50 States",
  description: `Search and filter ${SITE_NAME}'s comprehensive directory of independent golf club fitters, retailers, simulators, and pro shops across the United States.`,
  alternates: { canonical: `${SITE_URL}/directory` },
}

// Cache the static filter options (state + type dropdowns). The actual result
// list is fetched client-side, so these only change when shops are added.
export const revalidate = 2592000 // 30 days — long window keeps ISR writes low; edits propagate via on-demand revalidation (app/api/revalidate)

export default async function DirectoryPage() {
  const [stateOptions, shopTypeOptions] = await Promise.all([
    getAllStatesWithShops().catch((e) => logQueryError("directory getAllStatesWithShops", e, [])),
    getAllShopTypes().catch((e) => logQueryError("directory getAllShopTypes", e, [])),
  ])

  return (
    <Suspense fallback={<DirectoryLoading />}>
      <DirectoryClient
        stateOptions={stateOptions}
        shopTypeOptions={shopTypeOptions}
      />
    </Suspense>
  )
}

function DirectoryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-12 bg-[var(--color-cream)] rounded-lg animate-pulse mb-8" />
      <div className="flex gap-8">
        <div className="hidden lg:block w-56 shrink-0 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-[var(--color-cream)] rounded animate-pulse" />
          ))}
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] overflow-hidden shadow-card">
              <div className="h-1 w-full bg-[var(--color-cream-dark)]" />
              <div className="p-6 animate-pulse">
                <div className="h-3 w-20 bg-[var(--color-cream)] rounded" />
                <div className="mt-4 h-5 w-3/4 bg-[var(--color-cream)] rounded" />
                <div className="mt-3 h-3 w-1/2 bg-[var(--color-cream)] rounded" />
                <div className="mt-5 h-3 w-2/3 bg-[var(--color-cream)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
