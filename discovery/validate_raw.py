"""validate_raw.py — gate hand-assembled raw JSON before dedupe trusts it.

Usage: python3 discovery/validate_raw.py discovery/raw/openseo_TX.json
Exit 0 = valid; exit 1 prints one problem per line.
"""
import json
import sys
from pathlib import Path

FIELDS = ("name", "address", "city", "state_code", "zip",
          "phone", "website", "source")


def validate(path: Path) -> list:
    problems = []
    try:
        blob = json.loads(Path(path).read_text())
    except (OSError, ValueError) as e:
        return [f"unreadable: {e}"]
    for k in ("state", "source", "records"):
        if k not in blob:
            problems.append(f"top-level key missing: {k}")
    for i, r in enumerate(blob.get("records", [])):
        for f in FIELDS:
            if f not in r:
                problems.append(f"record {i}: missing field {f}")
            elif not isinstance(r[f], str):
                problems.append(f"record {i}: {f} must be str, got {type(r[f]).__name__}")
        if r.get("name", "") == "":
            problems.append(f"record {i}: empty name")
        if r.get("state_code") != blob.get("state"):
            problems.append(f"record {i}: state_code {r.get('state_code')!r} != file state {blob.get('state')!r}")
    return problems


if __name__ == "__main__":
    probs = validate(Path(sys.argv[1]))
    for p in probs:
        print(p)
    sys.exit(1 if probs else 0)
