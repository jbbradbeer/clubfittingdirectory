#!/usr/bin/env python3
"""One-off cleanup after the 2026-11 approvals audit. DRY RUN unless --commit.

1. Deactivate five listings that duplicate one already in the directory
   (status -> inactive; nothing is deleted). Refuses a claimed or paid listing,
   or one whose surviving twin isn't active.
2. Move Rick's Golf World from PA to NY (its website says 228 N Union St,
   Olean, NY 14760) and rename its slug.
3. Copy the messages owners left on approved claims into the Updates tab.

Old addresses are redirected by web/lib/listing-redirects.ts: deploy that first.

Usage: python3 scripts/cleanup_submissions_2026_11.py [--commit]
"""
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

COMMIT = "--commit" in sys.argv
ENV = Path(__file__).resolve().parent.parent / "web" / ".env.local"
env = dict(
    (k, v.strip().strip('"'))
    for k, v in re.findall(r"^([A-Z0-9_]+)=(.*)$", ENV.read_text(), re.M)
)
BASE = env["NEXT_PUBLIC_SUPABASE_URL"] + "/rest/v1/"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]

MERGES = {
    "golf-md-lenexa-ks-ad7dde": "golf-md-lenexa-ks",
    "arkansas-golf-center-conway-ar-7adab3": "arkansas-golf-center-conway-ar",
    "ultimate-fit-golf-minneapolis-mn": "ultimate-fit-golf-llc-columbia-heights-mn",
    "puetz-golf-seattle-superstore-seattle-wa-aef769": "puetz-golf-seattle-superstore-seattle-wa",
    "victory-golf-repair-seattle-wa": "allvictorygolf-kent-wa",
}
RICK_OLD, RICK_NEW = "rick-s-golf-world-olean-pa", "rick-s-golf-world-olean-ny"


def call(method, path, body=None):
    req = urllib.request.Request(
        BASE + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            "apikey": KEY, "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json", "Prefer": "return=representation",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read() or "[]")


def shop(slug):
    rows = call("GET", "shops?select=id,slug,name,status,claimed_at,listing_tier,state_code&slug=eq." + urllib.parse.quote(slug))
    return rows[0] if len(rows) == 1 else None


print("COMMIT" if COMMIT else "DRY RUN (nothing is written)")

print("\n1. Duplicate listings")
for dup_slug, keep_slug in MERGES.items():
    dup, keep = shop(dup_slug), shop(keep_slug)
    if not dup or not keep:
        print(f"  SKIP {dup_slug}: not found"); continue
    if dup["status"] != "active":
        print(f"  done {dup_slug}: already inactive"); continue
    if keep["status"] != "active" or dup["claimed_at"] or dup["listing_tier"] == "featured":
        print(f"  SKIP {dup_slug}: needs a person"); continue
    print(f"  hide {dup_slug}  (keep {keep_slug})")
    if COMMIT:
        call("PATCH", f"shops?id=eq.{dup['id']}&status=eq.active", {"status": "inactive"})

print("\n2. Rick's Golf World")
rick = shop(RICK_OLD)
if not rick:
    print("  done: old address no longer exists")
elif shop(RICK_NEW):
    print("  SKIP: new address is already taken")
else:
    print(f"  {RICK_OLD} -> {RICK_NEW}; PA -> NY; street 228 N Union St, 14760")
    if COMMIT:
        call("PATCH", f"shops?id=eq.{rick['id']}&slug=eq.{RICK_OLD}", {
            "slug": RICK_NEW, "state": "New York", "state_code": "NY",
            "street": "228 N Union St", "postal_code": "14760",
        })

print("\n3. Owner messages to copy into Updates")
claims = call("GET", "shop_claims?select=shop_id,claimant_name,claimant_email,message,shops(slug)&review_status=eq.approved&message=not.is.null")
existing = {(r["shop_id"], r["message"]) for r in call("GET", "listing_update_requests?select=shop_id,message")}
for c in claims:
    if not c["message"].strip():
        continue
    if (c["shop_id"], c["message"]) in existing:
        print(f"  done {c['shops']['slug']}"); continue
    print(f"  copy {c['shops']['slug']}: {' '.join(c['message'].split())[:90]}")
    if COMMIT:
        call("POST", "listing_update_requests", {
            "shop_id": c["shop_id"], "requester_name": c["claimant_name"],
            "requester_email": c["claimant_email"], "payload": {}, "message": c["message"],
        })
