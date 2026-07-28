# discovery/ — find shops not yet in the directory

Pipeline: sources → dedupe → review CSV → founder approval → upload.

1. `python3 discovery/sources/oem_locators.py --state TX` — scrape OEM fitter
   locators via Firecrawl into `raw/{brand}_TX.json`.
2. OpenSEO source: Claude runs `search_local_businesses` per metro
   (see RUNBOOK.md) and saves `raw/openseo_TX.json`; then
   `python3 discovery/validate_raw.py raw/openseo_TX.json`.
3. `python3 discovery/dedupe.py --state TX` — writes `review/new_shops_<date>.csv`.
4. Founder reviews CSV, deletes unwanted rows (or sets approved=no).
5. `python3 discovery/upload_new_shops.py review/new_shops_<date>.csv`
   (dry run) then `... --commit` — inserts shops + outreach rows.

Secrets: `discovery/.env` (Firecrawl, gitignored); Supabase key via
`web/.env.local` (same as outreach/).
