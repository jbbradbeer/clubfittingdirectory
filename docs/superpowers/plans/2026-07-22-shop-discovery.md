# Shop Discovery Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Find fitting shops not yet in the directory (pilot: TX, FL, CA, AZ, GA), dedup against existing data, gate on founder approval, then insert as listings + outreach prospects.

**Architecture:** New standalone `discovery/` folder. Two sources (OEM locators via Firecrawl REST API; OpenSEO `search_local_businesses` via MCP runbook) write raw JSON per state into `discovery/raw/`. `dedupe.py` normalizes and matches against the live `shops` table (ALL statuses) and `outreach` table, emitting a review CSV. After founder approval, `upload_new_shops.py` (dry-run default) inserts `shops` rows plus matching `outreach` rows.

**Tech Stack:** Python 3 stdlib only (matches `outreach/` convention — urllib, difflib, unittest, no pip deps). Firecrawl v2 REST API. Supabase PostgREST via existing `outreach/outreach_db.py` helpers.

## Global Constraints

- **Stdlib only** — no pip installs; follow `outreach/` style (urllib.request, no requests lib).
- **Never commit secrets** — `FIRECRAWL_API_KEY` lives in `discovery/.env` (gitignored). Supabase keys come from `web/.env.local` via `outreach_db.service_key()`.
- **Dry-run by default** — any script that writes to Supabase requires `--commit` to write.
- **Dedup against ALL shop statuses** — inactive rows (2026-07-08 quality cut) must never be re-added.
- **Pilot states:** `["TX", "FL", "CA", "AZ", "GA"]`.
- **Polite scraping** — ≥1.5s delay between Firecrawl calls per brand; retry once on failure, then log and skip.
- **Raw record schema** (every source writes this exact shape, one JSON file per source per state):
  `{"name": str, "address": str, "city": str, "state_code": str, "zip": str, "phone": str, "website": str, "source": str}` — missing values as `""`, never null. File path: `discovery/raw/{source}_{STATE}.json` containing `{"state": "TX", "source": "titleist", "records": [...]}`.
- **Tests:** stdlib `unittest`, files in `discovery/tests/`, run with `python3 -m unittest discovery.tests.<module> -v` from repo root. `discovery/` and `discovery/tests/` and `discovery/sources/` each need an `__init__.py` (empty) so imports work.
- Commit after every task.

---

### Task 1: Scaffolding + env

**Files:**
- Create: `discovery/__init__.py`, `discovery/sources/__init__.py`, `discovery/tests/__init__.py` (all empty)
- Create: `discovery/.env` (gitignored) with the Firecrawl key
- Create: `discovery/README.md`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `discovery/common.py` with `load_discovery_env() -> dict` and `firecrawl_key() -> str`, used by Task 3.

- [ ] **Step 1: Create folders and empty __init__ files**

```bash
mkdir -p discovery/sources discovery/tests discovery/raw discovery/review discovery/checkpoints
touch discovery/__init__.py discovery/sources/__init__.py discovery/tests/__init__.py
```

- [ ] **Step 2: Gitignore secrets and raw output**

Append to `.gitignore`:

```
discovery/.env
discovery/raw/
discovery/checkpoints/
```

(`discovery/review/` IS committed — the founder-facing CSVs are part of the audit trail.)

- [ ] **Step 3: Write `discovery/.env`**

```
FIRECRAWL_API_KEY=<paste key from Firecrawl auth — see discovery/.env>
```

(Key obtained via Firecrawl auth 2026-07-22. If invalid at run time, re-auth per Firecrawl Path D and replace.)

- [ ] **Step 4: Write failing test for env loader**

`discovery/tests/test_common.py`:

```python
import tempfile
import unittest
from pathlib import Path

from discovery.common import load_env_file


class TestEnv(unittest.TestCase):
    def test_load_env_file(self):
        with tempfile.NamedTemporaryFile("w", suffix=".env", delete=False) as f:
            f.write("# comment\nFIRECRAWL_API_KEY=fc-abc123\nOTHER=x=y\n")
        env = load_env_file(Path(f.name))
        self.assertEqual(env["FIRECRAWL_API_KEY"], "fc-abc123")
        self.assertEqual(env["OTHER"], "x=y")


if __name__ == "__main__":
    unittest.main()
```

Run: `python3 -m unittest discovery.tests.test_common -v` — Expected: FAIL (`ModuleNotFoundError: discovery.common`).

- [ ] **Step 5: Write `discovery/common.py`**

```python
"""common.py — shared env loading for discovery scripts."""
import sys
from pathlib import Path

DISCOVERY_DIR = Path(__file__).resolve().parent
ENV_FILE = DISCOVERY_DIR / ".env"
RAW_DIR = DISCOVERY_DIR / "raw"
REVIEW_DIR = DISCOVERY_DIR / "review"
CHECKPOINT_DIR = DISCOVERY_DIR / "checkpoints"
PILOT_STATES = ["TX", "FL", "CA", "AZ", "GA"]


def load_env_file(path: Path) -> dict:
    env = {}
    if path.exists():
        for line in path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


def firecrawl_key() -> str:
    key = load_env_file(ENV_FILE).get("FIRECRAWL_API_KEY", "")
    if not key:
        sys.exit("ERROR: FIRECRAWL_API_KEY missing from discovery/.env")
    return key
```

