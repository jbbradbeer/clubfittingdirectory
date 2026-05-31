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
- [ ] H5. Async race in `DirectoryClient`: overlapping `getListings` fetches, last-to-resolve wins
      → stale results can clobber correct ones. Add sequence guard / AbortController.
- [ ] H6. Homepage "Near me" link `/directory?near=1` does nothing (param never read).

### Medium — correctness & SEO
- [ ] M1. `getShopBySlug` uses `.single()` → 500 if two active rows share a slug. Use `.maybeSingle()`.
- [ ] M2. City page breadcrumb JSON-LD is wrong (reuses shop schema → broken level-4 link).
- [ ] M3. Sitemap lists category URLs that 404 when a shop_type has zero active shops.
- [ ] M4. `aggregateRating` emitted without `reviewCount` → Google flags invalid structured data.
- [ ] M5. URL/state desync: filters init from URL only at mount → browser Back/Forward leaves UI stale.
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
- [ ] Phase 2 — Correctness (H5, H6, M1, M5): fetch race, Near-me link, maybeSingle, URL sync.
- [ ] Phase 3 — SEO correctness (M2, M3, M4): breadcrumb, sitemap 404s, aggregateRating.
- [ ] Phase 4 — Robustness & polish (M6, M7, L1–L8): lint config, map safety, a11y, dedupe, CSP.

## Review
(to be filled in after implementation)
