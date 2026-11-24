/* ─────────────────────────────────────────────────────────
   Pure normalizers for the approvals queue — no database or
   framework imports, so they can be unit-tested anywhere.
   ───────────────────────────────────────────────────────── */

/* Hosts where many unrelated businesses share one domain. A match on one of
   these says nothing about who owns a shop, so it never counts as identity. */
const SHARED_HOSTS = [
  "facebook.com", "instagram.com", "linktr.ee", "google.com", "goo.gl", "g.page",
  "business.site", "wixsite.com", "wix.com", "squarespace.com", "weebly.com",
  "godaddysites.com", "wordpress.com", "blogspot.com", "myshopify.com", "square.site",
  "sites.google.com", "yelp.com", "pga.com", "pgatour.com", "golfnow.com",
  "airtable.com", "yolasite.com", "webador.com", "carrd.co", "youtube.com",
  "x.com", "twitter.com", "tiktok.com", "etsy.com", "ebay.com",
]

/** Adds https:// to a bare domain; null when the text isn't a web address. */
export function normalizeWebsite(raw: string | null | undefined): string | null {
  const text = (raw ?? "").trim()
  if (!text || /\s/.test(text)) return null
  // "javascript:…" / "mailto:…" — anything with a non-web scheme.
  if (/^[a-z][a-z0-9+.-]*:/i.test(text) && !/^https?:\/\//i.test(text)) return null
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
    if (url.username || url.password) return null
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname)) return null
    return url.toString()
  } catch {
    return null
  }
}

/** Hostname without "www." — null when missing or unparseable. */
export function websiteHost(raw: string | null | undefined): string | null {
  const website = normalizeWebsite(raw)
  if (!website) return null
  return new URL(website).hostname.toLowerCase().replace(/^www\./, "")
}

export function isSharedHost(host: string): boolean {
  return SHARED_HOSTS.some((s) => host === s || host.endsWith(`.${s}`))
}

/** Host usable as a shop's identity: its own domain, not a shared platform. */
export function ownHost(raw: string | null | undefined): string | null {
  const host = websiteHost(raw)
  return host && !isSharedHost(host) ? host : null
}

/** Last 10 digits of a US phone; null when it isn't one ("email only"). */
export function phoneDigits(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "")
  if (digits.length === 10) return digits
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1)
  return null
}

/** Words that don't distinguish one golf shop from another. */
const GENERIC_WORDS = new Set([
  "golf", "the", "a", "and", "of", "at", "llc", "inc", "co", "company", "shop", "store",
  "club", "clubs", "center", "centre",
])

/** Distinguishing words of a shop name, e.g. "Ultimate Fit GOLF LLC" → [fit, ultimate]. */
export function nameTokens(name: string): string[] {
  const words = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ'’]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  const distinct = words.filter((w) => !GENERIC_WORDS.has(w))
  return [...new Set(distinct.length > 0 ? distinct : words)].sort()
}

/** Same distinguishing words, or one name contained in the other (2+ words). */
export function namesSimilar(a: string, b: string): boolean {
  const ta = nameTokens(a)
  const tb = nameTokens(b)
  if (ta.length === 0 || tb.length === 0) return false
  if (ta.join(" ") === tb.join(" ")) return true
  const [small, big] = ta.length <= tb.length ? [ta, tb] : [tb, ta]
  return small.length >= 2 && small.every((w) => big.includes(w))
}
