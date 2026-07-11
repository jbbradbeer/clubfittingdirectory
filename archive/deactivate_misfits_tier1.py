"""Deactivate Tier 1 misfit listings (2026-07-07 review).

Sets status='inactive' for tier-1 rows in tasks/review/misfit-listings-2026-07-07.csv.
Reversible: rows stay in the DB; flip status back to 'active' to restore.

Usage:
    python3 archive/deactivate_misfits_tier1.py            # dry run (default)
    python3 archive/deactivate_misfits_tier1.py --commit   # apply changes
"""

import csv
import os
import sys

import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(ROOT, "tasks", "review", "misfit-listings-2026-07-07.csv")
ENV_PATH = os.path.join(ROOT, "web", ".env.local")


def load_env():
    env = {}
    with open(ENV_PATH) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def main():
    commit = "--commit" in sys.argv
    env = load_env()
    url = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = env["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    with open(CSV_PATH) as f:
        rows = [r for r in csv.DictReader(f) if r["tier"] == "1"]
    slugs = [r["slug"] for r in rows]
    print(f"Tier 1 misfits in CSV: {len(slugs)}")

    # Check current status of these slugs in the DB
    found = {}
    for i in range(0, len(slugs), 100):
        chunk = slugs[i : i + 100]
        resp = requests.get(
            f"{url}/rest/v1/shops",
            headers=headers,
            params={"slug": f"in.({','.join(chunk)})", "select": "slug,status"},
            timeout=30,
        )
        resp.raise_for_status()
        for row in resp.json():
            found[row["slug"]] = row["status"]

    missing = [s for s in slugs if s not in found]
    already_inactive = [s for s in slugs if found.get(s) == "inactive"]
    to_deactivate = [s for s in slugs if found.get(s) == "active"]

    print(f"Found in DB: {len(found)}")
    print(f"Already inactive: {len(already_inactive)}")
    print(f"Not found (slug mismatch?): {len(missing)}")
    for s in missing:
        print(f"  MISSING: {s}")
    print(f"Will deactivate: {len(to_deactivate)}")

    if not commit:
        print("\nDRY RUN — no changes made. Re-run with --commit to apply.")
        return

    updated = 0
    for i in range(0, len(to_deactivate), 100):
        chunk = to_deactivate[i : i + 100]
        resp = requests.patch(
            f"{url}/rest/v1/shops",
            headers=headers,
            params={"slug": f"in.({','.join(chunk)})"},
            json={"status": "inactive"},
            timeout=30,
        )
        resp.raise_for_status()
        updated += len(resp.json())
    print(f"\nDeactivated {updated} listings.")


if __name__ == "__main__":
    main()
