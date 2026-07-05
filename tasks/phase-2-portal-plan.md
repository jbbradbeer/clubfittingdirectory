# Phase 2 — Shop Owner Portal (full plan) + Data Engine (outline)

## Context

Phase A (PR #18) made paid onboarding deliverable with James as the human dashboard. Phase 2 is the self-serve layer for when volume arrives: a passwordless portal where claimed shops edit their listings (with James's approval), see their own leads, and check Verified status. Planned NOW so it's ready to build the moment paying shops show up; the agreed build trigger is ~20 paying shops or edit-request pain. Also included: a one-page outline for the roadmap's data-freshness engine (the other candidate "Phase 2").

Key architecture verdicts from exploration:
- Reuse the admin-auth pattern (HMAC + httpOnly cookie + edge presence-gate + server-side re-verify) — NOT Supabase Auth.
- Owner edits flow into the Phase 1 provenance ledger ('owner' source already seeded at precedence 90/confidence 0.9) — but **only on approval**.
- ⚠️ Critical correctness rule (caught in design review): NEVER write pending/unreviewed edits into `listing_facts` — `recompute_current_fact()` has no "pending" concept, and a human-verified owner row wins the winner-rule instantly, so any unrelated recompute would publish unreviewed data. Pending edits live exclusively in a new `owner_edit_batches` table; `listing_facts` receives owner rows only inside the approve action. Rejection = mark the batch; the ledger was never touched.

## Build 1 — Migration + magic-link auth (PR 1, ~1 session)

**`web/supabase/010_owner_portal.sql`**: `owner_edit_batches(id, shop_id FK cascade, owner_email, kind 'edit'|'identity_request', proposed jsonb, previous jsonb (snapshot for stable diffs), message, review_status 'new'|'approved'|'rejected', reviewed_at, review_note, created_at)` + status/shop indexes. RLS enabled with NO policies (service-role only — all writes go through guarded server actions). House style: idempotent + VERIFY + ROLLBACK.

**`web/lib/portal-auth.ts`** (mirror `web/lib/admin-auth.ts`): sessions keyed by **email, not shop id** (one login shows all shops with that `owner_email`; revocation = clear the column). New env `PORTAL_SECRET` (openssl rand -hex 32; Vercel + local).
- Magic link: `/portal/auth?e=<b64url(email)>&x=<expiresMs>&s=<hmac>`, hmac = HMAC-SHA256(`"cfd-portal-magic.v1\n"+email+"\n"+expiresMs`), 20-min validity. Newline-delimited signing input (emails contain dots); purpose-prefixed so magic tokens can't be replayed as session cookies.
- Session cookie `cfd_portal` = `v1.<b64url(email)>.<sessionExpMs>.<hmac>` (prefix `cfd-portal-session.v1`), 30 days, httpOnly/secure-prod/lax.
- Exports: `buildMagicLink`, `verifyMagicToken`, `getPortalSession`, `getOwnedShops(email)` (service role, `claimed_at not null`, **case-insensitive email match** — approveClaim stores verbatim; compare with ilike/lowercase, don't migrate data), `isShopOwner(shopId)` — called top of every portal page AND action, like `isAdmin()`.
- Documented accepted risks: 20-min stateless replay window; no per-session revocation (rotate PORTAL_SECRET / clear owner_email).

**`web/proxy.ts`**: matcher += `"/portal", "/portal/:path*"`; `/portal` + `/portal/auth` pass, other `/portal/*` without cookie presence → redirect `/portal` (authoritative check stays server-side).

**Routes**: `web/app/portal/page.tsx` (request-link card; ALWAYS the same "if that email matches a claimed listing, a link is on its way" — no enumeration; redirect to /portal/home if already signed in; noindex), `web/app/portal/auth/route.ts` (verify → set cookie → /portal/home; failures → `/portal?error=expired`; rate-limit 10/15min/IP), `requestMagicLink` + `portalLogout` actions (rate limits: 3/15min per IP AND per email, `rateLimitOk` + headers() pattern from admin login). Email: `sendPortalMagicLink` in `web/lib/email.ts` (existing Resend conventions).

## Build 2 — Portal home: listing snapshot, Verified, leads (PR 2, ~1 session)

**`web/app/portal/home/page.tsx`** (`force-dynamic`; session → redirect; `?shop=` selector pill when the email owns >1 shop; tabs Listing · Leads · Edit like admin's tab pills; logout button):
- **Listing tab**: read-only "what's live now" card from `shops` (the editable fields), name/city/state greyed with a lock note; **Verified card** via `isVerified()` from `web/lib/badges.ts` ("Verified until {date}" / muted upsell line); pending-edit banner when a `'new'` batch exists; identity-change free-text form → `submitIdentityRequest`.
- **Leads tab**: `web/components/portal/PortalLeadsList.tsx` — clone `LeadsPanel` card/status-pill markup scoped `.eq("shop_id", shopId)`; status buttons post to `updatePortalLeadStatus` which re-verifies `isShopOwner` AND that the lead's shop_id is owned (no cross-shop updates by id-guessing).

## Build 3 — Edit flow + admin review (PR 3, ~1.5 sessions)

**`web/lib/portal-editable.ts`** — the whitelist, single source shared by form/action/admin: `phone, website, street, working_hours, services_array, offers_fitting, brands_fitted, launch_monitors, ownership_type`. Rating excluded and server-enforced. No description field exists in the schema — free-text message covers it (separate migration later if wanted; flag to founder). If the working_hours editor drags, ship it read-only v1.

**`web/components/portal/EditListingForm.tsx`** + `submitEdits` action: coerce per fact_attributes value_kind, drop no-op values, snapshot `previous` from shops, insert batch — or **replace the shop's existing 'new' batch in place** (one queue card per shop, no stacking); rate-limit 5/hr/shop; best-effort `notifyOwnerEditSubmitted` to NOTIFY_TO. `listing_facts` untouched at submit time (see Context ⚠️).

**Admin**: add "Owner Edits" tab in `web/app/admin/page.tsx`; **`web/components/admin/OwnerEditsPanel.tsx`** (SubmissionsPanel clone): per-batch diff table (label / current-from-`previous` with "changed since submission" warning if live value drifted / proposed in gold tint; arrays as chips, hours as 7 rows), message in italics; whole-batch Approve/Reject only (no cherry-picking v1). Actions in **`web/app/admin/owner-edits/actions.ts`**:
- `approveOwnerEdits`: per attribute → upsert `listing_facts` `{source:'owner', confidence:0.9, verified_by:'human', fetched_at:now}` on `(listing_id,attribute,source)` → `rpc("recompute_current_fact")` (owner beats scrape on the human-first key; a future admin fact at 1.0 still beats owner — hierarchy preserved). Mark approved; revalidate `/admin`, `/listing/<slug>`, + city/state/category/directory when services/fitting changed (reuse approveSubmission's path list); best-effort `notifyOwnerEditsLive`. Identity batches: button reads "Mark handled", changes nothing else.
- `rejectOwnerEdits`: mark rejected + optional review_note. Ledger never touched.

**Emails** (extend `web/lib/email.ts`): `sendPortalMagicLink`, `notifyOwnerEditsLive`, `notifyOwnerEditSubmitted` — escapeHtml everything, skip-silently without key.

## Owner (James) steps
1. Run `010_owner_portal.sql` in Supabase SQL editor (+ VERIFY block).
2. `openssl rand -hex 32` → `PORTAL_SECRET` in `.env.local` + Vercel → redeploy.
3. Smoke-test with his own claimed test shop.
4. New rule for the admin runbook: never hand-edit `shops` columns for fact-tracked attributes (recompute would clobber); fix data via approve/reject or an admin fact.

## Verification (condensed — full checklist in the design)
No-enumeration copy identical for unknown emails · tampered/expired tokens rejected · magic token can't be used as cookie (purpose prefix) · two-shop email gets switcher, cross-shop `?shop=`/lead-id access refused · pending edit leaves `listing_facts` unchanged and a manual recompute does NOT surface it · approve updates shops + listing page; reject touches nothing · owner fact survives scrape recompute, loses to admin fact · smuggled `rating` field dropped · 4th link request rate-limited · clearing owner_email revokes access · /admin unaffected.

## Risks
Pending-facts poisoning (solved by design — the one non-negotiable); magic-link replay window + no per-session revocation (accepted, documented, escalation = consumed-token table later); per-instance rate limiter (nuisance-level); owner_email casing (compare-time fix only); working_hours UX fiddliness (fallback: read-only v1).

---

# Appendix — Roadmap "Data Engine" (the other Phase 2, one-page outline)

**Goal:** keep 1,270 listings fresh automatically — hours, phone, ratings, closures — using the provenance system as designed (Phase 1's stated purpose: "ingest from many sources without losing track of truth").

**Shape:** a rolling re-enrichment pipeline: each run picks the N shops with the stalest `listing_facts.fetched_at` for scrape-sourced attributes → re-fetches (Google data / shop websites, evolving the existing python enrichment scripts) → writes `listing_facts` rows as `scrape:google` (0.6) / `scrape:web` (0.55) → calls `recompute_current_fact` per changed attribute. Owner/admin facts always outrank scrapes by design, so refreshes can never clobber approved owner data — the whole point of Phase 1.

**Components:** (1) `scripts/refresh_facts.py` writing to the ledger (needs a facts-writing helper the python side doesn't have yet); (2) closure detection — business_status gone/CLOSED → flag for James, on confirm set `status='inactive'` + revalidate + sitemap drop; (3) admin "Data health" surface: `listing_fact_conflicts` view (already exists, unused) + stalest-shops count; (4) cadence via scheduled routine (weekly, ~100 shops/run ≈ full refresh quarterly).

**Prereqs:** none — schema is live. **Build trigger:** after the portal, or when stale-data complaints/GSC soft-404s appear. **Estimate:** ~2 sessions for v1 (script + admin surface), scraping robustness is the long tail.
