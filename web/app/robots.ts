import type { MetadataRoute } from "next"

/* ─────────────────────────────────────────────────────────
   ROBOTS.TXT
   Next.js generates /robots.txt from this file.

   Rules:
     - Allow all crawlers to index everything
     - Disallow access to /api/ routes (not for public crawling)

   Sitemap line lets Google find all pages automatically.

   ⚠️  Update SITE_URL before launch if the domain changes.
   ───────────────────────────────────────────────────────── */

const SITE_URL = "https://clubfittingdirectory.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
