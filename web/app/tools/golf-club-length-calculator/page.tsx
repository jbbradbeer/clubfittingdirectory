import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/layout/PageHeader"
import { LengthCalculatorClient } from "@/components/tools/LengthCalculatorClient"
import { FaqSection } from "@/components/seo/FaqSection"
import { RelatedGuides } from "@/components/seo/RelatedGuides"
import { JsonLd } from "@/components/seo/JsonLd"
import { SITE_URL } from "@/lib/constants"
import { DIRECTORY_YEAR } from "@/lib/seo-content"

const TITLE = `Golf Club Length Calculator — Wrist-to-Floor Chart (${DIRECTORY_YEAR})`

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description:
    "Free golf club length calculator. Enter your height and wrist-to-floor measurement to get a static length recommendation from the standard fitting chart.",
  alternates: { canonical: `${SITE_URL}/tools/golf-club-length-calculator` },
}

const FAQS = [
  {
    question: "How do I measure wrist-to-floor for golf club fitting?",
    answer:
      "Stand upright on a hard floor in flat shoes (or barefoot) with your arms hanging relaxed at your sides. Have someone measure from the crease of your lead wrist straight down to the floor. Don't reach or shrug — the measurement should capture your natural posture.",
  },
  {
    question: "Is height alone enough to determine golf club length?",
    answer:
      "No. Two golfers of the same height can need different lengths because arm length varies — that's why fitters use wrist-to-floor alongside height. A 6-foot golfer with long arms may fit standard length, while one with shorter arms may need +1/2 inch.",
  },
  {
    question: "How accurate is a static club length calculation?",
    answer:
      "A static chart gets most golfers within a half inch of their ideal length, but it can't see your posture, swing, or strike pattern. A dynamic fitting — hitting balls with impact tape and a lie board — is how a fitter confirms the final spec.",
  },
  {
    question: "Do longer golf clubs go farther?",
    answer:
      "Only if you can strike them consistently. Extra length adds clubhead speed in theory, but off-center strikes lose more distance than the added length gains. Most golfers score better with a length they can control — which is exactly what a fitting determines.",
  },
]

export default function LengthCalculatorPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Golf Club Length Calculator",
        item: `${SITE_URL}/tools/golf-club-length-calculator`,
      },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Club Length Calculator" }]}
        eyebrow="Free Fitting Tool"
        title="Golf Club Length Calculator"
        subtitle="Height + wrist-to-floor, against the standard static fitting chart."
      />

      <section className="bg-[var(--color-ivory)] py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-[var(--color-charcoal-light)] leading-relaxed mb-8">
            Enter your height and wrist-to-floor measurement to see how far from
            standard length your irons should be. This is the same static chart most
            fitters start from — the starting point a{" "}
            <Link
              href="/guides/golf-club-fitting"
              className="font-semibold text-[var(--color-forest)] hover:underline"
            >
              full club fitting
            </Link>{" "}
            then refines with your actual swing.
          </p>
          <LengthCalculatorClient />
          <p className="mt-6 text-sm text-[var(--color-charcoal-light)]">
            Want the full reference tables?{" "}
            <Link
              href="/guides/golf-club-fitting-chart"
              className="font-semibold text-[var(--color-forest)] hover:underline"
            >
              See our golf club fitting chart guide
            </Link>
            . Wondering what a real fitting runs?{" "}
            <Link
              href="/guides/golf-club-fitting-cost"
              className="font-semibold text-[var(--color-forest)] hover:underline"
            >
              Fitting prices from 71 shops
            </Link>
            .
          </p>
        </div>
      </section>

      <FaqSection items={FAQS} heading="Club length — common questions" />
      <RelatedGuides />
    </>
  )
}
