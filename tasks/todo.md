# Codebase Bug Audit & Remediation Plan (2026-05-31)

Context: Live site was down because Supabase env vars were missing on Vercel (fixed by
adding them to Vercel + redeploy). Audit run afterward across data layer, pages, components,
and config. Work organized into phases (bug fixes) + SEO batches. Domain clubfittingdirectory.com
is now live.

## Bug-fix phases

- [x] Phase 1 — Resilience & visibility (H1–H4): DONE + DEPLOYED. Env guard
      (`web/lib/supabase/env.ts`, throws loudly on missing vars), `logQueryError()` on every
      data fetch, visible search error+retry, fake homepage stats removed.
- [x] Phase 2 — Correctness (H5, H6, M1, M5): DONE + DEPLOYED. Fetch race guard (fetchSeq),
      homepage Near-me link (?near=1), getShopBySlug limit(1) (no 500 on dup slug), Back/Forward
      URL sync. BONUS: switched public read-only queries in shops.ts to createStaticClient() →
      /listing, /city, /state, /category now truly static (● not ƒ); cleared 2,001 build errors.
- [x] Phase 3 — SEO correctness (M2, M3, M4): DONE + DEPLOYED. City breadcrumb schema (3-level),
      sitemap excludes empty categories, valid aggregateRating (only with reviewCount).
- [x] Phase 4 — Robustness & polish (M6, M7, L1–L8): DONE (deploying).
      M6 lint: added eslint.config.mjs (native flat config from eslint-config-next; FlatCompat threw
        circular-JSON against this version). `npm run lint` now works & is clean.
      M7 maps: MapViewLeaflet uses != null (keeps lat/lng 0), shows "no mappable results" empty state.
      L1 HeroSearch: AbortController aborted on cleanup; res.ok checked before json(); aborted guards.
      L2: added ShopCard type in shared.ts (card queries no longer pretend to be full Shop).
      L3 RatingStars: clipPath id from useId() (no duplicate DOM ids).
      L4 a11y: htmlFor/id on State select + rating slider; aria-label on rating + sort selects.
      L5 dedupe: CARD_FIELDS/sanitizeSearchTerm/DirectoryFilters/DirectoryResult → lib/.../shared.ts.
      L6 CSP: removed dead Google frame-src + gstatic font-src; tightened img-src to OSM tiles.
      L7 open-today: extracted ShopHours client component; "today" read client-side via
        useSyncExternalStore (no build-time staleness, no hydration mismatch, lint-clean).
      L8 slug collisions: getShopsForCityPage filters by slug (groups "St. Louis"/"St Louis"), and
        display name comes from a shop in that city, not an arbitrary state shop.
      Verified: tsc clean, lint clean, build 0 errors (1,725 pages), affected pages HTTP 200.

## SEO improvement batches (post-audit, beyond bug fixes)

- [x] Batch A — Structured data & canonicals: DONE (deploying). WebSite+SearchAction &
      Organization JSON-LD on homepage; ItemList JSON-LD on state/city/category pages; canonicals
      added to homepage, /directory, /states; /directory title strengthened. SITE_DESCRIPTION added
      to constants. Verified: tsc + build pass (0 errors), JSON-LD validates on all page types.
- [x] Batch B — Social sharing previews: DONE (deploying). Added shared renderOgImage() helper
      (lib/og-image.tsx, brand forest/gold card) + dynamic opengraph-image.tsx at root, listing,
      state, city, category (each with route-specific title/eyebrow). Per-listing openGraph metadata.
      Generated favicon via app/icon.tsx (CF monogram). Removed dead /og-image.png ref from layout.
      Verified: tsc + build pass (0 errors); OG routes render valid 1200x630 PNGs (HTTP 200);
      og:image + icon meta tags emitted correctly.
- [x] Batch C — Content depth & sitemap accuracy: DONE (deploying). Added lib/seo-content.ts
      (location/category-specific intro copy + FAQs) and components/seo/FaqSection.tsx (visible FAQ +
      matching FAQPage JSON-LD from one source). Wired intro + FAQ into state/city/category pages.
      Sitemap: getAllShopSlugs() now returns updated_at; listing lastmod uses real per-shop dates
      (currently all 2026-05-28 since shops were migrated together — but no longer churns per rebuild).
      Verified: tsc + build pass (0 errors, 1,725 routes); FAQPage schema (4 Q) + intro + visible FAQ
      on all 3 collection types; sitemap lastmod = real data date.

## Owner action items (not code)
- [x] Vercel domain: DONE (2026-06-01). Flipped so clubfittingdirectory.com (non-www) is Production
      (200, no redirect) and www → 307 → non-www. Now matches all canonicals/sitemap/JSON-LD. (307
      not 308 — fine; could upgrade to permanent later but negligible.)
- [ ] Submit sitemap (https://clubfittingdirectory.com/sitemap.xml) in Google Search Console.
- [ ] PARKED (low severity): public anon key can write to PostGIS `spatial_ref_sys` (no app data —
      just standard coordinate-system constants; `shops` is fully secure, maps work). Can't fix via
      SQL on this plan (table owned by PostGIS → REVOKE reports success but no-ops, ALTER errors
      "must be owner"). Needs Supabase support to lock server-side. Safe to leave meanwhile.

## Feature: Submit a Shop (grow the data) — DONE (deploying) 2026-06-02
- New quarantined table `shop_submissions` (web/supabase/002_shop_submissions.sql, run on live DB):
  RLS insert-only for anon (verified live: INSERT 201, SELECT/UPDATE/DELETE all 401). Owned table,
  so RLS actually applies (unlike spatial_ref_sys).
- `/submit` page + SubmitShopForm (forest/gold design, honeypot spam guard).
- `/api/submit-shop` route: server validation (name/city/state required, US state + shop_type
  whitelist, email format), honeypot returns before insert. Verified: valid→ok, missing/bad→400,
  honeypot→fake-ok-no-insert.
- Links: footer Quick Links, contact page "List your shop" card, sitemap (/submit).
- NOTE: a few test rows (__VERIFY_TEST__, __APITEST__) left in shop_submissions — owner can delete.
- FOLLOW-UP (noted, not built): /admin review page to approve/reject submissions + promote to shops.
  Approval is manual in Supabase table editor for now.

## Findings reference (severity)
- H1 env guard ✅ / H2 silent catches ✅ / H3 fake stats ✅ / H4 search error state ✅
- H5 fetch race ✅ / H6 near-me link ✅ / M1 single() crash ✅ / M5 URL sync ✅
- M2 city breadcrumb ✅ / M3 sitemap 404s ✅ / M4 aggregateRating ✅
- Phase 4 remaining: M6 lint, M7 maps, L1 HeroSearch, L2 ShopCard type cast, L3 RatingStars id,
  L4 a11y labels, L5 dedupe shared code, L6 CSP cleanup, L7 open-today staleness, L8 slug collisions.

## Verified OK (no action)
- TypeScript typecheck passes. Dynamic params awaited everywhere. Internal /state/ links consistent.
- Maps load. sanitizeSearchTerm mitigates ilike injection. Pagination range correct.
- One h1 per page. robots.txt correct. metadataBase set.
