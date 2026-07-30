#!/usr/bin/env python3
"""
verify_ai_crawl.py — prove AI crawlers can read the site's raw HTML.

Samples URLs across every page type (home, directory, states index, state,
city, category, listing, guides), fetches each one with every AI crawler
user agent we care about, and asserts:

  1. HTTP 200
  2. an <h1 present in the raw body (no JavaScript executed)
  3. a page-specific string in the raw body (e.g. the shop's name derived
     from its slug) — proves real content, not a shell/skeleton

Outputs a pass/fail table. Exit code 0 only if every cell passes.

Usage:
  python3 scripts/verify_ai_crawl.py             # sample 20 URLs, all bots
  python3 scripts/verify_ai_crawl.py --quick     # 6 URLs, 3 bots (smoke test)

Run against production. This is the standing regression check for AI
crawlability — run after any rendering/middleware/robots change.
"""

import argparse
import random
import re
import sys
import urllib.request
from xml.etree import ElementTree

SITE = "https://clubfittingdirectory.com"

BOTS = {
    "GPTBot": "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)",
    "OAI-SearchBot": "Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)",
    "ChatGPT-User": "Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)",
    "ClaudeBot": "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    "Claude-User": "Mozilla/5.0 (compatible; Claude-User/1.0; +claude-user@anthropic.com)",
    "Claude-SearchBot": "Mozilla/5.0 (compatible; Claude-SearchBot/1.0)",
    "PerplexityBot": "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
    "Perplexity-User": "Mozilla/5.0 (compatible; Perplexity-User/1.0)",
    "Googlebot": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Bingbot": "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Applebot": "Mozilla/5.0 (compatible; Applebot/0.1; +http://www.apple.com/go/applebot)",
    "Amazonbot": "Mozilla/5.0 (compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot)",
    "meta-externalagent": "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
    "cohere-ai": "cohere-ai",
    "bare-curl": "curl/8.4.0",
}
QUICK_BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot"]

# Static pages: URL path -> string that must appear in the raw body.
STATIC_PAGES = {
    "/": "club fitting",
    "/directory": "fitters",
    "/states": "state",
    "/guides": "fitting",
}


def fetch(url: str, ua: str) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": ua})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception:
        return 0, ""


def sitemap_urls() -> list[str]:
    _, xml = fetch(f"{SITE}/sitemap.xml", BOTS["bare-curl"])
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    tree = ElementTree.fromstring(xml)
    return [loc.text for loc in tree.findall(".//s:loc", ns)]


def slug_token(url: str) -> str:
    """Distinctive lowercase token from the URL slug — must appear in body."""
    slug = url.rstrip("/").split("/")[-1]
    words = [w for w in slug.split("-") if len(w) > 3 and not w.isdigit()]
    return words[0] if words else slug


def sample_urls(n_listings: int, quick: bool) -> list[tuple[str, str]]:
    """Return (url, expected-string) pairs across all page types."""
    urls = sitemap_urls()
    rng = random.Random(2026)  # deterministic sample
    by = lambda seg: [u for u in urls if f"{SITE}/{seg}/" in u]

    picks: list[tuple[str, str]] = []
    for path, expect in (list(STATIC_PAGES.items())[:2] if quick else STATIC_PAGES.items()):
        picks.append((SITE + ("" if path == "/" else path), expect))
    for seg, count in (("state", 1 if quick else 2), ("city", 1 if quick else 3),
                       ("category", 0 if quick else 2), ("listing", 2 if quick else n_listings)):
        pool = by(seg)
        for u in rng.sample(pool, min(count, len(pool))):
            picks.append((u, slug_token(u)))
    return picks


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--quick", action="store_true", help="6 URLs x 3 bots smoke test")
    args = ap.parse_args()

    bots = {k: BOTS[k] for k in QUICK_BOTS} if args.quick else BOTS
    pages = sample_urls(n_listings=9, quick=args.quick)

    print(f"Checking {len(pages)} URLs x {len(bots)} user agents "
          f"({len(pages) * len(bots)} fetches)\n")

    failures = 0
    header = f"{'URL':<58} " + " ".join(f"{b[:9]:>9}" for b in bots)
    print(header)
    print("-" * len(header))
    for url, expect in pages:
        row = f"{url.replace(SITE, '') or '/':<58} "
        cells = []
        for bot, ua in bots.items():
            status, body = fetch(url, ua)
            low = body.lower()
            ok = status == 200 and "<h1" in low and expect.lower() in low
            if not ok:
                failures += 1
                why = str(status) if status != 200 else ("no-h1" if "<h1" not in low else "no-str")
                cells.append(f"{'FAIL:' + why:>9}")
            else:
                cells.append(f"{'pass':>9}")
        print(row + " ".join(cells))

    print(f"\n{'ALL GREEN' if failures == 0 else f'{failures} FAILURES'} "
          f"({len(pages) * len(bots) - failures}/{len(pages) * len(bots)} passed)")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
