import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/layout/PageHeader"
import { DistanceCalculatorClient } from "@/components/tools/DistanceCalculatorClient"
import { FaqSection } from "@/components/seo/FaqSection"
import { RelatedGuides } from "@/components/seo/RelatedGuides"
import { JsonLd } from "@/components/seo/JsonLd"
import { SITE_URL } from "@/lib/constants"
import { DIRECTORY_YEAR } from "@/lib/seo-content"

const TITLE = `Golf Club Distance Calculator & Chart (${DIRECTORY_YEAR})`

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description:
    "Free golf club distance calculator. Enter your driver swing speed to estimate carry distances for every club and check your gapping against tour averages.",
  alternates: { canonical: `${SITE_URL}/tools/golf-club-distance-calculator` },
}

const FAQS = [
  {
    question: "How far should I hit each golf club?",
    answer:
      "It depends almost entirely on clubhead speed and strike quality. A male amateur averaging 93 mph of driver speed carries the driver around 215 yards and a 7-iron around 150; a PGA Tour player at 115 mph carries the driver around 265. Use the calculator above with your own speed for a personal baseline.",
  },
  {
    question: "How do I find out my swing speed?",
    answer:
      "Any launch monitor reads it in a few swings — most fitting shops, simulator lounges, and big-box golf stores will measure it for free or as part of a session. As a rough proxy, divide your average driver carry by 2.3.",
  },
  {
    question: "Why do I hit my clubs shorter than the calculator says?",
    answer:
      "The estimates assume centered contact. Most amateurs lose 5–15% of potential carry to off-center strikes, and poorly fitted lofts or shafts widen the gap further. If your real distances fall well short of your speed, that's a classic sign a fitting would help.",
  },
  {
    question: "What is distance gapping and why does it matter?",
    answer:
      "Gapping is the spacing between consecutive clubs — ideally 10–15 yards. If two clubs fly the same distance or there's a 25-yard hole in your bag, your set composition doesn't match your speed. A gapping session on a launch monitor is one of the cheapest fittings and often the most valuable.",
  },
]

export default function DistanceCalculatorPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Golf Club Distance Calculator",
        item: `${SITE_URL}/tools/golf-club-distance-calculator`,
      },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Distance Calculator" }]}
        eyebrow="Free Fitting Tool"
        title="Golf Club Distance Calculator"
        subtitle="Estimated carry for every club in the bag, from your driver swing speed."
      />

      <section className="bg-[var(--color-ivory)] py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-[var(--color-charcoal-light)] leading-relaxed mb-8">
            Set your driver swing speed and the table estimates carry distance for
            all fourteen clubs, based on published launch-monitor averages. It&apos;s a
            baseline for checking your gapping — the distance spacing between clubs
            that a{" "}
            <Link
              href="/guides/golf-club-fitting"
              className="font-semibold text-[var(--color-forest)] hover:underline"
            >
              club fitting
            </Link>{" "}
            measures precisely.
          </p>
          <DistanceCalculatorClient />
        </div>
      </section>

      <FaqSection items={FAQS} heading="Club distances — common questions" />
      <RelatedGuides />
    </>
  )
}
