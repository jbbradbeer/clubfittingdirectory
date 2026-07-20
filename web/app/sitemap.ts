import type { MetadataRoute } from "next"
import {
  getAllShopSlugs,
  getAllStateCodes,
  getAllCitySlugs,
  getShopTypeCounts,
} from "@/lib/supabase/queries/shops"
import { SHOP_TYPES } from "@/lib/shop-types"
import { getAllGuides } from "@/lib/guides"
import { SITE_URL } from "@/lib/constants"
import { logQueryError } from "@/lib/utils"

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

// Regenerate the sitemap at most once a day instead of on every crawler hit —
// the underlying data (shops, cities, states) changes slowly.
export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* Fetch all dynamic routes in parallel */
  const [slugs, stateCodes, citySlugs, typeCounts] = await Promise.all([
    getAllShopSlugs().catch((e) => logQueryError("sitemap getAllShopSlugs", e, [] as { slug: string; updated_at: string }[])),
    getAllStateCodes().catch((e) => logQueryError("sitemap getAllStateCodes", e, [] as string[])),
    getAllCitySlugs().catch((e) => logQueryError("sitemap getAllCitySlugs", e, [] as { citySlug: string; shopCount: number }[])),
    getShopTypeCounts().catch((e) => logQueryError("sitemap getShopTypeCounts", e, {} as Record<string, number>)),
  ])

  /* A deterministic "last updated" anchor for routes that have no date of their
     own (home, /directory, state/category/city indexes). Using `new Date()` here
     would re-stamp every URL with today's date on EVERY sitemap regeneration —
     that changes the output bytes each time (a needless ISR write) and tells
     Google everything changed daily (wasted crawl budget). Anchoring to the most
     recent shop `updated_at` means the sitemap only changes when data does. */
  const latestUpdate = slugs.reduce(
    (max, s) => (s.updated_at && s.updated_at > max ? s.updated_at : max),
    "",
  )
  const now = latestUpdate ? new Date(latestUpdate) : new Date("2026-01-01T00:00:00Z")

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
      url:              `${SITE_URL}/repair`,
      lastModified:     now,
      changeFrequency:  "weekly",
      priority:         0.9,
    },
    {
      url:              `${SITE_URL}/guides`,
      lastModified:     now,
      changeFrequency:  "weekly",
      priority:         0.8,
    },
    {
      url:              `${SITE_URL}/tools/golf-club-length-calculator`,
      lastModified:     now,
      changeFrequency:  "monthly",
      priority:         0.8,
    },
    {
      url:              `${SITE_URL}/tools/golf-club-distance-calculator`,
      lastModified:     now,
      changeFrequency:  "monthly",
      priority:         0.8,
    },
    {
      url:              `${SITE_URL}/tools/golf-shaft-flex-calculator`,
      lastModified:     now,
      changeFrequency:  "monthly",
      priority:         0.8,
    },
    {
      url:              `${SITE_URL}/tools/golf-grip-size-calculator`,
      lastModified:     now,
      changeFrequency:  "monthly",
      priority:         0.8,
    },
    {
      url:              `${SITE_URL}/submit`,
      lastModified:     now,
      changeFrequency:  "monthly",
      priority:         0.6,
    },
    {
      url:              `${SITE_URL}/newsletter`,
      lastModified:     now,
      changeFrequency:  "monthly",
      priority:         0.7,
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

  /* ── Category pages (/category/club-fitters, …) ──
     Only include categories that actually have active shops. A category page
     with zero shops calls notFound() (404), so listing it here would put a
     dead URL in the sitemap — which hurts SEO. ── */
  const categoryRoutes: MetadataRoute.Sitemap = SHOP_TYPES
    .filter((t) => (typeCounts[t.dbType] ?? 0) > 0)
    .map((t) => ({
      url:             `${SITE_URL}/category/${t.slug}`,
      lastModified:    now,
      changeFrequency: "weekly" as const,
      priority:        0.9,
    }))

  /* ── City pages (/city/austin-tx, …) ──
     One-shop cities are excluded: those pages are noindexed as thin content,
     and a sitemap entry for a noindexed page is a mixed signal to Google. */
  const cityRoutes: MetadataRoute.Sitemap = citySlugs
    .filter(({ shopCount }) => shopCount >= 2)
    .map(({ citySlug }) => ({
      url:             `${SITE_URL}/city/${citySlug}`,
      lastModified:    now,
      changeFrequency: "weekly" as const,
      priority:        0.7,
    }))

  /* ── Guide / content-hub articles (/guides/[slug]) ──
     Editorial pages that target informational keywords and funnel readers
     into the directory. Use each guide's dateModified for an accurate lastmod. ── */
  const guideRoutes: MetadataRoute.Sitemap = getAllGuides().map((g) => ({
    url:             `${SITE_URL}/guides/${g.slug}`,
    lastModified:    g.dateModified ? new Date(g.dateModified) : now,
    changeFrequency: "monthly" as const,
    priority:        0.8,
  }))

  /* ── Individual listing pages (/listing/[slug]) ──
     Use each shop's real updated_at so Google sees accurate per-page lastmod
     dates, rather than every URL claiming to have changed on the last rebuild. ── */
  const listingRoutes: MetadataRoute.Sitemap = slugs.map(({ slug, updated_at }) => ({
    url:             `${SITE_URL}/listing/${slug}`,
    lastModified:    updated_at ? new Date(updated_at) : now,
    changeFrequency: "monthly" as const,
    priority:        0.8,
  }))

  return [
    ...staticRoutes,
    ...stateRoutes,
    ...categoryRoutes,
    ...guideRoutes,
    ...cityRoutes,
    ...listingRoutes,
  ]
}
