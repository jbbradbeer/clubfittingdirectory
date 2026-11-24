#!/usr/bin/env python3
"""Hide one listing that shouldn't have been published. DRY RUN unless --commit.

Sets shops.status to inactive (nothing is deleted) and marks the submission it
came from rejected, so it isn't counted as approved. Refuses a claimed or paid
listing. Backs the rows up first; to undo, set status back to 'active'.

Usage: python3 scripts/take_down_listing.py SLUG SUBMISSION_NAME [--commit]
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

args = [a for a in sys.argv[1:] if a != "--commit"]
COMMIT = "--commit" in sys.argv
if len(args) != 2:
    sys.exit(__doc__)
SLUG, NAME = args

ENV = Path(__file__).resolve().parent.parent / "web" / ".env.local"
env = dict((k, v.strip().strip('"')) for k, v in re.findall(r"^([A-Z0-9_]+)=(.*)$", ENV.read_text(), re.M))
BASE = env["NEXT_PUBLIC_SUPABASE_URL"] + "/rest/v1/"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]


def call(method, path, body=None):
    req = urllib.request.Request(
        BASE + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}",
                 "Content-Type": "application/json", "Prefer": "return=representation"},
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read() or "[]")


q = urllib.parse.quote
shops = call("GET", f"shops?select=*&slug=eq.{q(SLUG)}")
subs = call("GET", f"shop_submissions?select=*&name=eq.{q(NAME)}&review_status=eq.approved")
if len(shops) != 1 or len(subs) != 1:
    sys.exit(f"Expected one listing and one approved submission, found {len(shops)} and {len(subs)}. Nothing changed.")
shop, sub = shops[0], subs[0]
if shop["name"] != sub["name"] or shop["state_code"] != sub["state_code"]:
    sys.exit("The listing and submission don't look like the same shop. Nothing changed.")
if shop.get("claimed_at") or shop.get("listing_tier") != "free":
    sys.exit("This listing is claimed or paid. Nothing changed.")
leads = call("GET", f"fitting_requests?select=id&shop_id=eq.{shop['id']}")

print("COMMIT" if COMMIT else "DRY RUN (nothing is written)")
print(f"  listing    {SLUG}: {shop['status']} -> inactive")
print(f"  submission {NAME}: approved -> rejected")
print(f"  golfer requests on it: {len(leads)}")
if not COMMIT:
    sys.exit()

backup = Path.home() / "btg-backups" / f"take-down-{SLUG}-{int(time.time())}.json"
backup.touch(mode=0o600)
backup.write_text(json.dumps({"shop": shop, "submission": sub}, indent=1))
a = call("PATCH", f"shops?id=eq.{shop['id']}&status=eq.active&claimed_at=is.null", {"status": "inactive"})
b = call("PATCH", f"shop_submissions?id=eq.{sub['id']}&review_status=eq.approved", {"review_status": "rejected"}) if a else []
print(f"  wrote: listing {len(a)}, submission {len(b)}; backup {backup}")
