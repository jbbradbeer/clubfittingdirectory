import { SectionHeader } from "@/components/ui/SectionHeader"
import { JsonLd } from "@/components/seo/JsonLd"

export interface FaqItem {
  question: string
  answer: string
}

/**
 * Renders a visible FAQ section AND its matching FAQPage JSON-LD. Adds unique,
 * keyword-relevant text to otherwise-thin collection pages (state/city/category)
 * and makes them eligible for FAQ rich results in Google.
 *
 * The visible Q&A and the schema are built from the SAME `items` array, so they
 * can never drift apart (Google requires the markup to match on-page content).
 */
export function FaqSection({ items, heading = "Common questions" }: { items: FaqItem[]; heading?: string }) {
  if (!items.length) return null

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }

  return (
    <section className="bg-[var(--color-cream)] py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <JsonLd data={faqSchema} />
        <SectionHeader title={heading} centered={false} />
        <div className="mt-8 divide-y divide-[var(--color-border)]">
          {items.map((item) => (
            <div key={item.question} className="py-5">
              <h3 className="text-lg font-semibold text-[var(--color-charcoal)] mb-2">
                {item.question}
              </h3>
              <p className="text-[var(--color-charcoal-light)] leading-relaxed">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
