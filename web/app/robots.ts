import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/constants"

/* ─────────────────────────────────────────────────────────
   ROBOTS.TXT
   Next.js generates /robots.txt from this file.

   Rules:
     - Allow all crawlers to index everything
     - Explicitly allow the AI search/answer crawlers — a directory
       WANTS to be cited by ChatGPT/Perplexity/Claude/Google AI
       answers (tasks/research/geo-ai-search-2026-07.md). The `*`
       rule already permits them; naming them makes the welcome
       unambiguous and survives any future tightening of `*`.
     - Disallow access to /api/ routes and /admin (not for crawling)

   Sitemap line lets Google find all pages automatically.

   ⚠️  Update SITE_URL before launch if the domain changes.
   ───────────────────────────────────────────────────────── */

const AI_SEARCH_BOTS = [
  "GPTBot",          // OpenAI — training + ChatGPT browsing
  "OAI-SearchBot",   // OpenAI — ChatGPT Search index
  "ChatGPT-User",    // OpenAI — live user-initiated fetches
  "PerplexityBot",   // Perplexity index
  "Perplexity-User", // Perplexity live fetches
  "ClaudeBot",       // Anthropic crawler
  "Claude-SearchBot",// Anthropic search index
  "Claude-User",     // Anthropic live fetches
  "Google-Extended", // Google — Gemini/AI grounding
  "Googlebot",       // Google — search index + AI Overviews
  "Bingbot",         // Bing — feeds ChatGPT Search results
  "Applebot",        // Apple — Siri/Spotlight
  "Applebot-Extended",   // Apple — Apple Intelligence training
  "Amazonbot",       // Amazon — Alexa answers
  "meta-externalagent",  // Meta — Llama/AI training
  "cohere-ai",       // Cohere crawler
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin"],
      },
      ...AI_SEARCH_BOTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/api/", "/admin"],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
