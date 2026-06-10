# Repository Audit & Improvement Plan
**BTG Club Fitting Directory** · Audited 2026-06-09 · Branch: `fix-apostrophe-search`
Analysis only — no code was modified. Findings verified against the working tree; one finding (F1) verified live against the production Supabase instance with read-only queries.

---

## Executive Summary

**Overall health grade: B−.** This is an unusually well-built site for a solo project: TypeScript strict mode passes clean, ESLint passes with zero warnings, the database security model (RLS) is genuinely well designed, API routes are uniformly defensive, and the rendering strategy is correct on every route. What pulls the grade down is not sloppy code — it's missing infrastructure (zero tests, zero CI) and a handful of silent failure modes, one of which is actively harming the product right now.

**Top 3 risks:**
1. **Every "fetch all shops" query silently caps at 1,000 rows while the table holds 1,267** — the sitemap is missing ~267 listing pages from Google, homepage stats undercount, and the newest shops are the ones most likely dropped. Verified live. (Critical)
2. **The live production service-role key (god-mode database access, bypasses all security) sits unrotated in three places on disk**, including inside a misleadingly-named `.env.local.example` file in a 962 MB legacy folder — one gitignore edit or folder share away from public exposure. The repo is public. (High)
3. **An entire feature (the /guides SEO hub) plus a security commit exist only on this machine** — uncommitted, unpushed. A disk failure loses real work. (High)

**Top 3 opportunities:**
1. A ~20-line GitHub Action (type-check + lint on every PR) is the single highest-leverage safety net for an AI-driven solo workflow.
2. Moving five full-table-download aggregate queries to one SQL `GROUP BY` view fixes the Critical truncation bug *and* the performance smell in one move.
3. CLAUDE.md — read by every AI session — materially contradicts the codebase (wrong routes, nonexistent files, stale status). Fixing it improves every future change.

---

## Phase 1 — Repo Map

**Purpose:** A directory website of ~1,267 golf club fitting shops across all 50 US states. Golfers find local fitters; long-term plan is monetisation (featured listings, leads). Maturity: **early production** — live on Vercel, indexed by Google, actively developed by a non-technical founder working with AI agents.

**Stack:** Next.js 16.1.6 (App Router, React 19, server components), Tailwind CSS 4, Supabase (Postgres + PostGIS + RLS), Vercel hosting, Python 3 scripts for data operations, beehiiv for newsletter.

**Architecture sketch:**
```
Browser ──► Vercel (Next.js)
              ├─ Static/ISR pages (home, listing, state, city, category, guides)
              │    └─ build-time + revalidate queries ──► Supabase (anon key, RLS)
              ├─ /directory (client component, live filtered search) ──► Supabase
              ├─ /api/{search,newsletter,submit-shop} (validated, anon/server keys)
              └─ /admin (password gate → server actions, service-role key)
Python scripts (root) ──► Supabase (service-role key)  [bulk upload / enrichment]
```

**Key directories:**
| Path | What it is |
|---|---|
| `web/app/` | All routes: `/`, `/directory`, `/listing/[slug]`, `/state/[state_code]`, `/states`, `/city/[citySlug]`, `/category/[type]`, `/guides`, `/submit`, `/admin`, `/api/*` |
| `web/lib/supabase/queries/` | Data layer — `shops.ts` (534 lines, 18 exports), `listings.ts` (directory search), `shared.ts` (shared fields + search sanitizer) |
| `web/lib/` | `structured-data.ts` (JSON-LD), `seo-content.ts`, `admin-auth.ts`, `guides/` (new, untracked) |
| `web/components/` | layout / directory / shop-profile / guides / ui building blocks |
| `web/supabase/*.sql` | Schema + RLS migrations 001–004 |
| `*.py` (root) | Data pipeline: `migrate_to_supabase.py` (tracked), `check_duplicates.py`, `upload_new_shops.py`, `enrich_new_shops.py` (untracked) |
| `Club fitting directory claude /` | 962 MB gitignored legacy backup (note trailing space in name) — contains live secrets on disk |
| `tasks/` | `todo.md`, `lessons.md` — excellent dated work logs |

**Surprises found during mapping:**
- The repo is **public** on GitHub — raises the stakes on any secret-handling slip.
- `web/proxy.ts` is Next 16's renamed middleware convention (an edge gate for `/admin`), not a reverse proxy.
- Empty husk directories `web/app/shops/[slug]/` and `web/app/states/[state]/` from a pre-rename route structure.
- Local branch is 1 commit ahead of its remote and 2 ahead of `main` (security hardening commit unpushed).

---

## Phase 2 — Audit Report

Severity legend: 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low. Each finding labelled **[fact]** (verified) or **[judgment]**.

