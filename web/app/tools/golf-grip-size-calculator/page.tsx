import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/layout/PageHeader"
import { GripSizeCalculatorClient } from "@/components/tools/GripSizeCalculatorClient"
import { FaqSection } from "@/components/seo/FaqSection"
import { RelatedGuides } from "@/components/seo/RelatedGuides"
import { JsonLd } from "@/components/seo/JsonLd"
import { SITE_URL } from "@/lib/constants"
import { DIRECTORY_YEAR } from "@/lib/seo-content"

const TITLE = `Golf Grip Size Calculator — Hand Measurement Chart (${DIRECTORY_YEAR})`

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | Club Fitting Directory` },
  description:
    "Free golf grip size calculator. Measure your hand and middle finger to find your grip size — undersize, standard, midsize, or jumbo — using the standard fitting chart.",
  alternates: { canonical: `${SITE_URL}/tools/golf-grip-size-calculator` },
}

const FAQS = [
  {
    question: "How do I measure my hand for golf grip size?",
    answer:
      "Measure your glove hand (left hand for a right-handed golfer) from the wrist crease to the tip of your middle finger. Under 7 inches points to undersize, 7–8.25 to standard, 8.25–9.25 to midsize, and above 9.25 to jumbo. Middle-finger length refines a borderline result.",
  },
  {
    question: "What happens if my golf grips are the wrong size?",
    answer:
      "Grips that are too small encourage overactive hands — a common cause of hooks — while grips too large quiet the hands and can leave the face open, pushing shots. The wrong size also forces extra grip pressure, which costs speed and feel.",
  },
  {
    question: "Can I adjust grip size without buying new grips?",
    answer:
      "Yes, within limits. Shops add layers of build-up tape under the grip — each extra wrap adds roughly 1/64 inch — to fine-tune between standard sizes. Going from standard to true midsize or jumbo, though, means new grips.",
  },
  {
    question: "How often should golf grips be replaced?",
    answer:
      "Roughly every 40 rounds or once a year — hardened, glassy grips force more grip pressure and hurt control even if they look intact. Regripping a full set is one of the cheapest performance upgrades in golf, and most repair shops do it same-day.",
  },
]

export default function GripSizeCalculatorPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Golf Grip Size Calculator",
        item: `${SITE_URL}/tools/golf-grip-size-calculator`,
      },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Grip Size Calculator" }]}
        eyebrow="Free Fitting Tool"
        title="Golf Grip Size Calculator"
        subtitle="Undersize to jumbo, from two hand measurements."
      />

      <section className="bg-[var(--color-ivory)] py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-[var(--color-charcoal-light)] leading-relaxed mb-8">
            Measure your glove hand, enter the numbers, and get your size from the
            standard grip chart. Worn or wrong-sized grips are the cheapest fix in
            golf — every shop in our{" "}
            <Link
              href="/repair"
              className="font-semibold text-[var(--color-forest)] hover:underline"
            >
              club repair directory
            </Link>{" "}
            can regrip a set.
          </p>
          <GripSizeCalculatorClient />
        </div>
      </section>

      <FaqSection items={FAQS} heading="Grip size — common questions" />
      <RelatedGuides />
    </>
  )
}
