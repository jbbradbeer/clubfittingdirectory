import type { FaqItem } from "@/components/seo/FaqSection"

/* ─────────────────────────────────────────────────────────
   GUIDES — typed content model for the editorial Content Hub
   (/guides). Each article is a plain typed object: prose lives
   in `blocks`, FAQs reuse the existing FaqSection schema, and
   `related` powers internal cross-linking between guides.

   We use typed content instead of MDX so every article renders
   in the site's exact design language, structured data stays
   correct automatically, and we add zero build dependencies —
   the same "typed data → shared component" pattern already used
   by lib/seo-content.ts.
   ───────────────────────────────────────────────────────── */

/** A span of body text — a plain string, or a string that links somewhere. */
export type Inline = string | { text: string; href: string; external?: boolean }

/** Paragraph / list-item content: one span or several in sequence. */
export type RichText = Inline | Inline[]

/** The building blocks an article body is composed of. */
export type GuideBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: RichText }
  | { type: "list"; ordered?: boolean; items: RichText[] }
  | { type: "table"; caption?: string; headers: string[]; rows: string[][] }
  | { type: "callout"; title?: string; text: RichText }
  | { type: "cta"; heading: string; text?: string; buttonLabel: string; href: string }

export interface Guide {
  /** URL segment: /guides/<slug> */
  slug: string
  /** Is this the cluster's pillar article? (Surfaced first on the hub.) */
  pillar?: boolean

  /* ── SEO metadata ── */
  /** <title> tag — keep ≤ ~60 chars, lead with the target keyword */
  metaTitle: string
  /** Meta description — ~150–160 chars */
  metaDescription: string
  /** Primary keyword this article targets (for our own reference) */
  targetKeyword: string

  /* ── On-page ── */
  eyebrow?: string
  /** The visible <h1> */
  h1: string
  /** One-sentence summary shown on the hub card and as the lede */
  excerpt: string
  /**
   * 3–5 answer-first bullets rendered in a Key Takeaways box above the body
   * and joined into the Article JSON-LD `abstract`. Each bullet is one
   * sentence that leads with the answer.
   */
  keyTakeaways?: string[]
  /** Approx reading time in minutes (shown as a small meta line) */
  readMinutes: number

  /* ── Dates (ISO yyyy-mm-dd) — used for Article schema freshness ── */
  datePublished: string
  dateModified: string

  /* ── Content ── */
  blocks: GuideBlock[]
  faqs: FaqItem[]
  /** Internal links rendered at the foot of the article */
  related: { label: string; href: string }[]
}
