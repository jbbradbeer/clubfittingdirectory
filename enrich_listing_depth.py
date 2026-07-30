"""
Listing-depth enrichment crawl — extract ALL differentiating attributes from
shop websites into a review CSV (launch monitors, prices, brands fitted, year
established, credentials, bay count, mobile fitting, in-house build).

Uses the enrichment/ module (homepage + up to 3 hinted subpages per site).
Nothing touches the database — the founder reviews the CSV (every value has
its evidence snippet + source URL beside it), then push_listing_facts.py
uploads the approved rows to the provenance ledger.

Priority order: independents first, then everything else — the shops whose
depth wins AI citations.

Usage:
    python3 enrich_listing_depth.py [--limit N] [--fitting-only]

Output: tasks/listing_depth_crawl.csv
"""

import argparse
import asyncio
import csv
import json
import urllib.request
from pathlib import Path

from enrichment import extract_all
from enrichment.crawler import crawl_sites, normalize_url

ROOT = Path(__file__).resolve().parent
ENV_PATH = ROOT / "web" / ".env.local"
OUTPUT_PATH = ROOT / "tasks" / "listing_depth_crawl.csv"

# field -> (value column, snippet column). Arrays join with " | ".
FIELDS = [
    "launch_monitors", "fitting_price_min", "fitting_price_max",
    "brands_fitted", "year_established", "credentials",
    "bay_count", "mobile_fitting", "in_house_build",
]


def load_env() -> dict[str, str]:
    env = {}
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k] = v.strip()
    return env


def fetch_shops(env: dict[str, str], fitting_only: bool) -> list[dict]:
    """Active shops with a website — independents first, paged past the
    1,000-row PostgREST cap."""
    base = env["NEXT_PUBLIC_SUPABASE_URL"]
    key = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    shops, page = [], 0
    fitting_filter = "&offers_fitting=is.true" if fitting_only else ""
    while True:
        url = (
            f"{base}/rest/v1/shops?select=id,slug,name,website,ownership_type"
            f"&status=eq.active&website=not.is.null{fitting_filter}&order=id"
            f"&limit=1000&offset={page * 1000}"
        )
        req = urllib.request.Request(url, headers={
            "apikey": key, "Authorization": f"Bearer {key}",
        })
        with urllib.request.urlopen(req) as resp:
            rows = json.loads(resp.read())
        shops.extend(rows)
        if len(rows) < 1000:
            break
        page += 1
    shops = [s for s in shops if (s.get("website") or "").strip()]
    # Independents first — their depth is the citation product.
    shops.sort(key=lambda s: (s.get("ownership_type") != "independent", s["slug"]))
    return shops


def cell(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return " | ".join(str(v) for v in value)
    if isinstance(value, bool):
        return "true" if value else ""
    return str(value)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0,
                        help="crawl only the first N shops (smoke test)")
    parser.add_argument("--fitting-only", action="store_true",
                        help="only shops with offers_fitting = true")
    args = parser.parse_args()

    env = load_env()
    shops = fetch_shops(env, args.fitting_only)
    if args.limit:
        shops = shops[: args.limit]
    print(f"Shops to crawl: {len(shops)}")

    websites = list({normalize_url(s["website"]) for s in shops})
    site_pages = asyncio.run(crawl_sites(websites))

    OUTPUT_PATH.parent.mkdir(exist_ok=True)
    hits_per_field = {f: 0 for f in FIELDS}
    failed = 0
    with OUTPUT_PATH.open("w", newline="") as f:
        writer = csv.writer(f)
        header = ["id", "slug", "name", "website"]
        for field in FIELDS:
            header += [field, f"{field}_confidence", f"{field}_snippet", f"{field}_source_url"]
        header += ["pages_crawled", "crawl_status"]
        writer.writerow(header)

        for s in shops:
            pages = site_pages.get(normalize_url(s["website"]), {})
            crawled = sum(1 for t in pages.values() if t.strip())
            if crawled == 0:
                failed += 1
                writer.writerow([s["id"], s["slug"], s["name"], s["website"]]
                                + [""] * (len(FIELDS) * 4) + [0, "failed"])
                continue
            facts = extract_all(pages)
            row = [s["id"], s["slug"], s["name"], s["website"]]
            for field in FIELDS:
                ex = facts.get(field)
                if ex is None:
                    row += ["", "", "", ""]
                else:
                    hits_per_field[field] += 1
                    row += [cell(ex.value), f"{ex.confidence:.2f}", ex.snippet, ex.source_url]
            row += [crawled, "ok"]
            writer.writerow(row)

    print(f"\n{'=' * 50}")
    print(f"Crawled: {len(shops)}   failed: {failed}")
    for field, hits in hits_per_field.items():
        print(f"  {field:<20} {hits}")
    print(f"\n✅ Review CSV → {OUTPUT_PATH}")
    print("Next: review the CSV (check every snippet cell!), then run")
    print("  python3 push_listing_facts.py            # dry run")
    print("  python3 push_listing_facts.py --commit   # upload")


if __name__ == "__main__":
    main()