- [ ] **Step 6: Run test — PASS.** `python3 -m unittest discovery.tests.test_common -v`

- [ ] **Step 7: Write `discovery/README.md`**

```markdown
# discovery/ — find shops not yet in the directory

Pipeline: sources → dedupe → review CSV → founder approval → upload.

1. `python3 discovery/sources/oem_locators.py --state TX` — scrape OEM fitter
   locators via Firecrawl into `raw/{brand}_TX.json`.
2. OpenSEO source: Claude runs `search_local_businesses` per metro
   (see RUNBOOK.md) and saves `raw/openseo_TX.json`; then
   `python3 discovery/validate_raw.py raw/openseo_TX.json`.
3. `python3 discovery/dedupe.py --state TX` — writes `review/new_shops_<date>.csv`.
4. Founder reviews CSV, deletes unwanted rows (or sets approved=no).
5. `python3 discovery/upload_new_shops.py review/new_shops_<date>.csv`
   (dry run) then `... --commit` — inserts shops + outreach rows.

Secrets: `discovery/.env` (Firecrawl, gitignored); Supabase key via
`web/.env.local` (same as outreach/).
```

- [ ] **Step 8: Commit**

```bash
git add discovery .gitignore
git commit -m "feat: discovery pipeline scaffolding + env loading"
```

---

### Task 2: Normalization helpers

**Files:**
- Create: `discovery/normalize.py`
- Test: `discovery/tests/test_normalize.py`

**Interfaces:**
- Produces: `norm_name(s: str) -> str`, `norm_phone(s: str) -> str` (10 digits or ""), `norm_city(s: str) -> str`, `site_domain(url: str) -> str`. Consumed by Task 4 (dedupe) and Task 6 (upload).

- [ ] **Step 1: Write failing tests**

`discovery/tests/test_normalize.py`:

```python
import unittest

from discovery.normalize import norm_city, norm_name, norm_phone, site_domain


class TestNormalize(unittest.TestCase):
    def test_norm_name_strips_suffixes_and_punct(self):
        self.assertEqual(norm_name("True Spec Golf, LLC"), "true spec golf")
        self.assertEqual(norm_name("The Golf Lab Inc."), "golf lab")
        self.assertEqual(norm_name("Club Champion — Dallas"), "club champion dallas")

    def test_norm_phone(self):
        self.assertEqual(norm_phone("(512) 555-0134"), "5125550134")
        self.assertEqual(norm_phone("+1 512-555-0134"), "5125550134")
        self.assertEqual(norm_phone("555-0134"), "")     # too short
        self.assertEqual(norm_phone(""), "")

    def test_norm_city(self):
        self.assertEqual(norm_city("Ft. Worth"), "fort worth")
        self.assertEqual(norm_city("Saint Petersburg"), "st petersburg")

    def test_site_domain(self):
        self.assertEqual(site_domain("https://www.truespecgolf.com/tx"), "truespecgolf.com")
        self.assertEqual(site_domain("truespecgolf.com"), "truespecgolf.com")
        self.assertEqual(site_domain(""), "")


if __name__ == "__main__":
    unittest.main()
```

Run: `python3 -m unittest discovery.tests.test_normalize -v` — Expected: FAIL (no module).

- [ ] **Step 2: Implement `discovery/normalize.py`**

```python
"""normalize.py — canonical forms for shop matching."""
import re
import urllib.parse

_SUFFIXES = re.compile(r"\b(llc|inc|co|corp|corporation|ltd|the)\b\.?")
_PUNCT = re.compile(r"[^\w\s]")
_WS = re.compile(r"\s+")


def norm_name(s: str) -> str:
    s = (s or "").lower()
    s = _PUNCT.sub(" ", s.replace("—", " ").replace("-", " "))
    s = _SUFFIXES.sub(" ", s)
    return _WS.sub(" ", s).strip()


def norm_phone(s: str) -> str:
    digits = re.sub(r"\D", "", s or "")
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    return digits if len(digits) == 10 else ""


def norm_city(s: str) -> str:
    s = _WS.sub(" ", _PUNCT.sub(" ", (s or "").lower())).strip()
    s = re.sub(r"^ft\b", "fort", s)
    s = re.sub(r"^saint\b", "st", s)
    return s


def site_domain(url: str) -> str:
    if not url:
        return ""
    if not url.startswith("http"):
        url = "https://" + url
    netloc = urllib.parse.urlparse(url).netloc.lower()
    return netloc.removeprefix("www.")
```

- [ ] **Step 3: Run tests — PASS.**

- [ ] **Step 4: Commit** — `git add discovery && git commit -m "feat: discovery normalization helpers"`

---

### Task 3: Firecrawl REST client

**Files:**
- Create: `discovery/sources/firecrawl_client.py`
- Test: `discovery/tests/test_firecrawl_client.py`

**Interfaces:**
- Consumes: `discovery.common.firecrawl_key`.
- Produces: `scrape(url: str, formats: list[str] = ["markdown"], timeout: int = 60) -> dict` (returns Firecrawl `data` object, e.g. `{"markdown": ..., "metadata": ...}`) and `post(path: str, body: dict) -> dict` (raw API call). Both retry once on failure then raise `FirecrawlError`. Consumed by Task 5.

- [ ] **Step 1: Write failing test (mock urlopen — no network in tests)**

`discovery/tests/test_firecrawl_client.py`:

