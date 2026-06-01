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
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-[var(--color-cream)] border border-[var(--color-border)] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
