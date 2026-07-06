#!/usr/bin/env python3
"""
website_audit.py — rank shops by how badly they need a website overhaul.

Feeds the digital-services pitch: finds thriving shops (high rating, real
review volume, independent, fitting-focused) whose web presence is weak
(no site, social-only, free site builder, dead/broken/insecure site).

Reads the shops table via the Supabase REST API (anon key from
web/.env.local — active shops only, same rows the public site shows) and
optionally live-probes custom-domain sites to catch dead ones.

Usage:
  python3 scripts/website_audit.py               # classify only (no probing)
  python3 scripts/website_audit.py --probe       # also health-check real sites
  python3 scripts/website_audit.py --top 50      # rows in the ranked output

Output: tasks/services-prospects.csv (ranked) + a summary on stdout.
"""

import argparse
import csv
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse

import requests

REPO_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = REPO_ROOT / "web" / ".env.local"
OUT_FILE = REPO_ROOT / "tasks" / "services-prospects.csv"

# "Website" URLs that are really just a social profile.
SOCIAL_HOSTS = (
    "facebook.com", "m.facebook.com", "instagram.com", "linktr.ee",
    "twitter.com", "x.com", "youtube.com", "tiktok.com", "yelp.com",
)
# Free site builders — functional but scream "no web budget/skills".
# business.site (Google Business sites) was shut down by Google in 2024,
# so those links are dead outright.
FREE_BUILDER_HOSTS = (
    "business.site", "wixsite.com", "weebly.com", "square.site",
    "godaddysites.com", "wordpress.com", "sites.google.com",
    "blogspot.com", "webs.com", "webador.com", "mystrikingly.com",
)

# A real browser UA: bot-protection walls (Cloudflare etc.) 403 anything that
# self-identifies as a crawler, which falsely marked healthy sites dead.
PROBE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
}


def env_value(name: str) -> str:
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith(f"{name}="):
            return line.split("=", 1)[1].strip().strip('"')
    sys.exit(f"ERROR: {name} not found in {ENV_FILE}")


def fetch_all_shops() -> list[dict]:
    """Page through the REST API — PostgREST caps a request at 1,000 rows."""
    url = env_value("NEXT_PUBLIC_SUPABASE_URL")
    key = env_value("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    select = (
        "name,slug,city,state_code,website,phone,rating,reviews,"
        "is_chain,shop_type,offers_fitting,claimed_at,business_status"
    )
    shops, offset, page = [], 0, 1000
    while True:
        resp = requests.get(
            f"{url}/rest/v1/shops",
            params={
                "select": select,
                "status": "eq.active",
                "order": "id.asc",
                "offset": offset,
                "limit": page,
            },
            headers=headers,
            timeout=30,
        )
        resp.raise_for_status()
        batch = resp.json()
        shops.extend(batch)
        if len(batch) < page:
            return shops
        offset += page


def classify(website: str | None) -> tuple[str, str]:
    """Return (category, host) for a shop's website field."""
    if not website or not website.strip():
        return "none", ""
    host = (urlparse(website.strip()).hostname or "").lower().removeprefix("www.")
    if any(host == h or host.endswith("." + h) for h in SOCIAL_HOSTS):
        return "social_only", host
    if any(host == h or host.endswith("." + h) for h in FREE_BUILDER_HOSTS):
        return "free_builder", host
    if website.strip().lower().startswith("http://"):
        return "http_only", host
    return "custom", host


def probe(website: str) -> str:
    """Health-check one site: ok / dead / ssl_error / redirects_to_social."""
    try:
        resp = requests.get(
            website, headers=PROBE_HEADERS, timeout=12, allow_redirects=True
        )
        final_host = (urlparse(resp.url).hostname or "").lower().removeprefix("www.")
        if any(final_host == h or final_host.endswith("." + h) for h in SOCIAL_HOSTS):
            return "redirects_to_social"
        # 403/401/429 even with a browser UA is almost always a bot wall in
        # front of a working site, not a broken site — don't call it dead.
        if resp.status_code in (401, 403, 429):
            return "ok"
        if resp.status_code >= 400:
            return f"dead_http_{resp.status_code}"
        return "ok"
    except requests.exceptions.SSLError:
        return "ssl_error"
    except requests.exceptions.RequestException:
        return "dead"