```python
import json
import unittest
from unittest import mock

from discovery.sources import firecrawl_client as fc


def _resp(payload: dict):
    m = mock.MagicMock()
    m.read.return_value = json.dumps(payload).encode()
    m.__enter__ = lambda s: s
    m.__exit__ = lambda s, *a: False
    return m


class TestFirecrawl(unittest.TestCase):
    @mock.patch.object(fc, "firecrawl_key", return_value="fc-test")
    @mock.patch("urllib.request.urlopen")
    def test_scrape_returns_data(self, urlopen, _key):
        urlopen.return_value = _resp({"success": True, "data": {"markdown": "# hi"}})
        out = fc.scrape("https://example.com")
        self.assertEqual(out["markdown"], "# hi")
        req = urlopen.call_args[0][0]
        self.assertIn("/v2/scrape", req.full_url)
        self.assertEqual(req.get_header("Authorization"), "Bearer fc-test")

    @mock.patch.object(fc, "firecrawl_key", return_value="fc-test")
    @mock.patch("urllib.request.urlopen")
    def test_retries_once_then_raises(self, urlopen, _key):
        urlopen.side_effect = OSError("boom")
        with mock.patch.object(fc.time, "sleep"):
            with self.assertRaises(fc.FirecrawlError):
                fc.scrape("https://example.com")
        self.assertEqual(urlopen.call_count, 2)


if __name__ == "__main__":
    unittest.main()
```

Run: `python3 -m unittest discovery.tests.test_firecrawl_client -v` — Expected: FAIL.

- [ ] **Step 2: Implement `discovery/sources/firecrawl_client.py`**

```python
"""firecrawl_client.py — minimal Firecrawl v2 REST wrapper (stdlib only)."""
import json
import sys
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from discovery.common import firecrawl_key  # noqa: E402

API = "https://api.firecrawl.dev/v2"


class FirecrawlError(RuntimeError):
    pass


def post(path: str, body: dict, timeout: int = 90) -> dict:
    req = urllib.request.Request(
        f"{API}/{path.lstrip('/')}",
        data=json.dumps(body).encode(),
        headers={
            "Authorization": f"Bearer {firecrawl_key()}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    last_err = None
    for attempt in range(2):          # try, then one retry
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:        # noqa: BLE001 — retry any transport error
            last_err = e
            if attempt == 0:
                time.sleep(3)
    raise FirecrawlError(f"firecrawl {path} failed after retry: {last_err}")


def scrape(url: str, formats: list | None = None, timeout: int = 90) -> dict:
    body = {"url": url, "formats": formats or ["markdown"]}
    out = post("scrape", body, timeout=timeout)
    if not out.get("success", False) or "data" not in out:
        raise FirecrawlError(f"scrape {url}: unexpected response {str(out)[:200]}")
    return out["data"]
```

- [ ] **Step 3: Run tests — PASS.**

- [ ] **Step 4: Live smoke test (one call, real key)**

Run: `python3 -c "from discovery.sources.firecrawl_client import scrape; d = scrape('https://firecrawl.dev'); print(d['metadata']['title'])"`
Expected: prints a page title. If 401: key expired — re-auth per Firecrawl docs, update `discovery/.env`.

- [ ] **Step 5: Commit** — `git commit -am "feat: firecrawl REST client"`

---

### Task 4: Dedupe engine + review CSV

**Files:**
- Create: `discovery/dedupe.py`
- Test: `discovery/tests/test_dedupe.py`

**Interfaces:**
- Consumes: `discovery.normalize` (Task 2); `outreach.outreach_db.get_all` for live reads (`get_all(table: str, params: dict) -> list[dict]`, already exists).
- Produces: `classify(cand: dict, index: "ExistingIndex") -> tuple[str, str]` returning `(verdict, reason)` with verdict ∈ `{"new", "duplicate", "uncertain"}`; `ExistingIndex.build(shops_rows: list[dict]) -> ExistingIndex`; CLI writing `discovery/review/new_shops_{YYYY-MM-DD}.csv` with columns `name,address,city,state_code,zip,phone,website,sources,verdict,reason,approved`.

- [ ] **Step 1: Write failing tests (pure logic — no DB)**

`discovery/tests/test_dedupe.py`:

