"""
migrate_to_supabase.py — Upload golf_directory_enriched.csv to Supabase

Reads the CSV, transforms each row to match the database schema,
generates slugs, and uploads in batches via the Supabase REST API.

Temporary script — delete after use.
"""

import csv
import json
import re
import sys
import urllib.request
import urllib.error
import os

# ─── Config ───────────────────────────────────────────────────────
SUPABASE_URL = "https://omwetnvnorwsxfahghce.supabase.co"
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
CSV_PATH = os.path.join(os.path.dirname(__file__), "golf_directory_enriched.csv")
BATCH_SIZE = 50

if not SERVICE_ROLE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set.")
    sys.exit(1)

# ─── Helpers ──────────────────────────────────────────────────────

def slugify(text):
    """Convert text to URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)   # remove non-alphanumeric
    text = re.sub(r'[\s_]+', '-', text)     # spaces/underscores to hyphens
    text = re.sub(r'-+', '-', text)         # collapse multiple hyphens
    return text.strip('-')


def make_slug(name, city, state_code):
    """Generate unique-ish slug from shop name + city + state."""
    parts = [slugify(name)]
    if city:
        parts.append(slugify(city))
    if state_code:
        parts.append(state_code.lower().strip())
    return '-'.join(parts)


def parse_bool(val):
    """Parse CSV boolean values."""
    if val is None or val == '':
        return None
    return str(val).strip().lower() in ('true', '1', 'yes')


def parse_int(val):
    """Parse CSV integer values."""
    if val is None or val == '':
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def parse_float(val):
    """Parse CSV float values."""
    if val is None or val == '':
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def parse_json(val):
    """Parse CSV JSON string values."""
    if val is None or val == '':
        return None
    try:
        return json.loads(val)
    except (json.JSONDecodeError, TypeError):
        return None


def parse_services_array(services_str):
    """Convert pipe-delimited services string to array."""
    if not services_str or services_str.strip() == '':
        return []
    return [s.strip() for s in services_str.split('|') if s.strip()]


def transform_row(row):
    """Transform a CSV row dict into a database-ready dict."""
    name = (row.get('name') or '').strip()
    city = (row.get('city') or '').strip()
    state_code = (row.get('state_code') or '').strip()

    if not name or not city:
        return None  # skip rows missing required fields

    slug = make_slug(name, city, state_code)
    services_str = row.get('services', '')

    return {
        'slug': slug,
        'status': 'active',
        'is_featured': False,
        'listing_tier': 'free',
        'name': name,
        'shop_type': row.get('shop_type') or None,
        'primary_service': row.get('primary_service') or None,
        'is_chain': parse_bool(row.get('is_chain')),
        'phone': row.get('phone') or None,
        'website': row.get('website') or None,
        'street': row.get('street') or None,
        'city': city,
        'state': (row.get('state') or '').strip(),
        'state_code': state_code,
        'postal_code': row.get('postal_code') or None,
        'latitude': parse_float(row.get('latitude')),
        'longitude': parse_float(row.get('longitude')),
        'time_zone': row.get('time_zone') or None,
        'rating': parse_float(row.get('rating')),
        'rating_tier': row.get('rating_tier') or None,
        'reviews': parse_int(row.get('reviews')),
        'photos_count': parse_int(row.get('photos_count')) or 0,
        'has_photos': parse_bool(row.get('has_photos')),
        'verified': parse_bool(row.get('verified')),
        'location_link': row.get('location_link') or None,
        'services': services_str or None,
        'services_array': parse_services_array(services_str),
        'num_services': parse_int(row.get('num_services')) or 0,
        'offers_fitting': parse_bool(row.get('offers_fitting')),
        'fitting_environment': row.get('fitting_environment') or None,
        'public_fitting': parse_bool(row.get('public_fitting')),
        'working_hours': parse_json(row.get('working_hours')),
        'open_on_weekends': parse_bool(row.get('open_on_weekends')),
        'business_status': row.get('business_status') or 'OPERATIONAL',
        'outreach_ready': parse_bool(row.get('outreach_ready')),
        'services_source': row.get('services_source') or None,
        'query': row.get('query') or None,
        'area_service': parse_bool(row.get('area_service')),
        'owner_title': row.get('owner_title') or None,
        'about': parse_json(row.get('about')),
    }


def upload_batch(rows):
    """Upload a batch of rows to Supabase via REST API."""
    url = f"{SUPABASE_URL}/rest/v1/shops"
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    data = json.dumps(rows).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')

    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, None
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        return e.code, body


# ─── Main ─────────────────────────────────────────────────────────

def main():
    print(f"\nReading CSV: {CSV_PATH}")

    with open(CSV_PATH, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"  CSV rows read: {len(rows)}")

    # Transform all rows
    transformed = []
    skipped = 0
    slug_counts = {}

    for row in rows:
        record = transform_row(row)
        if record is None:
            skipped += 1
            continue

        # Handle duplicate slugs by appending a counter
        base_slug = record['slug']
        if base_slug in slug_counts:
            slug_counts[base_slug] += 1
            record['slug'] = f"{base_slug}-{slug_counts[base_slug]}"
        else:
            slug_counts[base_slug] = 0

        transformed.append(record)

    print(f"  Transformed:   {len(transformed)}")
    print(f"  Skipped:       {skipped}")

    # Upload in batches
    total_uploaded = 0
    total_errors = 0

    for i in range(0, len(transformed), BATCH_SIZE):
        batch = transformed[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (len(transformed) + BATCH_SIZE - 1) // BATCH_SIZE

        status, error = upload_batch(batch)

        if status == 201:
            total_uploaded += len(batch)
            print(f"  Batch {batch_num}/{total_batches}: {len(batch)} rows uploaded")
        else:
            total_errors += len(batch)
            print(f"  Batch {batch_num}/{total_batches}: FAILED (HTTP {status})")
            print(f"    Error: {error[:300] if error else 'unknown'}")
            # On first error, show the problematic row for debugging
            if total_errors == len(batch):
                print(f"    First row slug: {batch[0].get('slug', 'N/A')}")

    print(f"\n=== Migration Complete ===")
    print(f"  Uploaded: {total_uploaded}")
    print(f"  Errors:   {total_errors}")
    print(f"  Total:    {total_uploaded + total_errors}")


if __name__ == '__main__':
    main()
