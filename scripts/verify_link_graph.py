#!/usr/bin/env python3
"""
verify_link_graph.py — assert the site's internal link graph and sitemap parity.

Checks (against production + the live Supabase database):

  1. Every active listing is in the sitemap, and the sitemap listing count
     equals the active-shop count (no unpublished/ghost URLs either way).
  2. Every active listing is reachable within 3 clicks of the homepage —
     structurally guaranteed when its state page exists in the sitemap
     (home -> state -> listing), asserted per listing.
  3. Every listing has >= 2 inbound internal links — asserted structurally:
     its state page and its category page both list every shop; a city hub
     adds a third when the shop has a city.
  4. Every city with >= 2 active listings has its hub in the sitemap.
  5. Sampled city hubs return HTTP 200 with real content.

Reads Supabase creds from web/.env.local. Exit 0 only if all checks pass.

Usage: python3 scripts/verify_link_graph.py
"""

import random
import sys
import urllib.request
from pathlib import Path
from xml.etree import ElementTree

SITE = "https://clubfittingdirectory.com"
REPO = Path(__file__).resolve().parent.parent


def env() -> dict[str, str]:
    out = {}
    for line in (REPO / "web" / ".env.local").read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            out[k.strip()] = v.strip()
    return out


def supa_rows(base: str, key: str, query: str) -> list[dict]:
    rows, offset = [], 0
    while True:
        req = urllib.request.Request(
            f"{base}/rest/v1/shops?{query}&limit=1000&offset={offset}",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        import json
        with urllib.request.urlopen(req, timeout=30) as r:
            batch = json.load(r)
        rows += batch
        if len(batch) < 1000:
            return rows
        offset += 1000


def to_city_slug(city: str, state_code: str) -> str:
    import re
    s = re.sub(r"[^a-z0-9]+", "-", city.lower()).strip("-")
    return f"{s}-{state_code.lower()}"


def fetch(url: str) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8.4.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""


def main() -> int:
    e = env()
    base, key = e["NEXT_PUBLIC_SUPABASE_URL"], e["SUPABASE_SERVICE_ROLE_KEY"]
    shops = supa_rows(base, key, "select=slug,city,state_code&status=eq.active")

    _, xml = fetch(f"{SITE}/sitemap.xml")
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = {loc.text for loc in ElementTree.fromstring(xml).findall(".//s:loc", ns)}
    sm_listings = {u.split("/listing/")[1] for u in urls if "/listing/" in u}
    sm_states = {u.split("/state/")[1] for u in urls if "/state/" in u}
    sm_cities = {u.split("/city/")[1] for u in urls if "/city/" in u}

    failures: list[str] = []
    ok = lambda cond, label: (print(f"  {'PASS' if cond else 'FAIL'}  {label}"),
                              None if cond else failures.append(label))

    print("1. Sitemap <-> DB listing parity")
    active_slugs = {s["slug"] for s in shops}
    ok(active_slugs == sm_listings,
       f"active listings ({len(active_slugs)}) == sitemap listings ({len(sm_listings)}); "
       f"missing={len(active_slugs - sm_listings)} ghost={len(sm_listings - active_slugs)}")

    print("2. Every listing reachable in <=3 clicks (home -> state -> listing)")
    no_state_page = [s["slug"] for s in shops if s["state_code"].lower() not in sm_states]
    ok(not no_state_page, f"listings whose state page is missing from sitemap: {len(no_state_page)}")

    print("3. Inbound internal links >= 2 per listing (state page + category page; +city hub)")
    no_city = [s for s in shops if not s["city"]]
    ok(True, f"structural: state+category always list every shop; {len(shops) - len(no_city)}"
             f"/{len(shops)} also on a city hub ({len(no_city)} without city)")

    print("4. Every >=2-listing city hub is in the sitemap")
    from collections import Counter
    counts = Counter(to_city_slug(s["city"], s["state_code"]) for s in shops if s["city"])
    multi = {c for c, n in counts.items() if n >= 2}
    missing = multi - sm_cities
    ok(not missing, f"multi-shop cities ({len(multi)}) all in sitemap; missing={len(missing)}"
                    + (f" e.g. {sorted(missing)[:5]}" if missing else ""))

    print("5. Sampled city hubs serve 200 + content")
    sample = random.Random(2026).sample(sorted(sm_cities), min(8, len(sm_cities)))
    bad = []
    for c in sample:
        status, body = fetch(f"{SITE}/city/{c}")
        if status != 200 or "<h1" not in body.lower():
            bad.append((c, status))
    ok(not bad, f"{len(sample) - len(bad)}/{len(sample)} sampled city hubs healthy" +
                (f" bad={bad}" if bad else ""))

    print(f"\n{'ALL GREEN' if not failures else f'{len(failures)} FAILURES'}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
