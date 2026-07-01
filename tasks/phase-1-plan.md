# Phase 1 — A data model built for trust

**Objective:** make provenance and confidence first-class, so the system can
ingest from many sources without losing track of truth.

**Deliverable:** a schema where every field on the live site can answer
*"where did this come from, how sure are we, and does anything disagree?"*

**Decisions locked (2026-07-01):**
- **Read layer:** `shops` stays the materialized "current best" cache; a DB
  function promotes winning facts INTO shops. The live site's page/query code is
  unchanged. Lowest risk.
- **Scope:** the ~10 contested attributes (below), not every field.
- **Execution:** chunked; each SQL migration run manually in Supabase SQL Editor
  with verification between. Idempotent + additive (safe on a live DB).

---

## Architecture

```
   many sources (scrape, owner, OEM, geocoder, admin, heuristic)
                         │  each writes a row
                         ▼
   public.listing_facts   ← full provenance + confidence + history
      (listing_id, attribute, source) → value, source_url, fetched_at,
      confidence 0–1, verified_by, is_current
                         │  recompute_current_fact() picks the winner
                         │  (human > confidence > source precedence > recency)
                         ├─► sets is_current=true on the winning row
                         └─► PROMOTES the winning value into ──► public.shops
                                                                 (materialized
   live site reads shops (unchanged)  ◄──────────────────────────  cache)

   Views for querying/proof:
     • listing_current_facts     — the winning fact per attribute
     • listing_facts_published   — current AND confidence ≥ threshold (public)
     • listing_fact_conflicts    — attributes where sources disagree > threshold
```

### Attributes tracked this phase (`fact_attributes` registry)
| attribute | shops column (promotion target) | kind | conflict delta |
|---|---|---|---|
| phone | phone | text | exact |
| website | website | text | exact |
| street | street | text | exact |
| rating | rating | number | 0.3 |
| working_hours | working_hours | jsonb | exact |
| services_array | services_array | text_array | exact |
| offers_fitting | offers_fitting | boolean | exact |
| **brands_fitted** | brands_fitted *(NEW col)* | text_array | exact |
| **launch_monitors** | launch_monitors *(NEW col)* | text_array | exact |
| **ownership_type** | ownership_type *(NEW col)* | text | exact |

The last three have no flat column today → we add them to `shops` so the site can
read them uniformly once pipelines populate the facts. (We skip the "flat column
first" stage entirely — cleaner than the spec assumed.)

### Source precedence + base confidence (`fact_sources` registry)
| source | precedence | base confidence |
|---|---|---|
| admin (manual) | 100 | 1.00 |
| owner (verified claim) | 90 | 0.90 |
| oem (authorized-fitter list) | 80 | 0.80 |
| geocoder | 70 | 0.75 |
| scrape:google (Outscraper) | 50 | 0.60 |
| scrape:web (shop site) | 45 | 0.55 |
| heuristic | 20 | 0.30 |

**Winner rule:** `verified_by='human'` first, then highest `confidence`, then
highest source `precedence`, then most recent `fetched_at`.

---

## Chunks (each = one SQL file you run, then we verify)

### Chunk 1 — Schema  → `web/supabase/005_provenance_schema.sql`
- Add `brands_fitted text[]`, `launch_monitors text[]`, `ownership_type text` to `shops`.
- Create `fact_sources` + `fact_attributes` registries (seeded).
- Create `listing_facts` (FKs, checks, indexes, one-current-per-attribute unique index, updated_at trigger).
- RLS: public reads only *published* facts (`is_current AND confidence ≥ 0.5`); no write policy (service-role only). Registries public-read.
- **Additive only — touches no existing data.**

### Chunk 2 — Backfill + promotion + views  → `web/supabase/006_provenance_backfill.sql`
- `recompute_current_fact(listing_id, attribute)` — winner selection + promotion into shops (SECURITY DEFINER, execute revoked from anon/authenticated).
- Backfill `listing_facts` from current shops values (source `scrape:google`, `is_current=true`). Backfill writes only to `listing_facts` — **does not modify shops**.
- Views: `listing_current_facts`, `listing_facts_published`, `listing_fact_conflicts`.
- Verify: fact counts ≈ non-null shops values; conflicts view returns 0 (single source so far).

### Chunk 3 — Proof + docs
- A seeded demo conflict (insert a second-source rating for one shop) to show `listing_fact_conflicts` lighting up, then remove it.
- Example queries doc: "where did this come from / how sure / what disagrees".
- Update `docs/schema-provenance.md`; add the **Kathmere side-by-side note** (this schema vs clientSafe: same governance pattern, different domain).

### Chunk 4 (optional) — Confidence in the UI
- Small "Verified" / "Unverified" badge on listing pages driven by the winning
  fact's `verified_by` / `confidence`. Requires a light read of fact confidence
  on the listing page (the one intentional page-code touch). Deferred/optional.

---

## Safety & rollback
- All SQL idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`, `ON CONFLICT DO NOTHING`).
- New columns are nullable/defaulted → existing `SELECT`s and typed reads unaffected.
- Each migration ends with a commented `-- ROLLBACK:` block to undo it.
- Nothing in Chunks 1–2 mutates existing `shops` data.

## Review / results

- **Chunk 1 (schema)** ✅ `005_provenance_schema.sql` run — 7 sources / 10 attributes / 0 facts confirmed.
- **Chunk 2 (backfill+views)** ✅ `006_provenance_backfill.sql` run — ledger seeded from scrape, promotion fn + 3 views live.
- **Chunk 3 (proof+docs)** ✅ `docs/provenance-queries.sql` (example queries answering the 3 questions + a safe 3-step conflict demo); `docs/schema-provenance.md` updated with the IMPLEMENTED section + the Kathmere side-by-side table. (Live demo couldn't run from local — `.env.local` has only a placeholder service key; real key is in Vercel — so the demo runs in the SQL Editor instead.)
- **Chunk 4 (UI badge)** ✅ `getListingVerification()` query + `ProvenanceBadge` component wired into the listing header. Muted "Unverified" chip (with tooltip inviting owner claim) by default, flips to green "Owner-verified" when facts become human-verified. Verified: tsc ✓, eslint ✓, full build ✓ (1,271 listings). **Founder chose verified-only:** the badge is now a positive-only signal — hidden for default scraped data, appears (green/amber) only once a listing has real owner/admin verification. Guard in `ProvenanceBadge` (`if level==='unverified' return null`).

**Note:** migrations `005`/`006` are on the live DB but the `.sql` files are uncommitted working-tree changes — commit with the docs when ready.