```python
import unittest

from discovery.dedupe import ExistingIndex, classify, merge_candidates

SHOPS = [
    {"id": "1", "name": "True Spec Golf", "phone": "(512) 555-0134",
     "city": "Austin", "state_code": "TX", "website": "https://truespecgolf.com", "status": "active"},
    {"id": "2", "name": "Golf Etc of Dallas", "phone": "",
     "city": "Dallas", "state_code": "TX", "website": "golfetcdallas.com", "status": "inactive"},
]


def idx():
    return ExistingIndex.build(SHOPS)


class TestClassify(unittest.TestCase):
    def test_same_phone_is_duplicate(self):
        cand = {"name": "Totally Different Name", "phone": "512-555-0134",
                "city": "Round Rock", "state_code": "TX", "website": ""}
        verdict, reason = classify(cand, idx())
        self.assertEqual(verdict, "duplicate")
        self.assertIn("phone", reason)

    def test_inactive_shop_still_blocks(self):
        cand = {"name": "Golf Etc of Dallas", "phone": "",
                "city": "Dallas", "state_code": "TX", "website": ""}
        self.assertEqual(classify(cand, idx())[0], "duplicate")

    def test_same_domain_is_duplicate(self):
        cand = {"name": "TS Golf Studio", "phone": "",
                "city": "Austin", "state_code": "TX",
                "website": "https://www.truespecgolf.com/book"}
        verdict, reason = classify(cand, idx())
        self.assertEqual(verdict, "duplicate")
        self.assertIn("domain", reason)

    def test_fuzzy_name_same_city_is_uncertain(self):
        cand = {"name": "True Spec Golf Austin", "phone": "",
                "city": "Austin", "state_code": "TX", "website": ""}
        self.assertEqual(classify(cand, idx())[0], "uncertain")

    def test_unrelated_is_new(self):
        cand = {"name": "Bomb Squad Golf", "phone": "9725550101",
                "city": "Plano", "state_code": "TX", "website": "bombsquadgolf.com"}
        self.assertEqual(classify(cand, idx())[0], "new")


class TestMerge(unittest.TestCase):
    def test_same_shop_from_two_sources_merges(self):
        a = {"name": "Bomb Squad Golf", "phone": "9725550101", "city": "Plano",
             "state_code": "TX", "website": "", "address": "", "zip": "", "source": "titleist"}
        b = {"name": "Bomb Squad Golf LLC", "phone": "9725550101", "city": "Plano",
             "state_code": "TX", "website": "bombsquadgolf.com", "address": "", "zip": "", "source": "openseo"}
        merged = merge_candidates([a, b])
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["sources"], "openseo,titleist")
        self.assertEqual(merged[0]["website"], "bombsquadgolf.com")  # richer field wins


if __name__ == "__main__":
    unittest.main()
```

Run: `python3 -m unittest discovery.tests.test_dedupe -v` — Expected: FAIL.

- [ ] **Step 2: Implement `discovery/dedupe.py`**

