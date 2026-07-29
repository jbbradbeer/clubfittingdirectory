import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/layout/PageHeader"
import { ShaftFlexCalculatorClient } from "@/components/tools/ShaftFlexCalculatorClient"
import { FaqSection } from "@/components/seo/FaqSection"
import { RelatedGuides } from "@/components/seo/RelatedGuides"
import { JsonLd } from "@/components/seo/JsonLd"
import { SITE_URL } from "@/lib/constants"
import { DIRECTORY_YEAR } from "@/lib/seo-content"

const TITLE = `Golf Shaft Flex Calculator — What Flex Do I Need? (${DIRECTORY_YEAR})`

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description:
    "Free golf shaft flex calculator. Enter your driver swing speed or carry distance to see whether you need ladies, senior, regular, stiff, or extra stiff.",
  alternates: { canonical: `${SITE_URL}/tools/golf-shaft-flex-calculator` },
}

const FAQS = [
  {
    question: "What shaft flex do I need for my swing speed?",
    answer:
      "As a rule of thumb for driver speed: under 70 mph ladies (L), 70–80 senior (A), 80–92 regular (R), 92–105 stiff (S), and above 105 extra stiff (X). Tempo matters at the boundaries — a smooth swinger at 93 mph may prefer regular while an aggressive one needs stiff.",
  },
  {
    question: "What happens if my shaft is too stiff or too soft?",
    answer:
      "Too stiff typically costs launch, spin, and carry, with misses drifting right (for a right-hander) and the ball flying low. Too soft tends to balloon flight and scatter dispersion, often left. Either way you lose distance and consistency versus a matched flex.",
  },
  {
    question: "Is shaft flex the same across brands?",
    answer:
      "No — there is no industry standard. One manufacturer's stiff can measure like another's regular. That's why serious fitters measure shafts by frequency (CPM) and fit by ball flight on a launch monitor, not by the letter on the shaft.",
  },
  {
    question: "Do irons and driver need the same flex?",
    answer:
      "Usually the same letter, but not always — iron shafts are shorter and often heavier, and many golfers play steel in irons with graphite in woods. A full-bag fitting checks each, which is why flex charts are a starting point rather than a final answer.",
  },
]

export default function ShaftFlexCalculatorPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Golf Shaft Flex Calculator",
        item: `${SITE_URL}/tools/golf-shaft-flex-calculator`,
      },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Shaft Flex Calculator" }]}
        eyebrow="Free Fitting Tool"
        title="Golf Shaft Flex Calculator"
        subtitle="Ladies to extra stiff, from your swing speed or driver carry."
      />

      <section className="bg-[var(--color-ivory)] py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-[var(--color-charcoal-light)] leading-relaxed mb-8">
            Enter your driver swing speed — or your typical carry distance if you
            don&apos;t know it — and see where you land on the standard flex chart.
            Not sure of either? Our{" "}
            <Link
              href="/tools/golf-club-distance-calculator"
              className="font-semibold text-[var(--color-forest)] hover:underline"
            >
              distance calculator
            </Link>{" "}
            works the same numbers in reverse.
          </p>
          <ShaftFlexCalculatorClient />
        </div>
      </section>

      <FaqSection items={FAQS} heading="Shaft flex — common questions" />
      <RelatedGuides />
    </>
  )
}
