"""
Service enrichment script — keyword matching via crawl4ai (no API key required).
Targets rows where `services` is null/empty.
"""

import asyncio
import pandas as pd
import re
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from collections import Counter

INPUT_PATH  = "/Users/jbbradbeer/Coding Projects/BTG Clubfitting directory/archive/golf_directory_MASTER_pre_phase3b.csv"
OUTPUT_PATH = "/Users/jbbradbeer/Coding Projects/BTG Clubfitting directory/archive/golf_directory_enriched.csv"
REVIEW_PATH = "/Users/jbbradbeer/Coding Projects/BTG Clubfitting directory/archive/golf_directory_enrichment_review.csv"

MAX_CONCURRENT = 5
TIMEOUT        = 15  # seconds per page

# ---------------------------------------------------------------------------
# Service keyword map — order matters: more specific patterns first
# ---------------------------------------------------------------------------
SERVICE_KEYWORDS = {
    "Club Fitting": [
        r"\bclub\s+fit(ting)?\b", r"\bfitting\b", r"\bcustom\s+fit\b",
        r"\btrakman\b", r"\blaunch\s+monitor\b.*fit", r"\bfitted\b",
    ],
    "Club Repair": [
        r"\bclub\s+repair\b", r"\breshaft\b", r"\bregrip\b", r"\bgrip\s+install",
        r"\brepair\s+service\b", r"\bclub\s+refurbish", r"\bclub\s+restoration\b",
    ],
    "Custom Club Building": [
        r"\bcustom\s+club\s+build", r"\bcustom\s+build", r"\bclub\s+build",
        r"\bcustom\s+made\s+club", r"\bbuilt\s+to\s+spec\b",
    ],
    "Golf Lessons": [
        r"\bgolf\s+lesson", r"\binstruction\b", r"\bcoach(ing)?\b",
        r"\blessons?\b", r"\bteach(ing)?\b", r"\bjunior\s+golf\b",
        r"\bclinics?\b", r"\bprivate\s+lesson", r"\bgroup\s+lesson",
    ],
    "Golf Simulator": [
        r"\bsimulator\b", r"\bsim\s+golf\b", r"\bindoor\s+golf\b",
        r"\bvirtual\s+golf\b", r"\bscreen\s+golf\b", r"\bgolf\s+sim\b",
    ],
    "Launch Monitor": [
        r"\blaunch\s+monitor\b", r"\btracman\b", r"\btrackman\b",
        r"\bgcquad\b", r"\bflightscope\b", r"\bforesight\b",
        r"\bgc3\b", r"\bmevo\b",
    ],
    "Retail / Pro Shop": [
        r"\bpro\s+shop\b", r"\bretail\b", r"\bstore\b", r"\bshop\b",
        r"\bequipment\s+sale", r"\bgolf\s+equipment\b", r"\bgolf\s+gear\b",
        r"\bapparel\b", r"\bgolf\s+store\b",
    ],
    "Shaft & Grip Sales": [
        r"\bshaft\b", r"\bgrip\b", r"\bshaft\s+sale", r"\bgrip\s+sale",
        r"\bshaft\s+install", r"\bgrip\s+install",
    ],
    "Used Clubs / Trade-In": [
        r"\bused\s+club", r"\btrade[\s\-]in\b", r"\bpre[\s\-]owned\b",
        r"\bsecond[\s\-]hand\b", r"\bconsignment\b",
    ],
    "Driving Range": [
        r"\bdriving\s+range\b", r"\brange\s+ball", r"\bhitting\s+bay",
        r"\boutdoor\s+range\b", r"\bpractice\s+range\b",
    ],
    "Membership Programs": [
        r"\bmembership\b", r"\bmember\s+plan", r"\bmonthly\s+plan\b",
        r"\bsubscription\b", r"\bannual\s+pass\b",
    ],
}

