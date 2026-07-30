import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getShopsForServicePage } from "@/lib/supabase/queries/shops"
import { PageHeader } from "@/components/layout/PageHeader"
import { IndexHead } from "@/components/ui/IndexHead"
import { ListingGrid } from "@/components/directory/ListingGrid"
import { LedgerList } from "@/components/directory/LedgerList"
import { TrackedButton } from "@/components/ui/TrackedButton"
import { SITE_URL } from "@/lib/constants"
import { rethrowQueryError } from "@/lib/utils"
import { buildItemListSchema } from "@/lib/structured-data"
import { JsonLd } from "@/components/seo/JsonLd"
import { FaqSection } from "@/components/seo/FaqSection"
import { RelatedGuides } from "@/components/seo/RelatedGuides"
import { repairIntro, repairFaqs, LAST_UPDATED_LABEL } from "@/lib/seo-content"

/* ─────────────────────────────────────────────────────────
   /repair — service landing page for "golf club repair" search
   demand. Repair is a cross-cutting service (not a shop_type),
   so this page filters on the services column rather than
   living under /category/[type].
   ───────────────────────────────────────────────────────── */

export const revalidate = 2592000 // 30 days — matches category pages; edits propagate via on-demand revalidation

export const metadata: Metadata = {
  title: "Golf Club Repair Near You",
  description:
    "Find golf club repair near you. Browse 250+ US shops offering regripping, reshafting, and loft & lie adjustment, with ratings and contact details.",
  alternates: { canonical: `${SITE_URL}/repair` },
}

export default async function RepairPage() {
  const result = await getShopsForServicePage("Club Repair").catch(
    rethrowQueryError("repair getShopsForServicePage"),
  )
  if (!result || result.shops.length === 0) notFound()

  const { shops, stateBreakdown } = result

  const itemListSchema = buildItemListSchema(shops, "Golf Club Repair Directory")

  return (
    <>
      <JsonLd data={itemListSchema} />
      {/* Hero */}
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Club Repair" }]}
        eyebrow={`Club Fitting Directory · Updated ${LAST_UPDATED_LABEL}`}
        title="Golf Club Repair"
        subtitle={`${shops.length} shops offering club repair across ${stateBreakdown.length} states.`}
      />

      {/* Intro copy */}
      <section className="bg-[var(--color-ivory)] pt-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-[var(--color-charcoal-light)] leading-relaxed">
            {repairIntro(shops.length, stateBreakdown.length)}
          </p>
          <aside className="mt-8 rounded-2xl border-l-4 border-[var(--color-gold)] bg-[var(--color-gold-tint)] px-6 py-5">
            <p className="mb-1.5 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-gold-ink)]">
              What repair costs
            </p>
            <p className="text-lg leading-relaxed text-[var(--color-charcoal)]">
              Typical US pricing: regrips run about $3–$15 per club plus the grip,
              reshafts about $20–$45 plus the shaft, and loft or lie adjustments
              about $5–$10 per club. For what to expect from a shop visit, start
              with our{" "}
              <Link
                href="/guides"
                className="text-[var(--color-forest)] font-medium underline decoration-[var(--color-gold)] decoration-2 underline-offset-2 hover:text-[var(--color-forest-dark)] transition-colors"
              >
                fitting and equipment guides
              </Link>
              .
            </p>
          </aside>
        </div>
      </section>

      {/* State breakdown */}
      {stateBreakdown.length > 1 && (
        <section className="bg-[var(--color-cream)] py-10 mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal)] mb-4">
              By State
            </h2>
            <div className="flex flex-wrap gap-2">
              {stateBreakdown.slice(0, 20).map((s) => (
                <Link
                  key={s.state_code}
                  href={`/state/${s.state_code.toLowerCase()}`}
                  className="px-3 py-1.5 bg-white border border-[var(--color-border)] rounded-full text-xs font-medium hover:bg-[var(--color-forest)] hover:text-white hover:border-[var(--color-forest)] transition-all"
                >
                  {s.state}{" "}
                  <span className="text-[var(--color-charcoal-light)]">{s.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Listings */}
      <section className="bg-[var(--color-ivory)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <IndexHead value={shops.length}>
            shops offering club repair, all on record.
          </IndexHead>
          {shops.length > 9 ? (
            <LedgerList shops={shops} />
          ) : (
            <ListingGrid shops={shops} />
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--color-cream)] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <p className="text-lg text-[var(--color-charcoal)]">
            Want repair plus fitting, lessons, or a launch monitor? Filter the
            full directory.
          </p>
          <TrackedButton
            href="/directory?services=Club+Repair"
            variant="primary"
            event="repair_directory_cta"
          >
            Filter the Full Directory by Repair
          </TrackedButton>
        </div>
      </section>

      <FaqSection items={repairFaqs(shops)} heading="Golf Club Repair — FAQ" />

      <RelatedGuides slugs={["golf-club-repair-cost", "golf-club-fitting-cost", "is-golf-club-fitting-worth-it"]} />
    </>
  )
}
