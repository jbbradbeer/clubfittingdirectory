import { getAllGuides } from "@/lib/guides"
import { SITE_NAME, SITE_URL } from "@/lib/constants"
import { SHOP_TYPES } from "@/lib/shop-types"

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

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_NAME} (${SITE_URL}) is an independent directory of roughly 1,267 golf club fitting shops, custom club builders, and repair shops across all 50 US states. Every listing includes services, hours, ratings, and location. It is not owned by any fitting chain or equipment maker.`,
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
  ]

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