### Performance & Data Access

**🔴 F1 — PostgREST's 1,000-row default cap silently truncates every "fetch all rows" query. [fact — verified live]**
Supabase returns at most 1,000 rows unless `.limit()`/`.range()` is set. The table has 1,267 active rows; running the app's exact unbounded query live returned exactly 1,000. Affected: `getAllShopSlugs` (`web/lib/supabase/queries/shops.ts:101-110`), `getAllCitySlugs` (`shops.ts:472-492`), `getAllStatesWithShops` (`shops.ts:114-136`), `getHomepageStats` (`shops.ts:161-196`), `getShopTypeCounts` (`shops.ts:308-323`), `getAllStateCodes` (`shops.ts:398-408`), `getAllShopTypes` (`shops.ts:443-453`).
**Consequence:** sitemap (`web/app/sitemap.ts:35-40,138-143`) is missing ~267 listing URLs from Google; `generateStaticParams` prerenders only 1,000 listing pages (explains "1,049 static pages" vs 1,267 shops); homepage hero shows 1,000 instead of 1,267; state/category counts undercount. Rows dropped are in undefined order — likely the newest shops. Gets worse with every shop added.

**🟠 Q5 — Swallow-then-`notFound()` can turn healthy indexed pages into 404s during a database blip. [pattern: fact; consequence: judgment]**
ISR pages catch query failures, get `null`, and call `notFound()`: `state/[state_code]/page.tsx:50-54`, `city/[citySlug]/page.tsx:43-45`, `listing/[slug]/page.tsx:56-57`, `category/[type]/page.tsx:44-45`. With `revalidate = 86400`, an uncaught throw during background revalidation preserves the stale-but-good cached page; catching and rendering 404 is a "successful" render that **replaces the cached page with a 404** — across up to ~1,267 indexed pages. SEO is goal #3; this is the inverse of the intended resilience.

**🟡 F2 — Directory search fires two database queries per keystroke; no debounce. [fact]**
`SearchBar.tsx:28` → `DirectoryClient.tsx:88-125`: every keypress triggers a count query + data query + `router.replace`. Typing "Austin Texas" ≈ 24 Supabase REST calls (~20.5 KB each measured). The codebase already has the correct pattern — `HeroSearch.tsx:27-62` debounces 180 ms with AbortController — it just wasn't applied here.

**🟡 F3 — `/api/search` is not edge-cacheable. [fact]** `web/app/api/search/route.ts:17` sets `max-age=30` but no `s-maxage`; Vercel's CDN keys off `s-maxage`, so every type-ahead keystroke from every visitor hits the serverless function + DB.

