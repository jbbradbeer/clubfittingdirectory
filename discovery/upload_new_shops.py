"""upload_new_shops.py — insert founder-approved discovered shops.

SAFE BY DESIGN (same contract as the archived uploader):
  * Dry-run by default; --commit to write.
  * Re-checks live DB every run (phone/domain/name+city) — rerun-safe.
  * Unique slugs guaranteed against live data.
  * Also inserts one outreach row per shop (email_search_status='pending')
    so find_emails.py picks new shops up on its next run.

Usage:
  python3 discovery/upload_new_shops.py discovery/review/new_shops_2026-07-23.csv
  python3 discovery/upload_new_shops.py ... --commit
"""
import argparse
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "outreach"))
from discovery.dedupe import ExistingIndex, classify  # noqa: E402

US_STATES = {  # state_code -> full name (needed for the shops.state column)
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
}


def make_slug(name: str, city: str, state_code: str, taken: set) -> str:
    base = re.sub(r"[^a-z0-9]+", "-",
                  f"{name} {city} {state_code}".lower()).strip("-")
    slug, n = base, 1
    while slug in taken:
        n += 1
        slug = f"{base}-{n}"
    taken.add(slug)
    return slug


def clean_website(url: str) -> str:
    url = (url or "").strip()
    if url and not url.startswith("http"):
        url = "https://" + url
    return url


def row_to_shop(row: dict, taken_slugs: set) -> dict:
    sc = row["state_code"].upper()
    return {
        "name": row["name"].strip(),
        "street": row["address"].strip(),
        "city": row["city"].strip(),
        "state_code": sc,
        "state": US_STATES.get(sc, sc),
        "postal_code": row["zip"].strip(),
        "phone": row["phone"].strip(),
        "website": clean_website(row["website"]),
        "slug": make_slug(row["name"], row["city"], sc, taken_slugs),
        "status": "active",
        "shop_type": "Clubfitter",
        "offers_fitting": True,
    }


def valid_row(row: dict) -> str:
    """Return '' if the row is well-formed enough to insert, else a reason."""
    if not (row.get("name") or "").strip():
        return "missing name"
    if not (row.get("city") or "").strip():
        return "missing city"
    sc = (row.get("state_code") or "").strip().upper()
    if sc not in US_STATES:
        return f"invalid state_code {sc!r}"
    return ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv_path")
    ap.add_argument("--commit", action="store_true")
    args = ap.parse_args()

    from outreach_db import get_all, request  # noqa: E402
    shops = get_all("shops", {"select": "id,name,phone,city,state_code,website,status,slug"})
    ix = ExistingIndex.build(shops)
    taken_slugs = {s["slug"] for s in shops if s.get("slug")}

    to_insert, skipped, rejected = [], [], []
    with open(args.csv_path, newline="") as fh:
        for row in csv.DictReader(fh):
            if row.get("approved", "").strip().lower() != "yes":
                continue
            reason = valid_row(row)
            if reason:
                rejected.append({"name": row.get("name", ""), "reason": reason})
                continue
            verdict, reason = classify(row, ix)   # re-check live — rerun safety
            if verdict == "duplicate":
                skipped.append({"name": row["name"], "reason": reason})
                continue
            to_insert.append(row_to_shop(row, taken_slugs))

    print(json.dumps({"would_insert": len(to_insert), "skipped_live_dup": skipped,
                      "rejected": rejected}, indent=2))
    for s in to_insert:
        print(f"  + {s['name']} — {s['city']}, {s['state_code']} ({s['slug']})")

    if not args.commit:
        print("\nDRY RUN — nothing written. Add --commit to insert.")
        return
    if not to_insert:
        print("nothing to insert")
        return

    created = request("POST", "shops", body=to_insert,
                      prefer="return=representation")
    if len(created) != len(to_insert):
        print(f"WARNING: inserted {len(created)} shops but expected {len(to_insert)} "
              f"— some rows may have been rejected by the database.")

    outreach_rows = [{"shop_id": s["id"], "email_search_status": "pending"}
                     for s in created]
    try:
        request("POST", "outreach", body=outreach_rows)
    except Exception:
        print("\nSHOPS INSERTED BUT OUTREACH SEEDING FAILED — reconcile these ids:")
        for s in created:
            print(f"  {s.get('id')}  {s.get('slug')}")
        raise

    print(f"INSERTED {len(created)} shops + {len(outreach_rows)} outreach rows")


if __name__ == "__main__":
    main()
