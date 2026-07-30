#!/usr/bin/env python3
"""
depth_report.py — distribution of differentiating data points per published
listing, plus the enrichment queue.

A "differentiating point" is a populated value in one of the fields that make
a listing quotable in an AI answer: launch_monitors, brands_fitted, known
ownership_type, fitting price, fitting_environment, year_established,
credentials, bay_count, mobile_fitting, in_house_build.

Policy (founder decision 2026-07-30): listings below the 3-point bar are
FLAGGED for enrichment, never unpublished.

Usage: python3 scripts/depth_report.py
Output: histogram to stdout + tasks/enrichment_queue.csv (below-bar listings)
"""

import csv
import urllib.error
import json
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ENV_PATH = REPO / "web" / ".env.local"
QUEUE_PATH = REPO / "tasks" / "enrichment_queue.csv"
MIN_BAR = 3

SELECT = ("slug,name,city,state_code,website,launch_monitors,brands_fitted,"
          "ownership_type,fitting_price_min,fitting_environment,year_established,"
          "credentials,bay_count,mobile_fitting,in_house_build")
# Before migration 017 runs, the six new columns don't exist — report on the
# pre-017 fields so the baseline is measurable either way.
SELECT_PRE_017 = ("slug,name,city,state_code,website,launch_monitors,brands_fitted,"
                  "ownership_type,fitting_price_min,fitting_environment")


def load_env() -> dict[str, str]:
    env = {}
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k] = v.strip()
    return env


def fetch_shops(env: dict[str, str]) -> list[dict]:
    base, key = env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]
    select = SELECT
    shops, page = [], 0
    while True:
        req = urllib.request.Request(
            f"{base}/rest/v1/shops?select={select}&status=eq.active&order=id"
            f"&limit=1000&offset={page * 1000}",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        try:
            with urllib.request.urlopen(req) as resp:
                rows = json.loads(resp.read())
        except urllib.error.HTTPError as e:
            if e.code == 400 and select == SELECT:
                print("NOTE: migration 017 columns missing — reporting pre-017 fields only.\n")
                select = SELECT_PRE_017
                continue
            raise
        shops.extend(rows)
        if len(rows) < 1000:
            return shops
        page += 1


def count_points(s: dict) -> int:
    points = 0
    points += bool(s.get("launch_monitors"))
    points += bool(s.get("brands_fitted"))
    points += s.get("ownership_type") not in (None, "unknown")
    points += s.get("fitting_price_min") is not None
    points += bool(s.get("fitting_environment"))
    points += s.get("year_established") is not None
    points += bool(s.get("credentials"))
    points += s.get("bay_count") is not None
    points += s.get("mobile_fitting") is not None
    points += s.get("in_house_build") is not None
    return points


def main():
    shops = fetch_shops(load_env())
    histogram: dict[int, int] = {}
    queue: list[dict] = []
    for s in shops:
        points = count_points(s)
        histogram[points] = histogram.get(points, 0) + 1
        if points < MIN_BAR:
            queue.append({
                "slug": s["slug"], "name": s["name"],
                "city": s.get("city") or "", "state_code": s.get("state_code") or "",
                "website": s.get("website") or "",
                "points": points,
                "reason": f"below {MIN_BAR}-point differentiation bar",
            })

    print(f"Published listings: {len(shops)}")
    print("\nDifferentiating points per listing:")
    for points in sorted(histogram):
        bar = "#" * max(1, histogram[points] * 60 // len(shops))
        print(f"  {points:>2}: {histogram[points]:>4}  {bar}")
    at_or_above = sum(n for p, n in histogram.items() if p >= MIN_BAR)
    print(f"\nAt/above {MIN_BAR}-point bar: {at_or_above} "
          f"({at_or_above * 100 // len(shops)}%)")
    print(f"Flagged for enrichment:  {len(queue)}")

    QUEUE_PATH.parent.mkdir(exist_ok=True)
    with QUEUE_PATH.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["slug", "name", "city", "state_code",
                                               "website", "points", "reason"])
        writer.writeheader()
        writer.writerows(queue)
    print(f"Enrichment queue → {QUEUE_PATH}")


if __name__ == "__main__":
    main()
