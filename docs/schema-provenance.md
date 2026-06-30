# Schema & Provenance Audit (Phase 0 deliverable)

**Purpose (plain English):** Today, almost every piece of shop data comes from a
*single* source — a one-time web scrape (Outscraper/Google) loaded from
`golf_directory_MASTER.csv`. As the directory grows, the same fact (a shop's
address, hours, the brands it fits) will start arriving from *several* sources
that disagree: the original scrape, the shop owner claiming their listing, an
OEM's authorized-fitter list, a manual admin correction. When that happens we
need to know **which value to trust and where it came from.** This document
catalogues the current schema and flags every field that will become
"provenance-tracked" in Phase 1.

> Precedent already in the schema: `shops.services_source`
> (`crawled | recrawled | heuristic | no_website`) is a primitive provenance tag
> for one field. Phase 1 generalizes this idea to every contested field.

---

## 1. Current data flow (single-source today)

```
golf_directory_MASTER.csv  →  enrich_golf_directory.py (Outscraper/Google scrape)
                           →  migrate_to_supabase.py
                           →  public.shops   (one row per shop, one value per field)
```

Writes today come from exactly two places: the **bulk migration/enrich scripts**
(service-role) and the **admin approval flow** (`shop_submissions` → `shops`).
There is no per-field record of *where* a value came from or *when it was last
verified* — except `services_source`.

---

## 2. Table catalogue

### `public.shops` — the directory (one row per shop)
35 scraped columns + 7 internal. Full column list with provenance class in §3.

### `public.shop_submissions` — public "Submit a Shop" quarantine
Insert-only for the public; admin reviews and promotes to `shops`.
`name, shop_type, city, state_code, website, phone, offers_fitting,
submitter_email, notes, review_status (new|approved|rejected), created_at`.
→ **This is already a second source of truth for shop identity/location/contact.**
Phase 1 should treat an approved submission as a *provenance source*, not a
silent overwrite.

