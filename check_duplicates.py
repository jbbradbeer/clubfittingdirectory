"""
check_duplicates.py — READ-ONLY duplicate check for the boutique clubmaker list.

Pulls every existing shop's website/name/city from Supabase (anon key, public
read) and compares against the new CSV. Matches primarily on the registered
domain (so tracking query-strings and www/protocol differences don't hide a
real duplicate). Also flags name+city collisions.

Writes nothing to the database. Safe to run repeatedly.
"""

import csv
import json
import os
import re
import sys
import urllib.parse
import urllib.request

ROOT = os.path.dirname(__file__)
NEW_CSV = os.path.join(ROOT, "Boutique Clubmaker List-Grid view.csv")


def load_env():
    """Read NEXT_PUBLIC_SUPABASE_URL / ANON_KEY from web/.env.local."""
    env = {}
    path = os.path.join(ROOT, "web", ".env.local")
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def domain_of(url):
    """Reduce a URL to its registered domain: lowercase, no protocol, no www,
    no path/query. 'https://www.Foo.com/x?y=1' -> 'foo.com'. '' -> ''."""
    if not url:
        return ""
    u = url.strip().lower()
    if "//" not in u:
        u = "//" + u  # let urlparse find the netloc even without a scheme
    netloc = urllib.parse.urlparse(u).netloc
    if netloc.startswith("www."):
        netloc = netloc[4:]
    return netloc


def norm_name(s):
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())


def fetch_existing(base_url, anon_key):
    """Page through the public shops table, returning a list of dicts."""
    rows = []
    page = 0
    page_size = 1000
    while True:
        params = urllib.parse.urlencode({
            "select": "name,city,state_code,slug,website",
            "status": "eq.active",
            "limit": page_size,
            "offset": page * page_size,
        })
        url = f"{base_url}/rest/v1/shops?{params}"
        req = urllib.request.Request(url, headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
        })
        with urllib.request.urlopen(req) as resp:
            batch = json.loads(resp.read().decode("utf-8"))
        rows.extend(batch)
        if len(batch) < page_size:
            break
        page += 1
    return rows


def main():
    env = load_env()
    base_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    anon_key = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not base_url or not anon_key:
        print("ERROR: Supabase URL/anon key not found in web/.env.local")
        sys.exit(1)

    print("Fetching existing shops from the live database...")
    existing = fetch_existing(base_url, anon_key)
    print(f"  Live shops found: {len(existing)}\n")

    by_domain = {}
    by_namecity = {}
    for r in existing:
        d = domain_of(r.get("website"))
        if d:
            by_domain.setdefault(d, []).append(r)
        key = (norm_name(r.get("name")), norm_name(r.get("city")))
        by_namecity.setdefault(key, []).append(r)

    with open(NEW_CSV, newline="", encoding="utf-8-sig") as f:
        new_rows = list(csv.DictReader(f))

    # Detect same-domain pairs WITHIN the new list (e.g. 150 Golf x2)
    seen_new_domain = {}
    for i, row in enumerate(new_rows):
        d = domain_of(row.get("Website"))
        if d:
            seen_new_domain.setdefault(d, []).append(i)

    dup_url = []      # matches existing by domain
    dup_name = []     # matches existing by name+city only
    clean = []        # no match -> new
    no_website = []   # blank website -> can't URL-check, will need name check

    for i, row in enumerate(new_rows):
        name = (row.get("Shop Name") or "").strip()
        city = (row.get("City") or "").strip()
        state = (row.get("State") or "").strip()
        website = (row.get("Website") or "").strip()
        d = domain_of(website)
        nc = (norm_name(name), norm_name(city))

        label = f"{name} ({city}, {state})"
        if d and d in by_domain:
            match = by_domain[d][0]
            dup_url.append((label, d, match["name"], match["slug"]))
        elif nc in by_namecity:
            match = by_namecity[nc][0]
            dup_name.append((label, match["name"], match["slug"]))
        elif not website:
            no_website.append(label)
        else:
            clean.append((label, d))

    def section(title, items):
        print(f"\n{'='*70}\n{title}  ({len(items)})\n{'='*70}")
        for it in items:
            print("  - " + " | ".join(str(x) for x in (it if isinstance(it, tuple) else (it,))))

    section("ALREADY ON SITE — matched by website domain", dup_url)
    section("POSSIBLE MATCH — same name + city (no URL match)", dup_name)
    section("NO WEBSITE in list — needs manual name check", no_website)
    section("NEW — not found on site, safe to add", clean)

    # within-list duplicate domains
    intra = {d: idxs for d, idxs in seen_new_domain.items() if len(idxs) > 1}
    if intra:
        print(f"\n{'='*70}\nHEADS-UP: same website appears multiple times IN YOUR LIST\n{'='*70}")
        for d, idxs in intra.items():
            names = [f"{new_rows[i]['Shop Name']} ({new_rows[i]['City']}, {new_rows[i]['State']})" for i in idxs]
            print(f"  {d}: " + "  /  ".join(names))

    print(f"\nSUMMARY: {len(clean)} new, {len(dup_url)} url-dupes, "
          f"{len(dup_name)} name-dupes, {len(no_website)} no-website to verify.")


if __name__ == "__main__":
    main()
