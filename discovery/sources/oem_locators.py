"""oem_locators.py — scrape OEM fitter/dealer locators into raw JSON.

Usage: python3 discovery/sources/oem_locators.py --state TX [--brand ping]
Checkpoints per brand+state (rerun-safe). Endpoints documented in
oem_endpoints.md — update BOTH when a locator changes.
"""
import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from discovery.common import CHECKPOINT_DIR, RAW_DIR  # noqa: E402
from discovery.sources import firecrawl_client as fc  # noqa: E402

DELAY = 1.5   # seconds between calls per Global Constraints
PING_RADIUS_MI = 350  # per-query-point radius; multiple points per large
                       # state give overlapping coverage (see below) rather
                       # than relying on one wide 500mi radius that can miss
                       # far corners (Rio Grande Valley, far-north CA, etc.).
                       # 350mi (not the initially-tried 300mi) was chosen
                       # empirically for TX: at 300mi, Dallas-Amarillo
                       # (~334mi) and Houston-McAllen (~301mi) both fell
                       # just outside radius and dropped real records vs.
                       # the old single-centroid/500mi baseline — see
                       # oem_endpoints.md "Cap check" section.
# round hit-counts that look like a server-side page/result cap, worth a
# note in oem_endpoints.md if seen (see fetch_ping's cap check below)
SUSPICIOUS_ROUND_COUNTS = {50, 100, 150, 200, 250, 500, 1000}

# 2-3 query points per large state (chosen to spread coverage across the
# state's population centers/geographic extremes) so a single centroid +
# radius doesn't miss shop clusters at state edges. AZ/GA get 2 points
# since they're smaller/less sprawling than TX/CA/FL. Each point uses
# PING_RADIUS_MI with overlap between points.
STATE_QUERY_POINTS = {
    "TX": [
        (32.7767, -96.7970),   # Dallas
        (29.7604, -95.3698),   # Houston
        (31.7619, -106.4850),  # El Paso (covers far-west TX)
    ],
    "CA": [
        (34.0522, -118.2437),  # Los Angeles
        (37.7749, -122.4194),  # San Francisco
        (40.5865, -122.3917),  # Redding (covers far-north CA)
    ],
    "FL": [
        (25.7617, -80.1918),   # Miami
        (30.3322, -81.6557),   # Jacksonville (covers the panhandle-ward north)
    ],
    "AZ": [
        (33.4484, -112.0740),  # Phoenix
        (32.2226, -110.9747),  # Tucson
    ],
    "GA": [
        (33.7490, -84.3880),   # Atlanta
        (32.0809, -81.0912),   # Savannah (covers the coast)
    ],
}

PING_SEARCH_URL = "https://api.pingtechnology.digital/fittings/locations/v2/locations/search"


def _blank():
    return {"name": "", "address": "", "city": "", "state_code": "",
            "zip": "", "phone": "", "website": "", "source": ""}


def _http_json(url, headers, data=None, method="GET", timeout=30):
    """Minimal retry-once HTTP-JSON helper: try once, sleep 3s, retry once,
    then let the exception propagate. Used for every direct (non-Firecrawl)
    HTTP call so one transient blip doesn't cause a permanent skip.
    """
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except (urllib.error.URLError, OSError, TimeoutError):
        time.sleep(3)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())


def fetch_ping(state: str):
    """POST to Ping's public fitting-locator search API (no auth required),
    once per query point for the state, merging + deduping the results.

    Discovered by inspecting the map.locations.fittingmanagement.pingtechnology.digital
    React widget's main JS bundle — see oem_endpoints.md.
    """
    points = STATE_QUERY_POINTS.get(state)
    if points is None:
        raise ValueError(f"no query points configured for state {state}")

    seen = set()
    merged = []
    for i, (lat, lng) in enumerate(points):
        body = {
            "latitude": lat,
            "longitude": lng,
            "radius": PING_RADIUS_MI,
            "unitType": "MI",
            "sortBy": "distance",
        }
        payload = _http_json(
            PING_SEARCH_URL,
            headers={"Content-Type": "application/json", "X-Region": "global"},
            data=json.dumps(body).encode(),
            method="POST",
        )
        hits = payload.get("data", [])
        if len(hits) in SUSPICIOUS_ROUND_COUNTS:
            print(f"WARNING: ping query point ({lat}, {lng}) for {state} "
                  f"returned a suspiciously round count ({len(hits)}) — "
                  f"possible API result cap, consider splitting this point "
                  f"into smaller radii (see oem_endpoints.md)")
        for item in hits:
            key = ((item.get("name") or "").strip().lower(),
                   (item.get("street") or "").strip().lower())
            if key in seen:
                continue
            seen.add(key)
            merged.append(item)
        if i < len(points) - 1:
            time.sleep(DELAY)  # politeness delay between calls to the same host

    return {"statusCode": 200, "statusMessage": "OK", "data": merged}


PING_FITTING_BADGES = (
    "badgeFitterOfTheYear",
    "badgeCertifiedFitter",
    "badgeFittingExperience",
    "badgeCustomFittingExperience",
)


def parse_ping(payload, state: str):
    recs = []
    for item in payload.get("data", []):
        if item.get("state") != state:
            continue
        if not any(item.get(b) for b in PING_FITTING_BADGES):
            continue  # no fitting badge — a bare dealer/pro-shop listing, not a fitter
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
    except (fc.FirecrawlError, OSError, urllib.error.URLError, TimeoutError) as e:
        # transport-level failures only (network/timeout/Firecrawl errors) —
        # these are routine, transient, and safe to skip. Anything else
        # (KeyError, TypeError, etc. from a payload-shape bug) is a real
        # bug and should surface loudly rather than being logged as a skip.
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
