import type { MetadataRoute } from "next"
import { buildSitemap } from "@/lib/sitemap"
import { GOOGLE_CORE_ONLY } from "@/lib/index-policy"

/* /sitemap.xml — regenerated at most once a day, not on every crawler hit. */
export const revalidate = 86400

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap(GOOGLE_CORE_ONLY)
}
