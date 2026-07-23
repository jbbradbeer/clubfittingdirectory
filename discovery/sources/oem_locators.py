"""oem_locators.py — scrape OEM fitter/dealer locators into raw JSON.

Usage: python3 discovery/sources/oem_locators.py --state TX [--brand ping]
Checkpoints per brand+state (rerun-safe). Endpoints documented in
oem_endpoints.md — update BOTH when a locator changes.
"""
import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from discovery.common import CHECKPOINT_DIR, RAW_DIR  # noqa: E402
from discovery.sources import firecrawl_client as fc  # noqa: E402

DELAY = 1.5   # seconds between calls per Global Constraints

# rough state centroids (lat, lng) — used to seed the Ping radius search;
# 500-mile radius from these points reliably covers the whole state plus
# some neighbors, which parse_ping() then filters back down to state_code.
STATE_CENTROIDS = {
    "TX": (31.9686, -99.9018),
    "FL": (27.9944, -81.7603),
    "CA": (36.7783, -119.4179),
    "AZ": (34.0489, -111.0937),
    "GA": (32.1656, -82.9001),
}

PING_SEARCH_URL = "https://api.pingtechnology.digital/fittings/locations/v2/locations/search"


def _blank():
    return {"name": "", "address": "", "city": "", "state_code": "",
            "zip": "", "phone": "", "website": "", "source": ""}


def fetch_ping(state: str):
    """POST to Ping's public fitting-locator search API (no auth required).

    Discovered by inspecting the map.locations.fittingmanagement.pingtechnology.digital
    React widget's main JS bundle — see oem_endpoints.md.
    """
    centroid = STATE_CENTROIDS.get(state)
    if centroid is None:
        raise ValueError(f"no centroid configured for state {state}")
    lat, lng = centroid
    body = {
        "latitude": lat,
        "longitude": lng,
        "radius": 500,
        "unitType": "MI",
        "sortBy": "distance",
    }
    req = urllib.request.Request(
        PING_SEARCH_URL,
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "X-Region": "global",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def parse_ping(payload, state: str):
    recs = []
    for item in payload.get("data", []):
        if item.get("state") != state:
            continue
        r = _blank()
        r.update(
            name=(item.get("name") or "").strip(),
            address=(item.get("street") or "").strip(),
            city=(item.get("city") or "").strip(),
            state_code=state,
            zip=(item.get("postalCode") or ""),
            phone=(item.get("phone") or item.get("formattedNumber") or ""),
            website="",
            source="ping",
        )
        if r["name"]:
            recs.append(r)
    return recs


# ── per-brand: fetch_<brand>(state) -> payload, parse_<brand>(payload, state) -> records
# Probed 2026-07-23 — see oem_endpoints.md for full notes per brand, including
# SKIPPED brands (Titleist, Callaway, Mizuno, TaylorMade) and why.

BRANDS = {
    "ping": (fetch_ping, parse_ping),
}


def run_brand(brand: str, state: str):
    ck = CHECKPOINT_DIR / f"oem_{brand}_{state}.done"
    if ck.exists():
        print(f"skip {brand} {state} (checkpointed)")
        return
    fetch, parse = BRANDS[brand]
    try:
        payload = fetch(state)
        records = parse(payload, state)
    except Exception as e:  # noqa: BLE001 — network/parse errors, log & skip
        print(f"FAIL {brand} {state}: {e} — logged, skipping")
        return
    out = RAW_DIR / f"{brand}_{state}.json"
    RAW_DIR.mkdir(exist_ok=True)
    out.write_text(json.dumps(
        {"state": state, "source": brand, "records": records}, indent=1))
    ck.parent.mkdir(exist_ok=True)
    ck.touch()
    print(f"{brand} {state}: {len(records)} records -> {out}")
    time.sleep(DELAY)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--state", required=True)
    ap.add_argument("--brand", choices=sorted(BRANDS), default=None)
    args = ap.parse_args()
    brands = [args.brand] if args.brand else sorted(BRANDS)
    for b in brands:
        run_brand(b, args.state.upper())


if __name__ == "__main__":
    main()