```python
"""dedupe.py — match discovered shops against the live directory.

Usage:
  python3 discovery/dedupe.py --state TX [--state FL ...]
Reads every discovery/raw/*_{STATE}.json, merges cross-source duplicates,
classifies each candidate vs the shops table (ALL statuses — inactive rows
from the 2026-07-08 cut must never come back), writes
discovery/review/new_shops_{date}.csv for founder review.
"""
import argparse
import csv
import difflib
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "outreach"))
from discovery.common import RAW_DIR, REVIEW_DIR  # noqa: E402
from discovery.normalize import norm_city, norm_name, norm_phone, site_domain  # noqa: E402

FUZZY_DUP = 0.95      # >= this + same city → duplicate
FUZZY_UNCERTAIN = 0.82  # >= this + same city → uncertain (manual eye)


class ExistingIndex:
    """Lookup structures over the live shops table."""

    def __init__(self):
        self.by_phone = {}
        self.by_domain = {}
        self.by_citystate = {}   # (city, state) -> [(norm_name, shop)]

    @classmethod
    def build(cls, shops_rows):
        ix = cls()
        for s in shops_rows:
            p = norm_phone(s.get("phone") or "")
            if p:
                ix.by_phone[p] = s
            d = site_domain(s.get("website") or "")
            if d:
                ix.by_domain[d] = s
            key = (norm_city(s.get("city") or ""), (s.get("state_code") or "").upper())
            ix.by_citystate.setdefault(key, []).append((norm_name(s.get("name") or ""), s))
        return ix


def classify(cand, ix):
    p = norm_phone(cand.get("phone") or "")
    if p and p in ix.by_phone:
        return "duplicate", f"phone matches '{ix.by_phone[p]['name']}'"
    d = site_domain(cand.get("website") or "")
    if d and d in ix.by_domain:
        return "duplicate", f"domain matches '{ix.by_domain[d]['name']}'"
    key = (norm_city(cand.get("city") or ""), (cand.get("state_code") or "").upper())
    cname = norm_name(cand.get("name") or "")
    best, best_shop = 0.0, None
    for ename, shop in ix.by_citystate.get(key, []):
        r = difflib.SequenceMatcher(None, cname, ename).ratio()
        if r > best:
            best, best_shop = r, shop
    if best >= FUZZY_DUP:
        return "duplicate", f"name ~{best:.2f} matches '{best_shop['name']}' same city"
    if best >= FUZZY_UNCERTAIN:
        return "uncertain", f"name ~{best:.2f} similar to '{best_shop['name']}' same city"
    return "new", ""


def _cand_key(c):
    p = norm_phone(c.get("phone") or "")
    if p:
        return ("phone", p)
    return ("namecity", norm_name(c.get("name") or ""),
            norm_city(c.get("city") or ""), (c.get("state_code") or "").upper())


def merge_candidates(cands):
    """Merge the same shop seen by multiple sources; richer field values win."""
    merged = {}
    for c in cands:
        k = _cand_key(c)
        if k not in merged:
            merged[k] = dict(c)
            merged[k]["sources"] = {c.get("source", "?")}
        else:
            m = merged[k]
            m["sources"].add(c.get("source", "?"))
            for f in ("name", "address", "city", "zip", "phone", "website"):
                if len(c.get(f) or "") > len(m.get(f) or ""):
                    m[f] = c[f]
    out = []
    for m in merged.values():
        m["sources"] = ",".join(sorted(m.pop("sources")))
        m.pop("source", None)
        out.append(m)
    return sorted(out, key=lambda m: (m["state_code"], m["city"], m["name"]))


def load_raw(states):
    cands = []
    for f in sorted(RAW_DIR.glob("*.json")):
        blob = json.loads(f.read_text())
        if blob.get("state") in states:
            cands.extend(blob.get("records", []))
    return cands


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--state", action="append", required=True)
    args = ap.parse_args()
    states = [s.upper() for s in args.state]

    from outreach_db import get_all  # noqa: E402 — live read, service key
    shops = get_all("shops", {"select": "id,name,phone,city,state_code,website,status"})
    print(f"loaded {len(shops)} existing shops (all statuses)")
    ix = ExistingIndex.build(shops)

    cands = merge_candidates(load_raw(states))
    print(f"{len(cands)} merged candidates from raw files for {states}")

    REVIEW_DIR.mkdir(exist_ok=True)
    out_path = REVIEW_DIR / f"new_shops_{date.today().isoformat()}.csv"
    counts = {"new": 0, "duplicate": 0, "uncertain": 0}
    with open(out_path, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=[
            "name", "address", "city", "state_code", "zip", "phone",
            "website", "sources", "verdict", "reason", "approved"])
        w.writeheader()
        for c in cands:
            verdict, reason = classify(c, ix)
            counts[verdict] += 1
            if verdict == "duplicate":
                continue     # dropped, but counted
            w.writerow({**{k: c.get(k, "") for k in
                           ("name", "address", "city", "state_code", "zip",
                            "phone", "website", "sources")},
                        "verdict": verdict, "reason": reason,
                        "approved": "yes" if verdict == "new" else ""})
    print(json.dumps({"written": str(out_path), **counts}, indent=2))


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Run tests — PASS.** `python3 -m unittest discovery.tests.test_dedupe -v`

- [ ] **Step 4: Commit** — `git commit -am "feat: discovery dedupe engine + review CSV"`

---

### Task 5: OEM locator source (Firecrawl)

Endpoints are researched AT IMPLEMENTATION TIME — each brand's locator differs and may change. The task fixes the harness (config, checkpointing, fixture-driven parser tests); per-brand probing follows a repeatable recipe.

**Files:**
- Create: `discovery/sources/oem_locators.py`
- Create: `discovery/sources/oem_endpoints.md` (probe notes per brand)
- Create: `discovery/tests/fixtures/` (one captured payload per working brand)
- Test: `discovery/tests/test_oem_locators.py`

**Interfaces:**
- Consumes: `firecrawl_client.scrape/post` (Task 3), `discovery.common` paths.
- Produces: `discovery/raw/{brand}_{STATE}.json` in the Global-Constraints raw schema. Parser contract per brand: `parse_{brand}(payload: str|dict, state: str) -> list[dict]` returning raw-schema records.

- [ ] **Step 1: Probe brand locators (research step, ~30 min)**

For each of Titleist, Ping, Callaway, Mizuno, TaylorMade:
1. Load the brand's public fitter/dealer locator page in agent-browser or via `firecrawl_client.scrape` with `formats=["html"]`.
2. Look for the XHR/JSON endpoint the map calls (query patterns like `lat/lng/radius`, `zip`, `state`). agent-browser network inspection is the fastest route.
3. Record in `discovery/sources/oem_endpoints.md`: brand, endpoint URL template, params, auth/none, response shape, sample snippet. If a brand's locator is not reachable (auth walls, heavy anti-bot), record SKIPPED with reason — do not fight it; 2–3 working brands is enough for pilot.
4. Save one real response per working brand to `discovery/tests/fixtures/{brand}_sample.json` (trim to ~5 records, scrub nothing — it's public data).

- [ ] **Step 2: Write failing parser test per working brand**

`discovery/tests/test_oem_locators.py` (pattern — repeat per brand; exact assertions come from each captured fixture):

```python
import json
import unittest
from pathlib import Path

from discovery.sources.oem_locators import parse_titleist  # one import per working brand

FIXTURES = Path(__file__).parent / "fixtures"


class TestTitleistParse(unittest.TestCase):
    def test_fixture_parses_to_raw_schema(self):
        payload = json.loads((FIXTURES / "titleist_sample.json").read_text())
        recs = parse_titleist(payload, "TX")
        self.assertGreater(len(recs), 0)
        for r in recs:
            self.assertEqual(
                set(r), {"name", "address", "city", "state_code", "zip",
                         "phone", "website", "source"})
            self.assertEqual(r["source"], "titleist")
            self.assertEqual(r["state_code"], "TX")
            self.assertIsInstance(r["name"], str)
            self.assertNotEqual(r["name"], "")


if __name__ == "__main__":
    unittest.main()
```

Run — Expected: FAIL. (Adjust assertions to the real fixture where needed — e.g. records outside TX filtered out.)

- [ ] **Step 3: Implement `discovery/sources/oem_locators.py`**

Skeleton (fetchers filled per probe findings; every parser returns raw-schema records):

```python
"""oem_locators.py — scrape OEM fitter/dealer locators into raw JSON.

Usage: python3 discovery/sources/oem_locators.py --state TX [--brand titleist]
Checkpoints per brand+state (rerun-safe). Endpoints documented in
oem_endpoints.md — update BOTH when a locator changes.
"""
import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from discovery.common import CHECKPOINT_DIR, RAW_DIR  # noqa: E402
from discovery.sources import firecrawl_client as fc  # noqa: E402

