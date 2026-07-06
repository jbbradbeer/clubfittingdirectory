# GEO Research: Getting clubfittingdirectory.com Cited by AI Assistants
### (ChatGPT, Perplexity, Claude, Google AI Overviews / AI Mode, Bing Copilot)

**Date:** 6 July 2026
**What this is:** Research into "Generative Engine Optimization" (GEO) — how to get AI assistants to *recommend and cite* the directory when a golfer asks something like "where should I get a club fitting near Boise?" Findings are graded by how strong the evidence actually is, then turned into a ranked action list for this site.

---

## Part 1 — Headline findings, graded by evidence quality

### STRONG evidence (large real-data studies)

**1. Ranking well in normal search is still the biggest single lever — especially Bing for ChatGPT.**
- Ahrefs' large studies found roughly **76% of Google AI Overview citations come from pages already ranking in Google's top 10** for the query (median position 2). Newer follow-up data puts it lower (~38%) as AI Overviews diversify, but the overlap is still large.
- Seer Interactive found **~87% of ChatGPT Search (SearchGPT) citations match Bing's top-10 organic results**. Plain English: ChatGPT largely "Googles it on Bing" and cites what ranks. **Our regular SEO work IS our GEO work** — the in-flight "Top Fitters in {State} for 2026" pages serve both.
- Perplexity runs a live web search for every query and cites what it retrieves — again, ranking + retrievable HTML wins.

**2. Being cited in AI answers is worth real money even as clicks fall.**
- Seer Interactive (3,119 queries, 25M impressions, 42 orgs): queries with AI Overviews saw organic click-through drop ~61% — **but brands cited inside the AI answer earned ~35% more organic clicks** than uncited brands on the same queries. Citation is the new position 1.

**3. "Best of" listicles with the current year in the title are exactly what AI cites for "choose a provider" queries.**
- AIVO's June 2026 ChatGPT study: **~80% of commercial-investigation citations were listicle-type pages; 92% of cited listicles carry the current year in the title; median list length is 10**; for local queries, listicles were still 71% of citations. Freshness (re-dating and genuinely refreshing annually) was the single biggest lever.
- This is close to a direct endorsement of the planned "Top Golf Club Fitters in {State} for 2026" pages. Evidence says: ~10 picks, comparison-framed, year in the title, refreshed yearly.

**4. Brand mentions across the web (not just links) strongly predict AI visibility.**
- Ahrefs (75K brands): **branded web mentions correlate ~0.67 with AI Overview visibility** — the strongest factor they measured; top-quartile brands get 10x more AI mentions. Mentions on highly-linked pages correlate 0.70. YouTube mentions were the single strongest correlating platform.
- 5W/other citation-share studies: **Wikipedia + Reddit alone drive over 25% of ChatGPT citations**; Reddit, YouTube and LinkedIn top most cross-engine citation tables. Translation: being talked about on Reddit (r/golf), YouTube and golf media matters as much as anything on our own site.

**5. Statistics and quotable data points boost citation odds.**
- The Princeton-lineage GEO studies (the original academic work behind "GEO") found adding **statistics (+32–41%), quotations and authoritative citations (+30–41%)** measurably lifted a page's visibility in generated answers. Owning unique data ("we track 1,240 fitting shops; median driver fitting in Texas costs $X; 61% use Trackman") makes a page the thing AI must cite.

### MODERATE evidence

