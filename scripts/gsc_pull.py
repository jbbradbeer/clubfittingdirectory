#!/usr/bin/env python3
"""
gsc_pull.py — pull Search Console performance data into tasks/gsc-latest/.

Writes Queries.csv and Pages.csv in the exact shape of a manual GSC export
(Top queries/Top pages, Clicks, Impressions, CTR, Position), plus meta.txt
recording the property and date range. The SEO runbook's maintenance mode
runs this before re-sorting the article queue.

Credentials (either):
  - env GSC_SERVICE_ACCOUNT_JSON  — the service-account key JSON, verbatim
  - gsc-service-account.json      — key file at the repo root (gitignored)
Setup guide for creating the key: tasks/gsc-api-setup.md

Usage:
  python3 scripts/gsc_pull.py                 # last 28 days
  python3 scripts/gsc_pull.py --days 90
  python3 scripts/gsc_pull.py --property sc-domain:clubfittingdirectory.com

No Google SDK needed — signs the service-account JWT directly (requests +
cryptography, both already used by this repo's tooling).
"""

import argparse
import base64
import csv
import json
import os
import sys
import time
from datetime import date, timedelta
from pathlib import Path

import requests
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

REPO_ROOT = Path(__file__).resolve().parent.parent
KEY_FILE = REPO_ROOT / "gsc-service-account.json"
OUT_DIR = REPO_ROOT / "tasks" / "gsc-latest"
TOKEN_URL = "https://oauth2.googleapis.com/token"
SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
API = "https://www.googleapis.com/webmasters/v3"
SITE_CANDIDATES = [
    "sc-domain:clubfittingdirectory.com",
    "https://clubfittingdirectory.com/",
]


def load_key() -> dict:
    raw = os.environ.get("GSC_SERVICE_ACCOUNT_JSON")
    if raw:
        return json.loads(raw)
    if KEY_FILE.exists():
        return json.loads(KEY_FILE.read_text())
    sys.exit(
        "ERROR: no credentials. Set GSC_SERVICE_ACCOUNT_JSON or save the key "
        f"file to {KEY_FILE}.\nSetup guide: tasks/gsc-api-setup.md"
    )


def b64url(data: bytes) -> bytes:
    return base64.urlsafe_b64encode(data).rstrip(b"=")


def access_token(key: dict) -> str:
    now = int(time.time())
    header = b64url(json.dumps({"alg": "RS256", "typ": "JWT"}).encode())
    claims = b64url(
        json.dumps(
            {
                "iss": key["client_email"],
                "scope": SCOPE,
                "aud": TOKEN_URL,
                "iat": now,
                "exp": now + 3600,
            }
        ).encode()
    )
    signing_input = header + b"." + claims
    private_key = serialization.load_pem_private_key(
        key["private_key"].encode(), password=None
    )
    signature = private_key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())
    jwt = (signing_input + b"." + b64url(signature)).decode()

    resp = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": jwt,
        },
        timeout=30,
    )
    if resp.status_code != 200:
        sys.exit(f"ERROR: token exchange failed ({resp.status_code}): {resp.text}")
    return resp.json()["access_token"]


def detect_property(token: str, requested: str | None) -> str:
    headers = {"Authorization": f"Bearer {token}"}
    if requested:
        return requested
    resp = requests.get(f"{API}/sites", headers=headers, timeout=30)
    if resp.status_code == 200:
        entries = resp.json().get("siteEntry", [])
        allowed = [
            e["siteUrl"]
            for e in entries
            if e.get("permissionLevel") != "siteUnverifiedUser"
        ]
        for candidate in SITE_CANDIDATES:
            if candidate in allowed:
                return candidate
        if allowed:
            return allowed[0]
    # Fall back to trying candidates blind (sites.list can be empty for
    # service accounts added at property level in some configurations).
    return SITE_CANDIDATES[0]


def query_rows(token: str, site: str, dimension: str, start: str, end: str) -> list:
    """Fetch all rows for one dimension, paging past the 25k API cap."""
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{API}/sites/{requests.utils.quote(site, safe='')}/searchAnalytics/query"
    rows, start_row = [], 0
    while True:
        body = {
            "startDate": start,
            "endDate": end,
            "dimensions": [dimension],
            "rowLimit": 25000,
            "startRow": start_row,
        }
        resp = requests.post(url, headers=headers, json=body, timeout=60)
        if resp.status_code != 200:
            sys.exit(
                f"ERROR: query failed for {site} ({resp.status_code}): {resp.text}\n"
                "If this is a 403, the service account hasn't been added to the "
                "GSC property — see tasks/gsc-api-setup.md step 3."
            )
        batch = resp.json().get("rows", [])
        rows.extend(batch)
        if len(batch) < 25000:
            return rows
        start_row += len(batch)


def write_csv(path: Path, label: str, rows: list) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow([label, "Clicks", "Impressions", "CTR", "Position"])
        for r in sorted(rows, key=lambda r: r["clicks"], reverse=True):
            ctr = f"{r['ctr'] * 100:.2f}%".replace(".00%", "%")
            w.writerow(
                [r["keys"][0], r["clicks"], r["impressions"], ctr,
                 round(r["position"], 2)]
            )


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--days", type=int, default=28, help="lookback window (default 28)")
    p.add_argument("--property", help="GSC property (default: auto-detect)")
    args = p.parse_args()

    # GSC data lags ~2 days; end the window there so numbers are complete.
    end = date.today() - timedelta(days=2)
    start = end - timedelta(days=args.days)

    key = load_key()
    token = access_token(key)
    site = detect_property(token, args.property)
    print(f"Property: {site}\nWindow:   {start} → {end}")

    queries = query_rows(token, site, "query", str(start), str(end))
    pages = query_rows(token, site, "page", str(start), str(end))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_csv(OUT_DIR / "Queries.csv", "Top queries", queries)
    write_csv(OUT_DIR / "Pages.csv", "Top pages", pages)
    (OUT_DIR / "meta.txt").write_text(
        f"property: {site}\nstart: {start}\nend: {end}\n"
        f"pulled: {date.today()}\nqueries: {len(queries)}\npages: {len(pages)}\n"
    )
    print(f"Wrote {len(queries)} queries, {len(pages)} pages → {OUT_DIR}")


if __name__ == "__main__":
    main()