DELAY = 1.5   # seconds between calls per Global Constraints


def _blank():
    return {"name": "", "address": "", "city": "", "state_code": "",
            "zip": "", "phone": "", "website": "", "source": ""}


# ── per-brand: fetch_<brand>(state) -> payload, parse_<brand>(payload, state) -> records
# Filled in from oem_endpoints.md probe notes. Example shape (real params per probe):
#
# def fetch_titleist(state: str):
#     data = fc.post("scrape", {"url": TITLEIST_URL_FOR[state], "formats": ["html"]})
#     return extract_embedded_json(data["data"]["html"])
#
# def parse_titleist(payload, state):
#     recs = []
#     for item in payload["results"]:
#         r = _blank()
#         r.update(name=item["name"].strip(), city=item["city"].strip(),
#                  state_code=state, zip=str(item.get("zip", "")),
#                  phone=item.get("phone", ""), address=item.get("address1", ""),
#                  website=item.get("website", ""), source="titleist")
#         recs.append(r)
#     return recs

BRANDS = {
    # "titleist": (fetch_titleist, parse_titleist),
    # ... registered as each brand's probe lands
}


def run_brand(brand: str, state: str):
    ck = CHECKPOINT_DIR / f"oem_{brand}_{state}.done"
    if ck.exists():
        print(f"skip {brand} {state} (checkpointed)")
        return
    fetch, parse = BRANDS[brand]
    try:
        payload = fetch(state)
        records = parse(payload, state)
    except fc.FirecrawlError as e:
        print(f"FAIL {brand} {state}: {e} — logged, skipping")
        return
    out = RAW_DIR / f"{brand}_{state}.json"
    RAW_DIR.mkdir(exist_ok=True)
    out.write_text(json.dumps(
        {"state": state, "source": brand, "records": records}, indent=1))
    ck.parent.mkdir(exist_ok=True)
    ck.touch()
    print(f"{brand} {state}: {len(records)} records -> {out}")
    time.sleep(DELAY)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--state", required=True)
    ap.add_argument("--brand", choices=sorted(BRANDS), default=None)
    args = ap.parse_args()
    brands = [args.brand] if args.brand else sorted(BRANDS)
    for b in brands:
        run_brand(b, args.state.upper())


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run parser tests — PASS.** `python3 -m unittest discovery.tests.test_oem_locators -v`

- [ ] **Step 5: Live run one brand, one state**

Run: `python3 discovery/sources/oem_locators.py --state TX --brand titleist`
Expected: `titleist TX: N records -> discovery/raw/titleist_TX.json`, N > 0. Spot-check 3 records by eye.

- [ ] **Step 6: Commit** — `git add discovery && git commit -m "feat: OEM locator source via firecrawl"` (fixtures committed; raw/ is gitignored).

---

### Task 6: OpenSEO source — runbook + validator

OpenSEO `search_local_businesses` is an MCP tool (Claude calls it, not a script). The deliverable is a metro list, a runbook Claude follows, and a validator that gates the hand-written JSON before dedupe trusts it.

**Files:**
- Create: `discovery/metros.py`
- Create: `discovery/RUNBOOK.md`
- Create: `discovery/validate_raw.py`
- Test: `discovery/tests/test_validate_raw.py`

**Interfaces:**
- Produces: `METROS: dict[str, list[str]]` (state → metro list); `validate(path: Path) -> list[str]` returning problem strings (empty = valid). Output file consumed by Task 4: `discovery/raw/openseo_{STATE}.json`.

- [ ] **Step 1: Write `discovery/metros.py`**

```python
"""metros.py — metros to query per pilot state (OpenSEO local search)."""
METROS = {
    "TX": ["Dallas", "Houston", "Austin", "San Antonio", "Fort Worth", "Plano"],
    "FL": ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale",
           "Naples", "West Palm Beach"],
    "CA": ["Los Angeles", "San Diego", "San Francisco", "San Jose",
           "Sacramento", "Palm Springs", "Irvine"],
    "AZ": ["Phoenix", "Scottsdale", "Tucson", "Mesa"],
    "GA": ["Atlanta", "Savannah", "Augusta", "Alpharetta", "Marietta"],
}
QUERIES = ["club fitting", "golf club fitting"]
```

- [ ] **Step 2: Write failing validator test**

`discovery/tests/test_validate_raw.py`:

```python
import json
import tempfile
import unittest
from pathlib import Path

from discovery.validate_raw import validate


def _write(blob):
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False)
    json.dump(blob, f)
    f.close()
    return Path(f.name)


GOOD = {"state": "TX", "source": "openseo", "records": [
    {"name": "Bomb Squad Golf", "address": "1 Main St", "city": "Plano",
     "state_code": "TX", "zip": "75023", "phone": "9725550101",
     "website": "bombsquadgolf.com", "source": "openseo"}]}


class TestValidate(unittest.TestCase):
    def test_good_file_passes(self):
        self.assertEqual(validate(_write(GOOD)), [])

    def test_missing_field_reported(self):
        bad = json.loads(json.dumps(GOOD))
        del bad["records"][0]["phone"]
        problems = validate(_write(bad))
        self.assertTrue(any("phone" in p for p in problems))

    def test_null_value_reported(self):
        bad = json.loads(json.dumps(GOOD))
        bad["records"][0]["website"] = None
        self.assertTrue(any("website" in p for p in validate(_write(bad))))

    def test_state_mismatch_reported(self):
        bad = json.loads(json.dumps(GOOD))
        bad["records"][0]["state_code"] = "OK"
        self.assertTrue(any("state_code" in p for p in validate(_write(bad))))


if __name__ == "__main__":
    unittest.main()
```

