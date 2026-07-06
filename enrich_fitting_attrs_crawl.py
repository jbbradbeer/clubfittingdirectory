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

ROOT        = Path(__file__).resolve().parent
ENV_PATH    = ROOT / "web" / ".env.local"
OUTPUT_PATH = ROOT / "tasks" / "fitting_attrs_crawl.csv"

MAX_CONCURRENT = 5
TIMEOUT        = 15  # seconds per page

# ---------------------------------------------------------------------------
# Launch monitor device map — canonical display name → regexes.
# Order matters: specific devices before the generic brand (a GCQuad page
# usually also says "Foresight"; we keep the specific device and only fall
# back to "Foresight" when no specific model matched).
# ---------------------------------------------------------------------------
DEVICE_PATTERNS: dict[str, list[str]] = {
    "TrackMan":     [r"\btrack\s?man\b"],
    "GCQuad":       [r"\bgc\s?quad\b"],
    "GC3":          [r"\bgc3\b"],
    "FlightScope":  [r"\bflight\s?scope\b"],
    "SkyTrak":      [r"\bsky\s?trak\b"],
    "Mevo":         [r"\bmevo\+?\b"],
    "Full Swing":   [r"\bfull\s?swing\s+(golf|sim|simulator|kit)\b"],
    "SAM PuttLab":  [r"\bsam\s+putt\s?lab\b"],
    "Quintic":      [r"\bquintic\b"],
    "Foresight":    [r"\bforesight\b"],  # generic — dropped if GCQuad/GC3 hit
}
GENERIC_FORESIGHT_SPECIFICS = {"GCQuad", "GC3"}

# ---------------------------------------------------------------------------
# Price extraction — a $ amount only counts when fitting words appear nearby,
# which filters membership fees, sim-rental rates and sale prices.
# ---------------------------------------------------------------------------
PRICE_RE = re.compile(r"\$\s?(\d{2,4}(?:\.\d{2})?)")
FITTING_CONTEXT_RE = re.compile(
    r"fit(?:ting|ted)?s?|full\s+bag|driver|iron|wedge|putter|woods|hybrid|bag\s+mapping",
    re.IGNORECASE,
)
CONTEXT_WINDOW = 100   # chars either side of the $ that must mention fitting
PRICE_MIN, PRICE_MAX = 40, 1500  # sane band for a fitting session


def detect_devices(text: str) -> list[str]:
    text_lower = text.lower()
    found = []
    for device, patterns in DEVICE_PATTERNS.items():
        if any(re.search(p, text_lower) for p in patterns):
            found.append(device)
    if "Foresight" in found and any(d in found for d in GENERIC_FORESIGHT_SPECIFICS):
        found.remove("Foresight")
    return sorted(found)


def extract_prices(text: str) -> tuple[int | None, int | None, str]:
    """Return (min, max, snippets) for fitting-context prices on the page."""
    prices: list[int] = []
    snippets: list[str] = []
    for m in PRICE_RE.finditer(text):
        try:
            value = int(float(m.group(1)))
        except ValueError:
            continue
        if not (PRICE_MIN <= value <= PRICE_MAX):
            continue
        window = text[max(0, m.start() - CONTEXT_WINDOW): m.end() + CONTEXT_WINDOW]
        if not FITTING_CONTEXT_RE.search(window):
            continue
        prices.append(value)
        if len(snippets) < 6:  # enough context to review, not the whole page
            snippets.append(" ".join(window.split()))
    if not prices:
        return None, None, ""
    return min(prices), max(prices), " || ".join(snippets)


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
