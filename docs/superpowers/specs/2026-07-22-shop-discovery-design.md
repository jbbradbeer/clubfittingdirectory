# Shop Discovery Pipeline — Design (2026-07-22)

## Purpose

Find golf club fitting shops that are not yet in the directory, add them as listings
(directory growth / SEO), and feed them into the outreach pipeline (Founding Verified
Listing prospects). This answers the "feed the machine with new prospect sources" item
in `tasks/outreach-scale-plan.md`.

## Scope

- **Pilot first**: 5 states — TX, FL, CA, AZ, GA (large golf markets, most likely to
  surface shops we missed). Nationwide sweep only after pilot proves dedup quality and
  yield.
- **In scope**: shops offering club fitting / custom fitting / clubmaking.
- **Out of scope**: repair-only shops, driving ranges without fitting, big-box stores
  without a fitting service. Filtered at review time by services keywords.

## Architecture

New standalone `discovery/` folder (separate from `outreach/` — discovery serves both
directory growth and outreach, so it gets its own home). Pipeline stages:

```
sources → normalize + dedup → review CSV → founder gate → bulk upload → outreach auto-pickup
```

### 1. Source scrapers (`discovery/sources/`)

Each writes raw JSON per state: name, address, city, state, zip, phone, website,
source identifier.

- **`oem_locators.py`** — OEM fitter/dealer locators (Titleist, Ping, Callaway,
  Mizuno, TaylorMade). Fetched via **Firecrawl** (`scrape`/`search`; API key obtained
  2026-07-22, stored in `discovery/.env`, never committed). Many locators are JSON
  endpoints behind store-locator maps; Firecrawl handles the JS-heavy ones.
  Polite scraping: delays between requests, no hammering.
- **`places.py`** — Google Places Text Search, queries like "club fitting" /
  "golf club fitting" per metro in pilot states. Stores `place_id` for dedup and
  future refresh. Pilot cost estimate: $2–5. Requires a Places API key (owner action).
- **OpenSEO `search_local_businesses`** — MCP tool, used at review time as a
  cross-check, not a batch source. Credits currently 0 — owner tops up first.

Scrapers checkpoint per state (rerun-safe; same pattern as `outreach/checkpoints`).

### 2. Normalize + dedup (`discovery/dedupe.py`)

- Canonicalize: lowercase name (strip punctuation/suffixes like LLC), phone digits
  only, normalized street address.
- Compare against BOTH the `shops` table (**all rows, active AND inactive** — never
  re-add listings cut in the 2026-07-08 quality review) and the outreach table.
- Match rule: same phone, OR fuzzy name match above threshold AND same city.
  Uncertain matches flagged for manual review rather than auto-dropped.
- Output: `discovery/review/new_shops_{date}.csv` — genuinely-new candidates with
  columns for source(s), match confidence, and why-matched notes.

### 3. Founder gate

Claude summarizes in chat: counts per state per source, notable finds, flagged
uncertain matches. Founder reviews CSV, approves/cuts rows. Nothing is inserted
without approval.

### 4. Ingest

- Approved rows inserted via the existing bulk-upload dry-run/commit workflow
  (service key in `web/.env.local`), `status = 'active'`.
- Enrichment pass (hours, services, ratings) same as existing listings.
- New rows land in the outreach table automatically; `find_emails.py` +
  MillionVerifier verification pick them up; they join the daily batch queue under
  existing A/B/C segmenting.

## Error handling

- Per-state checkpoints in every scraper; a failed state reruns without repeating
  completed ones.
- Firecrawl failures: retry once, then log and skip; `firecrawl ask` with the failing
  jobId for diagnosis if a source consistently fails.
- Places API: cap requests per run; abort run if error rate spikes (protects spend).

## Success criteria (pilot)

- Dedup precision holds up on manual spot-check (no obvious duplicates slip through;
  no obvious real matches falsely flagged as new).
- Meaningful yield: rough expectation 50–150 genuinely-new shops across 5 states.
- Then decide: scale nationwide, adjust sources, or stop.

## Owner actions needed

1. Google Places API key (Google Cloud console, enable Places API, billing on).
2. Top up OpenSEO credits (optional — cross-check only).
