import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image"
import { getShopBySlug } from "@/lib/supabase/queries/shops"
import { logQueryError } from "@/lib/utils"
import { SITE_NAME } from "@/lib/constants"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Golf club fitter listing"

/* Per-shop social card: shop name as the headline, "type • city, state" eyebrow. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const shop = await getShopBySlug(slug).catch((e) =>
    logQueryError("og listing getShopBySlug", e, null),
  )

  if (!shop) return renderOgImage(SITE_NAME)

  const eyebrow = [shop.shop_type, [shop.city, shop.state_code].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" • ")

  return renderOgImage(shop.name, eyebrow)
}
