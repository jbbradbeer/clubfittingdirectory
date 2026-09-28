# Codebase Bug Audit & Remediation Plan (2026-05-31)

## Senior-engineer audit + fixes — 2026-09-28

Branch `fix/audit-2026-09`. Three read-only audits (web app, DB/data layer, recurring
processes); full findings + tiers in `~/.claude/plans/evaluate-this-project-for-snug-meadow.md`.
Founder chose: Tier 1 + Tier 2 code fixes now, Tier 3 (ops/process) as backlog.

### Tier 1 — shipped
- [x] Featured badge/sort survived expiry forever → `getShopTag` no longer trusts `is_featured`;
      `lapseFeaturedShop` (one path: admin button, Stripe `customer.subscription.deleted`,
      daily cron sweep); activation now filters `status='active'`.
- [x] New `GET /api/cron/daily` (vercel.json cron 06:00 UTC, `CRON_SECRET`): expiry sweep,
      un-notified lead retry, `crawler_hits` 90-day prune.
- [x] Portal magic-link `ilike` wildcard hole (`%@%` matched every claimed shop) → LIKE-escaped + validated.
- [x] JSON-LD `<` escape (script breakout via scraped shop name).
- [x] `proxy.ts` crawler logging: Googlebot/Bingbot no longer logged; 60s per-bot+path dedupe.
- [x] Owner edit clearing a field → NOT NULL violation jammed the batch silently → null deletes the
      owner fact; approve action returns the error inline.
- [x] `/api/revalidate`: `/map` refresh, case-insensitive `/repair`, timing-safe secret + rate limit;
      path logic moved to `lib/revalidate-paths.ts` (tested).
- [x] Sitemap rethrows on query failure / refuses empty slug list.

### Tier 2 — shipped
- [x] Migration `019_indexes_and_retention.sql` (trigram + composite indexes, drop dup index, optional pg_cron prune).
- [x] Migration `020_fitting_requests_notified.sql` (`notified_at`, `notify_attempts`).
- [x] Listing page "nearby" is now by distance (state fallback when no coords).
- [x] Homepage Top Rated carousel uses the badge's 25-review floor; `searchShops` stable tiebreaker.
- [x] City page falls back to full-state query when the prefix narrowing finds nothing.
- [x] Category subtitle excludes DC from the state count; `generateStaticParams` returns param keys only.
- [x] `sanitizeSearchTerm` capped at 80 chars; lint ref-cleanup warning fixed.
- [x] Migrations 001/002/007/009 policies made re-runnable (`DROP POLICY IF EXISTS`).

### Owner actions to go live
- [ ] Run `web/supabase/019_indexes_and_retention.sql` then `020_fitting_requests_notified.sql` in Supabase SQL editor.
- [ ] Vercel env: add `CRON_SECRET` (`openssl rand -hex 32`) — the cron refuses to run without it.
- [ ] Stripe dashboard → webhook → add events `customer.subscription.deleted` and `invoice.payment_failed`.
- [ ] Merge PR, deploy with `vercel --prod` (git auto-deploy still broken — Tier 3 item A).
- [ ] Confirm the Supabase revalidate webhook is actually wired (`tasks/wire-revalidation-webhook.md` checklist is unticked).

### Tier 3 backlog (not started)
CI deploy job + `.next/cache`; auto-disable revalidate trigger in `push_*_facts.py` + batch IndexNow;
rewrite `outreach/README.md` (says Gmail drafts, code sends via AgentMail) + cron `check_replies.py`;
enrichment `--resume` + rate limit; `scripts/_common.py`; `AGENTS.md` symlink + CLAUDE.md route fixes;
admin cookie HMAC expiry; `.gitignore` `audit-issues.json`, `.codex/`.

## Shop assistant product design — 2026-09-18

- [x] Review existing directory and owner-portal planning context.
- [x] Design a starter product for a typical independent fitter using explicit assumptions.
- [x] Define first-release scope, owner screens, automation boundaries, pilot checks, and later additions.
- [x] Founder review of the proposed product scope (approved 2026-09-18).
- [x] Save staged directory integration roadmap in `tasks/shop-assistant-integration-plan.md`.
- [x] Incorporate founder correction: standalone platform; directory is an optional connector. Current roadmap: `tasks/standalone-booking-platform-plan.md`.
- [ ] Establish separate product workspace, then write stage-specific technical plans starting with business accounts and hosted booking intake.

Review: proposal saved in `tasks/shop-assistant-product-design.md`. Documentation only; no application changes. Calendar provider and pricing remain decisions for pilot discovery, not unsupported compatibility or revenue promises.

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
- FOLLOW-UP: /admin review page — DONE + DEPLOYED 2026-06-02. Password gate (ADMIN_PASSWORD) +
  service-role key (SUPABASE_SERVICE_ROLE_KEY), both server-only env vars in Vercel. proxy.ts edge
  gate + page-level isAdmin() (constant-time hash, httpOnly cookie). One-click approve promotes a
  submission into shops as active; reject marks rejected. /admin noindex + robots-disallowed.
  Verified live: /admin → 307 login, forged cookie no leak, login form renders.
  Access: clubfittingdirectory.com/admin → log in with ADMIN_PASSWORD.

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

