import { getAllGuides } from "@/lib/guides"
import { GuideCard } from "@/components/guides/GuideCard"
import { SectionHeader } from "@/components/ui/SectionHeader"

/**
 * "Fitting guides" block for collection pages (state/city/category). Links the
 * 1,300+ location pages into the /guides content hub so authority flows both
 * ways: location pages gain helpful content, guides gain internal links.
 *
 * Pass `slugs` to pick topical guides for the page (unknown slugs are skipped);
 * with no prop it falls back to the first three registry guides, so existing
 * call sites are unchanged.
 */
export function RelatedGuides({ slugs }: { slugs?: string[] } = {}) {
  const all = getAllGuides()
  const picked = slugs
    ? slugs.map((s) => all.find((g) => g.slug === s)).filter((g) => g !== undefined)
    : []
  const guides = picked.length >= 3 ? picked.slice(0, 3) : all.slice(0, 3)
  if (!guides.length) return null

  return (
    <section className="bg-[var(--color-ivory)] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Before you book, read up"
          subtitle="Guides from the team that curates this directory."
          centered={false}
        />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <GuideCard key={guide.slug} guide={guide} />
          ))}
        </div>
      </div>
    </section>
  )
}