**6. Each AI engine has different taste — only ~11% of domains are cited by both ChatGPT and Perplexity** (Profound's 680M-citation dataset). ChatGPT leans editorial/reference (Wikipedia, Forbes, listicles); Google's AI leans on its own ecosystem (Google Business Profile, Yelp, Facebook); Perplexity leans Reddit/LinkedIn/review platforms. You optimize for a portfolio, not one engine.

**7. For local queries specifically, AI synthesizes from: Google Business Profile, review platforms (Yelp used in ~a third of local AI searches), directories, and "best of the city" listicles.** BrightLocal found ~27% of ChatGPT's local-business sources are third-party mentions — listicles, directories, local press. **Directories with structured review/price/tech data are exactly the source type AI reaches for on local "choose one" queries.** Brands present across structured review/directory ecosystems see roughly a 3x citation multiplier.

**8. Structured data (schema) helps AI understand and extract, but is not a magic citation switch.** Vendor case studies claim 2–3x citation lift for comprehensively-marked-up pages; Google says AI Mode uses the same index and signals as Search, where schema definitely matters. Fair read: schema is table stakes + a tiebreaker, not a ranking hack. (We already have this.)

**9. AI crawlers don't run JavaScript.** Vercel's own research and every crawler analysis confirms: GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot **do not render JavaScript**. Anything that only appears after client-side rendering is invisible to them. Our server-rendered static pages are correct; our one weak spot is `/directory` (client-rendered — fine, since every listing/city/state has a static page).

### WEAK / NEGATIVE evidence

**10. llms.txt is effectively dead as a search-citation lever.** Ahrefs server-log study (137K domains, May 2026): **97% of llms.txt files got zero requests**. A 500M-bot-visit study found only 408 hits on llms.txt. Google publicly said it won't support it (Illyes/Mueller compared it to the keywords meta tag); no major provider uses it in production answers. It's harmless to keep ours (near-zero maintenance, and coding assistants/IDE agents do read it), but **invest nothing further in it**.

**11. Ignore vendors selling "AI visibility" magic.** Most of the tactical listicle advice online is unverified. The verified levers are boring: rank well (Google AND Bing), be fresh, be structured, be quotable, be mentioned elsewhere.

---

## Part 2 — What the site already does right (don't redo)

| Already in place | GEO verdict |
|---|---|
| Static, server-rendered pages for every listing/city/state/category | The #1 technical requirement — AI crawlers can't run JavaScript, so this is exactly right |
| LocalBusiness + BreadcrumbList + ItemList + FAQPage JSON-LD | Table stakes, done. FAQPage especially useful — AI loves Q&A-shaped content |
| IndexNow pings on page changes | Feeds Bing fast — and Bing feeds ChatGPT. Genuinely valuable |
| /guides hub with keyTakeaways | keyTakeaways = extractable summary blocks, the format AI lifts. Good |
| Year-stamped "Top ... for 2026" pages (in flight) | Matches the strongest citation pattern in the 2026 data (listicle + current year). Highest-leverage thing in progress |
| llms.txt | Fine to keep; do not extend |
| Unique per-shop data (price ranges, launch monitors, ownership — the fitting-attributes crawl) | This is the raw material for finding #5 (be the canonical data source). Big opportunity |

---

## Part 3 — Ranked action list (impact vs effort)

**Legend:** 🔁 = overlaps with the in-flight SEO work (retitled "Top … for 2026" state/city pages) — one change serves both.

### 1. 🔁 Ship the "Top Fitters in {State} for 2026" pages in the exact shape AI cites — HIGH impact, LOW extra effort
The evidence (AIVO study) is unusually specific: current year in title, **~10 ranked picks**, comparison framing, and a visible "Last updated {Month Year}" line. Add to each page:
- A short **comparison table** (shop, city, price range, launch monitor, indoor/outdoor) — tables are the most-extracted format.
- 2–3 **hard statistics in plain sentences** ("Texas has 94 fitting locations in our directory; 38 offer Trackman; typical full-bag fitting runs $150–$400"). Statistics = +32–41% citation lift in the GEO studies.
- One-line **methodology** ("Ranked from our database of 1,240 U.S. fitting shops using verified reviews, technology, and services") — AI prefers sources that explain how they know.
Commit to genuinely refreshing + re-titling these annually ("for 2027"). Re-dating without real changes is the failure mode.

### 2. Verify the site ranks on BING and is clean in Bing Webmaster Tools — HIGH impact, LOW effort
ChatGPT ≈ Bing's top 10 (87% match). One afternoon: register/check Bing Webmaster Tools, submit the sitemap, confirm state/city pages index and rank on Bing for "best club fitters in {state}". IndexNow already helps here; this closes the loop. Nobody in golf is doing Bing SEO — cheap win.

### 3. Turn the shop database into quotable published statistics — HIGH impact, MEDIUM effort
Being *the canonical data source* for a niche is the strongest durable GEO position (finding #5, and how FittingPros could beat us if they publish first). Create one flagship page, e.g. **"U.S. Golf Club Fitting Report 2026"**: number of fitters per state, price-range distribution, launch-monitor market share (Trackman vs GCQuad vs Foresight), independent vs big-box split — all straight from the fitting-attributes crawl already underway. Then sprinkle 2–3 of these stats onto each state page (action 1) with a link back. Every stat is a sentence an AI (or a golf journalist) can only attribute to us. This also earns the brand mentions in finding #4.

### 4. robots.txt: explicitly ALLOW the AI search bots — MEDIUM impact, TRIVIAL effort
Check `web/app/robots.ts` doesn't block, and ideally explicitly allows: `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Claude-SearchBot`/`Claude-User`, `GPTBot`, `Google-Extended`, `Bingbot`. For a directory whose whole business is being found, the trade-off is one-sided: allow everything, including training bots — a directory *wants* to be in the models' world knowledge. (Content publishers agonize over this; we shouldn't.)

### 5. 🔁 Add a per-listing "quick facts" answer block — MEDIUM impact, MEDIUM effort
On each listing page, a short server-rendered plain-text block AI can lift whole: "**{Shop}** is a {independent/big-box} club fitting studio in {City}, {State}. Fittings from {price}. Technology: {launch monitors}. {Verified badge status}." Mirrors keyTakeaways from /guides; keeps LocalBusiness schema and visible text saying the same thing (consistency is a citation factor). Uses the same new fitting-attribute fields as the SEO pages — build once.

### 6. Earn third-party mentions: Reddit, YouTube, golf media — HIGH impact, HIGH effort (ongoing)
The 0.67-correlation finding. Realistic versions for a solo founder:
- When r/golf threads ask "where to get fitted in X?", the directory being organically mentioned is gold. Don't astroturf — but publishing the stats report (action 3) gives Redditors and golf writers a reason to link/mention.
- Pitch the annual report to golf publications (MyGolfSpy, Golf Digest gear team, GolfWRX) — "new data on fitting prices across 50 states" is a genuinely pitchable story. One pickup = the "highly-linked page mention" (0.70 correlation).
- Later: short YouTube explainers ("what a club fitting costs in 2026") — YouTube is the #1 cited domain in AI Overviews.

### 7. Monitor whether it's working — LOW effort, do monthly
Free version: once a month, ask ChatGPT (with search), Perplexity, and Google AI Mode 5 test questions ("best club fitters in Texas", "where should I get fitted near Boise", "how much does a club fitting cost") and log whether clubfittingdirectory.com or FittingPros appears. Also watch server logs / Vercel analytics for `OAI-SearchBot`, `PerplexityBot`, `ChatGPT-User` hits, and referrer traffic from chatgpt.com / perplexity.ai. Paid tools (Profound, Ahrefs Brand Radar) exist but aren't needed at this stage.

### Explicitly NOT recommended
- **More llms.txt work** (llms-full.txt, per-page markdown mirrors) — 97% of these files are never fetched.
- **Blocking training crawlers** — wrong move for a directory.
- **Schema beyond what exists** — current markup already covers the types that matter; marginal returns now come from content, not markup.

---

## Sources (primary ones worth trusting)
- Ahrefs: [76% of AI Overview citations from top 10](https://ahrefs.com/blog/search-rankings-ai-citations/), [update: 38%](https://ahrefs.com/blog/ai-overview-citations-top-10/), [how to rank in AI Overviews / brand-mention correlations](https://ahrefs.com/blog/how-to-rank-in-ai-overviews/), [12% AI-cited URLs rank top-10 for the prompt](https://ahrefs.com/blog/ai-search-overlap/)
- [Seer Interactive — AI Overviews impact case study (CTR + citation lift, SearchGPT↔Bing overlap)](https://www.seerinteractive.com/insights/case-study-analyzing-the-impact-of-ai-overviews-on-organic-search-performance)
- [ppc.land — Ahrefs 137K-domain log study: 97% of llms.txt files get zero requests](https://ppc.land/llms-txt-adoption-rises-8-8x-but-97-of-files-get-zero-ai-requests/), [SE Ranking llms.txt analysis](https://seranking.com/blog/llms-txt/)
- [AIVO Research — ChatGPT listicle citation study, June 2026](https://www.tryaivo.com/resources/research/chatgpt-listicle-silver-bullet-june-2026)
- [5W Research — Wikipedia + Reddit >25% of ChatGPT citations](https://www.prnewswire.com/news-releases/wikipedia-and-reddit-now-drive-over-25-of-chatgpt-citations-in-the-us-new-5w-research-finds--wsj-nyt-and-bloomberg-do-not-appear-in-the-top-20-302768339.html)
- [Search Engine Land — AI engines cite Reddit, YouTube, LinkedIn most](https://searchengineland.com/ai-search-engines-cite-reddit-youtube-and-linkedin-most-study-473138)
- [BrightLocal — AI search makes local listings more important](https://www.brightlocal.com/blog/ai-search-using-listings-sources/)
- [Vercel — The rise of the AI crawler (no-JS finding)](https://vercel.com/blog/the-rise-of-the-ai-crawler), [Cloudflare — who's crawling your site](https://blog.cloudflare.com/from-googlebot-to-gptbot-whos-crawling-your-site-in-2025/)
- [Whitespark — Google AI Mode for local businesses](https://whitespark.ca/guides/whitesparks-guide-to-googles-ai-mode-for-local-businesses/)
- [everything-pr — the six 2026 AI-citation studies](https://everything-pr.com/how-ai-engines-cite-the-web-the-six-studies-that-define-the-2026-evidence-base), [Scrunch — Reddit paradox by industry](https://scrunch.com/blog/reddit-paradox-industry-breakdown-of-most-cited-ai-sources/)
