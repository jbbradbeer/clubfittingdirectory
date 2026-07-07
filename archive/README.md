# Archive

One-off scripts and superseded data snapshots, moved here during the July 2026
code audit to keep the repo root clean. **Nothing here is deleted — it's all
still in git history and runnable from this folder.**

Supabase is the source of truth for shop data; these CSVs are historical
snapshots. Never re-import them without a dry-run diff.

| File | What it was |
|---|---|
| `migrate_to_supabase.py` | One-time upload of `golf_directory_enriched.csv` into Supabase (June 2026 initial import). Reads the CSV from this folder. |
| `check_duplicates.py`, `upload_new_shops.py`, `enrich_new_shops.py` | One-off tooling for the June 2026 boutique-clubmaker import (13 shops). |
| `golf_directory_enriched.csv`, `golf_directory_MASTER_pre_phase3b.csv`, `golf_directory_enrichment_review.csv` | Pre-import data snapshots (Feb 2026 enrichment run). `enrich_services_crawl.py` at the repo root still points here. |
| `gsc-2026-06-10/` | Manual Google Search Console export, superseded by the auto-refreshed `tasks/gsc-latest/` (`scripts/gsc_pull.py`). |

Still active (NOT archived): `golf_directory_MASTER.csv`, `enrich_services_crawl.py`,
`enrich_fitting_attrs_crawl.py`, `push_fitting_facts.py`, `scripts/`, `outreach/`.
