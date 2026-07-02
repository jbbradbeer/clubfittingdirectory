#!/usr/bin/env python3
"""
find_emails.py — discover contact emails for shops in the outreach table.

The shops table has no email column; this script fetches each shop's website
(homepage, then /contact and /about plus any contact-ish links found on the
homepage), extracts the best email, and PATCHes it onto the shop's outreach
row. shops itself is never written.

Politeness: 5 shops in flight at once (different domains), pages within one
site fetched sequentially with a 1.5s gap, 20s timeout, browser User-Agent.

Idempotent: rows are selected by email_search_status='pending', so re-runs
skip completed shops. A local JSON checkpoint is kept as a fast cache only —
the DB is the source of truth. Use --retry-failed to revisit fetch_failed.

Usage:
  python3 outreach/find_emails.py --state PA --limit 25    # pilot
  python3 outreach/find_emails.py --limit 200              # any state
  python3 outreach/find_emails.py --retry-failed --state PA
"""

import argparse
import gzip
import html as html_lib
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from outreach_db import get_all, log_event, patch_row  # noqa: E402

CONCURRENCY = 5
PAGE_TIMEOUT = 20
PER_PAGE_GAP = 1.5
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/125.0 Safari/537.36")

CHECKPOINT_DIR = Path(__file__).resolve().parent / "checkpoints"

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
# "name [at] domain [dot] com" and "name(at)domain.com" style obfuscation
OBFUSCATED_RE = re.compile(
    r"([A-Za-z0-9._%+-]+)\s*[\[\(]\s*at\s*[\]\)]\s*([A-Za-z0-9.-]+?)"
    r"(?:\s*[\[\(]\s*dot\s*[\]\)]\s*([A-Za-z]{2,}))?",
    re.IGNORECASE,
)

# Reject emails whose local part or domain contains any of these.
JUNK_SUBSTRINGS = (
    "wix", "sentry", "godaddy", "example.", "noreply", "no-reply", "donotreply",
    "privacy@", "abuse@", "dmca@", "webmaster@", "postmaster@", "mailer-daemon",
    "squarespace", "shopify", "wordpress", "cloudflare", "recaptcha", "schema.org",
    "yourdomain", "domain.com", "email.com", "@2x", "u003e",
    "mystore.com",   # website-template placeholder (found on multiple PA sites)
    "mysite.com",    # Wix template placeholder
    "sudtipos",      # font foundry credit embedded in site code
    "latofonts",     # ditto (Lato typeface)
    "fontsquirrel", "typekit", "fonts.com", "myfonts",
    "filesusr",      # Wix asset domain
)
# Image-artifact "emails" like logo@2x.png that the regex can catch.
IMAGE_EXT_RE = re.compile(r"\.(png|jpe?g|gif|webp|svg|css|js)$", re.IGNORECASE)

CONTACT_PATHS = ("/contact", "/contact-us", "/about", "/about-us")
CONTACT_LINK_RE = re.compile(
    r'href=["\']([^"\']*(?:contact|about)[^"\']*)["\']', re.IGNORECASE)


def fetch(url: str) -> str | None:
    req = urllib.request.Request(url, headers={
        "User-Agent": UA, "Accept": "text/html,*/*", "Accept-Encoding": "gzip",
    })
    try:
        with urllib.request.urlopen(req, timeout=PAGE_TIMEOUT) as resp:
            raw = resp.read(2_000_000)  # 2 MB cap
            if resp.headers.get("Content-Encoding") == "gzip":
                raw = gzip.decompress(raw)
            return raw.decode("utf-8", errors="ignore")
    except Exception:
        return None


def is_junk(email: str) -> bool:
    e = email.lower()
    if IMAGE_EXT_RE.search(e):
        return True
    return any(j in e for j in JUNK_SUBSTRINGS)


def extract_emails(page_html: str) -> list[tuple[str, str]]:
    """Return [(email, source)] found on a page, junk filtered, order preserved."""
    text = html_lib.unescape(page_html)
    found: list[tuple[str, str]] = []
    seen: set[str] = set()

    for m in re.finditer(r'href=["\']mailto:([^"\'?]+)', text, re.IGNORECASE):
        e = m.group(1).strip().lower()
        if EMAIL_RE.fullmatch(e) and not is_junk(e) and e not in seen:
            seen.add(e)
            found.append((e, "mailto"))

    for m in EMAIL_RE.finditer(text):
        e = m.group(0).strip(".").lower()
        if not is_junk(e) and e not in seen:
            seen.add(e)
            found.append((e, "regex"))

    for m in OBFUSCATED_RE.finditer(text):
        local, dom, tld = m.group(1), m.group(2), m.group(3)
        e = f"{local}@{dom}.{tld}".lower() if tld else f"{local}@{dom}".lower()
        if EMAIL_RE.fullmatch(e) and not is_junk(e) and e not in seen:
            seen.add(e)
            found.append((e, "obfuscated"))

    return found


def site_domain(website: str) -> str:
    netloc = urllib.parse.urlparse(website).netloc.lower()
    return netloc.removeprefix("www.")


def rank(candidates: list[tuple[str, str]], website: str) -> tuple[str, str] | None:
    """Pick the single best (email, source). Same-domain beats platform/personal;
    mailto beats regex; friendly locals beat generic ones; gmail/yahoo last."""
    if not candidates:
        return None
    domain = site_domain(website)
    friendly = ("info", "hello", "contact", "fitting", "golf", "shop", "bookings")
    personal_providers = ("gmail.com", "yahoo.com", "aol.com", "hotmail.com",
                          "outlook.com", "icloud.com", "comcast.net", "verizon.net")

    def score(item):
        email, source = item
        local, _, dom = email.partition("@")
        s = 0
        if domain and (dom == domain or dom.endswith("." + domain)):
            s += 100
        elif dom in personal_providers:
            s += 20   # small fitters often use these — acceptable, ranked low
        else:
            s += 40   # other business domain (could be an old domain of theirs)
        if source == "mailto":
            s += 15
        if any(local.startswith(f) for f in friendly):
            s += 10
        if local.startswith(("sales", "marketing", "billing", "support")):
            s -= 10
        return -s

    return sorted(candidates, key=score)[0]


