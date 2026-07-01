# Phase 0 — Stable, Instrumented Base

**Objective:** Make the current system cheap, observable, and safe to build on.
**Deliverable:** A stable, instrumented base with controlled revalidation cost.

**Decisions made (2026-06-30):**
- Observability: **Vercel-native only** (no Sentry for now).
- Supabase webhook: I build/verify code; James does dashboard clicks with my guide.
- Execution: **Plan, approve each chunk** — revalidation first.

---

## Audit summary (what already exists)

- All dynamic routes are statically generated (`generateStaticParams`) with 30-day `revalidate`. ✅
- On-demand endpoint `/api/revalidate` exists (Bearer-auth via `REVALIDATE_SECRET`, surgical path logic). ✅
- CI exists: `.github/workflows/ci.yml` runs `tsc --noEmit`, `lint`, `test` on every PR + push to main. ✅
- Schema: 3 tables (`shops`, `shop_submissions`, `fitting_requests`), PostGIS + FTS, RLS locked down. ✅
- Observability: **none** (no Sentry, no Vercel Analytics, no structured logging). ❌
- Homepage `revalidate = 3600` (hourly clock — only remaining time-based leak). ⚠️
- `about`, `contact`, `submit`, `newsletter` pages have no `revalidate` → render dynamically. ⚠️
- Supabase webhook + `REVALIDATE_SECRET` may not be wired up (noted as "still owed"). ⚠️
- CI does not run `next build`. ⚠️

---

## Chunk A — Revalidation economics (cost)  ✅ CODE DONE (1 owner action left)
- [x] A1. Code verified (endpoint correct, typechecks). `REVALIDATE_SECRET` confirmed MISSING — documented in `.env.local.example`; secret generated; wiring guide → `tasks/wire-revalidation-webhook.md`. **Owner action: do those dashboard clicks.**
- [x] A2. Homepage hourly clock removed: `revalidate` 3600 → 2592000 (30-day safety net). Webhook now also refreshes `/` when a shop's `rating` or `is_featured` changes.
- [x] A3. Verified `about`/`contact`/`submit`/`newsletter` are ALREADY static (no dynamic data). No change needed — audit's "defaults to dynamic" was incorrect.
- [x] A4. DECISION: keep path-based `revalidatePath` (already surgical + meets cost goal). Tags deferred to a later phase.

## Chunk B — Observability (Vercel-native)  ✅ CODE DONE (owner toggles left)
- [x] B1. `@vercel/analytics` + `@vercel/speed-insights` installed + rendered in `app/layout.tsx`. **Owner: enable both in Vercel dashboard (guide below).**
- [x] B2. Structured logger `lib/logger.ts` (JSON in prod, readable in dev). Wired into all API routes, `lib/email.ts`, `logQueryError`, `fetchAllRows`. Added `app/global-error.tsx`; `error.tsx` now reports caught errors.
- [x] B3. Slow-query visibility documented (Supabase Query Performance report + optional log_min_duration_statement). Guide: `tasks/observability-setup.md`.
- Verified: `tsc --noEmit` exit 0; `eslint` 0 errors (1 pre-existing warning, unrelated).

## Chunk C — Schema provenance audit (document)  ✅ DONE
- [x] C1. Wrote `docs/schema-provenance.md`: full table catalogue; classified `shops` columns into A (internal), B (multi-source Phase 1 targets: address/geo, hours, services, contact, ratings, classification), C (new fields to add: brands fitted, launch monitor, ownership type). Includes a provenance-model design sketch + Phase 1 priority order. Noted `services_source` as the existing provenance precedent.

## Chunk D — CI completeness  ✅ CODE DONE (owner secrets left)
- [x] D1. Added `Build` step to `.github/workflows/ci.yml` (needs PUBLIC Supabase creds via GitHub secrets — `fetchAllRows` throws, so build requires a reachable DB). Added `typecheck` npm script; CI now calls `npm run typecheck`. **Verified: full `npm run build` passes locally (1,271 listings + all pages prerendered, 30d windows confirmed).** Owner: add 2 GitHub secrets (guide: `tasks/ci-setup.md`).
- [x] D2. Documented Vercel preview-deploy verification in `tasks/ci-setup.md` (on by default).

---

## Review / results

**Status: Phase 0 code complete (2026-06-30). All 4 chunks done. Verified: `tsc` ✓, `eslint` ✓ (1 pre-existing warning), full `npm run build` ✓.**

Files changed (all uncommitted working-tree changes):
- `web/app/page.tsx` — homepage revalidate 3600 → 2592000 (kill hourly clock)
- `web/app/api/revalidate/route.ts` — refresh `/` on rating/featured UPDATE
- `web/.env.local.example` — documented `REVALIDATE_SECRET`
- `web/app/layout.tsx` — Vercel Analytics + Speed Insights
- `web/lib/logger.ts` — NEW structured logger
- `web/lib/utils.ts`, `web/lib/email.ts`, `web/lib/supabase/queries/shared.ts`, `web/app/api/{request-fitting,newsletter,search,submit-shop,revalidate}/route.ts` — use structured logger
- `web/app/error.tsx` — reports caught errors; `web/app/global-error.tsx` — NEW last-resort boundary
- `web/package.json` — `typecheck` script
- `.github/workflows/ci.yml` — `Build` step
- `docs/schema-provenance.md` — NEW Phase 0 deliverable
- Guides: `tasks/wire-revalidation-webhook.md`, `tasks/observability-setup.md`, `tasks/ci-setup.md`

**Owner actions remaining (all guided, none block each other):**
1. Wire Supabase webhook + set `REVALIDATE_SECRET` in Vercel — `tasks/wire-revalidation-webhook.md` (HIGHEST VALUE — turns on instant updates)
2. Enable Vercel Analytics + Speed Insights — `tasks/observability-setup.md`
3. Add 2 GitHub secrets for the CI build — `tasks/ci-setup.md`

**Deferred to later phases:** `revalidateTag` migration (paths already meet cost goal); Sentry (chose Vercel-native); client-error beacon endpoint.
