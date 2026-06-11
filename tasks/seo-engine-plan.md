# SEO Content Engine — Master Plan (approved 2026-06-10)

Goal: rank clubfittingdirectory.com organically on Google AND get cited by AI
search engines (ChatGPT, Perplexity, Google AI Overviews) for golf club
fitting queries. Builds on the existing `/guides` hub (see
`tasks/seo-content-calendar.md` for the article-level backlog + checklist).

## Decisions (made by James, 2026-06-10)
- **Automation:** weekly scheduled Claude agent — drafts the next article from
  the keyword queue and opens a PR. Nothing publishes without James merging.
- **GSC data:** yes — James exports the Search Console queries report; the
  file gets analyzed into the keyword map. (Export steps at bottom.)
- **Data pages:** included in the first build — flagship "State of Club
  Fitting" report from the 1,268-shop Supabase dataset.

## Phase 1 — Keyword research → keyword map
Sources: GSC export (real queries) · Google autocomplete + People Also Ask ·
competitor content inventories (Club Champion, True Spec, GOLFTEC, MyGolfSpy)
· Reddit r/golf + GolfWRX question mining.
Cluster by intent: cost · process/what-to-expect · club-specific
(driver/iron/putter/shaft/wedge) · audience (beginner/senior/high-handicap)
· decision ("is it worth it") · local (already served by city/state pages).
Score each: relevance × winnability (young-site realistic) × directory-funnel value.
**Deliverable:** `tasks/seo-keyword-map.md` — 50–100 keywords, each mapped to a
planned page, priority-ordered. This is the engine's queue.

## Phase 2 — Architecture
1. **Guides cluster** grows 3 → ~20 articles, queue order from the map.
2. **Data pages:** original stats from Supabase (avg rating by state, % indoor
   sim, fitting availability density). Flagship: annual "State of Club Fitting
   in America" report — built for backlinks + AI citation.
3. **Upgrade existing 1,300+ pages:** FAQ blocks + "related guides" links on
   state/city/category pages (internal-link mesh, AI-quotable answers).
4. **AI-search tune-up:** answer-first opening paragraphs, comparison tables,
   complete JSON-LD, consider llms.txt.

## Phase 3 — The engine (weekly scheduled agent)
Pipeline per article: next keyword from queue → live research of current
top-ranking pages → draft in typed-Guide format (checklist in
seo-content-calendar.md) → internal links → `npm run build` verify → PR with
preview → James reviews + merges. Pace: 1–2 excellent pieces/week — quality
over volume (Google penalizes thin mass-published AI content).
Engine also maintains: refresh stale guides, re-sort queue from GSC monthly.

## Phase 4 — Measure & steer (monthly)
GSC review: impressions/position by page → double down on climbers, refresh
stalls, re-prioritize the queue. Add Vercel Analytics (one line in
`web/app/layout.tsx`, still pending) to see guide→directory and
guide→newsletter conversion.

## Status
- [x] GSC export received from James (2026-06-10, in `tasks/gsc-2026-06-10/`)
- [x] Phase 1: keyword research + map → `tasks/seo-keyword-map.md` (2026-06-10;
      raw research preserved in `tasks/research/`)
- [x] Phase 2: data report v1 + page upgrades (PR #11, 2026-06-11 — data-driven
      city/state FAQs, RelatedGuides block, /guides/state-of-club-fitting-2026)
- [x] Phase 3: weekly drafting agent created (routine `trig_01SXFyummSJdtcFWjuUe1t5v`,
      Mondays 13:00 UTC ≈ 9am ET, claude.ai/code/routines — drafts next queue
      article, opens `seo-article-<slug>` PR; requires PR #11 merged so the
      queue exists on main)
- [ ] Phase 4: monthly review routine (start ~July: GSC check → re-sort queue)

## GSC export — click-by-click (for James)
1. Go to **search.google.com/search-console** and pick the
   clubfittingdirectory.com property.
2. Left sidebar → **Performance** (→ "Search results").
3. Top of the chart, set the date range to **Last 6 months** (Date filter).
4. Click **EXPORT** (top right) → **Download CSV**.
5. Drop the downloaded file (or the whole zip) into this project folder —
   anywhere is fine; Claude will find it.
