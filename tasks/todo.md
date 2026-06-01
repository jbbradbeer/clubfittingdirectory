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
- [ ] Phase 4 — Robustness & polish (M6, M7, L1–L8): lint config, map SSR safety + "no mappable
      results" state + lat/lng 0 truthiness, HeroSearch abort/res.ok, RatingStars dup clipPath id,
      a11y labels (sort select, filter controls), dedupe CARD_FIELDS/sanitize/DirectoryFilters,
      CSP dead/permissive entries, "open today" staleness, city slug collisions.

## SEO improvement batches (post-audit, beyond bug fixes)

- [x] Batch A — Structured data & canonicals: DONE (deploying). WebSite+SearchAction &
      Organization JSON-LD on homepage; ItemList JSON-LD on state/city/category pages; canonicals
      added to homepage, /directory, /states; /directory title strengthened. SITE_DESCRIPTION added
      to constants. Verified: tsc + build pass (0 errors), JSON-LD validates on all page types.
- [ ] Batch B — Social sharing previews: og-image is referenced but MISSING (broken previews on
      every share). Add dynamic opengraph-image.tsx (root + per listing/state/city) via ImageResponse;
      per-listing openGraph metadata; favicon (app/icon.png) + apple-icon.
- [ ] Batch C — Content depth & sitemap accuracy: thin city/state/category pages → add templated
      intro copy + FAQPage schema; sitemap lastModified should use each shop's real updated_at, not
      build time.

## Owner action items (not code)
- [ ] Vercel domain: both apex (clubfittingdirectory.com) and www currently serve 200 with no
      redirect. Set the apex (non-www) as PRIMARY so www redirects to it — matches all canonicals,
      sitemap, and JSON-LD (which use non-www). One toggle in Vercel → Settings → Domains.
- [ ] Submit sitemap (https://clubfittingdirectory.com/sitemap.xml) in Google Search Console.

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
