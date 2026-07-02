#!/usr/bin/env python3
"""
import_verification.py — read a NeverBounce or ZeroBounce results CSV and
update outreach.email_verified. Invalid addresses become do_not_contact.

Column detection (case-insensitive):
  NeverBounce: email + one of (result / verification_result / status)
               values: valid | invalid | disposable | catchall | unknown
  ZeroBounce:  "Email Address" + "ZB Status"
               values: valid | invalid | catch-all | do_not_mail | unknown | spamtrap | abuse

Mapping -> outreach.email_verified:
  valid                          -> valid
  invalid, spamtrap, abuse,
  do_not_mail, disposable        -> invalid  (row also set do_not_contact)
  catchall / catch-all           -> risky
  everything else                -> unknown

Usage:
  python3 outreach/import_verification.py outreach/verification/results.csv
"""

import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from outreach_db import get_all, log_event, patch_row  # noqa: E402

INVALID = ("invalid", "spamtrap", "abuse", "do_not_mail", "disposable")
RISKY = ("catchall", "catch-all")


def detect_columns(fieldnames):
    lower = {f.lower().strip(): f for f in fieldnames}
    email_col = next((lower[k] for k in ("email", "email address", "email_address")
                      if k in lower), None)
    result_col = next((lower[k] for k in ("result", "verification_result", "zb status",
                                          "zb_status", "status") if k in lower), None)
    if not email_col or not result_col:
        sys.exit(f"ERROR: couldn't find email/result columns in: {fieldnames}")
    return email_col, result_col


def map_result(raw: str) -> str:
    r = raw.lower().strip()
    if r == "valid":
        return "valid"
    if r in INVALID:
        return "invalid"
    if r in RISKY:
        return "risky"
    return "unknown"


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("results_csv")
    args = p.parse_args()

    with open(args.results_csv, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        email_col, result_col = detect_columns(reader.fieldnames)
        results = {row[email_col].lower().strip(): map_result(row[result_col])
                   for row in reader if row.get(email_col)}
    print(f"Results file: {len(results)} emails ({email_col} / {result_col})")

    rows = get_all("outreach", {
        "select": "id,contact_email,status",
        "contact_email": "not.is.null",
    })

    counts = {"valid": 0, "invalid": 0, "risky": 0, "unknown": 0, "no_result": 0}
    for r in rows:
        verdict = results.get(r["contact_email"].lower())
        if verdict is None:
            counts["no_result"] += 1
            continue
        fields = {"email_verified": verdict}
        if verdict == "invalid" and r["status"] == "not_contacted":
            fields["status"] = "do_not_contact"
            fields["notes"] = "email failed verification"
        patch_row(r["id"], fields)
        log_event(r["id"], "verification_result", {"result": verdict})
        counts[verdict] += 1

    print("\n=== Import summary ===")
    for k, v in counts.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