def contact_links_on(page_html: str, base_url: str) -> list[str]:
    links = []
    for m in CONTACT_LINK_RE.finditer(page_html):
        href = m.group(1)
        if href.startswith(("mailto:", "tel:", "#", "javascript:")):
            continue
        full = urllib.parse.urljoin(base_url, href)
        if site_domain(full) == site_domain(base_url):
            links.append(full.split("#")[0])
    return links


def process_shop(row: dict) -> dict:
    """Fetch up to ~4 pages of one shop's site; return the outcome."""
    shop = row["shops"]
    website = (shop.get("website") or "").strip()
    if not website:
        return {"row": row, "outcome": "no_website"}
    if not website.startswith("http"):
        website = "https://" + website

    urls = [website]
    fetched_any = False
    candidates: list[tuple[str, str]] = []
    tried: set[str] = set()

    while urls and len(tried) < 4:
        url = urls.pop(0)
        if url.rstrip("/") in tried:
            continue
        tried.add(url.rstrip("/"))
        page = fetch(url)
        if page is None:
            continue
        fetched_any = True
        candidates.extend(extract_emails(page))
        # A mailto hit is a strong signal — stop crawling this site.
        if any(src == "mailto" for _, src in candidates):
            break
        if url == website:  # queue standard paths + discovered contact links
            urls.extend(urllib.parse.urljoin(website + "/", p.lstrip("/"))
                        for p in CONTACT_PATHS)
            urls.extend(contact_links_on(page, website)[:2])
        time.sleep(PER_PAGE_GAP)

    if not fetched_any:
        return {"row": row, "outcome": "fetch_failed"}
    best = rank(candidates, website)
    if best is None:
        return {"row": row, "outcome": "not_found"}
    return {"row": row, "outcome": "found", "email": best[0], "source": best[1],
            "all_candidates": [e for e, _ in candidates][:5]}


def save_result(result: dict) -> str:
    """Write one shop's outcome to the DB. Returns a status string for the log."""
    row = result["row"]
    outcome = result["outcome"]

    if outcome == "found":
        try:
            patch_row(row["id"], {
                "contact_email": result["email"],
                "email_source": result["source"],
                "email_search_status": "found",
            })
            log_event(row["id"], "email_discovered", {
                "email": result["email"], "source": result["source"],
                "candidates": result["all_candidates"],
            })
            return f"found: {result['email']}"
        except RuntimeError as e:
            if "duplicate key" in str(e) or "23505" in str(e):
                # Chain locations share an address — keep the first shop only.
                patch_row(row["id"], {
                    "email_search_status": "found",
                    "notes": f"email {result['email']} already used by another location",
                })
                log_event(row["id"], "email_discovered", {
                    "email": result["email"], "duplicate": True})
                return f"duplicate: {result['email']} (left null)"
            raise

    patch_row(row["id"], {"email_search_status": outcome})
    log_event(row["id"], "email_discovered", {"outcome": outcome})
    return outcome


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--state", help="two-letter state_code filter, e.g. PA")
    p.add_argument("--limit", type=int, default=50)
    p.add_argument("--retry-failed", action="store_true",
                   help="revisit rows marked fetch_failed instead of pending")
    args = p.parse_args()

    search_status = "fetch_failed" if args.retry_failed else "pending"
    params = {
        "select": "id,shop_id,shops!inner(name,website,city,state_code)",
        "email_search_status": f"eq.{search_status}",
        "contact_email": "is.null",
        "order": "created_at.asc",
    }
    if args.state:
        params["shops.state_code"] = f"eq.{args.state.upper()}"

    rows = get_all("outreach", params)[: args.limit]
    if not rows:
        print("Nothing to do — no matching rows with that search status.")
        return

    CHECKPOINT_DIR.mkdir(exist_ok=True)
    checkpoint = CHECKPOINT_DIR / f"find_emails_{args.state or 'all'}.json"
    done: dict = json.loads(checkpoint.read_text()) if checkpoint.exists() else {}

    todo = [r for r in rows if r["id"] not in done]
    print(f"Processing {len(todo)} shops ({len(rows) - len(todo)} already in checkpoint)…")

    counts = {"found": 0, "not_found": 0, "fetch_failed": 0, "no_website": 0, "duplicate": 0}
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
        futures = {pool.submit(process_shop, r): r for r in todo}
        for i, fut in enumerate(as_completed(futures), 1):
            row = futures[fut]
            try:
                result = fut.result()
                status = save_result(result)
            except Exception as e:  # noqa: BLE001 — keep the batch alive
                status = f"error: {e}"
            key = status.split(":")[0]
            counts[key] = counts.get(key, 0) + 1
            done[row["id"]] = status
            if i % 10 == 0 or i == len(todo):
                checkpoint.write_text(json.dumps(done, indent=1))
            print(f"  [{i}/{len(todo)}] {row['shops']['name'][:40]:40s} -> {status}")

    print("\n=== Summary ===")
    for k, v in counts.items():
        if v:
            print(f"  {k}: {v}")
    print(f"Checkpoint: {checkpoint}")
    print("Review found emails in Supabase (outreach table) before scaling up.")


if __name__ == "__main__":
    main()
