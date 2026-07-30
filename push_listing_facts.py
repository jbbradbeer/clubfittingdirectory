"""
Push reviewed listing-depth attributes into the provenance ledger.

Reads tasks/listing_depth_crawl.csv (AFTER founder review — clear any value
cell whose snippet looks wrong; an empty value cell is skipped), upserts
listing_facts rows as source='scrape:web' with each row's per-field
confidence, then calls recompute_current_fact so winning values are promoted
into the shops columns the site reads.

An owner claim (0.9) or admin correction (1.0) always outranks these facts.
Requires migration 017 (the new fact_attributes rows) to be applied first.

IMPORTANT — revalidation webhook: the promotion step updates shops rows one by
one. Before a big run, disable the per-row webhook trigger in the Supabase SQL
Editor, and re-enable + revalidate after (the script prints reminders):
    alter table public.shops disable trigger shops_revalidate_webhook;
    alter table public.shops enable  trigger shops_revalidate_webhook;

Usage:
    python3 push_listing_facts.py             # dry run — prints what would happen
    python3 push_listing_facts.py --commit    # actually upload
"""

import argparse
import csv
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ENV_PATH = ROOT / "web" / ".env.local"
CSV_PATH = ROOT / "tasks" / "listing_depth_crawl.csv"

SOURCE = "scrape:web"
DEFAULT_CONFIDENCE = 0.550

# attribute -> value kind (must match fact_attributes / migration 017)
ATTRIBUTES: dict[str, str] = {
    "launch_monitors":   "text_array",
    "fitting_price_min": "number",
    "fitting_price_max": "number",
    "brands_fitted":     "text_array",
    "year_established":  "number",
    "credentials":       "text_array",
    "bay_count":         "number",
    "mobile_fitting":    "boolean",
    "in_house_build":    "boolean",
}


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


def parse_value(raw: str, kind: str):
    raw = raw.strip()
    if not raw:
        return None
    if kind == "text_array":
        return [v.strip() for v in raw.split("|") if v.strip()] or None
    if kind == "number":
        return int(float(raw))
    if kind == "boolean":
        return raw.lower() in ("true", "1", "yes")
    return raw


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--commit", action="store_true",
                        help="actually write (default is a dry run)")
    args = parser.parse_args()

    env = load_env()
    if "placeholder" in env.get("SUPABASE_SERVICE_ROLE_KEY", "placeholder").lower():
        sys.exit("SUPABASE_SERVICE_ROLE_KEY missing from web/.env.local — aborting.")

    rows = list(csv.DictReader(CSV_PATH.open()))
    facts = []  # dicts ready for listing_facts
    for r in rows:
        if r.get("crawl_status") != "ok":
            continue
        for attr, kind in ATTRIBUTES.items():
            value = parse_value(r.get(attr, ""), kind)
            if value is None:
                continue
            try:
                confidence = float(r.get(f"{attr}_confidence") or DEFAULT_CONFIDENCE)
            except ValueError:
                confidence = DEFAULT_CONFIDENCE
            facts.append({
                "listing_id": r["id"],
                "attribute": attr,
                "value": value,
                "source": SOURCE,
                "source_url": r.get(f"{attr}_source_url") or r["website"],
                "confidence": round(confidence, 3),
                "verified_by": "system",
            })

    by_attr: dict[str, int] = {}
    for fact in facts:
        by_attr[fact["attribute"]] = by_attr.get(fact["attribute"], 0) + 1
    print(f"CSV rows: {len(rows)} — facts to write: {len(facts)} {by_attr}")

    if not args.commit:
        for fact in facts[:10]:
            print(f"  would upsert  {fact['listing_id']}  {fact['attribute']} = {fact['value']!r} (conf {fact['confidence']})")
        if len(facts) > 10:
            print(f"  ... and {len(facts) - 10} more")
        print("\nDry run only. Re-run with --commit to upload.")
        return

    print("\nREMINDER: the webhook trigger should be DISABLED for a bulk run:")
    print("  alter table public.shops disable trigger shops_revalidate_webhook;")
    if input("Type 'yes' if the trigger is disabled (or the run is small): ") != "yes":
        sys.exit("Aborted.")

    BATCH = 200
    for i in range(0, len(facts), BATCH):
        rest(env, "POST", "/rest/v1/listing_facts?on_conflict=listing_id,attribute,source",
             facts[i : i + BATCH],
             prefer="resolution=merge-duplicates,return=minimal")
        print(f"  upserted {min(i + BATCH, len(facts))}/{len(facts)} facts")

    pairs = sorted({(f["listing_id"], f["attribute"]) for f in facts})
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
