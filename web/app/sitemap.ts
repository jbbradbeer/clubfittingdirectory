import type { MetadataRoute } from "next"
import {
  getAllShopSlugs,
  getAllStateCodes,
  getAllCitySlugs,
} from "@/lib/supabase/queries/shops"
import { SHOP_TYPES } from "@/lib/shop-types"
import { SITE_URL } from "@/lib/constants"

/* ─────────────────────────────────────────────────────────
   SITEMAP
   Next.js generates /sitemap.xml from this file.
   Google uses sitemaps to discover and prioritise pages.

   Priority guide:
     1.0  Homepage — most important
     0.9  State + Category index pages — high-value SEO
     0.8  Individual listing pages — long tail
     0.5  Static utility pages

   changeFrequency:
     - Indexes: weekly (new listings may be added)
     - Listings: monthly (data changes occasionally)
   ───────────────────────────────────────────────────────── */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* Fetch all dynamic routes in parallel */
  const [slugs, stateCodes, citySlugs] = await Promise.all([
    getAllShopSlugs().catch(() => [] as { slug: string }[]),
    getAllStateCodes().catch(() => [] as string[]),
    getAllCitySlugs().catch(() => [] as { citySlug: string }[]),
  ])

  const now = new Date()

  /* ── Static pages ── */
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url:              SITE_URL,
      lastModified:     now,
      changeFrequency:  "weekly",
      priority:         1.0,
    },
    {
      url:              `${SITE_URL}/directory`,
      lastModified:     now,
      changeFrequency:  "weekly",
      priority:         0.9,
    },
    {
      url:              `${SITE_URL}/states`,
      lastModified:     now,
      changeFrequency:  "weekly",
      priority:         0.8,
    },
    {
      url:              `${SITE_URL}/about`,
      lastModified:     now,
      changeFrequency:  "monthly",
      priority:         0.5,
    },
    {
      url:              `${SITE_URL}/contact`,
      lastModified:     now,
      changeFrequency:  "monthly",
      priority:         0.5,
    },
  ]

  /* ── State index pages (/state/tx, /state/ca, …) ── */
  const stateRoutes: MetadataRoute.Sitemap = stateCodes.map((code) => ({
    url:             `${SITE_URL}/state/${code.toLowerCase()}`,
    lastModified:    now,
    changeFrequency: "weekly" as const,
    priority:        0.9,
  }))

  /* ── Category pages (/category/club-fitters, …) ── */
  const categoryRoutes: MetadataRoute.Sitemap = SHOP_TYPES.map((t) => ({
    url:             `${SITE_URL}/category/${t.slug}`,
    lastModified:    now,
    changeFrequency: "weekly" as const,
    priority:        0.9,
  }))

  /* ── City pages (/city/austin-tx, …) ── */
  const cityRoutes: MetadataRoute.Sitemap = citySlugs.map(({ citySlug }) => ({
    url:             `${SITE_URL}/city/${citySlug}`,
    lastModified:    now,
    changeFrequency: "weekly" as const,
    priority:        0.7,
  }))

  /* ── Individual listing pages (/listing/[slug]) ── */
  const listingRoutes: MetadataRoute.Sitemap = slugs.map(({ slug }) => ({
    url:             `${SITE_URL}/listing/${slug}`,
    lastModified:    now,
    changeFrequency: "monthly" as const,
    priority:        0.8,
  }))

  return [
    ...staticRoutes,
    ...stateRoutes,
    ...categoryRoutes,
    ...cityRoutes,
    ...listingRoutes,
  ]
}
