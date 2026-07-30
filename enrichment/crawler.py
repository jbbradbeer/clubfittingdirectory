"""
Site crawler for the enrichment engine (crawl4ai, no API key).

crawl_site(url) fetches the homepage plus up to MAX_SUBPAGES same-domain
subpages whose path looks informative (fitting, about, pricing, services,
technology, studio) — that's where year-established and credentials live,
which the homepage-only crawl missed. Returns {url: markdown} in crawl order
(homepage first).

crawl_sites(urls) runs many sites concurrently under one browser.
"""

import asyncio
import re
from urllib.parse import urljoin, urlparse

from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig

MAX_CONCURRENT_SITES = 5
MAX_SUBPAGES = 3
TIMEOUT = 15  # seconds per page

SUBPAGE_HINT_RE = re.compile(
    r"fit|about|price|pricing|rates|service|technolog|studio|build|team|staff",
    re.IGNORECASE,
)
# Markdown links produced by crawl4ai: [text](href)
MD_LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)\s]+)")

_RUN_CFG = CrawlerRunConfig(
    cache_mode=CacheMode.BYPASS,
    page_timeout=TIMEOUT * 1000,
    wait_until="domcontentloaded",
)


def normalize_url(website: str) -> str:
    website = website.strip()
    return website if website.startswith("http") else f"https://{website}"


def pick_subpages(home_url: str, home_markdown: str) -> list[str]:
    """Same-domain links whose path or anchor text hints at fitting content."""
    home = urlparse(home_url)
    seen: list[str] = []
    for text, href in MD_LINK_RE.findall(home_markdown):
        absolute = urljoin(home_url, href.split("#")[0])
        parsed = urlparse(absolute)
        if parsed.netloc.removeprefix("www.") != home.netloc.removeprefix("www."):
            continue
        if not parsed.path or parsed.path == "/":
            continue
        if parsed.path.rsplit(".", 1)[-1].lower() in ("pdf", "jpg", "jpeg", "png", "zip"):
            continue
        if not (SUBPAGE_HINT_RE.search(parsed.path) or SUBPAGE_HINT_RE.search(text)):
            continue
        if absolute not in seen:
            seen.append(absolute)
        if len(seen) >= MAX_SUBPAGES:
            break
    return seen


async def _fetch(crawler: AsyncWebCrawler, url: str) -> str:
    try:
        result = await crawler.arun(url=url, config=_RUN_CFG)
        return result.markdown if (result.success and result.markdown) else ""
    except Exception:
        return ""


async def _crawl_site(crawler: AsyncWebCrawler, website: str) -> dict[str, str]:
    home_url = normalize_url(website)
    pages: dict[str, str] = {}
    home_md = await _fetch(crawler, home_url)
    pages[home_url] = home_md
    if home_md:
        for sub in pick_subpages(home_url, home_md):
            pages[sub] = await _fetch(crawler, sub)
    return pages


async def crawl_site(website: str) -> dict[str, str]:
    """Crawl one site (homepage + hinted subpages). Returns {url: markdown}."""
    async with AsyncWebCrawler(config=BrowserConfig(headless=True, verbose=False)) as crawler:
        return await _crawl_site(crawler, website)


async def crawl_sites(
    websites: list[str],
    progress_every: int = 25,
) -> dict[str, dict[str, str]]:
    """Crawl many sites concurrently. Returns {website: {url: markdown}}."""
    results: dict[str, dict[str, str]] = {}
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_SITES)

    async def one(crawler: AsyncWebCrawler, website: str) -> None:
        async with semaphore:
            results[website] = await _crawl_site(crawler, website)

    async with AsyncWebCrawler(config=BrowserConfig(headless=True, verbose=False)) as crawler:
        tasks = [one(crawler, w) for w in websites]
        total = len(tasks)
        for i, coro in enumerate(asyncio.as_completed(tasks), 1):
            await coro
            if i % progress_every == 0 or i == total:
                print(f"  Crawled {i}/{total} sites...", flush=True)
    return results