Run — Expected: FAIL.

- [ ] **Step 3: Implement `discovery/validate_raw.py`**

```python
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
```

- [ ] **Step 4: Run tests — PASS.**

- [ ] **Step 5: Write `discovery/RUNBOOK.md`**

```markdown
# Discovery run — OpenSEO source (Claude runbook)

For each pilot state (TX, FL, CA, AZ, GA):

1. For every metro in `discovery/metros.py` METROS[state], for each query in
   QUERIES, call the OpenSEO MCP tool `search_local_businesses` with
   query + "in {metro}, {state}". Keep total batch under 2,000 credits;
   report credit spend to the founder as you go.
2. Collect unique businesses. Map each to the raw record schema
   (see discovery/README.md): name, address, city, state_code, zip, phone,
   website, source="openseo". Missing values = "" (never null).
   Drop obvious non-fitting results (driving ranges, courses without
   a shop, repair-only) — note dropped count.
3. Write discovery/raw/openseo_{STATE}.json:
   {"state": "TX", "source": "openseo", "records": [...]}
4. Gate: `python3 discovery/validate_raw.py discovery/raw/openseo_TX.json`
   must exit 0. Fix problems before proceeding.
5. Then run dedupe: `python3 discovery/dedupe.py --state TX ...`
```

- [ ] **Step 6: Commit** — `git commit -am "feat: openseo discovery runbook + raw validator"`

---

### Task 7: Upload approved shops (+ outreach rows)

**Files:**
- Create: `discovery/upload_new_shops.py` (modeled on `archive/upload_new_shops.py`, but reads the review CSV and also seeds `outreach`)
- Test: `discovery/tests/test_upload.py`

**Interfaces:**
- Consumes: review CSV from Task 4 (`approved` column: only rows with `approved == "yes"` are inserted); `outreach_db.request` (`request(method, path, params=None, body=None, prefer=None)`) and `outreach_db.get_all`.
- Produces: inserted `shops` rows (`status='active'`, `shop_type='Clubfitter'`, `offers_fitting=true`, unique slug) and one `outreach` row per shop (`shop_id`, `email_search_status='pending'`). Prints dry-run/commit JSON summary.

- [ ] **Step 1: Write failing tests for the pure transforms**

`discovery/tests/test_upload.py`:

```python
import unittest

from discovery.upload_new_shops import make_slug, row_to_shop


class TestTransforms(unittest.TestCase):
    def test_make_slug_unique(self):
        taken = {"bomb-squad-golf-plano-tx"}
        self.assertEqual(make_slug("Bomb Squad Golf", "Plano", "TX", set()),
                         "bomb-squad-golf-plano-tx")
        self.assertEqual(make_slug("Bomb Squad Golf", "Plano", "TX", taken),
                         "bomb-squad-golf-plano-tx-2")

    def test_row_to_shop_defaults(self):
        row = {"name": "Bomb Squad Golf", "address": "1 Main St", "city": "Plano",
               "state_code": "TX", "zip": "75023", "phone": "9725550101",
               "website": "bombsquadgolf.com", "sources": "titleist,openseo",
               "verdict": "new", "reason": "", "approved": "yes"}
        shop = row_to_shop(row, set())
        self.assertEqual(shop["status"], "active")
        self.assertEqual(shop["shop_type"], "Clubfitter")
        self.assertTrue(shop["offers_fitting"])
        self.assertEqual(shop["state_code"], "TX")
        self.assertEqual(shop["website"], "https://bombsquadgolf.com")
        self.assertEqual(shop["slug"], "bomb-squad-golf-plano-tx")


if __name__ == "__main__":
    unittest.main()
```

Run — Expected: FAIL.

- [ ] **Step 2: Implement `discovery/upload_new_shops.py`**

