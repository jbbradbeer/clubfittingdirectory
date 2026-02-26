import type { Metadata } from "next"
import { Suspense } from "react"
import { getAllStatesWithShops, getShopTypeCounts } from "@/lib/supabase/queries/shops"
import { DirectoryClient } from "@/components/directory/DirectoryClient"

/* ─────────────────────────────────────────────────────────
   /directory — Server Component shell
   ───────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Find a Club Fitter Near You",
  description:
    "Search 1,200+ independent golf club fitting shops, simulators, and retailers across all 50 states. Filter by state, shop type, fitting availability, and rating.",
}

export default async function DirectoryPage() {
  const [states, typeCounts] = await Promise.all([
    getAllStatesWithShops().catch(() => []),
    getShopTypeCounts().catch(() => ({})),
  ])

  return (
    <Suspense fallback={<DirectoryLoadingShell />}>
      <DirectoryClient states={states} typeCounts={typeCounts} />
    </Suspense>
  )
}

function DirectoryLoadingShell() {
  return (
    <div className="min-h-screen bg-[var(--color-off-white)] animate-pulse">
      <div className="border-b border-[var(--color-gray-light)] bg-white py-8 px-6">
        <div className="max-w-[1400px] mx-auto space-y-2">
          <div className="h-3 w-32 rounded bg-[var(--color-gray-light)]" />
          <div className="h-9 w-56 rounded bg-[var(--color-gray-light)]" />
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto flex gap-6 p-6">
        <div className="hidden lg:block w-[280px] h-[600px] rounded-md bg-white border border-[var(--color-gray-light)] shrink-0" />
        <div className="flex-1 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-md bg-white border border-[var(--color-gray-light)]" />
          ))}
        </div>
      </div>
    </div>
  )
}
