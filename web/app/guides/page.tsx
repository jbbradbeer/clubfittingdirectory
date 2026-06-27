import type { Metadata } from "next"
import { getAllGuides } from "@/lib/guides"
import { PageHeader } from "@/components/layout/PageHeader"
import { GuideCard } from "@/components/guides/GuideCard"
import { Button } from "@/components/ui/Button"
import { SITE_URL, SITE_NAME } from "@/lib/constants"

export const revalidate = 2592000 // 30 days — long window keeps ISR writes low; edits propagate via on-demand revalidation (app/api/revalidate)

export const metadata: Metadata = {
  title: "Golf Club Fitting Guides — Charts, Costs & How-Tos",
  description:
    "Plain-English guides to golf club fitting: what it is, how much it costs, fitting charts, and where to get fitted. Then find a fitter near you.",
  alternates: { canonical: `${SITE_URL}/guides` },
}

export default function GuidesIndexPage() {
  const guides = getAllGuides()

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Guides" },
        ]}
        align="center"
        eyebrow="The Fitting Library"
        title="Golf club fitting, explained"
        subtitle="Clear, expert guides to getting the right clubs for your game — what fitting is, what it costs, and how to get it done right."
      />

      <section className="bg-[var(--color-ivory)] py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <GuideCard key={guide.slug} guide={guide} />
            ))}
          </div>
        </div>
      </section>

      {/* Funnel back into the directory */}
      <section className="bg-[var(--color-forest)] grain text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
          <h2 className="font-display text-3xl md:text-[2.4rem] font-bold text-white! leading-[1.1]">
            Ready to get fitted?
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-white/70 leading-relaxed">
            Browse independent club fitters, retailers, and simulators near you — every
            listing on {SITE_NAME} shows services, ratings, and contact details.
          </p>
          <div className="mt-8">
            <Button href="/directory" variant="secondary" size="lg">
              Find a fitter near you
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