```python
"""upload_new_shops.py — insert founder-approved discovered shops.

SAFE BY DESIGN (same contract as the archived uploader):
  * Dry-run by default; --commit to write.
  * Re-checks live DB every run (phone/domain/name+city) — rerun-safe.
  * Unique slugs guaranteed against live data.
  * Also inserts one outreach row per shop (email_search_status='pending')
    so find_emails.py picks new shops up on its next run.

Usage:
  python3 discovery/upload_new_shops.py discovery/review/new_shops_2026-07-23.csv
  python3 discovery/upload_new_shops.py ... --commit
"""
import argparse
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "outreach"))
from discovery.dedupe import ExistingIndex, classify  # noqa: E402

US_STATES = {  # state_code -> full name (needed for the shops.state column)
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


def make_slug(name: str, city: str, state_code: str, taken: set) -> str:
    base = re.sub(r"[^a-z0-9]+", "-",
                  f"{name} {city} {state_code}".lower()).strip("-")
    slug, n = base, 1
    while slug in taken:
        n += 1
        slug = f"{base}-{n}"
    taken.add(slug)
    return slug


def clean_website(url: str) -> str:
    url = (url or "").strip()
    if url and not url.startswith("http"):
        url = "https://" + url
    return url


def row_to_shop(row: dict, taken_slugs: set) -> dict:
    sc = row["state_code"].upper()
    return {
        "name": row["name"].strip(),
        "address": row["address"].strip(),
        "city": row["city"].strip(),
        "state_code": sc,
        "state": US_STATES.get(sc, sc),
        "zip": row["zip"].strip(),
        "phone": row["phone"].strip(),
        "website": clean_website(row["website"]),
        "slug": make_slug(row["name"], row["city"], sc, taken_slugs),
        "status": "active",
        "shop_type": "Clubfitter",
        "offers_fitting": True,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv_path")
    ap.add_argument("--commit", action="store_true")
    args = ap.parse_args()

    from outreach_db import get_all, request  # noqa: E402
    shops = get_all("shops", {"select": "id,name,phone,city,state_code,website,status,slug"})
    ix = ExistingIndex.build(shops)
    taken_slugs = {s["slug"] for s in shops if s.get("slug")}

    to_insert, skipped = [], []
    with open(args.csv_path, newline="") as fh:
        for row in csv.DictReader(fh):
            if row.get("approved", "").strip().lower() != "yes":
                continue
            verdict, reason = classify(row, ix)   # re-check live — rerun safety
            if verdict == "duplicate":
                skipped.append({"name": row["name"], "reason": reason})
                continue
            to_insert.append(row_to_shop(row, taken_slugs))

    print(json.dumps({"would_insert": len(to_insert), "skipped_live_dup": skipped},
                     indent=2))
    for s in to_insert:
        print(f"  + {s['name']} — {s['city']}, {s['state_code']} ({s['slug']})")

    if not args.commit:
        print("\nDRY RUN — nothing written. Add --commit to insert.")
        return
    if not to_insert:
        print("nothing to insert")
        return

    created = request("POST", "shops", body=to_insert,
                      prefer="return=representation")
    outreach_rows = [{"shop_id": s["id"], "email_search_status": "pending"}
                     for s in created]
    request("POST", "outreach", body=outreach_rows)
    print(f"INSERTED {len(created)} shops + {len(outreach_rows)} outreach rows")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Run tests — PASS.** `python3 -m unittest discovery.tests.test_upload -v`

- [ ] **Step 4: Verify the outreach table columns before first live run**

Run: `python3 -c "import sys; sys.path.insert(0,'outreach'); from outreach_db import get_all; r = get_all('outreach', {'select': '*', 'limit': '1'}); print(sorted(r[0].keys()))"`
Expected: column list includes `shop_id` and `email_search_status`. If `outreach` has other NOT NULL columns without defaults, add them to `outreach_rows` construction accordingly (check `web/supabase/` migration files for the outreach schema).

- [ ] **Step 5: Commit** — `git commit -am "feat: discovery upload with outreach seeding"`

---

### Task 8: Pilot run + review (execution, not code)

**Files:**
- Create: `discovery/review/new_shops_{date}.csv` (output)
- Modify: `discovery/sources/oem_endpoints.md` (any endpoint notes learned)

- [ ] **Step 1:** Run OEM source for all 5 pilot states, all working brands: `for s in TX FL CA AZ GA; do python3 discovery/sources/oem_locators.py --state $s; done`
- [ ] **Step 2:** Follow `discovery/RUNBOOK.md` for OpenSEO across the 5 states; validate each file with `validate_raw.py` (exit 0 required).
- [ ] **Step 3:** `python3 discovery/dedupe.py --state TX --state FL --state CA --state AZ --state GA`
- [ ] **Step 4:** Spot-check dedup quality: pick 10 random `new` rows, manually search the live site for each (should be absent); pick any `uncertain` rows and resolve by eye. If obvious duplicates slipped through, STOP — tune `FUZZY_DUP`/`FUZZY_UNCERTAIN`, rerun, re-check before showing the founder.
- [ ] **Step 5:** Summarize for founder in chat: counts per state per source, notable finds, uncertain rows, credit spend. Founder edits `approved` column.
- [ ] **Step 6:** `python3 discovery/upload_new_shops.py <csv>` (dry run) — founder confirms — `--commit`.
- [ ] **Step 7:** Kick off enrichment + email finding for new rows: `python3 outreach/find_emails.py --state TX --limit 50` etc. (existing script; selects `email_search_status='pending'` automatically).
- [ ] **Step 8:** Commit review CSV + endpoint notes; update `tasks/outreach-scale-plan.md` "new prospect sources" section with pilot yield numbers.

---

## Self-Review Notes

- Spec coverage: sources (T5 OEM, T6 OpenSEO), normalize+dedup incl. inactive rows (T2/T4), founder gate (T4 CSV + T8), ingest incl. outreach auto-pickup (T7), checkpoints/retry (T3/T5), credit tracking (T6 runbook), pilot success criteria (T8 step 4). Google Places correctly absent.
- Known open point: exact OEM endpoints unknowable until probe (T5 Step 1) — harness + fixture-TDD pattern locks quality anyway. `outreach` table extra NOT NULL columns verified in T7 Step 4 before first commit run.
- Type consistency: raw record schema identical across T4/T5/T6; `classify` consumed by both T4 CLI and T7 rerun-check with same dict shape (CSV rows carry the same keys).
