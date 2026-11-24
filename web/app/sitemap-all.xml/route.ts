import { buildSitemap } from "@/lib/sitemap"

/* /sitemap-all.xml — every indexable page, for Bing (see lib/sitemap.ts). */
export const dynamic = "force-static"
export const revalidate = 86400

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export async function GET(): Promise<Response> {
  const entries = await buildSitemap(false)
  const body = entries
    .map((e) => {
      const lastmod = e.lastModified ? `<lastmod>${new Date(e.lastModified).toISOString()}</lastmod>` : ""
      return `<url><loc>${escapeXml(e.url)}</loc>${lastmod}</url>`
    })
    .join("\n")
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  )
}