---

# BOOKING ENGINE PLAN — "Request a Fitting" (started 2026-06-27)

## Strategy & decisions (locked with founder)
- **Booking type:** Request-to-book (lead form). NOT live calendars. Golfer submits a request;
  shop is contacted to confirm. Fastest path to revenue, no shop-side calendar maintenance.
- **Shop accounts:** None yet. No shop logins in MVP.
- **First milestone:** PROVE DEMAND FAST. Ship the request flow, measure real golfer intent.
- **Monetization (later, layered):** per-lead/per-booking fee → monthly subscription (+Verified
  badge) → featured/premium placement. NOT building payments now.

## Key constraint discovered
- The `shops` table has `phone` + `website` but **NO email column**. So we cannot auto-email a
  shop the lead on day one. → MVP is a **concierge model**: every request saved to DB + emailed to
  the FOUNDER (jamesbradbeer3@gmail.com), who manually relays it to the shop (and collects the
  shop's email in the process). This is intentional "do things that don't scale" — it also starts
  the shop relationship we will monetize. Auto-shop-notify is a later phase once we have emails.

## Reusable patterns already in the codebase (clone these, don't reinvent)
- DB-insert form pattern: `web/app/api/submit-shop/route.ts` (validation + honeypot + insert).
- Quarantined insert-only table w/ RLS: `web/supabase/002_shop_submissions.sql`.
- Admin review dashboard (password gate + service-role): `web/app/admin/` + `web/lib/admin-auth.ts`
  + `web/lib/supabase/admin.ts`. Booking requests get an analogous admin view.
- Server Supabase clients: `createClient()` (anon/RLS) vs `createAdminClient()` (service role).
- Listing page CTA home: contact card sidebar in `web/app/listing/[slug]/page.tsx` (~lines 279-337).

## PHASE 1 — Capture & deliver requests (the MVP)  [CODE DONE 2026-06-28]
- [x] 1.1 DB schema written: web/supabase/003_fitting_requests.sql (table + RLS anon INSERT-only,
      mirrors shop_submissions; shop_id FK ON DELETE SET NULL; status new/contacted/booked/closed).
      ⚠ STILL TO RUN on the live Supabase DB (owner action below).
- [x] 1.2 API route: web/app/api/request-fitting/route.ts. Validates (name, email, fitting_type +
      preferred_time whitelists), honeypot, inserts via createClient() (anon RLS). Registered as ƒ.
- [x] 1.3 Email-to-founder: `resend` installed; web/lib/email.ts notifyNewFittingRequest() — BEST
      EFFORT (save happens first; if RESEND_API_KEY unset it logs + skips, never blocks the lead).
      Defaults to Resend test sender → founder inbox. ⚠ Needs RESEND_API_KEY (owner action).
- [x] 1.4 UI: components/booking/RequestFittingButton.tsx — gold CTA opens an accessible modal
      (Esc/backdrop close, scroll lock, focus first field) with the full form + success state.
- [x] 1.5 Wired: RequestFittingButton is now the primary (gold) CTA in the listing contact card;
      old "Visit Website" demoted to white outline so there's one clear primary action.
- [x] 1.6 Golfer confirmation: in-modal "Request sent" success screen.
- [x] 1.7 Verify (code): tsc clean, eslint clean, full build OK (1,271 listing pages), route ƒ
      registered. ⚠ Live end-to-end (insert→email) pending DB migration + Resend key.

### OWNER ACTIONS to go live — ALL DONE ✅ (LIVE 2026-06-28)
- [x] A. Ran 003_fitting_requests.sql in Supabase.
- [x] B. Added RESEND_API_KEY in Vercel + redeployed.
- [x] C. Verified live: production POST → lead saved in DB + founder confirmed email received.
      Deployed via merge of feature/booking-engine → main (commit 4085709). PHASE 1 COMPLETE.
- [ ] Housekeeping: run `DELETE FROM public.fitting_requests WHERE notes LIKE '%__VERIFY_TEST__%';`
      in Supabase to clear test rows (3 left from verification).

## PHASE 2 — Measure & operate (no/low code)
- [ ] 2.1 Admin view of fitting_requests (clone /admin submissions list): see leads, mark status.
- [ ] 2.2 Track conversion: how many listing views → requests. (Vercel Analytics is already a
      pending item — good moment to add it.)
- [ ] 2.3 Founder works leads manually; collect shop emails; note which shops want the leads.

## PHASE 3 — Monetize (only after demand is proven)
- [ ] 3.1 Per-lead: simple billing/agreement; "first N free, then $X/lead".
- [ ] 3.2 Subscription + Verified badge: needs shop accounts/dashboard (revisit paused claim-shop
      plan, see memory). Shops log in, see their leads, set preferences.
- [ ] 3.3 Featured/premium placement: paid ranking + badges in search/listings.
- [ ] 3.4 (Optional, last) auto-notify shops by email once we have addresses; later, real calendars
      for top shops (the "hybrid" upgrade).

## Review
- (to be filled in after Phase 1 ships)
