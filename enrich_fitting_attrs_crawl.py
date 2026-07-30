"""
Fitting-attributes crawler — detects LAUNCH MONITOR devices and published
FITTING PRICES on shop websites (crawl4ai, no API key required).

Reads the LIVE shops table (Supabase REST, anon key from web/.env.local),
crawls each active shop's website, and writes a review CSV. Nothing touches
the database — the founder reviews the CSV (especially every price snippet),
then push_fitting_facts.py uploads the approved rows to the provenance ledger.

Usage:
    python3 enrich_fitting_attrs_crawl.py [--limit N]

Output: tasks/fitting_attrs_crawl.csv
"""

import argparse
import asyncio
import csv
import json
import re
import urllib.request
from pathlib import Path

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

# Detector logic moved to enrichment/detectors.py (shared with the
# listing-depth engine); re-exported here so existing imports keep working.
from enrichment.detectors import (  # noqa: F401
    CONTEXT_AFTER,
    CONTEXT_BEFORE,
    DEVICE_PATTERNS,
    FITTING_CONTEXT_RE,
    GENERIC_TO_SPECIFIC,
    NEGATIVE_CONTEXT_RE,
    PRICE_MAX,
    PRICE_MIN,
    PRICE_RE,
    detect_devices,
    extract_prices,
)

ROOT        = Path(__file__).resolve().parent
ENV_PATH    = ROOT / "web" / ".env.local"
OUTPUT_PATH = ROOT / "tasks" / "fitting_attrs_crawl.csv"

MAX_CONCURRENT = 5
TIMEOUT        = 15  # seconds per page

def load_env() -> dict[str, str]:
    env = {}
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k] = v.strip()
    return env


def fetch_shops(env: dict[str, str]) -> list[dict]:
    """All active shops with a website, paged past PostgREST's 1,000-row cap."""
    base = env["NEXT_PUBLIC_SUPABASE_URL"]
    key  = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    shops, page = [], 0
    while True:
        url = (
            f"{base}/rest/v1/shops?select=id,slug,name,website"
            f"&status=eq.active&website=not.is.null&order=id"
            f"&limit=1000&offset={page * 1000}"
        )
        req = urllib.request.Request(url, headers={
            "apikey": key, "Authorization": f"Bearer {key}",
        })
        with urllib.request.urlopen(req) as resp:
            rows = json.loads(resp.read())
        shops.extend(rows)
        if len(rows) < 1000:
            return [s for s in shops if (s.get("website") or "").strip()]
        page += 1


async def crawl_all(urls: list[str]) -> dict[str, str]:
    """Crawl all URLs concurrently. Returns {url: markdown_text}."""
    browser_cfg = BrowserConfig(headless=True, verbose=False)
    run_cfg = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        page_timeout=TIMEOUT * 1000,
        wait_until="domcontentloaded",
    )
    results: dict[str, str] = {}
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    async def fetch(crawler, url):
        async with semaphore:
            try:
                result = await crawler.arun(url=url, config=run_cfg)
                results[url] = result.markdown if (result.success and result.markdown) else ""
            except Exception:
                results[url] = ""

    async with AsyncWebCrawler(config=browser_cfg) as crawler:
        tasks = [fetch(crawler, url) for url in urls]
        total = len(tasks)
        for i, coro in enumerate(asyncio.as_completed(tasks), 1):
            await coro
            if i % 25 == 0 or i == total:
                print(f"  Crawled {i}/{total}...", flush=True)
    return results


def normalize_url(website: str) -> str:
    website = website.strip()
    return website if website.startswith("http") else f"https://{website}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0,
                        help="crawl only the first N shops (smoke test)")
    args = parser.parse_args()

    env = load_env()
    shops = fetch_shops(env)
    if args.limit:
        shops = shops[: args.limit]
    print(f"Shops to crawl: {len(shops)}")

    urls = {s["id"]: normalize_url(s["website"]) for s in shops}
    crawl_results = asyncio.run(crawl_all(list(set(urls.values()))))

    OUTPUT_PATH.parent.mkdir(exist_ok=True)
    device_hits = price_hits = failed = 0
    with OUTPUT_PATH.open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "id", "slug", "name", "website",
            "launch_monitors", "price_min", "price_max", "price_snippets",
            "crawl_status",
        ])
        for s in shops:
            text = crawl_results.get(urls[s["id"]], "")
            if not text.strip():
                failed += 1
                writer.writerow([s["id"], s["slug"], s["name"], s["website"],
                                 "", "", "", "", "failed"])
                continue
            devices = detect_devices(text)
            pmin, pmax, snippets = extract_prices(text)
            if devices:
                device_hits += 1
            if pmin is not None:
                price_hits += 1
            writer.writerow([
                s["id"], s["slug"], s["name"], s["website"],
                " | ".join(devices), pmin or "", pmax or "", snippets, "ok",
            ])

    print(f"\n{'=' * 50}")
    print(f"Crawled:                  {len(shops)}")
    print(f"Failed (no page text):    {failed}")
    print(f"Shops with device hits:   {device_hits}")
    print(f"Shops with price hits:    {price_hits}")
    print(f"\n✅ Review CSV → {OUTPUT_PATH}")
    print("Next: review the CSV (check every price_snippets cell!), then run")
    print("  python3 push_fitting_facts.py            # dry run")
    print("  python3 push_fitting_facts.py --commit   # upload")


if __name__ == "__main__":
    main()
