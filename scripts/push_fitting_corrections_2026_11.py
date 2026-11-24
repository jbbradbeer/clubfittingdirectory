#!/usr/bin/env python3
"""Correct listings wrongly marked as not offering fittings. DRY RUN unless --commit.

Reads tasks/review/fitting-corrections-2026-11.csv (founder-reviewed) and, for each
decision=yes row, writes a human-verified 'admin' fact with the page it came from,
then recompute_current_fact promotes it into shops.offers_fitting. The shops column
is never written directly: the next recompute would undo it.

To undo one: delete its listing_facts row (attribute=offers_fitting, source=admin)
and call recompute_current_fact again.
"""
import csv
import json
import re
import sys
import urllib.request
from pathlib import Path

COMMIT = "--commit" in sys.argv
ROOT = Path(__file__).resolve().parent.parent
env = dict((k, v.strip().strip('"')) for k, v in
           re.findall(r"^([A-Z0-9_]+)=(.*)$", (ROOT / "web" / ".env.local").read_text(), re.M))
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]


def call(method, path, body=None, prefer="return=representation"):
    req = urllib.request.Request(
        env["NEXT_PUBLIC_SUPABASE_URL"] + "/rest/v1/" + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}",
                 "Content-Type": "application/json", "Prefer": prefer})
    with urllib.request.urlopen(req, timeout=30) as res:
        raw = res.read()
        return json.loads(raw) if raw else None


print("COMMIT" if COMMIT else "DRY RUN (nothing is written)")
todo = 0
for row in csv.DictReader((ROOT / "tasks/review/fitting-corrections-2026-11.csv").open()):
    if row["decision"] != "yes":
        print(f"  hold {row['slug']}: {row['note']}"); continue
    shops = call("GET", f"shops?select=id,status,offers_fitting&slug=eq.{row['slug']}")
    if len(shops) != 1 or shops[0]["status"] != "active":
        print(f"  SKIP {row['slug']}: not a single active listing"); continue
    shop = shops[0]
    if shop["offers_fitting"]:
        print(f"  done {row['slug']}"); continue
    owner = call("GET", f"listing_facts?select=source&listing_id=eq.{shop['id']}&attribute=eq.offers_fitting&verified_by=eq.human")
    if owner:
        print(f"  SKIP {row['slug']}: a person already set this"); continue
    todo += 1
    print(f"  set  {row['slug']}  <- {row['source_url']}")
    if COMMIT:
        call("POST", "listing_facts?on_conflict=listing_id,attribute,source", {
            "listing_id": shop["id"], "attribute": "offers_fitting", "value": True,
            "source": "admin", "source_url": row["source_url"], "confidence": 1.0, "verified_by": "human",
        }, "resolution=merge-duplicates,return=minimal")
        call("POST", "rpc/recompute_current_fact", {"p_listing_id": shop["id"], "p_attribute": "offers_fitting"}, "return=minimal")
        after = call("GET", f"shops?select=offers_fitting&id=eq.{shop['id']}")[0]["offers_fitting"]
        print("       ->", "ok" if after is True else f"FAILED ({after})")
print(f"{todo} to set")
