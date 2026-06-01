import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image"
import { getShopsForCityPage } from "@/lib/supabase/queries/shops"
import { logQueryError } from "@/lib/utils"
import { SITE_NAME } from "@/lib/constants"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Golf club fitters by city"

/* Per-city social card: "Golf Club Fitters in {City}, {ST}". */
export default async function Image({ params }: { params: Promise<{ citySlug: string }> }) {
  const { citySlug } = await params
  const result = await getShopsForCityPage(citySlug).catch((e) =>
    logQueryError("og city getShopsForCityPage", e, null),
  )

  if (!result) return renderOgImage(SITE_NAME)

  return renderOgImage(`${result.city}, ${result.stateCode}`, "Golf Club Fitters")
}