### `public.fitting_requests` — booking-engine leads
Not directory data (it's customer leads). Out of scope for provenance, but noted
for completeness: `shop_id (FK), shop_slug, shop_name, visitor_*`, fitting
details, `status (new|contacted|booked|closed)`.

---

## 3. Provenance classification of `shops` columns

Each column falls into one of three buckets.

### Bucket A — Internal / system (single source forever, NOT provenance-tracked)
These are owned by the application itself; they never have a competing source.

| Column | Owner | Notes |
|---|---|---|
| `id` | DB | Primary key |
| `slug` | App | Generated from name+location |
| `status` | Admin | active/pending/inactive |
| `is_featured` | Admin/billing | Monetization flag |
| `listing_tier` | Admin/billing | free/basic/featured |
| `location` (PostGIS) | Derived | Computed from `latitude`/`longitude` |
| `created_at`, `updated_at` | DB | Timestamps |
| `query` | Scrape | The original search string; historical artifact |

### Bucket B — Multi-source fields (the Phase 1 provenance targets)
The same fact will arrive from several sources that can disagree. Listed with
the sources we already know about and the conflict risk.

| Field group | Columns | Current source | Future sources (Phase 1) | Conflict risk |
|---|---|---|---|---|
| **Address / geo** | `street, city, state, state_code, postal_code, latitude, longitude, time_zone` | Google scrape | Owner claim, geocoder (USPS/Mapbox), admin fix | **High** — shops relocate; scrape geocoding is imperfect; powers maps + proximity search |
| **Contact** | `phone, website` | Google scrape | Owner claim, website re-scrape, admin fix | High — numbers/sites change; owner is authoritative |
| **Name / identity** | `name, primary_service` | Scrape | Owner claim, submission, admin | Medium — branding/DBA differences |
| **Hours** | `working_hours, open_on_weekends` | Outscraper JSON | Owner claim, seasonal updates, Google re-scrape | **High** — frequently wrong/stale; owner authoritative; seasonal |
| **Ratings / reviews** | `rating, rating_tier, reviews, photos_count, has_photos, verified` | Google scrape (point-in-time) | Periodic Google re-scrape, possibly Yelp / internal reviews | Medium — staleness, not contradiction; may aggregate multiple platforms |
| **Services** | `services, services_array, num_services, offers_fitting, fitting_environment, public_fitting` | Scrape/heuristic (`services_source`) | Owner claim, website scrape, structured taxonomy | **High** — heuristic-derived; owner authoritative; drives filtering |
| **Classification** | `shop_type, is_chain` | Scrape/heuristic | Owner, OEM lists, manual taxonomy | Medium — feeds the "independent vs OEM" need below |
| **Meta** | `business_status, outreach_ready, area_service, owner_title, about` | Scrape | Owner, admin, outreach pipeline | Low–Medium |

### Bucket C — Fields Phase 1 must ADD (multi-source from day one)
The roadmap explicitly names these; they **do not exist as structured columns
yet** and will be born provenance-tracked.

| New field | Today | Sources | Why structured |
|---|---|---|---|
| **Brands fitted** | Not captured (sometimes buried in free-text `services`) | Owner claim, shop-website scrape, **OEM authorized-fitter locators** (Titleist, Ping, TaylorMade, Callaway, Mizuno…) | Core filter ("who fits Ping?"); OEM lists are an authoritative external source |
| **Launch monitor** | Only "Launch Monitor" as a generic `services` tag + `fitting_environment` | Owner, website scrape | Golfers search by device — **TrackMan, GCQuad/Foresight, Full Swing, SkyTrak**; needs its own structured, multi-valued field |
| **Ownership type (independent vs OEM vs big-box)** | Approximated by `is_chain` + `shop_type` | Classification heuristic, owner, manual review | Key differentiator for an "independent fitter" directory; will be contested/edited |

---

## 4. Recommended provenance model for Phase 1 (design sketch, not built yet)

Two complementary patterns — to be designed in detail at the start of Phase 1:

**(a) Per-field provenance metadata.** For each Bucket B/C field, track not just
the value but: `source` (scrape | owner | oem | geocoder | admin), `confidence`,
`last_verified_at`, and `verified_by`. Implementation options to weigh in Phase 1:
a side table `shop_field_provenance(shop_id, field, value, source, confidence,
verified_at)` that holds candidate values, with the `shops` row caching the
*winning* value for fast reads. (Keeps the hot read path — listing pages — fast.)

**(b) A precedence (trust) order** to resolve conflicts deterministically, e.g.:
`admin override > verified owner claim > OEM authoritative list > fresh scrape >
heuristic`. A "promote winner to `shops`" step runs on change and triggers the
on-demand revalidation we wired in Phase 0.

**(c) Owner claims as a first-class source.** The existing `shop_submissions`
table is the seed of this — Phase 1's "claim your shop" flow (see paused
claim-shop plan) becomes the `owner` provenance source.

**Design constraints carried from Phase 0:**
- Reads stay on the cached `shops` row (don't make listing pages join provenance tables on every request).
- Any write that changes a displayed field must fire the Supabase webhook → `/api/revalidate` (already built).
- RLS: provenance tables must be service-role-write, and either admin-read-only or public-read of *winning values only* (never expose raw owner emails / unverified claims).

---

## 5. Priority for Phase 1

1. **Address/geo + Hours + Services** — highest conflict risk, most visible, most owner-correction demand.
2. **Brands fitted + Launch monitor** — new structured fields; high search/SEO value; OEM lists give an authoritative external source to seed them.
3. **Ownership type** — strategic differentiator; lower volume, can be admin-curated initially.
4. Contact + Ratings — important but lower contention (staleness, not contradiction).

---

_Audited 2026-06-30 against `web/supabase/001_schema.sql`, `002_shop_submissions.sql`, `003_fitting_requests.sql`. No code or schema changed by this document._
