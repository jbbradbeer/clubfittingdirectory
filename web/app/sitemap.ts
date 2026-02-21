import type { MetadataRoute } from "next"
import {
  getAllShopSlugs,
  getAllStateCodes,
  getAllShopTypes,
} from "@/lib/supabase/queries/shops"
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

/* Slug ↔ DB value — must match /app/category/[type]/page.tsx */
const TYPE_TO_SLUG: Record<string, string> = {
  "Clubfitter":            "club-fitters",
  "Retailer":              "golf-retailers",
  "Golf Course / Pro Shop": "golf-courses",
  "Simulator":             "simulators",
  "Instruction":           "instruction",
  "Driving Range":         "driving-ranges",
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* Fetch all dynamic routes in parallel */
  const [slugs, stateCodes, shopTypes] = await Promise.all([
    getAllShopSlugs().catch(() => [] as { slug: string }[]),
    getAllStateCodes().catch(() => [] as string[]),
    getAllShopTypes().catch(() => [] as string[]),
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
  ]

  /* ── State index pages (/state/tx, /state/ca, …) ── */
  const stateRoutes: MetadataRoute.Sitemap = stateCodes.map((code) => ({
    url:             `${SITE_URL}/state/${code.toLowerCase()}`,
    lastModified:    now,
    changeFrequency: "weekly" as const,
    priority:        0.9,
  }))

  /* ── Category pages (/category/club-fitters, …) ── */
  const categoryRoutes: MetadataRoute.Sitemap = shopTypes
    .filter((t) => TYPE_TO_SLUG[t])
    .map((t) => ({
      url:             `${SITE_URL}/category/${TYPE_TO_SLUG[t]}`,
      lastModified:    now,
      changeFrequency: "weekly" as const,
      priority:        0.9,
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
    ...listingRoutes,
  ]
}
