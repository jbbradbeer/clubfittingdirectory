"""
Push reviewed fitting attributes into the provenance ledger.

Reads tasks/fitting_attrs_crawl.csv (AFTER founder review — delete or fix any
row whose price_snippets look wrong), upserts listing_facts rows as
source='scrape:web' (confidence 0.55), then calls recompute_current_fact so
the winning value is promoted into the shops columns the site reads.

An owner claim (0.9) or admin correction (1.0) always outranks these facts.

IMPORTANT — revalidation webhook: the promotion step updates shops rows one by
one. Before a big run, disable the per-row webhook trigger in the Supabase SQL
Editor, and re-enable + revalidate after (the script prints reminders):
    alter table public.shops disable trigger shops_revalidate_webhook;
    alter table public.shops enable  trigger shops_revalidate_webhook;

Usage:
    python3 push_fitting_facts.py             # dry run — prints what would happen
    python3 push_fitting_facts.py --commit    # actually upload
"""

import argparse
import csv
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT     = Path(__file__).resolve().parent
ENV_PATH = ROOT / "web" / ".env.local"
CSV_PATH = ROOT / "tasks" / "fitting_attrs_crawl.csv"

SOURCE     = "scrape:web"
CONFIDENCE = 0.550


def load_env() -> dict[str, str]:
    env = {}
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k] = v.strip()
    return env


def rest(env, method, path, body=None, prefer=None):
    key = env["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    req = urllib.request.Request(
        f"{env['NEXT_PUBLIC_SUPABASE_URL']}{path}",
        data=json.dumps(body).encode() if body is not None else None,
        headers=headers,
        method=method,
    )
    with urllib.request.urlopen(req) as resp:
        raw = resp.read()
        return json.loads(raw) if raw else None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--commit", action="store_true",
                        help="actually write (default is a dry run)")
    args = parser.parse_args()

    env = load_env()
    if "placeholder" in env.get("SUPABASE_SERVICE_ROLE_KEY", "placeholder").lower():
        sys.exit("SUPABASE_SERVICE_ROLE_KEY missing from web/.env.local — aborting.")

    rows = list(csv.DictReader(CSV_PATH.open()))
    facts = []  # (listing_id, attribute, value_json, source_url)
    for r in rows:
        if r["crawl_status"] != "ok":
            continue
        devices = [d.strip() for d in r["launch_monitors"].split("|") if d.strip()]
        if devices:
            facts.append((r["id"], "launch_monitors", devices, r["website"]))
        if r["price_min"]:
            facts.append((r["id"], "fitting_price_min", int(r["price_min"]), r["website"]))
        if r["price_max"]:
            facts.append((r["id"], "fitting_price_max", int(r["price_max"]), r["website"]))

    by_attr = {}
    for _, attr, _, _ in facts:
        by_attr[attr] = by_attr.get(attr, 0) + 1
    print(f"CSV rows: {len(rows)} — facts to write: {len(facts)} {by_attr}")

    if not args.commit:
        for listing_id, attr, value, _ in facts[:10]:
            print(f"  would upsert  {listing_id}  {attr} = {value!r}")
        if len(facts) > 10:
            print(f"  ... and {len(facts) - 10} more")
        print("\nDry run only. Re-run with --commit to upload.")
        return

    print("\nREMINDER: the webhook trigger should be DISABLED for a bulk run:")
    print("  alter table public.shops disable trigger shops_revalidate_webhook;")
    if input("Type 'yes' if the trigger is disabled (or the run is small): ") != "yes":
        sys.exit("Aborted.")

    # 1. Upsert facts — merge-duplicates matches unique (listing_id, attribute, source)
    BATCH = 200
    payload = [
        {
            "listing_id": listing_id,
            "attribute": attr,
            "value": value,
            "source": SOURCE,
            "source_url": url,
            "confidence": CONFIDENCE,
            "verified_by": "system",
        }
        for listing_id, attr, value, url in facts
    ]
    for i in range(0, len(payload), BATCH):
        rest(env, "POST", "/rest/v1/listing_facts?on_conflict=listing_id,attribute,source",
             payload[i : i + BATCH],
             prefer="resolution=merge-duplicates,return=minimal")
        print(f"  upserted {min(i + BATCH, len(payload))}/{len(payload)} facts")

    # 2. Promote each (listing, attribute) via recompute_current_fact
    pairs = sorted({(listing_id, attr) for listing_id, attr, _, _ in facts})
    for n, (listing_id, attr) in enumerate(pairs, 1):
        try:
            rest(env, "POST", "/rest/v1/rpc/recompute_current_fact",
                 {"p_listing_id": listing_id, "p_attribute": attr})
        except urllib.error.HTTPError as e:
            print(f"  RPC failed for {listing_id}/{attr}: {e}")
        if n % 100 == 0 or n == len(pairs):
            print(f"  promoted {n}/{len(pairs)}")

    print("\n✅ Facts pushed and promoted.")
    print("Now in the SQL Editor:")
    print("  alter table public.shops enable trigger shops_revalidate_webhook;")
    print("Then trigger one manual revalidation pass (POST /api/revalidate).")


if __name__ == "__main__":
    main()
