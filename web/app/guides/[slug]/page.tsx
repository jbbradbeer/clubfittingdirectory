import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Clock, ArrowRight } from "lucide-react"
import { getGuideBySlug, getAllGuideSlugs } from "@/lib/guides"
import { PageHeader } from "@/components/layout/PageHeader"
import { GuideBody } from "@/components/guides/GuideBody"
import { FaqSection } from "@/components/seo/FaqSection"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { SITE_URL } from "@/lib/constants"
import {
  buildArticleSchema,
  buildGuideBreadcrumbSchema,
} from "@/lib/structured-data"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 86400

export function generateStaticParams() {
  return getAllGuideSlugs()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuideBySlug(slug)
  if (!guide) return { title: "Guide Not Found" }

  const url = `${SITE_URL}/guides/${guide.slug}`
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      url,
      type: "article",
    },
  }
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params
  const guide = getGuideBySlug(slug)
  if (!guide) notFound()

  const articleSchema = buildArticleSchema(guide)
  const breadcrumbSchema = buildGuideBreadcrumbSchema(guide)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <PageHeader
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Guides", href: "/guides" },
          { label: guide.h1 },
        ]}
        eyebrow={guide.eyebrow ?? "Club Fitting Guide"}
        title={guide.h1}
        subtitle={guide.excerpt}
      >
        <p className="mt-5 inline-flex items-center gap-1.5 text-sm text-[var(--color-charcoal-light)]">
          <Clock size={14} className="text-[var(--color-gold)]" />
          {guide.readMinutes} min read
        </p>
      </PageHeader>

      {/* Article body */}
      <article className="bg-white py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <GuideBody blocks={guide.blocks} />
        </div>
      </article>

      {/* FAQ (visible + FAQPage JSON-LD) */}
      <FaqSection items={guide.faqs} heading="Frequently asked questions" />

      {/* Related guides — internal linking that powers the topic cluster */}
      {guide.related.length > 0 && (
        <section className="bg-white py-14">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader eyebrow="Keep reading" title="Related guides" centered={false} />
            <ul className="mt-8 divide-y divide-[var(--color-border)]">
              {guide.related.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center justify-between gap-4 py-4 text-lg font-medium text-[var(--color-charcoal)] hover:text-[var(--color-forest)] transition-colors"
                  >
                    {link.label}
                    <ArrowRight
                      size={18}
                      className="shrink-0 text-[var(--color-gold)] group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