def infer_services(text: str) -> list[str]:
    """Return list of matched service names from page text."""
    text_lower = text.lower()
    matched = []
    for service, patterns in SERVICE_KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                matched.append(service)
                break  # only add each service once
    return matched


async def crawl_all(urls: list[str]) -> dict[str, str]:
    """Crawl all URLs concurrently in batches. Returns {url: text}."""
    browser_cfg = BrowserConfig(headless=True, verbose=False)
    run_cfg = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        page_timeout=TIMEOUT * 1000,  # ms
        wait_until="domcontentloaded",
    )

    results = {}
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    async def fetch(crawler, url):
        async with semaphore:
            try:
                result = await crawler.arun(url=url, config=run_cfg)
                if result.success and result.markdown:
                    results[url] = result.markdown
                else:
                    results[url] = ""
            except Exception as e:
                results[url] = ""

    async with AsyncWebCrawler(config=browser_cfg) as crawler:
        tasks = [fetch(crawler, url) for url in urls]
        total = len(tasks)
        for i, coro in enumerate(asyncio.as_completed(tasks), 1):
            await coro
            if i % 10 == 0 or i == total:
                print(f"  Crawled {i}/{total}...", flush=True)

    return results


def main():
    # --- Load ---
    df = pd.read_csv(INPUT_PATH, dtype={"postal_code": str})
    print(f"Total rows loaded: {len(df)}")

    # --- Step 1: Filter target rows ---
    mask = df["services"].isna() | (df["services"].astype(str).str.strip() == "")
    targets = df[mask].copy()
    print(f"Rows to enrich: {len(targets)}")

    if len(targets) == 0:
        print("Nothing to enrich — exiting.")
        return

    urls = targets["website"].tolist()

    # --- Step 2: Crawl ---
    print(f"\nCrawling {len(urls)} websites (max {MAX_CONCURRENT} concurrent)...")
    crawl_results = asyncio.run(crawl_all(urls))

    # --- Step 3 & 4: Infer + write back ---
    statuses = []
    service_counter = Counter()

    for idx, row in targets.iterrows():
        url = row["website"]
        text = crawl_results.get(url, "")

        if not text.strip():
            statuses.append((idx, "", 0, "failed"))
            continue

        services = infer_services(text)

        if not services:
            statuses.append((idx, "", 0, "unknown"))
        else:
            svc_str = " | ".join(services)
            statuses.append((idx, svc_str, len(services), "enriched"))
            service_counter.update(services)

    # Apply back to original df
    if "enrichment_status" not in df.columns:
        df["enrichment_status"] = ""

    for idx, svc_str, num_svc, status in statuses:
        df.at[idx, "services"]          = svc_str
        df.at[idx, "num_services"]      = num_svc
        df.at[idx, "enrichment_status"] = status

    # --- Step 5: Save ---
    df.to_csv(OUTPUT_PATH, index=False)

    review_statuses = ["failed", "unknown", "not_golf"]
    review_df = df[df["enrichment_status"].isin(review_statuses)]
    review_df.to_csv(REVIEW_PATH, index=False)

    # --- Step 6: Summary ---
    enriched = sum(1 for _, _, _, s in statuses if s == "enriched")
    unknown  = sum(1 for _, _, _, s in statuses if s == "unknown")
    failed   = sum(1 for _, _, _, s in statuses if s == "failed")

    print(f"\n{'='*50}")
    print(f"Total rows targeted:     {len(targets)}")
    print(f"Successfully enriched:   {enriched}")
    print(f"Unknown (no services):   {unknown}")
    print(f"Not golf (flagged):      0")
    print(f"Failed (crawl error):    {failed}")
    print(f"\nTop services found across enriched rows:")
    for service, count in service_counter.most_common():
        print(f"  {service}: {count}")
    print(f"\n✅ Enrichment complete.")
    print(f"Full CSV  → {OUTPUT_PATH}")
    print(f"Review CSV → {REVIEW_PATH}")


if __name__ == "__main__":
    main()
