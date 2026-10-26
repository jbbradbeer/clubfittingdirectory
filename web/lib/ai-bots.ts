/* ─────────────────────────────────────────────────────────
   CANONICAL AI CRAWLER LIST — single source of truth.

   Two consumers:
     - app/robots.ts        → emits an explicit allow block per bot (AI_SEARCH_BOTS)
     - proxy.ts             → logs page fetches by these bots (crawler_hits),
                              via matchAiBot, which EXCLUDES the two classic
                              search engines (see LOGGED_BOTS below)

   Edge-safe: plain data + string matching only, no Node APIs.
   ───────────────────────────────────────────────────────── */

export const AI_SEARCH_BOTS = [
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

/* Googlebot and Bingbot stay in the robots allow-list but are NOT logged:
   they fetch one to three orders of magnitude more pages than every AI
   crawler combined, and the crawler_hits table exists to measure the AI
   engines — the classic crawlers would drown the signal and the row budget. */
const NOT_LOGGED = new Set(["Googlebot", "Bingbot"])
const LOGGED_BOTS = AI_SEARCH_BOTS.filter((b) => !NOT_LOGGED.has(b))

/* Longest-match first so "Applebot-Extended" doesn't report as "Applebot"
   and "Perplexity-User"/"OAI-SearchBot" resolve to their own names. */
const BOTS_BY_LENGTH = [...LOGGED_BOTS].sort((a, b) => b.length - a.length)

/** Canonical bot name if the user-agent belongs to a LOGGED AI crawler, else null. */
export function matchAiBot(userAgent: string | null): string | null {
  if (!userAgent) return null
  const ua = userAgent.toLowerCase()
  for (const bot of BOTS_BY_LENGTH) {
    if (ua.includes(bot.toLowerCase())) return bot
  }
  return null
}
