"""dedupe.py — match discovered shops against the live directory.

Usage:
  python3 discovery/dedupe.py --state TX [--state FL ...]
Reads every discovery/raw/*_{STATE}.json, merges cross-source duplicates,
classifies each candidate vs the shops table (ALL statuses — inactive rows
from the 2026-07-08 cut must never come back), writes
discovery/review/new_shops_{date}.csv for founder review.
"""
import argparse
import csv
import difflib
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "outreach"))
from discovery.common import RAW_DIR, REVIEW_DIR  # noqa: E402
from discovery.normalize import norm_city, norm_name, norm_phone, site_domain  # noqa: E402

FUZZY_DUP = 0.95      # >= this + same city → duplicate
FUZZY_UNCERTAIN = 0.80  # >= this + same city → uncertain (manual eye)


class ExistingIndex:
    """Lookup structures over the live shops table."""

    def __init__(self):
        self.by_phone = {}
        self.by_domain = {}
        self.by_citystate = {}   # (city, state) -> [(norm_name, shop)]

    @classmethod
    def build(cls, shops_rows):
        ix = cls()
        for s in shops_rows:
            p = norm_phone(s.get("phone") or "")
            if p:
                ix.by_phone[p] = s
            d = site_domain(s.get("website") or "")
            if d:
                ix.by_domain[d] = s
            key = (norm_city(s.get("city") or ""), (s.get("state_code") or "").upper())
            ix.by_citystate.setdefault(key, []).append((norm_name(s.get("name") or ""), s))
        return ix


def classify(cand, ix):
    p = norm_phone(cand.get("phone") or "")
    if p and p in ix.by_phone:
        return "duplicate", f"phone matches '{ix.by_phone[p]['name']}'"
    d = site_domain(cand.get("website") or "")
    if d and d in ix.by_domain:
        return "duplicate", f"domain matches '{ix.by_domain[d]['name']}'"
    key = (norm_city(cand.get("city") or ""), (cand.get("state_code") or "").upper())
    cname = norm_name(cand.get("name") or "")
    best, best_shop = 0.0, None
    for ename, shop in ix.by_citystate.get(key, []):
        r = difflib.SequenceMatcher(None, cname, ename).ratio()
        if r > best:
            best, best_shop = r, shop
    if best >= FUZZY_DUP:
        return "duplicate", f"name ~{best:.2f} matches '{best_shop['name']}' same city"
    if best >= FUZZY_UNCERTAIN:
        return "uncertain", f"name ~{best:.2f} similar to '{best_shop['name']}' same city"
    return "new", ""


def _cand_key(c):
    p = norm_phone(c.get("phone") or "")
    if p:
        return ("phone", p)
    return ("namecity", norm_name(c.get("name") or ""),
            norm_city(c.get("city") or ""), (c.get("state_code") or "").upper())


def merge_candidates(cands):
    """Merge the same shop seen by multiple sources; richer field values win."""
    merged = {}
    for c in cands:
        k = _cand_key(c)
        if k not in merged:
            merged[k] = dict(c)
            merged[k]["sources"] = {c.get("source", "?")}
        else:
            m = merged[k]
            m["sources"].add(c.get("source", "?"))
            for f in ("name", "address", "city", "zip", "phone", "website"):
                if len(c.get(f) or "") > len(m.get(f) or ""):
                    m[f] = c[f]
    out = []
    for m in merged.values():
        m["sources"] = ",".join(sorted(m.pop("sources")))
        m.pop("source", None)
        out.append(m)
    return sorted(out, key=lambda m: (m["state_code"], m["city"], m["name"]))


def load_raw(states):
    cands = []
    for f in sorted(RAW_DIR.glob("*.json")):
        blob = json.loads(f.read_text())
        if blob.get("state") in states:
            cands.extend(blob.get("records", []))
    return cands


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--state", action="append", required=True)
    args = ap.parse_args()
    states = [s.upper() for s in args.state]

    from outreach_db import get_all  # noqa: E402 — live read, service key
    shops = get_all("shops", {"select": "id,name,phone,city,state_code,website,status"})
    print(f"loaded {len(shops)} existing shops (all statuses)")
    ix = ExistingIndex.build(shops)

    cands = merge_candidates(load_raw(states))
    print(f"{len(cands)} merged candidates from raw files for {states}")

    REVIEW_DIR.mkdir(exist_ok=True)
    out_path = REVIEW_DIR / f"new_shops_{date.today().isoformat()}.csv"
    counts = {"new": 0, "duplicate": 0, "uncertain": 0}
    with open(out_path, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=[
            "name", "address", "city", "state_code", "zip", "phone",
            "website", "sources", "verdict", "reason", "approved"])
        w.writeheader()
        for c in cands:
            verdict, reason = classify(c, ix)
            counts[verdict] += 1
            if verdict == "duplicate":
                continue     # dropped, but counted
            w.writerow({**{k: c.get(k, "") for k in
                           ("name", "address", "city", "state_code", "zip",
                            "phone", "website", "sources")},
                        "verdict": verdict, "reason": reason,
                        "approved": "yes" if verdict == "new" else ""})
    print(json.dumps({"written": str(out_path), **counts}, indent=2))


if __name__ == "__main__":
    main()
