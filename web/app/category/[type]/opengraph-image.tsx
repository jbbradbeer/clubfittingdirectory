import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image"
import { slugToShopType } from "@/lib/shop-types"
import { SITE_NAME } from "@/lib/constants"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Golf shops by category"

/* Per-category social card: e.g. "Club Fitters". */
export default async function Image({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const shopType = slugToShopType(type)
  return renderOgImage(shopType?.label ?? SITE_NAME, "Browse by Category")
}
