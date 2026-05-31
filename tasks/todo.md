# Codebase Bug Audit & Remediation Plan (2026-05-31)

Context: Live site was down because Supabase env vars were missing on Vercel (now fixed
by adding them + redeploy). Audit run afterward across data layer, pages, components, and
config. Findings below, grouped by severity. Plan organized into phases.

## Findings

### Critical / High — resilience & visibility (this is the class of bug that caused today's outage)
- [x] H1. No env-var guard → ADDED `web/lib/supabase/env.ts` (validates + throws loudly at build/import);
      `client.ts`/`server.ts` now use it instead of `process.env...!`.
- [x] H2. Silent error swallowing → ADDED `logQueryError()` in `lib/utils.ts`; routed every page-level
      `.catch` (page, listing, state, category, city, directory, states, sitemap, api/search) through it.
- [x] H3. Homepage fake-stats fallback → removed; falls back to 0 + logs, and hero/trust line render
      honest copy (no numbers) when stats unavailable (`hasStats` guard).
- [x] H4. Search error state → `DirectoryClient` now tracks `loadError`, logs the failure, and shows a
      distinct "Couldn't load listings — Try again" state in `ResultsGrid` (vs "No results found").
- [x] H5. Async race in `DirectoryClient` → added `fetchSeq` ref; only the latest request writes
      results / clears loading. Stale responses are ignored. (Phase 2)
- [x] H6. Homepage "Near me" link `/directory?near=1` → `DirectoryClient` now reads `near=1` on mount
      and auto-triggers `handleNearMe()`. (Phase 2)

### Medium — correctness & SEO
- [x] M1. `getShopBySlug` `.single()` → replaced with `.order(rating).limit(1)` + `data?.[0] ?? null`:
      never 500s on duplicate slugs, returns null for no rows. (Phase 2)
- [x] M2. City breadcrumb → added `buildCityBreadcrumbSchema()` (Home > State > City, 3 levels);
      city page uses it instead of the shop schema. Verified: clean 3-level JSON-LD, no /listing link. (Phase 3)
- [x] M3. Sitemap category 404s → sitemap now fetches `getShopTypeCounts()` and only emits categories
      with count > 0. Verified via /sitemap.xml. (Phase 3)
- [x] M4. `aggregateRating` → now emitted only when BOTH rating > 0 AND reviews > 0, and always
      includes `reviewCount`. Verified valid JSON-LD on a real listing. (Phase 3)
- [x] M5. URL/state desync → `DirectoryClient` now re-syncs controls from `searchParams` (guarded
      functional setState, no feedback loop) so Back/Forward updates the UI. (Phase 2)
- [ ] M6. ESLint broken (no flat config) → `npm run lint` errors, zero coverage.
- [ ] M7. Leaflet `new L.Icon` at module top level (SSR-fragile) + lat/lng `0` truthiness drop +
      no "no mappable results" empty state.

### Low — polish / robustness
- [ ] L1. `HeroSearch`: abort not run on cleanup; `res.ok` not checked before `res.json()`.
- [ ] L2. `as unknown as Shop` cast hides that `CARD_FIELDS` omits many required Shop fields.
- [ ] L3. Duplicate SVG `clipPath id="halfClip"` in `RatingStars` (invalid dup DOM ids).
- [ ] L4. Accessibility: sort `<select>` + filter controls lack associated labels / aria-label.
- [ ] L5. Duplicated `CARD_FIELDS`/`sanitizeSearchTerm`/`DirectoryFilters` across shops.ts & listings.ts.
- [ ] L6. CSP dead/permissive config: unused `frame-src` Google + `fonts.gstatic.com`; broad `img-src https:`.
- [ ] L7. "Open today" computed at build w/ `revalidate=86400` → can be up to a day stale.
- [ ] L8. City slug collisions (e.g. "St. Louis" vs "St Louis") can merge listings.

### Verified OK (no action)
- TypeScript typecheck passes (0 errors). Dynamic `params` correctly awaited everywhere.
- Internal state links consistent (`/state/xx` singular). Maps DO load (img-src https: wildcard).
- `sanitizeSearchTerm` properly mitigates ilike injection. Pagination range correct.

## Plan (phased)

- [x] Phase 1 — Resilience & visibility (H1–H4): DONE. Env guard, logging on all data fetches,
      visible search error+retry, fake stats removed. Typecheck passes; homepage/listing/directory
      verified HTTP 200 locally with real data (homepage now shows real 1,000 count, not fake 1,049).
- [x] Phase 2 — Correctness (H5, H6, M1, M5): DONE. Fetch race guard, Near-me link, limit(1) slug
      lookup, Back/Forward URL sync. BONUS (surfaced by Phase 1 logging — build threw 2,001
      "Dynamic server usage" errors): switched the public read-only queries in shops.ts from the
      cookie-based `createClient` to the cookie-free `createStaticClient`. App has no auth, so cookies
      were never needed; this makes /listing, /city, /state, /category pages truly STATIC (● not ƒ) —
      faster + better SEO — and clears the build errors. Typecheck + build pass; `next start` serves
      listing/home/directory/city/state all HTTP 200.
- [x] Phase 3 — SEO correctness (M2, M3, M4): DONE. City breadcrumb schema, sitemap excludes empty
      categories, valid aggregateRating. Typecheck + build pass (0 errors, 1,723 pages); JSON-LD and
      sitemap output verified against the production server.
      NOTE (not a code bug, for the owner): SITE_URL / canonical URLs point to
      https://clubfittingdirectory.com but that domain wasn't resolving in testing — confirm the
      custom domain is connected in Vercel + DNS, else Google is pointed at a dead host.
- [ ] Phase 4 — Robustness & polish (M6, M7, L1–L8): lint config, map safety, a11y, dedupe, CSP.

## Review
(to be filled in after implementation)
