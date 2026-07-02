#!/usr/bin/env python3
"""
export_verification.py — dump unverified emails to CSV for NeverBounce/ZeroBounce.

Only exports what you plan to contact (default segments A,B) so you only pay
to verify addresses you'll use. Upload the CSV to the vendor's pay-as-you-go
bulk verifier, download the results, then run import_verification.py.

Usage:
  python3 outreach/export_verification.py                 # segments A,B
  python3 outreach/export_verification.py --segment A,B,C
"""

import argparse
import csv
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from outreach_db import get_all  # noqa: E402

OUT_DIR = Path(__file__).resolve().parent / "verification"


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--segment", default="A,B")
    args = p.parse_args()
    segments = [s.strip().upper() for s in args.segment.split(",")]

    rows = get_all("outreach", {
        "select": "contact_email,segment",
        "contact_email": "not.is.null",
        "email_verified": "eq.unverified",
        "segment": f"in.({','.join(segments)})",
    })
    emails = sorted({r["contact_email"].lower() for r in rows})
    if not emails:
        print("No unverified emails in those segments.")
        return

    OUT_DIR.mkdir(exist_ok=True)
    out = OUT_DIR / f"export_{date.today().isoformat()}.csv"
    with open(out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["email"])
        w.writerows([e] for e in emails)
    print(f"Wrote {len(emails)} emails -> {out}")
    print("Upload to NeverBounce/ZeroBounce, download results, then run "
          "import_verification.py <results.csv>")


if __name__ == "__main__":
    main()
