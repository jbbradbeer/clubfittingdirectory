#!/usr/bin/env python3
"""
audit_report.py — one-page personalized web-presence report for a prospect.

Takes a shop from tasks/services-prospects.csv (matched by name substring or
listing slug), re-probes their site live so the finding is current, and writes
a plain-English markdown report the founder can paste into an email or attach
as a PDF. This is the outreach hook artifact for the services pitch.

Usage:
  python3 scripts/audit_report.py "A To Z"            # match by name
  python3 scripts/audit_report.py a-to-z-golf-coaching-fitting-center-hampton-ga
  python3 scripts/audit_report.py "A To Z" --no-probe # trust the CSV, skip live check

Output: tasks/reports/<slug>.md (and printed to stdout).
"""

import argparse
import csv
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from website_audit import classify, probe  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
CSV_FILE = REPO_ROOT / "tasks" / "services-prospects.csv"
OUT_DIR = REPO_ROOT / "tasks" / "reports"
CONFIG_FILE = REPO_ROOT / ".claude" / "skills" / "fitter-outreach" / "config.json"

# Plain-English explanation of each problem, written for the shop owner.
PROBLEM_COPY = {
    "dead": (
        "Your website is down",
        "When a golfer Googles you and clicks your website, they hit an error "
        "page instead of your shop. Most people assume a business with a dead "
        "website has closed — they book with whoever loads.",
    ),
    "ssl_error": (
        "Your website shows a security warning",
        "Browsers now show a full-screen \"Your connection is not private\" "
        "warning before your site loads. Most visitors hit Back instead of "
        "\"proceed anyway\" — and Google ranks warned sites lower.",
    ),
    "social_only": (
        "Your only web presence is a social page",
        "A Facebook or Instagram page can't rank in normal Google results the "
        "way a real website does, and it shows visitors ads for other "
        "businesses. Golfers comparing fitters see a shop without its own "
        "site as the less established option.",
    ),
    "redirects_to_social": (
        "Your domain just forwards to a social page",
        "You're paying for a domain that dumps visitors onto a social "
        "network, where they see ads and competing content instead of your "
        "services, prices, and booking button.",
    ),
    "free_builder": (
        "Your site is on a free site builder",
        "Free-builder sites load slowly, look templated on phones, and rank "
        "poorly. Golfers spending a few hundred dollars on a fitting are "
        "judging whether you sweat the details — the website is the first "
        "detail they see.",
    ),
    "http_only": (
        "Your website is flagged \"Not Secure\"",
        "Your site still runs on plain HTTP, so every browser shows a "
        "\"Not Secure\" label next to your name in the address bar. It's a "
        "quick fix — and until it's fixed it quietly costs you trust and "
        "Google ranking.",
    ),
    "none": (
        "You have no website at all",
        "Golfers researching a fitting can't find your services, prices, or "
        "hours anywhere you control. You're invisible in normal Google "
        "results — only directories (like ours) are catching that search "
        "traffic for you.",
    ),
    # seo_basics explanation is assembled from the specific gaps found —
    # see GAP_COPY below. The tuple here is the headline + lead-in.
    "seo_basics": (
        "Your website is missing the basics Google reads",
        "The site loads fine — but when we checked the page itself, it's "
        "missing things Google and phones rely on:",
    ),
}

# Plain-English line per on-page gap (website_audit.seo_gaps codes).
GAP_COPY = {
    "no-title": "The homepage has no title tag, so Google invents its own headline for your shop in search results.",
    "thin-title": "The homepage title is only a few characters, wasting the headline Google shows searchers.",
    "no-meta-description": "There is no page description, so Google improvises the text that appears under your name in results.",
    "no-viewport": "The page isn't flagged mobile-ready, so phones get the desktop layout squeezed down — and most golfers search on their phone.",
    "no-h1": "The page has no main heading, one of the first signals Google reads to understand what you do.",
}


