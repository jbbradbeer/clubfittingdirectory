import type { MetadataRoute } from "next"
import {
  getAllShopSlugs,
  getAllStateCodes,
  getAllCitySlugs,
  getShopTypeCounts,
  getCoreCounts,
} from "@/lib/supabase/queries/shops"
import { SHOP_TYPES } from "@/lib/shop-types"
import { getAllGuides } from "@/lib/guides"
import { SITE_URL } from "@/lib/constants"
import { isCoreCity, isCoreGuide, isCoreState } from "@/lib/index-policy"
import { rethrowQueryError } from "@/lib/utils"

/**
 * Builds the URL list for both sitemaps:
 *   /sitemap.xml      coreOnly  — what Google should index (lib/index-policy.ts)
 *   /sitemap-all.xml  everything indexable — submitted to Bing by hand and
 *                     deliberately NOT listed in robots.txt, where Google reads it
 *
 * Priority guide: 1.0 home, 0.9 state/category, 0.8 listings/guides, 0.5 utility.
 */
export async function buildSitemap(coreOnly: boolean): Promise<MetadataRoute.Sitemap> {
  /* Fetch all dynamic routes in parallel */
  /* RETHROW on failure (don't fall back to []): a swallowed error here would
     publish a sitemap with only the static routes and cache it for a day —
     Google would see ~1,000 listing URLs vanish. Throwing makes the ISR
     regeneration fail, so Next keeps serving the last good sitemap. */
  const [slugs, stateCodes, citySlugs, typeCounts, core] = await Promise.all([
    getAllShopSlugs().catch(rethrowQueryError("sitemap getAllShopSlugs")),
    getAllStateCodes().catch(rethrowQueryError("sitemap getAllStateCodes")),
    getAllCitySlugs().catch(rethrowQueryError("sitemap getAllCitySlugs")),
    getShopTypeCounts().catch(rethrowQueryError("sitemap getShopTypeCounts")),
    getCoreCounts().catch(rethrowQueryError("sitemap getCoreCounts")),
  ])
  if (slugs.length === 0) {
    // A successful-but-empty read is just as wrong (RLS misconfig, wrong
    // project): refuse to publish a listing-less sitemap.
    throw new Error("sitemap: zero active shop slugs returned — refusing to publish an empty sitemap")
  }

  if (coreOnly && core.listings.size === 0) {
    throw new Error("sitemap: zero core listings — refusing to publish a hollowed-out sitemap")
  }

  /* No lastModified on data pages: shops.updated_at is reset by bulk database
     edits (902 pages once claimed the same day), and a date Google learns to
     distrust is worse than none. Guides carry a real, hand-set date. */

  /* ── Static pages ── */
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url:              SITE_URL,
      changeFrequency:  "weekly",
      priority:         1.0,
    },
    {
      url:              `${SITE_URL}/directory`,
      changeFrequency:  "weekly",
      priority:         0.9,
    },
    {
      url:              `${SITE_URL}/map`,
      changeFrequency:  "weekly",
      priority:         0.8,
    },
    {
      url:              `${SITE_URL}/states`,
      changeFrequency:  "weekly",
      priority:         0.8,
    },
    {
      url:              `${SITE_URL}/repair`,
      changeFrequency:  "weekly",
      priority:         0.9,
    },
    {
      url:              `${SITE_URL}/guides`,
      changeFrequency:  "weekly",
      priority:         0.8,
    },
    {
      url:              `${SITE_URL}/tools/golf-club-length-calculator`,
      changeFrequency:  "monthly",
      priority:         0.8,
    },
    {
      url:              `${SITE_URL}/tools/golf-club-distance-calculator`,
      changeFrequency:  "monthly",
      priority:         0.8,
    },
    {
      url:              `${SITE_URL}/tools/golf-shaft-flex-calculator`,
      changeFrequency:  "monthly",
      priority:         0.8,
    },
    {
      url:              `${SITE_URL}/tools/golf-grip-size-calculator`,
      changeFrequency:  "monthly",
      priority:         0.8,
    },
    {
      url:              `${SITE_URL}/for-shops`,
      changeFrequency:  "monthly",
      priority:         0.7,
    },
    {
      url:              `${SITE_URL}/submit`,
      changeFrequency:  "monthly",
      priority:         0.6,
    },
    {
      url:              `${SITE_URL}/newsletter`,
      changeFrequency:  "monthly",
      priority:         0.7,
    },
    {
      url:              `${SITE_URL}/about`,
      changeFrequency:  "monthly",
      priority:         0.5,
    },
    {
      url:              `${SITE_URL}/contact`,
      changeFrequency:  "monthly",
      priority:         0.5,
    },
  ]

  /* ── State index pages (/state/tx, /state/ca, …) ── */
  const stateRoutes: MetadataRoute.Sitemap = stateCodes
    .filter((code) => !coreOnly || isCoreState(core.states.get(code.toUpperCase()) ?? 0))
    .map((code) => ({
    url:             `${SITE_URL}/state/${code.toLowerCase()}`,
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
      changeFrequency: "weekly" as const,
      priority:        0.9,
    }))

  /* ── City pages (/city/austin-tx, …) ──
     Include exactly the indexable set: multi-shop cities plus one-shop cities
     the nearby-fitters module lifts to a ≥3-fitter comparison. `indexable`
     (getAllCitySlugs) mirrors the robots gate on the city page itself, so
     the sitemap never lists a noindexed page nor omits an indexable one. */
  const cityRoutes: MetadataRoute.Sitemap = citySlugs
    .filter(({ indexable }) => indexable)
    .filter(({ citySlug }) => !coreOnly || isCoreCity(core.cities.get(citySlug) ?? 0))
    .map(({ citySlug }) => ({
      url:             `${SITE_URL}/city/${citySlug}`,
      changeFrequency: "weekly" as const,
      priority:        0.7,
    }))

  /* ── Guide / content-hub articles (/guides/[slug]) ──
     Editorial pages that target informational keywords and funnel readers
     into the directory. Use each guide's dateModified for an accurate lastmod. ── */
  const guideRoutes: MetadataRoute.Sitemap = getAllGuides()
    .filter((g) => !coreOnly || isCoreGuide(g.slug))
    .map((g) => ({
    url:             `${SITE_URL}/guides/${g.slug}`,
    ...(g.dateModified ? { lastModified: new Date(g.dateModified) } : {}),
    changeFrequency: "monthly" as const,
    priority:        0.8,
  }))

  /* ── Individual listing pages (/listing/[slug]) ── */
  const listingRoutes: MetadataRoute.Sitemap = slugs
    .filter(({ slug }) => !coreOnly || core.listings.has(slug))
    .map(({ slug }) => ({
      url:             `${SITE_URL}/listing/${slug}`,
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
