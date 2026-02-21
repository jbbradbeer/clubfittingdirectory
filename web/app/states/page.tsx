import type { Metadata } from "next"
import Link from "next/link"
import { getAllStatesWithShops } from "@/lib/supabase/queries/shops"

/* ─────────────────────────────────────────────────────────
   /states — All States Index
   A simple, high-SEO page listing all 50 states with
   listing counts, linking to each state's detail page.
   ───────────────────────────────────────────────────────── */

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Browse Club Fitters by State",
  description:
    "Find golf club fitting shops in your state. Browse the full directory by location — all 50 states covered.",
  alternates: { canonical: "https://clubfittingdirectory.com/states" },
}

export default async function StatesIndexPage() {
  const states = await getAllStatesWithShops().catch(() => [])

  return (
    <div className="min-h-screen bg-[var(--color-green-deep)] px-4 sm:px-6 py-16">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.35em] uppercase text-[var(--color-brass)] mb-3">
            Club Fitting Directory
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-black text-[var(--color-ivory)] leading-tight mb-4">
            Browse by State
          </h1>
          <p className="font-[family-name:var(--font-body)] text-[var(--color-ivory-warm)] text-lg max-w-xl">
            {states.length > 0
              ? `${states.length} states with club fitting listings. Select yours below.`
              : "Select a state to browse local club fitting shops."}
          </p>
        </div>

        {/* State grid */}
        {states.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {states.map((s) => {
              const isLarge = s.count >= 40
              return (
                <Link
                  key={s.state_code}
                  href={`/state/${s.state_code.toLowerCase()}`}
                  className={[
                    "group flex flex-col gap-1 p-4 rounded-sm border transition-all duration-150",
                    isLarge
                      ? "border-[color-mix(in_srgb,var(--color-brass)_50%,transparent)] bg-[color-mix(in_srgb,var(--color-brass)_5%,transparent)]"
                      : "border-[color-mix(in_srgb,var(--color-ivory)_12%,transparent)] bg-[var(--color-green-mid)]",
                    "hover:border-[var(--color-brass)] hover:bg-[color-mix(in_srgb,var(--color-brass)_8%,transparent)]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "font-[family-name:var(--font-mono)] text-sm font-bold tracking-wide transition-colors",
                      isLarge
                        ? "text-[var(--color-brass)]"
                        : "text-[var(--color-ivory)] group-hover:text-[var(--color-brass)]",
                    ].join(" ")}
                  >
                    {s.state_code}
                  </span>
                  <span className="font-[family-name:var(--font-body)] text-xs text-[var(--color-ivory-warm)] leading-tight truncate">
                    {s.state}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[9px] text-[color-mix(in_srgb,var(--color-ivory-warm)_60%,transparent)] tabular-nums">
                    {s.count.toLocaleString()} listing{s.count !== 1 ? "s" : ""}
                  </span>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="font-[family-name:var(--font-body)] text-[var(--color-ivory-warm)]">
            State listings will appear once shop data has been loaded into the database.
          </p>
        )}

        {/* Back link */}
        <div className="mt-12">
          <Link
            href="/directory"
            className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-brass)] hover:text-[var(--color-brass-light)] transition-colors group"
          >
            <span className="inline-block transition-transform group-hover:-translate-x-0.5" aria-hidden="true">←</span>
            Back to Directory
          </Link>
        </div>

      </div>
    </div>
  )
}
