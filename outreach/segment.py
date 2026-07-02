#!/usr/bin/env python3
"""
segment.py — tag every outreach row A, B, or C. Idempotent; never overwrites A.

  Segment A: founder-provided CSV of shops he knows/has featured.
             CSV needs a `slug` column, or `name` (+ optional `state_code`).
             Exact slug matches apply silently; fuzzy name matches are shown
             and confirmed interactively.
  Segment B: state in the priority list AND has a website AND shop_type in
             (Clubfitter, Retailer) AND not a chain (is_chain).
  Segment C: everyone else.

Usage:
  python3 outreach/segment.py                       # tag B and C
  python3 outreach/segment.py --csv my_people.csv   # tag A first, then B/C
  python3 outreach/segment.py --include-chains      # let chains into B
"""

import argparse
import csv
import difflib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from outreach_db import get_all, log_event, request  # noqa: E402

B_STATES = ("PA", "NY", "NJ", "TX", "FL", "CA", "OH", "MA", "IL", "GA")
B_TYPES = ("Clubfitter", "Retailer")  # exact shop_type values from the DB
CHUNK = 50


def set_segment(outreach_ids: list[str], segment: str, reason: str):
    for i in range(0, len(outreach_ids), CHUNK):
        chunk = outreach_ids[i:i + CHUNK]
        request("PATCH", "outreach",
                params={"id": f"in.({','.join(chunk)})"},
                body={"segment": segment}, prefer="return=minimal")
        for oid in chunk:
            log_event(oid, "segment_assigned", {"segment": segment, "reason": reason})


def load_rows():
    return get_all("outreach", {
        "select": "id,segment,shops!inner(slug,name,city,state_code,shop_type,website,is_chain)",
    })


def tag_segment_a(rows: list[dict], csv_path: str):
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        wanted = list(csv.DictReader(f))
    by_slug = {r["shops"]["slug"]: r for r in rows}
    names = {r["shops"]["name"].lower(): r for r in rows}

    matched, unmatched = [], []
    for w in wanted:
        slug = (w.get("slug") or "").strip()
        name = (w.get("name") or "").strip()
        state = (w.get("state_code") or "").strip().upper()
        if slug and slug in by_slug:
            matched.append((by_slug[slug], f"slug:{slug}"))
            continue
        if name and name.lower() in names:
            matched.append((names[name.lower()], f"name:{name}"))
            continue
        # Fuzzy: closest names, filtered by state if given — confirm interactively.
        pool = [r for r in rows if not state or r["shops"]["state_code"] == state]
        close = difflib.get_close_matches(
            name.lower(), [r["shops"]["name"].lower() for r in pool], n=3, cutoff=0.6)
        if close:
            print(f'\nCSV row "{name}" ({state or "any state"}) — closest listings:')
            options = [next(r for r in pool if r["shops"]["name"].lower() == c) for c in close]
            for idx, r in enumerate(options, 1):
                s = r["shops"]
                print(f"  {idx}. {s['name']} — {s['city']}, {s['state_code']} ({s['slug']})")
            choice = input("Pick 1-3, or Enter to skip: ").strip()
            if choice in ("1", "2", "3") and int(choice) <= len(options):
                matched.append((options[int(choice) - 1], f"fuzzy:{name}"))
                continue
        unmatched.append(name or slug)

    ids = [r["id"] for r, _ in matched if r["segment"] != "A"]
    if ids:
        set_segment(ids, "A", "founder CSV")
    print(f"\nSegment A: {len(matched)} matched ({len(ids)} newly tagged)")
    if unmatched:
        print(f"  Unmatched CSV rows (fix and re-run): {unmatched}")


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--csv", help="Segment A CSV (slug or name[,state_code] columns)")
    p.add_argument("--include-chains", action="store_true")
    args = p.parse_args()

    rows = load_rows()

    if args.csv:
        tag_segment_a(rows, args.csv)
        rows = load_rows()  # refresh so A wins over B below

    b_ids = [r["id"] for r in rows
             if r["segment"] is None
             and r["shops"]["state_code"] in B_STATES
             and (r["shops"]["website"] or "").strip()
             and r["shops"]["shop_type"] in B_TYPES
             and (args.include_chains or not r["shops"]["is_chain"])]
    if b_ids:
        set_segment(b_ids, "B", "priority state + website + fitter/retailer")

    rows = load_rows()
    c_ids = [r["id"] for r in rows if r["segment"] is None]
    if c_ids:
        set_segment(c_ids, "C", "default")

    rows = load_rows()
    counts = {}
    for r in rows:
        counts[r["segment"] or "-"] = counts.get(r["segment"] or "-", 0) + 1
    print("\n=== Segment counts ===")
    for seg in ("A", "B", "C"):
        print(f"  {seg}: {counts.get(seg, 0)}")


if __name__ == "__main__":
    main()
