import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Clock, ArrowRight, UserRound } from "lucide-react"
import { getGuideBySlug, getAllGuideSlugs } from "@/lib/guides"
import { PageHeader } from "@/components/layout/PageHeader"
import { GuideBody } from "@/components/guides/GuideBody"
import { FaqSection } from "@/components/seo/FaqSection"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { SITE_URL, SITE_AUTHOR } from "@/lib/constants"
import {
  buildArticleSchema,
  buildGuideBreadcrumbSchema,
} from "@/lib/structured-data"
import { JsonLd } from "@/components/seo/JsonLd"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 2592000 // 30 days — long window keeps ISR writes low; edits propagate via on-demand revalidation (app/api/revalidate)

export function generateStaticParams() {
  return getAllGuideSlugs()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuideBySlug(slug)
  // notFound() in generateMetadata is what sets a real 404 status — by the time
  // the page body runs, streaming has already sent a 200. Guides are a local
  // in-code registry, so a miss always means the URL is genuinely invalid.
  if (!guide) notFound()

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
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

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
        {/* Byline + dates — visible E-E-A-T signals matching the Article
            schema's Person author and datePublished/dateModified. */}
        <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[var(--color-charcoal-light)]">
          <span className="inline-flex items-center gap-1.5">
            <UserRound size={14} className="text-[var(--color-gold)]" />
            By {SITE_AUTHOR}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} className="text-[var(--color-gold)]" />
            {guide.readMinutes} min read
          </span>
          <span>
            Updated{" "}
            {new Date(guide.dateModified).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </p>
      </PageHeader>

      {/* Article body */}
      <article className="bg-white py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <GuideBody blocks={guide.blocks} keyTakeaways={guide.keyTakeaways} guideSlug={guide.slug} />
        </div>
      </article>

      {/* FAQ (visible + FAQPage JSON-LD) */}
      <FaqSection items={guide.faqs} heading="Frequently asked questions" />

      {/* Related guides — internal linking that powers the topic cluster */}
      {guide.related.length > 0 && (
        <section className="bg-white py-14">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Keep reading" centered={false} />
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
