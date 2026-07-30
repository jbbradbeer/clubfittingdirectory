#!/usr/bin/env python3
"""
crawler_report.py — AI-crawler traffic report from the crawler_hits table
(migration 018, populated fire-and-forget by web/proxy.ts).

The "is it working" command for AI-search legibility: shows which AI engines
are fetching the site, how often, and which pages they read. Fetch volume here
moves weeks before citations or rankings do.

Usage:
  python3 scripts/crawler_report.py            # last 14 days
  python3 scripts/crawler_report.py --days 30
"""

import argparse
import json
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import date, timedelta
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ENV_PATH = REPO / "web" / ".env.local"


def load_env() -> dict[str, str]:
    env = {}
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k] = v.strip()
    return env


def fetch_hits(env: dict[str, str], days: int) -> list[dict]:
    base, key = env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]
    since = (date.today() - timedelta(days=days)).isoformat()
    hits, offset = [], 0
    while True:
        q = urllib.parse.urlencode({"select": "bot,path,ts", "ts": f"gte.{since}",
                                    "order": "ts.desc", "limit": 1000, "offset": offset})
        req = urllib.request.Request(f"{base}/rest/v1/crawler_hits?{q}",
                                     headers={"apikey": key, "Authorization": f"Bearer {key}"})
        with urllib.request.urlopen(req, timeout=30) as r:
            batch = json.load(r)
        hits += batch
        if len(batch) < 1000:
            return hits
        offset += 1000


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=14)
    args = ap.parse_args()

    hits = fetch_hits(load_env(), args.days)
    print(f"AI-crawler hits, last {args.days} days: {len(hits)}\n")
    if not hits:
        print("No hits recorded yet. After deploy, verify with:")
        print('  curl -sA "GPTBot" https://clubfittingdirectory.com/ > /dev/null')
        return

    by_bot = Counter(h["bot"] for h in hits)
    print("By bot:")
    for bot, n in by_bot.most_common():
        print(f"  {bot:<20} {n}")

    per_day: dict[str, Counter] = defaultdict(Counter)
    for h in hits:
        per_day[h["ts"][:10]][h["bot"]] += 1
    print("\nBy day:")
    for day in sorted(per_day, reverse=True)[:14]:
        top = ", ".join(f"{b}:{n}" for b, n in per_day[day].most_common(4))
        print(f"  {day}  {sum(per_day[day].values()):>4}  ({top})")

    by_path = Counter(h["path"] for h in hits)
    print("\nTop fetched pages:")
    for path, n in by_path.most_common(15):
        print(f"  {n:>4}  {path}")


if __name__ == "__main__":
    main()
