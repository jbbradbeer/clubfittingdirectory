import type { Metadata } from "next"
import Link from "next/link"
import { getAllStatesWithShops } from "@/lib/supabase/queries/shops"
import { PageHeader } from "@/components/layout/PageHeader"
import { SITE_NAME, SITE_URL } from "@/lib/constants"
import { logQueryError } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Browse by State",
  description: `Find golf club fitters and retailers in your state. ${SITE_NAME} covers all 50 US states with over 1,000 independent shop listings.`,
  alternates: { canonical: `${SITE_URL}/states` },
}

export const revalidate = 2592000 // 30 days — long window keeps ISR writes low; edits propagate via on-demand revalidation (app/api/revalidate)

export default async function StatesPage() {
  const states = await getAllStatesWithShops().catch((e) => logQueryError("states getAllStatesWithShops", e, []))

  return (
    <>
      <PageHeader
        align="center"
        eyebrow="The Club Fitting Directory"
        title="Browse by State"
        subtitle="Find independent club fitters and golf retailers in every corner of the country."
      />

      <section className="bg-[var(--color-ivory)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {states.map((s) => (
              <Link
                key={s.state_code}
                href={`/state/${s.state_code.toLowerCase()}`}
                className="flex items-center justify-between p-4 bg-white border border-[var(--color-border)] rounded-xl shadow-card hover:bg-[var(--color-forest)] hover:text-white hover:border-[var(--color-forest)] hover:-translate-y-0.5 transition-all duration-300 group"
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
