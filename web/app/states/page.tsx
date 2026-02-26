import type { Metadata } from "next"
import Link from "next/link"
import { getAllStatesWithShops } from "@/lib/supabase/queries/shops"

/* ─────────────────────────────────────────────────────────
   /states — All States Index
   Off-white background, white tiles, green highlights.
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
    <div className="min-h-screen bg-[var(--color-off-white)] px-4 sm:px-6 py-16">
      <div className="max-w-5xl mx-auto">

        <div className="mb-12">
          <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.35em] uppercase text-[var(--color-green-deep)] mb-3">
            Club Fitting Directory
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-normal text-[var(--color-black)] leading-tight mb-4">
            Browse by State
          </h1>
          <p className="font-[family-name:var(--font-body)] text-[var(--color-gray)] text-lg max-w-xl">
            {states.length > 0
              ? `${states.length} states with club fitting listings. Select yours below.`
              : "Select a state to browse local club fitting shops."}
          </p>
        </div>

        {states.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {states.map((s) => {
              const isLarge = s.count >= 40
              return (
                <Link
                  key={s.state_code}
                  href={`/state/${s.state_code.toLowerCase()}`}
                  className={[
                    "group flex flex-col gap-1 p-4 rounded-md border transition-colors duration-150",
                    isLarge ? "border-[var(--color-green-deep)] bg-[#1B43320A]" : "border-[var(--color-gray-light)] bg-white",
                    "hover:border-[var(--color-green-deep)] hover:bg-[#1B43320A]",
                  ].join(" ")}
                >
                  <span className={[
                    "font-[family-name:var(--font-body)] text-sm font-semibold tracking-wide transition-colors tabular-nums",
                    isLarge ? "text-[var(--color-green-deep)]" : "text-[var(--color-black)] group-hover:text-[var(--color-green-deep)]",
                  ].join(" ")}>
                    {s.state_code}
                  </span>
                  <span className="font-[family-name:var(--font-body)] text-xs text-[var(--color-gray)] leading-tight truncate">{s.state}</span>
                  <span className="font-[family-name:var(--font-body)] text-[9px] text-[var(--color-gray)] tabular-nums">
                    {s.count.toLocaleString()} listing{s.count !== 1 ? "s" : ""}
                  </span>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="font-[family-name:var(--font-body)] text-[var(--color-gray)]">
            State listings will appear once shop data has been loaded into the database.
          </p>
        )}

        <div className="mt-12">
          <Link href="/directory"
            className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-green-deep)] hover:text-[var(--color-green-hover)] transition-colors group">
            <span className="inline-block transition-transform group-hover:-translate-x-0.5" aria-hidden="true">←</span>
            Back to Directory
          </Link>
        </div>
      </div>
    </div>
  )
}
