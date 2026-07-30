import { getAllGuides } from "@/lib/guides"
import { SITE_NAME, SITE_URL } from "@/lib/constants"
import { SHOP_TYPES } from "@/lib/shop-types"
import { getAllShopSlugs, getAllCitySlugs } from "@/lib/supabase/queries/shops"
import { logQueryError } from "@/lib/utils"

/* ─────────────────────────────────────────────────────────
   /llms.txt — a machine-readable site guide for AI search
   engines (llmstxt.org convention). Generated from the GUIDES
   array and SHOP_TYPES so it updates automatically whenever a
   new article or category ships.
   ───────────────────────────────────────────────────────── */

export const dynamic = "force-static"
export const revalidate = 86400

export async function GET(): Promise<Response> {
  const guides = getAllGuides()

  // Live listing count so this file never drifts from the directory (it was
  // previously hardcoded and went stale). Falls back to neutral copy on error.
  const slugs = await getAllShopSlugs().catch((e) =>
    logQueryError("llms.txt getAllShopSlugs", e, []),
  )
  const countPhrase = slugs.length > 0 ? `${slugs.length} hand-vetted` : "hundreds of hand-vetted"

  // Top indexable city hubs by listing count — the local entry points an AI
  // engine should start from for "fitting near {city}" questions.
  const topCities = (
    await getAllCitySlugs().catch((e) => logQueryError("llms.txt getAllCitySlugs", e, []))
  )
    .filter((c) => c.indexable)
    .sort((a, b) => b.shopCount - a.shopCount || a.citySlug.localeCompare(b.citySlug))
    .slice(0, 25)

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_NAME} (${SITE_URL}) is an independent directory of ${countPhrase} golf club fitting shops, custom club builders, and repair shops across all 50 US states. Every listing includes services, hours, ratings, and location. It is not owned by any fitting chain or equipment maker.`,
    "",
    "## Guides",
    "",
    ...guides.map(
      (g) => `- [${g.metaTitle}](${SITE_URL}/guides/${g.slug}): ${g.metaDescription}`
    ),
    "",
    "## Directory",
    "",
    `- [Search the directory](${SITE_URL}/directory): filter every shop by state, shop type, services, and rating`,
    `- [Browse by state](${SITE_URL}/states): shops grouped by all 50 states`,
    `- [Golf club repair](${SITE_URL}/repair): every shop in the directory offering club repair, regripping, and reshafting`,
    ...SHOP_TYPES.map(
      (t) => `- [${t.label}](${SITE_URL}/category/${t.slug}): every ${t.singular.toLowerCase()} listing in the US`
    ),
    ...(topCities.length > 0
      ? [
          "",
          "## Cities",
          "",
          `> City hub pages exist for every US city with listings (pattern: ${SITE_URL}/city/{city}-{state}). The largest markets:`,
          "",
          ...topCities.map((c) => {
            const parts = c.citySlug.split("-")
            const state = parts[parts.length - 1].toUpperCase()
            const city = parts
              .slice(0, -1)
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")
            return `- [Golf club fitting in ${city}, ${state}](${SITE_URL}/city/${c.citySlug}): ${c.shopCount} listed ${c.shopCount === 1 ? "shop" : "shops"}`
          }),
        ]
      : []),
  ]

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