def load_prospect(query: str) -> dict:
    q = query.lower().strip()
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    matches = [
        r for r in rows
        if q in r["name"].lower() or q in r["listing"].rsplit("/", 1)[-1]
    ]
    if not matches:
        sys.exit(f"No prospect matching {query!r} in {CSV_FILE}")
    if len(matches) > 1:
        names = ", ".join(r["name"] for r in matches[:5])
        sys.exit(f"{len(matches)} prospects match {query!r}: {names} — be more specific.")
    return matches[0]


def current_problem(row: dict, do_probe: bool) -> tuple[str, list[str]]:
    """Re-check the site live so we never pitch a fixed/revived site.
    Returns (problem, seo gap codes — only meaningful for seo_basics)."""
    website = row["website"].strip()
    category, _ = classify(website or None)
    if category in ("none", "social_only", "free_builder"):
        return category, []
    if not do_probe:
        return row["problem"], (row.get("details") or "").split(",") if row.get("details") else []
    result, gaps = probe(website)
    if result == "ok":
        if category == "http_only":
            return "http_only", gaps  # still a finding on its own
        return ("seo_basics", gaps) if gaps else ("ok", [])
    return ("dead" if result.startswith("dead") else result), []


def build_report(row: dict, problem: str, gaps: list[str], cal_url: str) -> str:
    slug = row["listing"].rsplit("/", 1)[-1]
    headline, explanation = PROBLEM_COPY[problem]
    if problem == "seo_basics":
        gap_lines = "\n".join(f"- {GAP_COPY[g]}" for g in gaps if g in GAP_COPY)
        explanation = f"{explanation}\n\n{gap_lines}"
    rating_line = ""
    if row["rating"]:
        reviews = f" across {row['reviews']} Google reviews" if row["reviews"] else ""
        rating_line = (
            f"You've earned a **{row['rating']}-star rating**{reviews}. "
            "That reputation is doing the hard part — your web presence is "
            "what's dropping the ball at the last step.\n\n"
        )
    return f"""# Web Presence Report — {row['name']}

**Prepared by clubfittingdirectory.com · {date.today().strftime('%B %-d, %Y')}**

{row['name']} · {row['city']}, {row['state']}
Checked live on the date above — this isn't a form letter.

---

## What we found

### {headline}

`{row['website'] or 'no website on record'}`

{explanation}

{rating_line}---

## What we'd ship

**Shop Site** — a fast, modern 1–3 page website: your services and pricing,
hours, Google reviews, a map, and a "request a fitting" form that lands in
your inbox. Domain and security sorted. From $750 to build, then a small
monthly care plan so it never breaks again.

**Shop Site + Growth** — everything above, plus an AI booking assistant on
your site that answers fitting questions and captures bookings 24/7, a
review-request flow with AI-drafted responses you approve, monthly Google
Business Profile posts written for you, and Featured placement on
clubfittingdirectory.com.

We build and run clubfittingdirectory.com — the directory your listing is
already on — so your site gets built by people who work with fitting shops
all day.

---

## Next step

15-minute call, no pitch deck: {cal_url}

Your free directory listing stays live either way:
https://clubfittingdirectory.com/listing/{slug}
"""


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("query", help="shop name substring or listing slug")
    p.add_argument("--no-probe", action="store_true", help="skip the live re-check")
    args = p.parse_args()

    row = load_prospect(args.query)
    problem, gaps = current_problem(row, do_probe=not args.no_probe)
    if problem in ("ok", "custom"):
        sys.exit(
            f"{row['name']}'s site now checks out ({row['website']}) — the "
            "CSV finding is stale. Don't pitch; re-run website_audit.py --probe."
        )
    if problem not in PROBLEM_COPY:
        sys.exit(f"Unknown problem category {problem!r} — add copy for it first.")

    cal_url = json.loads(CONFIG_FILE.read_text())["CALENDLY_URL"]
    report = build_report(row, problem, gaps, cal_url)

    slug = row["listing"].rsplit("/", 1)[-1]
    OUT_DIR.mkdir(exist_ok=True)
    out_file = OUT_DIR / f"{slug}.md"
    out_file.write_text(report, encoding="utf-8")
    print(report)
    print(f"--- written to {out_file}", file=sys.stderr)


if __name__ == "__main__":
    main()
