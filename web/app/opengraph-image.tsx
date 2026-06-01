import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Club Fitting Directory"

/* Site-wide default social card (homepage + any page without its own image). */
export default function Image() {
  return renderOgImage("Find your perfect fit.", "The Club Fitting Directory")
}