# Why each web-presence problem is worth points: bigger score = easier pitch.
CATEGORY_POINTS = {
    "none": 40,           # nothing to find — invisible online
    "dead": 38,           # had a site, it's gone — worst look for customers
    "social_only": 32,    # Facebook page as a storefront
    "free_builder": 26,   # wix/weebly/business.site — no budget ever spent
    "ssl_error": 22,      # browser scares visitors away
    "redirects_to_social": 30,
    "http_only": 14,      # works, but "Not Secure" in the address bar
    "custom": 0,
}


def score(shop: dict, category: str) -> int:
    pts = CATEGORY_POINTS.get(category, 0)
    if pts == 0:
        return 0
    # Business-strength signals: can they afford $200-500/mo?
    rating = shop.get("rating") or 0
    reviews = shop.get("reviews") or 0
    if rating >= 4.8: pts += 20
    elif rating >= 4.5: pts += 14
    elif rating >= 4.0: pts += 6
    if reviews >= 100: pts += 20
    elif reviews >= 50: pts += 14
    elif reviews >= 20: pts += 8
    elif reviews < 5: pts -= 10   # too small/quiet to buy
    if shop.get("offers_fitting"): pts += 5   # our core audience
    if shop.get("claimed_at"): pts += 15      # already engaged with us!
    return pts


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--probe", action="store_true", help="live-check custom-domain sites")
    p.add_argument("--top", type=int, default=100, help="rows in the output CSV")
    args = p.parse_args()

    shops = fetch_all_shops()
    # Chains have corporate sites and corporate marketing budgets — skip.
    prospects = [s for s in shops if not s.get("is_chain")]
    print(f"Loaded {len(shops)} active shops ({len(prospects)} independent).")

    for s in prospects:
        s["category"], s["host"] = classify(s.get("website"))

    if args.probe:
        custom = [s for s in prospects if s["category"] in ("custom", "http_only")]
        print(f"Probing {len(custom)} real-looking sites (20 at a time)…")
        with ThreadPoolExecutor(max_workers=20) as pool:
            futures = {pool.submit(probe, s["website"]): s for s in custom}
            for i, fut in enumerate(as_completed(futures), 1):
                s = futures[fut]
                result = fut.result()
                if result != "ok":
                    # dead_http_404 etc. all score as "dead"
                    s["category"] = "dead" if result.startswith("dead") else result
                if i % 100 == 0:
                    print(f"  …{i}/{len(custom)}")

    for s in prospects:
        s["score"] = score(s, s["category"])

    ranked = sorted(
        (s for s in prospects if s["score"] > 0),
        key=lambda s: s["score"],
        reverse=True,
    )

    counts: dict[str, int] = {}
    for s in prospects:
        counts[s["category"]] = counts.get(s["category"], 0) + 1
    print("\nWeb-presence breakdown (independent shops):")
    for cat, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"  {cat:20s} {n}")
    print(f"\n{len(ranked)} shops have a fixable web-presence problem.")

    OUT_FILE.parent.mkdir(exist_ok=True)
    with open(OUT_FILE, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow([
            "score", "problem", "name", "city", "state", "rating", "reviews",
            "phone", "website", "listing",
        ])
        for s in ranked[: args.top]:
            w.writerow([
                s["score"], s["category"], s["name"], s.get("city") or "",
                s.get("state_code") or "", s.get("rating") or "",
                s.get("reviews") or "", s.get("phone") or "",
                s.get("website") or "",
                f"https://clubfittingdirectory.com/listing/{s['slug']}",
            ])
    print(f"Top {min(args.top, len(ranked))} written to {OUT_FILE}")


if __name__ == "__main__":
    main()