**🟡 F4 — Build makes ~3,000–4,000 Supabase round trips. [pattern: fact; totals: judgment]** ~2 calls per listing page × 1,254 pages, plus per-listing `opengraph-image.tsx:13` refetching `getShopBySlug` (React `cache()` doesn't span routes), plus 50 state pages each refetching `getAllStatesWithShops`. Acceptable today; scales linearly with shop count.

**🟡 F5 — Search uses leading-wildcard `ilike` (unindexable) while purpose-built FTS infrastructure sits unused. [fact]** The GIN full-text index (`web/supabase/001_schema.sql:100-106`) and `search_shops_text` RPC (`001_schema.sql:209-254`) are never called by app code; `pg_trgm` is enabled but no trigram index exists. ~1 ms at current scale — a scaling cliff, not a today-problem.

**🟡 F6 — Five aggregate functions download the full table and count in JavaScript. [fact]** e.g. `shops.ts:166-196`; 67.5 KB measured for a stats scan a `GROUP BY` answers in ~50 rows. This pattern is the *root cause* of F1.

**⚪ F7 — `shadcn` (a CLI code-generator, not a library) is a runtime dependency. [fact]** `web/package.json:24`; zero imports anywhere. `@types/leaflet` also belongs in devDependencies. Slows every Vercel install.

**⚪ F9 — No composite index matches the dominant query shape** (`status` + `state_code`/`shop_type`, ordered by `is_featured DESC, rating DESC`). [judgment] Irrelevant below ~50k rows; roadmap item only.

### Security

**🟠 S1 — Live, never-rotated production service-role key in a legacy ".example" file. [fact]**
`Club fitting directory claude /club-fitting-directory/.env.local.example:6` contains the real service-role JWT for the **current** production project — byte-identical (SHA-256 compared) to the key in `web/.env.local`. It also sits in `Club fitting directory claude /club-fitting-directory/.env.local`. The service-role key bypasses all RLS — full read/write/delete of everything. Untracked only because of one gitignore line; `.env.local.example` files are conventionally committed, and the repo is public. **No secret has ever actually been committed** (verified with content searches across full git history of both repos) — but the key should be rotated and the legacy copies deleted.

**🟠 S2 — Next.js 16.1.6 has known published vulnerabilities; fix is 16.2.9. [fact — npm audit]**
Advisories include middleware/proxy bypass via segment-prefetch routes and dynamic route parameter injection, RSC cache poisoning, SSRF via WebSocket upgrades, DoS, and CSP-nonce XSS. The proxy-bypass class lets crafted requests skip `web/proxy.ts` and reach `/admin` directly — currently neutralised because every admin page and server action independently re-checks auth, but that's one refactor away from mattering. Transitive: `flatted`, `picomatch`, `ws`, `postcss`, `brace-expansion` (mostly build-time/dev).

**🟡 S3 — No rate limiting anywhere. [fact: none exists; impact: judgment]**
(a) `/admin/login` (`web/app/admin/actions.ts:12-29`) accepts unlimited password attempts; the single static password is the only defence to a 7-day admin session. (b) `/api/newsletter` sends a welcome email per POST (`route.ts:62`) — a subscription-bombing vector that burns your beehiiv quota and sender reputation. (c) `/api/submit-shop` allows unlimited anon inserts (quarantined by design, so consequence is admin-queue pollution only).

**🟡 S4 — Admin session cookie is unsalted SHA-256 of the password; no server-side revocation. [judgment]**
`web/lib/admin-auth.ts:18,29` — deterministic, identical across sessions, valid until the password changes; logout only deletes the local cookie. A leaked cookie is a permanent credential and an offline dictionary target.

**🟡 S5 — CSP allows `script-src 'unsafe-inline'`. [judgment]** `web/vercel.json` — with unsafe-inline, CSP provides near-zero XSS protection. Mitigants: React escaping, no user-data `dangerouslySetInnerHTML` sinks found, and Next's inline runtime makes nonce CSP non-trivial. Eventually, not urgently.

**⚪ S6 — Residual search chars pass sanitization. [fact]** `_` (single-char LIKE wildcard) and `.` pass `sanitizeSearchTerm` (`shared.ts:47`) — broadens matches slightly; no injection or data-exposure path exists (breakout attempts were tested and failed).

### Architecture & Code Quality

**🟡 Q1 — ~190 lines of dead code in the query layer, including a full duplicate of the live `getListings`. [fact]**
`getShops` (`shops.ts:14-45`), `getShopsByState` (`:85-98`), `getDirectoryStats` (`:139-156`), and dead `getListings` (`:206-305`) have zero callers. The dead `getListings` is a near-copy of the live one in `listings.ts:19-89` — a classic drift trap: fix the filter bug in the dead copy and see no effect.

**🟡 Q2 — Count-query errors silently swallowed in directory pagination. [fact]**
`listings.ts:76-80` destructures only the data query's `error`. A failed count yields `total = 0`, `totalPages = 1` while 24 cards still render — a confusing silent failure of exactly the kind the project's own `logQueryError` exists to prevent.

**🟡 Q3 — The type system lies: nine `as unknown as Shop[]` casts; the fix was built but never wired up. [fact]**
Card queries select 26 of 41 columns but are cast to full `Shop` (`shops.ts:44,60,97,374,392,425,520`; `listings.ts:83`; `DirectoryClient.tsx:201`). `shared.ts:25` defines the correct `ShopCard` type whose doc-comment claims it replaced the casts — zero usages. Components can access `working_hours`/`about` etc. on card data and get `undefined` with full type-checker approval.

**🟡 Q4 — Admin approval permanently rejects valid submissions and ignores update failures. [fact]**
(a) The public submit endpoint treats `shop_type` as optional (`web/app/api/submit-shop/route.ts`), storing `null`; `approveSubmission` (`web/app/admin/actions.ts`) hard-throws on missing `shop_type` — such submissions **can never be approved** and the admin (you) sees a raw Next error page. (b) Both `review_status` updates in approve/reject discard the Supabase result — a failed update leaves an already-inserted shop showing "Pending review", and re-approving creates a duplicate listing (slug-suffix logic makes `foo-tx-a1b2c3` rather than failing).

**⚪ Q6 — `shops.ts` is a 534-line god file with a layering leak. [fact + judgment]** Mixes card/detail/sitemap/aggregate/search queries plus the pure string utility `toCitySlug` (`:463`), which `lib/structured-data.ts:4` (a presentation module) imports from the *database layer* just to build URLs.

**⚪ Q7 — Website-URL normalization copy-pasted four times. [fact]** `app/listing/[slug]/page.tsx:142,294,326,361`.

**⚪ Q8 — `applyFilters = (q: any)` disables type-checking on the one function assembling every user-controlled filter. [fact]** `listings.ts:29`.

**⚪ Q9 — Empty leftover route directories** `web/app/shops/[slug]/`, `web/app/states/[state]/` mislead anyone exploring routing. [fact]

**⚪ Q10 — `sameAs` misused in LocalBusiness JSON-LD** (`structured-data.ts:93-94`) — the business's own site should be `url`, not `sameAs`. [judgment]

### Data Pipeline & Repo Hygiene

**🟠 R1 — The guides feature, a security commit, and the June-2 data-op scripts exist only on this machine. [fact]**
Untracked: `web/app/guides/`, `web/components/guides/`, `web/lib/guides/` (~56 KB authored content/code), `tasks/seo-content-calendar.md`, `check_duplicates.py`, `enrich_new_shops.py`, `upload_new_shops.py`. Uncommitted wiring edits in 5 files (+79 lines, reviewed — clean, matches conventions). Commit `b03c8ea` (security hardening) is unpushed. One disk failure loses all of it.

**🟠 R2 — Source-of-truth split-brain: CSVs are stale but documentation says they're authoritative. [fact + judgment]**
Root CSVs date to Feb 20; the live DB was mutated directly since (13 shops added 2026-06-02). CLAUDE.md still says `golf_directory_MASTER.csv` "contains all the shop listings" — that file doesn't exist at root. Anyone "re-importing the master CSV" would silently destroy four months of live changes. Supabase is the de facto source of truth; nothing says so.

**🟡 R3 — 962 MB legacy folder on disk** (`Club fitting directory claude /` — trailing space breaks naive shell commands), containing two old app copies with node_modules, 9 CSV snapshots, the original scripts, and the live secrets from S1. Fully gitignored, but it's also the *only* place `golf_directory_MASTER.csv` and the original enrichment scripts still exist. [fact]

**🟡 P1 — `enrich_new_shops.py` reports success on no-op updates. [fact]** PostgREST returns 204 for a PATCH matching zero rows (`enrich_new_shops.py:160-173,205-212`); a typo'd or renamed slug prints `✓` while writing nothing.

**🟡 P2 — `migrate_to_supabase.py` has no dry-run; batch-level failure on duplicate slugs; slug suffixes depend on CSV row order. [fact]** Header says "temporary — delete after use"; it survived.

**🟡 P3 — No Python dependency management. [fact]** No `requirements.txt`/`pyproject.toml`; `enrich_services_crawl.py` imports unpinned `pandas` + `crawl4ai`. Unreproducible after an environment wipe.

**⚪ P4 — Two scripts reference a CSV that no longer exists** (`check_duplicates.py:21`, `upload_new_shops.py:31` → `Boutique Clubmaker List-Grid view.csv`) and crash with raw tracebacks if run. `load_env()` is copy-pasted across three scripts. [fact]

**⚪ P5 — Crawl script etiquette:** `enrich_services_crawl.py` runs 5 concurrent headless crawls, no robots.txt check, bare `except Exception` swallowing crawl errors into `""` (`:104-105`). One-time batch job; low. [fact]

**⚪ R4 — Stale agent worktrees** (`.claude/worktrees/`, 8.3 MB, 3 worktrees + matching `worktree-agent-*` branches parked at Jun-2 commit). ~1.9 MB of stale CSVs tracked in git. [fact]

### Testing, CI, Observability, Docs

**🟠 T1 — Zero tests, zero CI. [fact]**
No test files, framework, or script anywhere in `web/`; no `.github/` directory — no PR checks of any kind. The only gate is Vercel's build failing *after* merge. For a workflow where AI agents write most code, an automated `tsc --noEmit` + `eslint` check on every PR is the single highest-leverage safety net. Highest-value first tests: `toCitySlug()` + the Python slug functions (independent implementations that must agree — divergence silently 404s pages), `sanitizeSearchTerm` (the apostrophe bug this very branch fixes is exactly the recurring kind), and `getListings` filter-building.

**🟠 B1 — CLAUDE.md materially contradicts the codebase. [fact]**
Read at the start of every session, it describes routes that don't exist (`/shops/[slug]`, `/states/[state]`), files that don't exist at root (`golf_directory_MASTER.csv`, `enrich_golf_directory.py`, `recrawl_failed.py`), a months-stale status ("files were deleted... may need to be restored"), and asserts the CSV is the data source (see R2). Every future AI session starts with a wrong map.

**🟡 B2 — `web/README.md` drift. [fact]** Says Next.js 15 (actual: 16.1.6), Node 18+ (Next 16 needs ≥20), and a setup step referencing a file the script doesn't read (`migrate_to_supabase.py:21` reads `golf_directory_enriched.csv`). New-machine setup fails at step 5.

**🟡 O1 — No error monitoring, no analytics. [fact]** Zero hits for Sentry/Vercel Analytics/etc. Production errors are visible only in Vercel function logs; no traffic data to judge the SEO investment (stated goal #3).

### Strengths (preserve these)

1. **Security architecture is genuinely good:** clean secret hygiene across the entire git history of both repos (content-searched, not just filenames); insert-only RLS quarantine for public submissions with re-validation at approval; defence-in-depth on `/admin` (edge gate + page check + per-action check, timing-safe compares, httpOnly/secure/lax cookie) — this redundancy is exactly what currently neutralises the Next.js middleware-bypass CVEs.
2. **`sanitizeSearchTerm` (`shared.ts:39-55`) shows real security awareness** — strips every structural character of the PostgREST `.or()` grammar with comments explaining why; the auditor could not construct a breakout.
3. **Rendering strategy is correct everywhere:** ISR with sane revalidate values, `generateStaticParams` on all SEO routes, the only `force-dynamic` is `/admin`, and public queries use a cookie-free client so static optimization is never accidentally killed.
4. **Client/server hygiene is excellent:** 17 `'use client'` files, all genuinely interactive leaves; Leaflet double-isolated via lazy `import()` so the map never touches the shared bundle; `HeroSearch.tsx` is a model component (debounce + AbortController + full ARIA combobox).
5. **Column projection discipline:** card queries pull 26 shared `CARD_FIELDS`, not `select('*')`; no N+1 patterns anywhere; PostGIS RPC with GIST index for "Near Me".
6. **Operational memory is encoded in the code:** inline comments explain past incidents (`.single()` → `.limit(1)`, sitemap excluding zero-shop categories); `tasks/todo.md` and `lessons.md` are excellent dated logs; `tsc --noEmit` and `eslint` both pass clean today; TypeScript strict mode is on.

---

## Phase 3 — Improvement Strategy

### Theme 1: Silent failure is the default failure mode
F1 (1,000-row truncation), Q2 (swallowed count errors), Q5 (ISR pages becoming 404s "successfully"), Q4b (ignored update results), P1 (no-op PATCH printing ✓), O1 (no monitoring) are all the same disease: when something goes wrong, this system smiles and carries on.
**Target state / principle:** *fail loud or fail safe — never fail silent.* Every Supabase response checked; transient failures throw (preserving ISR cache) instead of rendering 404; scripts verify row counts after writes; Sentry catches what slips through.

### Theme 2: No safety net under an AI-driven workflow
T1 (zero tests, zero CI) is the structural risk. Most code here is written by AI agents and merged by a non-technical founder — the humans-review-the-diff backstop doesn't exist. Today the only gate is "does Vercel's build crash."
**Target state / principle:** *machines check the machines.* CI runs type-check + lint + unit tests on every PR; the first tests target the code that has already bitten (slugs, search sanitization, listing filters).

### Theme 3: Truth drift — docs, data, and dead code disagree with reality
B1/B2 (docs describe a codebase that no longer exists), R2 (CSVs masquerading as source of truth), Q1/Q3 (dead duplicate code and an abandoned type migration documenting improvements that didn't happen). Each is individually small; together they mean every new session — human or AI — starts misinformed.
**Target state / principle:** *one source of truth per fact.* Supabase is declared the data authority; CLAUDE.md/README rewritten to match reality; dead code deleted rather than kept "just in case"; half-finished migrations finished or reverted.

### Theme 4: Secret sprawl and patch lag
S1 (god-key in three disk locations, never rotated, one in an "example" file in a public repo's working tree) and S2 (known CVEs with a patch available). Both are maintenance habits, not design flaws — the design is good.
**Target state / principle:** *secrets live in exactly two places* (local `.env.local` + Vercel env vars), rotated after any sprawl event; framework patched when advisories land.

### Theme 5: Open front doors
S3 — no rate limiting on login, newsletter, or submission endpoints. The blast radii differ (admin takeover risk vs. quota burn vs. queue spam) but the fix is one shared mechanism.
**Target state / principle:** every unauthenticated POST endpoint and the login form get basic throttling (Vercel WAF rules or a small in-route limiter).

### Explicitly NOT fixing (trade-offs)
- **Nonce-based CSP (S5):** Next's inline runtime scripts make this genuinely fiddly; React escaping + no user-HTML sinks means low marginal payoff. Revisit if user-generated content (reviews) ships.
- **Full-text-search migration (F5) and composite indexes (F9):** seq scans cost ~1 ms at 1,267 rows. Defer until ~10k+ shops; noted on the roadmap so the unused FTS infra isn't deleted by mistake.
- **Polishing one-time Python scripts (P2, P4, P5):** delete or archive them instead of hardening them. Only the *reusable* pattern (`upload_new_shops.py`'s dry-run-by-default design) deserves keeping.
- **Admin session store (S4) beyond a cheap fix:** a full session table is overkill for one admin; an HMAC-with-separate-secret token is the right-sized fix.
- **Build round-trip optimisation (F4):** acceptable at current scale; revisit at ~5k shops or if Vercel build times exceed ~10 min.

### Definition of done (measurable)
- `curl` of `/sitemap.xml` URL count == Supabase `count(*) where status='active'` (currently 1,267).
- CI fails PRs on type errors, lint errors, or test failures; badge green on `main`.
- `npm audit` shows zero high-severity advisories on direct dependencies.
- Old service-role key returns 401 against the Supabase API (rotation confirmed).
- Zero unpushed commits / untracked feature code (`git status` clean after each work session).
- ≥ 20 unit tests covering `toCitySlug`, `sanitizeSearchTerm`, `getListings` filter-building; all passing in CI.
- Sentry receiving events from production; Vercel Analytics reporting page views.
- CLAUDE.md route/file/status sections verified accurate; "Supabase is the source of truth" stated explicitly.

---

## Phase 4 — Task Plan

### Quick wins (do immediately — all S effort, high impact)
| ID | Task | Impact |
|---|---|---|
| QW-1 | Commit & push guides feature + unpushed security commit (= M0-1) | Removes single-machine loss risk |
| QW-2 | Rotate Supabase service-role key; delete legacy env files (= M1-2) | Closes the god-key sprawl |
| QW-3 | Add 180 ms debounce to DirectoryClient (copy HeroSearch pattern) | ~10× cut in directory DB traffic |
| QW-4 | Add `s-maxage=30` to `/api/search` Cache-Control | Edge-caches type-ahead |
| QW-5 | Remove `shadcn` from dependencies; move `@types/leaflet` to devDependencies | Faster installs |
| QW-6 | `git worktree remove` stale worktrees; delete `worktree-agent-*` branches; delete empty `app/shops/[slug]` & `app/states/[state]` dirs | Repo clarity |

### Milestone 0 — Safety net (before any refactoring)

**M0-1 · Commit and push all outstanding work** — Commit the guides feature (untracked dirs + 5 modified files), the three new Python scripts, and `tasks/seo-content-calendar.md`; push `fix-apostrophe-search` including `b03c8ea`; merge to `main` via PR.
Files: `web/app/guides/`, `web/components/guides/`, `web/lib/guides/`, `web/app/{page,sitemap}.tsx/ts`, `web/components/layout/{Header,Footer}.tsx`, `web/lib/structured-data.ts`, root scripts. Acceptance: `git status` clean; `origin/main` contains all work. **Effort: S. Risk: minimal** (diff already reviewed clean). Deps: none.

**M0-2 · Add CI: type-check + lint on every PR** — GitHub Action running `npm ci`, `npx tsc --noEmit`, `npm run lint` in `web/` on pull_request + push to main.
Files: `.github/workflows/ci.yml` (new). Acceptance: a PR with a deliberate type error fails CI. **Effort: S. Risk: none.** Deps: M0-1.

**M0-3 · Add vitest + first regression tests** — Install vitest; test `sanitizeSearchTerm` (apostrophes, smart quotes, `%`, `,`, `(`, `)`, `&`), `toCitySlug` (spaces, punctuation, casing — and pin expected outputs against real slugs in the DB), and `getListings` filter-building with a stubbed client. Add `npm test` to CI.
Files: `web/vitest.config.ts`, `web/lib/**/*.test.ts`, `package.json`, ci.yml. Acceptance: ≥20 assertions, green in CI; reverting the apostrophe fix (f7cc17d) makes a test fail. **Effort: M. Risk: none.** Deps: M0-2.

### Milestone 1 — Critical fixes (security & correctness)

**M1-1 · Fix the 1,000-row truncation (F1) 🔴** — Replace the seven unbounded queries. Aggregates (`getHomepageStats`, `getAllStatesWithShops`, `getShopTypeCounts`, `getAllStateCodes`, `getAllShopTypes`) move to a SQL view/RPC with `GROUP BY`; row-enumeration queries (`getAllShopSlugs`, `getAllCitySlugs`) get explicit pagination or a generous `.limit(10000)` with a loud warning when the limit is hit.
Files: `web/lib/supabase/queries/shops.ts`, new `web/supabase/005_aggregates.sql`, `web/app/sitemap.ts`. Acceptance: sitemap URL count == 1,267 active shops; homepage shows 1,267; build prerenders all listing pages. **Effort: M. Risk: medium** (touches homepage + sitemap; tests from M0-3 + a post-deploy sitemap count check mitigate). Deps: M0-2, M0-3.
*Implementation sketch:* (1) Write `005_aggregates.sql`: a `shop_state_counts` view (`SELECT state_code, state, count(*), count(*) FILTER (WHERE shop_type='fitting_studio')... GROUP BY`) and a `shop_type_counts` view; grant SELECT to anon; apply via Supabase SQL editor (the project's documented DB-change path). (2) Point the five aggregate functions at the views — each becomes a ~5-line select. (3) For `getAllShopSlugs`/`getAllCitySlugs`, loop `.range(i, i+999)` until a short page returns; log an error if >10 pages (runaway guard). (4) Gotcha: views need `security_invoker = on` (Postgres 15+) or the security advisor will flag them; RLS on the base table then applies. (5) Verify live: compare sitemap count to a direct `count` query before/after.

**M1-2 · Rotate service-role key; delete legacy secret files (S1) 🟠** — Rotate in Supabase dashboard → update `web/.env.local` + Vercel env vars → redeploy → delete `Club fitting directory claude /club-fitting-directory/.env.local{,.example}` and `Club fitting directory claude /web/.env.local`.
Acceptance: old key returns 401; site + admin + Python upload path work with new key; `grep -r` for the old key over the whole disk tree finds nothing. **Effort: S. Risk: low-medium** — admin approvals and Python scripts break until the new key is in place everywhere; do it in one sitting. Deps: none.
*Implementation sketch:* (1) Supabase → Settings → API → rotate service_role (anon key can stay). (2) Update Vercel env var, redeploy, test `/admin` approve on a dummy submission. (3) Update `web/.env.local`. (4) Delete the three legacy files. (5) Gotcha: project memory documents scripts falling back to reading `web/.env.local` — they'll pick up the new key automatically; nothing else stores it.

**M1-3 · Upgrade Next.js to 16.2.9 + `npm audit fix` (S2) 🟠** — Patch-level upgrade within v16.
Files: `web/package.json`, lockfile. Acceptance: `npm audit` zero high on direct deps; build passes; `/admin`, `/directory`, a listing page, and all three API routes smoke-tested. **Effort: S. Risk: medium** (framework upgrade; patch-range so low expected breakage — CI + smoke tests gate it). Deps: M0-2.
*Implementation sketch:* `npm install next@16.2.9 eslint-config-next@16.2.9`, then `npm audit fix` (non-`--force`), build locally, run the verify pass. Gotcha: prior memory notes the 15→16 bump was itself a security fix; check the release notes for proxy.ts/middleware behavioral changes since the proxy-bypass advisories specifically touch that subsystem.

**M1-4 · Make transient DB failures preserve ISR cache instead of rendering 404 (Q5) 🟠** — Distinguish "query failed" (throw → Next keeps stale page) from "no rows" (→ `notFound()`). Change the four page-level fetch helpers to rethrow on `error` after logging, keeping `null` only for genuine zero-row results.
Files: `web/app/{listing/[slug],state/[state_code],city/[citySlug],category/[type]}/page.tsx`, possibly `lib/utils.ts` (`logQueryError` gains a `rethrow` mode). Acceptance: code review confirms error path throws; simulate by pointing at a bad Supabase URL locally — page render fails loudly instead of 404ing. **Effort: M. Risk: low.** Deps: M0-3.

**M1-5 · Fix admin approval correctness (Q4) + count-error swallow (Q2)** — (a) Align validation: either require `shop_type` at submission or let `approveSubmission` accept null with a default; (b) check `error` on both `review_status` updates and surface failure in the admin UI; (c) destructure and handle the count query's error in `listings.ts:76-80`.
Files: `web/app/admin/actions.ts`, `web/app/api/submit-shop/route.ts`, `web/lib/supabase/queries/listings.ts`. Acceptance: a no-shop-type submission can be approved or is rejected at submit time with a clear message; a forced count failure logs and shows a sane UI. **Effort: M. Risk: low.** Deps: M0-1.

### Milestone 2 — High-leverage improvements

**M2-1 · Rewrite CLAUDE.md and README to match reality (B1, B2, R2)** — Correct routes/files/status; state explicitly: *Supabase is the source of truth; CSVs are historical snapshots; never re-import without a dry-run diff.* Fix README version/Node/setup steps. Move stale CSVs to an `archive/` dir (or delete `golf_directory_MASTER_pre_phase3b.csv`).
Acceptance: every path/route named in CLAUDE.md exists; a new-machine setup following README succeeds. **Effort: M. Risk: none.** Deps: M0-1.

**M2-2 · Rate limiting on login, newsletter, submit (S3)** — Small shared token-bucket keyed by IP (in-memory per-instance is acceptable at this traffic; or Vercel WAF rules for zero code). Login additionally gets a 1s failure delay.
Files: `web/lib/rate-limit.ts` (new), `web/app/admin/actions.ts`, `web/app/api/{newsletter,submit-shop}/route.ts`. Acceptance: >5 login failures/min → 429/delay; >3 newsletter posts/min/IP → 429. **Effort: M. Risk: low.** Deps: M1-3.

**M2-3 · Delete dead query code; finish the ShopCard type migration (Q1, Q3, Q6, Q8)** — Remove the four dead exports (~190 lines) + `ShopFilters`; adopt `ShopCard` as the return type of all card queries, removing the nine casts; move `toCitySlug` to `lib/slugs.ts`; type `applyFilters` properly.
Files: `shops.ts`, `listings.ts`, `shared.ts`, `types/shop.ts`, `structured-data.ts`, card components. Acceptance: `tsc --noEmit` clean with zero `as unknown as Shop` remaining; grep proves no dead exports. **Effort: M. Risk: medium** (wide type ripple — but the compiler finds every site; CI gates it). Deps: M0-2, M0-3, ideally after M1-1 (same file).

**M2-4 · Observability: Vercel Analytics + Sentry (O1)** — `@vercel/analytics` one-liner in `layout.tsx`; Sentry via the Next wizard for server + client errors.
Acceptance: page views visible in Vercel; a test error appears in Sentry. **Effort: S–M. Risk: low.** Deps: M0-1.

**M2-5 · Python pipeline hygiene (P1–P4, R3)** — Add `requirements.txt` (pinned); fix `enrich_new_shops.py` to verify the PATCH matched a row (`Prefer: return=representation` or a follow-up count); archive the original `golf_directory_MASTER.csv` + original scripts out of the 962 MB legacy folder, then delete the folder (after M1-2 removed its secrets); delete or archive the dead one-shot scripts.
Acceptance: legacy folder gone; `pip install -r requirements.txt` + a dry-run of `upload_new_shops.py` works; ~960 MB disk reclaimed. **Effort: M. Risk: low** (archive before delete). Deps: M1-2.

### Milestone 3 — Quality & polish

| ID | Task | Effort | Risk | Deps |
|---|---|---|---|---|
| M3-1 | Random-token admin session (HMAC w/ separate secret) replacing sha256(password) cookie (S4) | M | low | — |
| M3-2 | `normalizeWebsiteUrl()` util replacing 4× duplication (Q7) | S | none | — |
| M3-3 | JSON-LD: business website → `url`, listing page → `mainEntityOfPage` (Q10) | S | low | — |
| M3-4 | Build-time fan-out reduction: shared card-data fetch for generateStaticParams paths; fix per-route opengraph-image refetch (F4) | L | medium | M1-1 |
| M3-5 | Switch search to the existing FTS RPC + trigram index when shop count or search latency warrants (F5) | L | medium | deferred by design |
| M3-6 | Guides nits: move `headingId` to `lib/`, drop pointless `revalidate` on compiled-in content | S | none | M0-1 |

### Suggested sequence
Week 1: QW-1…6, M0-1, M0-2, M1-2, M1-3 → Week 2: M0-3, M1-1, M1-4, M1-5 → Week 3: M2-1…M2-5 → then M3 opportunistically.

---

## Open Questions (need a human decision)

1. **Shop type at submission (M1-5):** should `shop_type` become a required field on the public submit form, or should approvals default untyped submissions to a catch-all category? (Product decision — affects form friction vs. admin workload.)
2. **Legacy folder disposal (M2-5):** OK to delete the 962 MB `Club fitting directory claude /` folder entirely after archiving `golf_directory_MASTER.csv` + the original enrichment scripts to a single zip? Anything in there you still want?
3. **CSV archival policy:** keep the three root CSVs as tracked history, move to `archive/`, or delete? (They're 1.9 MB and no longer authoritative.)
4. **Rate-limit posture:** in-route limiter (free, per-instance, resets on deploy) vs. Vercel WAF rules (dashboard-managed, no code) — preference?
5. **Growth target:** how many shops do you expect within 12 months? At ~5k+, M3-4/M3-5 (build fan-out, FTS) move from "deferred" to "scheduled."
6. **Monetisation timing:** if featured listings are coming soon, the admin area grows — that would raise M3-1 (proper sessions) and S5 (CSP) in priority.

---

*Lighter-review areas: individual guide article content files (structure reviewed, prose not), `docs/inspiration-care-com.md`, the legacy folder's old app copies (checked for secrets only), and visual/UI quality (out of scope). Everything else received file-level review.*
