"""
upload_new_shops.py — Add the genuinely-new boutique clubmakers to Supabase.

SAFE BY DESIGN:
  * Dry-run by default: prints exactly what WOULD be added, writes nothing.
    Add the flag  --commit  to actually insert.
  * Re-checks the live database every run and skips any shop already present
    (matched by website domain OR by name+city), so re-running can't create
    duplicates.
  * Cleans website URLs and guarantees unique slugs against live data.

Reading uses the public anon key (from web/.env.local).
Writing requires the service-role key in the environment:
    export SUPABASE_SERVICE_ROLE_KEY="...."
    python3 upload_new_shops.py            # dry run
    python3 upload_new_shops.py --commit   # actually upload

Temporary script — safe to delete after use.
"""

import csv
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(__file__)
NEW_CSV = os.path.join(ROOT, "Boutique Clubmaker List-Grid view.csv")

# Defaults for every new listing (per founder decision: boutique clubmakers)
SHOP_TYPE = "Clubfitter"
OFFERS_FITTING = True

US_STATES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
}


# ─── Helpers ──────────────────────────────────────────────────────
def load_env():
    env = {}
    with open(os.path.join(ROOT, "web", ".env.local"), encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def slugify(text):
    text = (text or "").lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def make_slug(name, city, state_code):
    parts = [slugify(name)]
    if city:
        parts.append(slugify(city))
    if state_code:
        parts.append(state_code.lower().strip())
    return "-".join(parts)


def domain_of(url):
    if not url:
        return ""
    u = url.strip().lower()
    if "//" not in u:
        u = "//" + u
    netloc = urllib.parse.urlparse(u).netloc
    return netloc[4:] if netloc.startswith("www.") else netloc


def clean_website(url):
    """Ensure https:// prefix and drop tracking query strings. '' -> None."""
    if not url or not url.strip():
        return None
    u = url.strip().split("?")[0].rstrip()
    if not u.startswith(("http://", "https://")):
        u = "https://" + u
    return u


def norm_name(s):
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())


def fetch_existing(base_url, key):
    """All active shops: name, city, slug, website (paged)."""
    rows, page, size = [], 0, 1000
    while True:
        params = urllib.parse.urlencode({
            "select": "name,city,slug,website",
            "status": "eq.active",
            "limit": size, "offset": page * size,
        })
        req = urllib.request.Request(
            f"{base_url}/rest/v1/shops?{params}",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        with urllib.request.urlopen(req) as resp:
            batch = json.loads(resp.read().decode("utf-8"))
        rows.extend(batch)
        if len(batch) < size:
            return rows
        page += 1


def upload_batch(base_url, service_key, rows):
    req = urllib.request.Request(
        f"{base_url}/rest/v1/shops",
        data=json.dumps(rows).encode("utf-8"),
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, None
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")


# ─── Main ─────────────────────────────────────────────────────────
def main():
    commit = "--commit" in sys.argv
    env = load_env()
    base_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    anon_key = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    # Service-role key: prefer the environment, fall back to web/.env.local
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") or \
        env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    print("Reading live database to skip anything already present...")
    existing = fetch_existing(base_url, anon_key)
    existing_domains = {domain_of(r.get("website")) for r in existing if r.get("website")}
    existing_namecity = {(norm_name(r["name"]), norm_name(r["city"])) for r in existing}
    existing_slugs = {r["slug"] for r in existing}
    print(f"  {len(existing)} live shops loaded.\n")

    with open(NEW_CSV, newline="", encoding="utf-8-sig") as f:
        new_rows = list(csv.DictReader(f))

    records, skipped = [], 0
    used_slugs = set()
    for row in new_rows:
        name = (row.get("Shop Name") or "").strip()
        city = (row.get("City") or "").strip()
        code = (row.get("State") or "").strip().upper()
        website = clean_website(row.get("Website"))

        if not name or not city or code not in US_STATES:
            skipped += 1
            continue
        # Skip if already on the site (by domain or by name+city)
        d = domain_of(website)
        if (d and d in existing_domains) or \
           ((norm_name(name), norm_name(city)) in existing_namecity):
            skipped += 1
            continue

        # Unique slug vs live data AND vs others in this run
        slug = make_slug(name, city, code)
        base = slug
        n = 1
        while slug in existing_slugs or slug in used_slugs:
            n += 1
            slug = f"{base}-{n}"
        used_slugs.add(slug)

        records.append({
            "slug": slug,
            "status": "active",
            "is_featured": False,
            "listing_tier": "free",
            "name": name,
            "shop_type": SHOP_TYPE,
            "city": city,
            "state": US_STATES[code],
            "state_code": code,
            "website": website,
            "offers_fitting": OFFERS_FITTING,
        })

    print(f"Skipped (already present or invalid): {skipped}")
    print(f"To add: {len(records)}\n")
    for r in records:
        print(f"  + {r['name']:<28} {r['city']}, {r['state_code']:<3} "
              f"slug={r['slug']:<40} site={r['website'] or '(none)'}")

    if not records:
        print("\nNothing to add. Done.")
        return

    if not commit:
        print("\n--- DRY RUN --- nothing was written.")
        print("Re-run with  --commit  (and SUPABASE_SERVICE_ROLE_KEY set) to upload.")
        return

    if not service_key:
        print("\nERROR: --commit given but SUPABASE_SERVICE_ROLE_KEY is not set.")
        print('Run:  export SUPABASE_SERVICE_ROLE_KEY="your-key"  then try again.')
        sys.exit(1)

    print("\nUploading...")
    status, error = upload_batch(base_url, service_key, records)
    if status == 201:
        print(f"SUCCESS: {len(records)} shops added.")
    else:
        print(f"FAILED (HTTP {status}): {error[:400] if error else 'unknown'}")
        sys.exit(1)


if __name__ == "__main__":
    main()
