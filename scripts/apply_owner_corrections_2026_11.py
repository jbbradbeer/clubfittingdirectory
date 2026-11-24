#!/usr/bin/env python3
"""Apply the corrections owners sent with their claims. DRY RUN unless --commit.

Writes human-verified facts to listing_facts, then recompute_current_fact promotes
them (the same path as applyOwnerFact in web/lib/facts.ts). Hawk's View stays open in
Update Requests: its hours were summer hours, so they are not published.

Undo: delete the fact row (attribute + source below) and recompute.
"""
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
CONF = {"owner": 0.9, "admin": 1.0}
FIT = "https://elevategolfperformancecenter.com/club-fitting/"
WEEK = {d: ["8AM-5PM"] for d in ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")}
FACTS = [
    ("elevate-golf-performance-center-cornelius-nc", "fitting_price_max", 275, "owner", FIT),
    # Not stated by the owner; read from the shop's own fitting page.
    ("elevate-golf-performance-center-cornelius-nc", "fitting_price_min", 150, "admin", FIT),
    ("all-about-golf-tempe-az", "working_hours", {**WEEK, "Saturday": ["9AM-2PM"]}, "owner", None),
    ("hawks-view-golf-club-lake-geneva-wi", "year_established", 2001, "owner", None),
]
DONE = ["elevate-golf-performance-center-cornelius-nc", "all-about-golf-tempe-az"]


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
ok = {}
todo = 0
for slug, attr, value, source, url in FACTS:
    shop = call("GET", f"shops?select=id,claimed_at,{attr}&slug=eq.{slug}&status=eq.active")[0]
    if not shop["claimed_at"]:
        print(f"  SKIP {slug}: not claimed"); continue
    if shop[attr] == value:
        print(f"  done {slug}.{attr}"); ok.setdefault(slug, []).append(True); continue
    todo += 1
    print(f"  {slug}.{attr}: {shop[attr]} -> {value}  ({source})")
    if COMMIT:
        call("POST", "listing_facts?on_conflict=listing_id,attribute,source", {
            "listing_id": shop["id"], "attribute": attr, "value": value, "source": source,
            "source_url": url, "confidence": CONF[source], "verified_by": "human",
        }, "resolution=merge-duplicates,return=minimal")
        call("POST", "rpc/recompute_current_fact", {"p_listing_id": shop["id"], "p_attribute": attr}, "return=minimal")
        after = call("GET", f"shops?select={attr}&slug=eq.{slug}")[0][attr]
        ok.setdefault(slug, []).append(after == value)
        print("     ->", "ok" if after == value else f"FAILED ({after})")
if COMMIT:
    for slug in DONE:
        if ok.get(slug) and all(ok[slug]):
            sid = call("GET", f"shops?select=id&slug=eq.{slug}")[0]["id"]
            call("PATCH", f"listing_update_requests?shop_id=eq.{sid}&review_status=eq.new", {"review_status": "done"})
            print(f"  update request closed: {slug}")
print(f"{todo} to set")
