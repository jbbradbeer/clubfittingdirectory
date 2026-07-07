"""
enrich_new_shops.py — Apply web-researched details to the 13 new shops.

Data was gathered by research agents (addresses, phones, services, hours, and
verified ratings only). This script geocodes each address into map coordinates
(free OpenStreetMap/Nominatim) and updates the live shops table.

SAFE: dry-run by default (prints what it would write, changes nothing).
Add --commit to actually update. Reads the service key from web/.env.local.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(__file__)

# ─── Researched data (verified; null/omitted = not confidently found) ──────
SHOPS = [
    {"slug": "keplers-golf-walnut-creek-ca",
     "street": "2329 Boulevard Circle", "postal_code": "94595", "phone": "(925) 932-8179",
     "services": ["Club Fitting", "Club Repair", "Custom Club Building", "Launch Monitor", "Shaft & Grip Sales"],
     "primary_service": "Club Fitting",
     "working_hours": {"Monday": "9 AM–6 PM", "Tuesday": "9 AM–6 PM", "Wednesday": "9 AM–6 PM",
                       "Thursday": "9 AM–6 PM", "Friday": "9 AM–6 PM", "Saturday": "9 AM–5 PM", "Sunday": "Closed"},
     "geocode": "2329 Boulevard Circle, Walnut Creek, CA 94595"},

    {"slug": "stratton-haley-golf-fort-worth-tx",
     "services": ["Custom Club Building", "Shaft & Grip Sales", "Retail / Pro Shop"],
     "primary_service": "Custom Club Building"},

    {"slug": "sandbaggers-golf-shop-pembroke-ma",
     "street": "829 Washington Street", "postal_code": "02359", "phone": "(781) 826-1234",
     "services": ["Club Fitting", "Club Repair", "Golf Lessons", "Retail / Pro Shop", "Driving Range"],
     "primary_service": "Driving Range", "fitting_environment": "Outdoor",
     "geocode": "829 Washington Street, Pembroke, MA 02359"},

    # 247: corrected to the real Stuart, FL business (slug + city change)
    {"slug": "247-indoor-golf-jupiter-fl",
     "new_slug": "247-indoor-golf-stuart-fl", "city": "Stuart", "state": "Florida", "state_code": "FL",
     "street": "971 SE Federal Hwy", "postal_code": "34994", "phone": "(772) 888-6977",
     "services": ["Golf Simulator", "Club Fitting", "Club Repair", "Custom Club Building",
                  "Golf Lessons", "Launch Monitor", "Retail / Pro Shop", "Membership Programs"],
     "primary_service": "Golf Simulator", "fitting_environment": "Indoor",
     "geocode": "971 SE Federal Hwy, Stuart, FL 34994"},

    {"slug": "plaza-golf-torrance-ca",
     "street": "23715 Crenshaw Blvd", "postal_code": "90505", "phone": "(310) 534-3346",
     "services": ["Club Fitting", "Club Repair", "Retail / Pro Shop", "Launch Monitor", "Used Clubs / Trade-In"],
     "primary_service": "Club Fitting", "fitting_environment": "Indoor",
     "working_hours": {"Monday": "10 AM–7 PM", "Tuesday": "10 AM–7 PM", "Wednesday": "10 AM–7 PM",
                       "Thursday": "10 AM–7 PM", "Friday": "10 AM–7 PM", "Saturday": "9 AM–6 PM", "Sunday": "10 AM–5 PM"},
     "geocode": "23715 Crenshaw Blvd, Torrance, CA 90505"},

    {"slug": "tour-quality-golf-tulsa-ok",
     "street": "6006 S Sheridan Rd, Suite A", "postal_code": "74145", "phone": "(918) 221-7096",
     "services": ["Club Fitting", "Club Repair", "Custom Club Building", "Golf Lessons", "Golf Simulator",
                  "Launch Monitor", "Retail / Pro Shop", "Shaft & Grip Sales", "Used Clubs / Trade-In", "Membership Programs"],
     "primary_service": "Golf Simulator", "fitting_environment": "Indoor",
     "working_hours": {"Monday": "10 AM–7 PM", "Tuesday": "10 AM–7 PM", "Wednesday": "10 AM–7 PM",
                       "Thursday": "10 AM–7 PM", "Friday": "10 AM–7 PM", "Saturday": "10 AM–7 PM", "Sunday": "Closed"},
     "geocode": "6006 S Sheridan Rd, Tulsa, OK 74145"},

    {"slug": "popsys-golf-center-greensburg-pa",
     "street": "362 Sand Hill Road, Suite 1", "postal_code": "15601",
     "services": ["Golf Simulator", "Launch Monitor", "Golf Lessons", "Membership Programs"],
     "primary_service": "Golf Simulator", "fitting_environment": "Indoor",
     "geocode": "362 Sand Hill Road, Greensburg, PA 15601"},

    {"slug": "bagman-golf-los-angeles-ca",
     "services": ["Club Fitting"], "primary_service": "Club Fitting"},

    {"slug": "the-combine-golf-loretto-mn",
     "services": ["Club Fitting", "Custom Club Building", "Golf Lessons", "Golf Simulator",
                  "Launch Monitor", "Club Repair", "Retail / Pro Shop"],
     "primary_service": "Club Fitting", "fitting_environment": "Indoor"},

    {"slug": "no-bogeys-golf-laguna-beach-ca",
     "street": "27601 Forbes Rd, Suite 28", "postal_code": "92677", "phone": "(949) 595-4405",
     "services": ["Club Fitting", "Custom Club Building", "Golf Lessons", "Golf Simulator",
                  "Launch Monitor", "Retail / Pro Shop", "Membership Programs"],
     "primary_service": "Club Fitting", "fitting_environment": "Indoor",
     "rating": 4.8, "reviews": 102, "rating_tier": "Top Rated",
     "working_hours": {"Monday": "9 AM–6 PM", "Tuesday": "9 AM–6 PM", "Wednesday": "9 AM–6 PM",
                       "Thursday": "9 AM–6 PM", "Friday": "9 AM–6 PM", "Saturday": "6 AM–6 PM", "Sunday": "Closed"},
     "geocode": "27601 Forbes Rd, Laguna Niguel, CA 92677"},

    {"slug": "garner-golf-fairfield-ct",
     "street": "79 Unquowa Pl", "postal_code": "06824", "phone": "(203) 319-1200",
     "services": ["Club Fitting", "Club Repair", "Custom Club Building"],
     "primary_service": "Club Fitting",
     "geocode": "79 Unquowa Pl, Fairfield, CT 06824"},

    {"slug": "par-golf-columbus-oh",
     "website": "https://www.pargolfproshop.com/",
     "street": "5863 Sawmill Rd", "postal_code": "43017", "phone": "(614) 792-3553",
     "services": ["Club Fitting", "Club Repair", "Golf Lessons", "Retail / Pro Shop", "Used Clubs / Trade-In", "Driving Range"],
     "primary_service": "Retail / Pro Shop",
     "working_hours": {"Monday": "10 AM–8 PM", "Tuesday": "10 AM–8 PM", "Wednesday": "10 AM–8 PM",
                       "Thursday": "10 AM–8 PM", "Friday": "10 AM–8 PM", "Saturday": "10 AM–6 PM", "Sunday": "11 AM–5 PM"},
     "geocode": "5863 Sawmill Rd, Dublin, OH 43017"},

    {"slug": "bernie-dunne-custom-clubs-pitman-nj",
     "street": "421 Crafton Ave", "postal_code": "08071", "phone": "(856) 589-8131",
     "services": ["Club Fitting", "Custom Club Building"],
     "primary_service": "Custom Club Building",
     "geocode": "421 Crafton Ave, Pitman, NJ 08071"},
]


def load_env():
    env = {}
    with open(os.path.join(ROOT, "web", ".env.local"), encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def geocode(query):
    """Free OpenStreetMap/Nominatim geocode → (lat, lon) or (None, None)."""
    params = urllib.parse.urlencode({"q": query, "format": "json", "limit": 1})
    req = urllib.request.Request(
        f"https://nominatim.openstreetmap.org/search?{params}",
        headers={"User-Agent": "btg-clubfitting-directory/1.0 (enrichment)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        if data:
            return round(float(data[0]["lat"]), 7), round(float(data[0]["lon"]), 7)
    except Exception as e:
        print(f"    geocode failed: {e}")
    return None, None


def build_update(shop):
    """Turn a researched record into the DB field set."""
    upd = {}
    for col in ("street", "postal_code", "phone", "primary_service",
                "fitting_environment", "working_hours", "website",
                "rating", "reviews", "rating_tier", "city", "state", "state_code"):
        if col in shop and shop[col] is not None:
            upd[col] = shop[col]
    if shop.get("services"):
        upd["services"] = " | ".join(shop["services"])
        upd["services_array"] = shop["services"]
        upd["num_services"] = len(shop["services"])
    if shop.get("new_slug"):
        upd["slug"] = shop["new_slug"]
    return upd


def patch(base_url, key, slug, body):
    params = urllib.parse.urlencode({"slug": f"eq.{slug}"})
    req = urllib.request.Request(
        f"{base_url}/rest/v1/shops?{params}",
        data=json.dumps(body).encode("utf-8"),
        headers={"apikey": key, "Authorization": f"Bearer {key}",
                 "Content-Type": "application/json", "Prefer": "return=minimal"},
        method="PATCH",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, None
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")


def main():
    commit = "--commit" in sys.argv
    env = load_env()
    base_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") or env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    print("Geocoding addresses (free OpenStreetMap, ~1s each)...\n")
    updates = []
    for shop in SHOPS:
        upd = build_update(shop)
        if shop.get("geocode"):
            lat, lon = geocode(shop["geocode"])
            if lat is not None:
                upd["latitude"], upd["longitude"] = lat, lon
            time.sleep(1.1)  # Nominatim rate limit
        updates.append((shop["slug"], upd))
        addr = upd.get("street", "—")
        pin = f"{upd.get('latitude')},{upd.get('longitude')}" if upd.get("latitude") else "no pin"
        rating = f" rating={upd['rating']}" if upd.get("rating") else ""
        newslug = f" -> {upd['slug']}" if upd.get("slug") else ""
        print(f"  {shop['slug']}{newslug}\n     addr={addr} | {len(shop.get('services',[]))} services | {pin}{rating}")

    if not commit:
        print("\n--- DRY RUN --- nothing written. Re-run with --commit to apply.")
        return
    if not service_key:
        print("\nERROR: --commit but SUPABASE_SERVICE_ROLE_KEY not set."); sys.exit(1)

    print("\nApplying updates...")
    ok = 0
    for slug, body in updates:
        status, err = patch(base_url, service_key, slug, body)
        if status in (200, 204):
            ok += 1
            print(f"  ✓ {slug}")
        else:
            print(f"  ✗ {slug} (HTTP {status}): {err[:200] if err else ''}")
    print(f"\nDone: {ok}/{len(updates)} updated.")


if __name__ == "__main__":
    main()
