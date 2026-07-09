import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image"
import { getGuideBySlug, getAllGuides } from "@/lib/guides"
import { SITE_NAME } from "@/lib/constants"

// Cache rendered cards like their pages: without this every crawler hit
// pays a satori render (the pattern behind the old ISR bill).
export const dynamic = "force-static"
export const revalidate = 2592000

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Golf club fitting guide"

export async function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }))
}

/* Per-guide social card: article headline with a "Guide" eyebrow. Also the
   Article schema `image` — articles with an image qualify for richer results. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = getGuideBySlug(slug)

  if (!guide) return renderOgImage(SITE_NAME)

  return renderOgImage(guide.h1, "Guide")
}
