import type { Metadata } from "next"
import Link from "next/link"
import { getAllStatesWithShops } from "@/lib/supabase/queries/shops"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { SITE_NAME } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Browse by State",
  description: `Find golf club fitters and retailers in your state. ${SITE_NAME} covers all 50 US states with over 1,000 independent shop listings.`,
}

export const revalidate = 86400

export default async function StatesPage() {
  const states = await getAllStatesWithShops().catch(() => [])

  return (
    <>
      <section className="bg-[var(--color-cream)] bg-grain py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <SectionHeader
            eyebrow="The Club Fitting Directory"
            title="Browse by State"
            subtitle="Find independent club fitters and golf retailers in every corner of the country."
          />
        </div>
      </section>

      <section className="bg-[var(--color-ivory)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {states.map((s) => (
              <Link
                key={s.state_code}
                href={`/state/${s.state_code.toLowerCase()}`}
                className="flex items-center justify-between p-4 bg-white border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-forest)] hover:text-white hover:border-[var(--color-forest)] transition-all group"
              >
                <div>
                  <span className="block text-sm font-semibold">{s.state}</span>
                  <span className="block text-xs text-[var(--color-charcoal-light)] group-hover:text-white/70 mt-0.5">
                    {s.state_code}
                  </span>
                </div>
                <span className="text-xs font-bold text-[var(--color-gold)] group-hover:text-white/80">
                  {s.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
