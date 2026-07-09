# SEO / GEO / AEO Discoverability Audit & Plan — 2026-07-09

Full audit of clubfittingdirectory.com across SEO (Google ranking), AEO (answer
engines — featured snippets, FAQ rich results), and GEO (generative engines —
ChatGPT / Perplexity / AI Overviews citations).

## Verdict

**Grade: B+ / strong foundation.** Most of the July GEO research was actually
shipped: comparison tables with methodology, year-stamped titles, FAQPage schema
on collection pages, AI-bot allow-list, llms.txt, data-driven intros, guides
with keyTakeaways. Live checks confirm everything is server-rendered and
crawlable, sitemap has 1,349 URLs, site ranks ~#3 for "club fitting directory"
(behind FittingPros and Golf Digest).

Remaining gaps cluster in four areas:
1. A handful of concrete on-site bugs/omissions (fixable in code now)
2. Listing pages (highest-volume page type) lack AEO answer blocks
3. E-E-A-T / authority signals (author identity, off-site mentions, Bing)
4. Unbuilt differentiators (award layer, OEM badges)

---

## Tier 1 — Quick code fixes (one session)

- [ ] **Fix broken schema logo URL.** `web/lib/structured-data.ts:277` and `:303`
      reference `${SITE_URL}/icon.png` which 404s (icon served at `/icon` from
      `app/icon.tsx`). Point to `/icon` or add real `public/icon.png`.
- [ ] **Add BreadcrumbList schema to state + category pages.** Visible breadcrumb
      exists on both; schema missing (city/listing/guide all have it).
- [ ] **Reconcile shop count.** llms.txt hardcodes "roughly 1,267"; homepage says
      "700+"; sitemap shows 727 live listings. Make llms.txt count dynamic.
- [ ] **Add `image` to Article schema** (`buildArticleSchema`) + per-guide OG
      image route (guides currently fall back to site default card).

## Tier 2 — Listing-page AEO (highest-volume pages, 1–2 sessions)

- [ ] **Quick-facts liftable sentence per listing** (owed from GEO research rec #5):
      server-rendered prose block — "*{Shop} is an independent club fitting studio
      in {City}, {State}. Fittings from {price}. Technology: {monitors}.
      {Verified status}.*" This is the sentence AI engines lift verbatim.
- [ ] **FAQPage schema + visible Q&A on listing pages** — currently zero FAQ on
      the ~727 listing pages. Data-driven questions (price, booking, tech).
- [ ] **Category page parity**: data-driven intro + local FAQs + TopFittersTable +
      year-stamped metadata (currently the thinnest programmatic template).

## Tier 3 — Trust & authority (E-E-A-T)

- [ ] **Author identity on guides**: named person byline + visible
      published/updated dates + Person schema (currently Organization-only).
- [ ] **Per-state hard stats**: "N shops offer Trackman; typical fitting $X–$Y"
      + link each state page back to the State of Club Fitting 2026 report.
- [ ] **Thin-page strategy**: noindex (or enrich) one-shop city pages to avoid
      thin-content dilution.

## Tier 4 — Owner actions (not code — founder does these)

- [ ] **Bing Webmaster Tools verification** — HIGH impact: ChatGPT search runs on
      Bing's index. Still owed since July research. ~15 min.
- [ ] **Off-site mentions** — strongest measured GEO factor (0.67 correlation):
      Reddit (r/golf fitting threads), YouTube fitters, golf media pitches citing
      the 2026 data report. Ongoing, no code artifact possible.
- [ ] **Monthly AI-citation check** — test queries in ChatGPT/Perplexity ("best
      club fitter in Austin"), log whether site is cited; watch AI-bot hits.

## Tier 5 — Differentiators (from competitor research, bigger builds)

- [ ] Guides backlog: Custom Fitting, What to Expect, Driver Fitting, Iron
      Fitting (weekly drafting agent already runs; these are queued).
- [ ] Annual "Best Independent Fitters" award — fills lapsed Golf Digest vacuum;
      earns backlinks + AI citations.
- [ ] OEM certification badges on listings (Ping Certified, AGCP Master, etc.).

## Live-site facts (verified 2026-07-09)

- robots.txt healthy; 10 AI bots explicitly allowed; sitemap declared
- sitemap.xml: 1,349 URLs (727 listing / 548 city / 51 state / 9 guides / 6 category / 7 static)
- All sampled pages server-rendered with correct JSON-LD (LocalBusiness,
  FAQPage, ItemList, BreadcrumbList)
- Google: indexed incl. deep pages; #3 for "club fitting directory"; absent from
  "golf club fitting near me" top 10 (expected — city pages are the play there)
- Bing status unverifiable from CLI (bot challenge) — BWT signup resolves this
