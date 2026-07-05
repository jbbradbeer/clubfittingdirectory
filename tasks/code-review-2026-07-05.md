# Codebase Review — 2026-07-05

Three-lens review (correctness, performance/cost, security) after SEO engine v2
+ analytics events shipped. Every finding verified at file:line by the
reviewer before inclusion. Overall verdict: **healthy** — 1 high, 6 medium,
rest low. The ISR-cost discipline, input hardening, admin auth layering, and
fetchAllRows usage were all independently confirmed solid.

## Priority 1 — fix now

1. **HIGH (correctness): transient DB errors become 30-day cached 404s.**
   All ISR pages (`app/listing/[slug]`, `city`, `state`, `category`,
   `repair`) do `.catch(→ null)` then `notFound()`. A momentary Supabase blip
   during regeneration caches a 404 for the full 30-day window — a healthy
   page vanishes from the site and Google for up to a month. Fix: re-throw on
   query error (ISR then keeps serving the last good page); `notFound()` only
   for a successful empty result. One shared pattern, 5 files.

2. **MEDIUM (security): HTML injection into the founder lead email.**
   `web/lib/email.ts:62,79` — `listingUrl` is built from attacker-controlled
   `shop_slug` (via `/api/request-fitting`) and interpolated unescaped into
   the notification email; every other field is correctly escaped. Enables
   phishing links that look like they come from our own system. Fix: validate
   slug `/^[a-z0-9-]+$/` + escapeHtml.

3. **MEDIUM (security): no rate limit on admin login** (`app/admin/actions.ts:13`).
   Password check is constant-time but brute-forceable at network speed, and
   admin = service-role DB access. Fix: `rateLimitOk()` on login (5/15min).
   Also confirm ADMIN_PASSWORD is long + random (owner action).

4. **MEDIUM (correctness): the revalidate webhook never refreshes `/repair`**
   (`app/api/revalidate/route.ts` pathsForShop). Repair shop changes stay
   stale up to 30 days on the new page. Fix: add `/repair` when the row's
   services contains a SERVICE_FILTERS value (or on INSERT/DELETE).

## Priority 2 — fix soon (small, contained)

5. **MEDIUM (correctness): typing a search doesn't reset pagination**
   (`DirectoryClient.tsx`) — user on page 3 types a new query, sees "no
   results" for matches that exist. Fix: setPage(1) when debouncedQuery changes.
6. **MEDIUM (security): no rate limit on `/api/submit-shop` + `/api/newsletter`**
   — junk-flood of the admin queue / beehiiv subscription-bombing. Fix: same
   `rateLimitOk()` guard the other routes already use.
7. **MEDIUM (perf/cost): 4 `opengraph-image.tsx` routes are uncached** — every
   social/AI crawler fetch runs a satori render + DB query. The one remaining
   per-request cost path that scales with crawler traffic (same class as the
   old ISR incident). Fix: `export const revalidate = 2592000` in each (4 lines).
8. **LOW/MEDIUM (SEO): `/state/TX` renders as a duplicate page with uppercase
   self-canonical** (`app/state/[state_code]/page.tsx:34-48`). Fix: lowercase
   the canonical (or redirect non-lowercase).

## Priority 3 — when convenient

9. Build-time N+1: per-listing verification query (~1,267 calls/build) —
   batch behind a module-level memo (`lib/supabase/queries/provenance.ts`).
10. `searchShops` missing `.order("id")` tiebreaker (`shops.ts:361-368`) —
    CDN-cached suggestions can flicker.
11. `listing_open` fires on any click inside the card, inflating the metric
    (`ResultsGrid.tsx:127`) — gate on `closest("a")`.
12. Dead code w/ latent bug: `getShops` + `getDirectoryStats` (no callers;
    the latter re-introduces the DC "51 states" bug if ever wired) — delete.
13. Directory page 1 could be server-rendered into the shell (LCP win).
14. Services filter uses seq-scan ilike; fine at 1.3k rows — switch to
    `services_array.cs.{}` (existing GIN index) if the table grows 20x.
15. Leaflet chunk loads on every listing view — IntersectionObserver gate.
16. Rate limiter is per-instance and fails open at 10k buckets (documented
    tradeoff) — move to Upstash only if lead spam actually appears.

## Verified clean (checked, not assumed)

- Service-role key never reaches the client; RLS assumptions hold.
- `?services=` PostgREST injection: sanitized (structural chars stripped).
- `/api/revalidate` missing-secret behavior = 500 (not allow-all); IndexNow
  ping can't be aimed at foreign hosts.
- No secrets in git history; .gitignore covers all key files.
- No `new Date()` in server output; all `revalidate` values static literals;
- `q`+services `.or()` interplay ANDs correctly; URL-sync loop can't ping-pong.
- Zero image-optimization spend; lucide tree-shaken; maps are lazy Leaflet+OSM.
