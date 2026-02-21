import type { Metadata } from "next"
import { Suspense } from "react"
import { getAllStatesWithShops, getShopTypeCounts } from "@/lib/supabase/queries/shops"
import { DirectoryClient } from "@/components/directory/DirectoryClient"

/* ─────────────────────────────────────────────────────────
   /directory — Server Component shell
   Fetches the static seed data needed for filter dropdowns
   (states list, type counts) at request time, then hands
   everything to the client component that owns URL state
   and live filtering.

   DirectoryClient uses useSearchParams(), which requires a
   Suspense boundary per Next.js 15 App Router rules.
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

/* Minimal skeleton shown during the Suspense fallback */
function DirectoryLoadingShell() {
  return (
    <div className="min-h-screen bg-[var(--color-green-deep)] animate-pulse">
      <div className="border-b border-[color-mix(in_srgb,var(--color-brass)_20%,transparent)] py-8 px-6">
        <div className="max-w-[1400px] mx-auto space-y-2">
          <div className="h-3 w-32 rounded bg-[var(--color-green-mid)]" />
          <div className="h-9 w-56 rounded bg-[var(--color-green-mid)]" />
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto flex gap-6 p-6">
        <div className="hidden lg:block w-[280px] h-[600px] rounded bg-[var(--color-green-mid)] shrink-0" />
        <div className="flex-1 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded bg-[var(--color-green-mid)]" />
          ))}
        </div>
      </div>
    </div>
  )
}
