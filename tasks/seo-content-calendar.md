# SEO Content Calendar — Guides Hub (`/guides`)

> **2026-06-10:** Article priority now lives in `tasks/seo-keyword-map.md`
> (built from GSC + Ahrefs + suggest mining + competitor/forum research).
> The backlog table below is superseded by that queue; the per-article
> checklist here still applies to every new guide.

The strategy is a **topic cluster**: one pillar article anchors the cluster, and
focused "spoke" articles target specific sub-keywords. They cross-link to each
other and funnel readers into the directory. Adding a guide = write a content
file in `web/lib/guides/` and add it to the array in `web/lib/guides/index.ts`.

## ✅ Published (built 2026-06-03)

| Guide | URL | Target keyword | Vol/mo | Role |
|---|---|---|---|---|
| Golf Club Fitting: The Complete Guide | `/guides/golf-club-fitting` | golf club fitting | 14.8K | **Pillar** |
| Golf Club Fitting Chart | `/guides/golf-club-fitting-chart` | golf club fitting chart | 2.9K | Quick win (KD 24) + linkable asset |
| Where to Get Fitted for Golf Clubs | `/guides/where-to-get-fitted-for-golf-clubs` | where to get fitted for golf clubs | 1.3K | Directory funnel |

## 📝 Backlog (next spokes, priority order)

| # | Working title | Target keyword(s) | Vol/mo | Notes |
|---|---|---|---|---|
| 1 | How Much Does Golf Club Fitting Cost? | golf club fitting cost / "how much…" | — | Commercial-investigation intent, high CPC. Use a cost table. |
| 2 | Custom Golf Club Fitting Explained | custom golf club fitting (1.9K) + custom fit golf clubs (1.3K) | 3.2K combined | Covers two strong commercial terms. |
| 3 | What to Expect at a Golf Club Fitting | what to expect at a club fitting | — | Supporting long-tail; strong internal-link target. |
| 4 | Driver Fitting Guide | driver fitting | — | Club-specific spoke (links from pillar's Driver section). |
| 5 | Iron Fitting Guide | iron fitting | — | Club-specific spoke. |
| 6 | Do I Need a Club Fitting? (beginner) | is club fitting worth it | — | Captures hesitation/decision queries. |

## Per-article checklist (so every guide stays consistent)
- [ ] Target keyword in `metaTitle` (front-loaded), `h1`, and first paragraph
- [ ] Meta description ~150–160 chars, compelling
- [ ] 800+ words of genuinely useful content (headings break up the body)
- [ ] At least one `cta` block → `/directory` (the funnel)
- [ ] 2–3 contextual internal links to other guides + relevant `/category` or `/state` pages
- [ ] 3–4 FAQs (these power the FAQ rich-result schema)
- [ ] `related` array links to the pillar + 1–2 sibling spokes
- [ ] Added to the `GUIDES` array in `web/lib/guides/index.ts`
- [ ] `npm run build` passes and the new URL appears in the sitemap

## Beyond articles (future SEO phases — not started)
- Add a small "Related guides" block to the bottom of `/state`, `/city`, and
  `/category` pages (push authority from the 1,267 location pages into the hub).
- Off-site link building / digital PR: an original "State of Club Fitting" data
  report built from the directory's listings — naturally earns backlinks.
- Set up Google Search Console rank tracking + Vercel Analytics to measure impact.
