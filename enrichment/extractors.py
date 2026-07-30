"""
Pure text -> fact extractors for the enrichment engine.

Every extractor returns an Extraction (value, confidence, snippet, source_url)
or None when the page gives no evidence. Booleans are only ever asserted TRUE —
absence of a mention is never evidence of absence, so no extractor returns
False. Confidences are deliberately conservative: everything here enters the
provenance ledger as source 'scrape:web' and a human reviews the snippet before
anything is pushed.

Launch-monitor and price detection live in detectors.py (shared with the
original enrich_fitting_attrs_crawl.py) rather than duplicated.
"""

import re
from dataclasses import dataclass
from datetime import date

from .detectors import detect_devices, extract_prices


@dataclass
class Extraction:
    value: object            # str | int | bool | list[str]
    confidence: float        # 0-1, conservative
    snippet: str             # the evidence a human reviews
    source_url: str = ""     # page the evidence came from


def _snippet(text: str, start: int, end: int, radius: int = 60) -> str:
    return " ".join(text[max(0, start - radius): end + radius].split())


# ---------------------------------------------------------------------------
# Brands fitted — canonical club/putter manufacturers. A brand only counts
# when it appears near fitting/dealer context; bare mentions on a retail page
# are merchandise, not a fitting matrix.
# ---------------------------------------------------------------------------
BRAND_PATTERNS: dict[str, str] = {
    "Titleist":       r"\btitleist\b",
    "TaylorMade":     r"\btaylor\s?made\b",
    "Callaway":       r"\bcallaway\b",
    "PING":           r"\bping\b",
    "Mizuno":         r"\bmizuno\b",
    "Srixon":         r"\bsrixon\b",
    "Cobra":          r"\bcobra\b",
    "PXG":            r"\bpxg\b",
    "Wilson":         r"\bwilson\b",
    "Bridgestone":    r"\bbridgestone\b",
    "Cleveland":      r"\bcleveland\b",
    "Scotty Cameron": r"\bscotty\s+cameron\b",
    "Odyssey":        r"\bodyssey\b",
    "Honma":          r"\bhonma\b",
    "Bettinardi":     r"\bbettinardi\b",
    "Edel":           r"\bedel\b",
    "Miura":          r"\bmiura\b",
    "Tour Edge":      r"\btour\s+edge\b",
    "XXIO":           r"\bxxio\b",
}
BRAND_CONTEXT_RE = re.compile(
    r"fit(?:ting|ted|ter)?s?|custom|authoriz|certified|dealer|demo|matrix|"
    r"brands?\s+we|we\s+(?:carry|fit|stock)",
    re.IGNORECASE,
)
BRAND_CONTEXT_RADIUS = 200


def extract_brands(text: str, url: str = "") -> Extraction | None:
    lower = text.lower()
    found: list[str] = []
    first_snip = ""
    for brand, pattern in BRAND_PATTERNS.items():
        m = re.search(pattern, lower)
        if not m:
            continue
        window = lower[max(0, m.start() - BRAND_CONTEXT_RADIUS): m.end() + BRAND_CONTEXT_RADIUS]
        if not BRAND_CONTEXT_RE.search(window):
            continue
        found.append(brand)
        if not first_snip:
            first_snip = _snippet(text, m.start(), m.end(), 90)
    # A single brand near "authorized dealer" is a retail signal, not a fitting
    # matrix — require two brands before claiming anything.
    if len(found) < 2:
        return None
    return Extraction(sorted(found), 0.5, first_snip, url)


# ---------------------------------------------------------------------------
# Year established
# ---------------------------------------------------------------------------
YEAR_RE = re.compile(
    r"(?:established|est\.?|founded|serving[^.]{0,60}since|in\s+business\s+since|"
    r"opened(?:\s+(?:our\s+doors|in))?|since)\s*[:\-–]?\s*\(?((?:18|19|20)\d{2})\b",
    re.IGNORECASE,
)


def extract_year_established(text: str, url: str = "") -> Extraction | None:
    current = date.today().year
    for m in YEAR_RE.finditer(text):
        year = int(m.group(1))
        if 1850 <= year <= current:
            # "since 2015" alone is weaker evidence than "established 2015" —
            # copyright lines say "© since"-ish things. Penalize bare "since".
            strong = not m.group(0).lower().startswith("since")
            return Extraction(year, 0.55 if strong else 0.45, _snippet(text, m.start(), m.end()), url)
    return None


# ---------------------------------------------------------------------------
# Credentials / certifications — canonical labels only, no free text.
# ---------------------------------------------------------------------------
CREDENTIAL_PATTERNS: dict[str, str] = {
    "PGA Professional":            r"\b(?:class\s+a\s+)?pga\s+(?:of\s+america\s+)?(?:professional|member|pro)\b",
    "Master Club Fitter":          r"\bmaster\s+(?:club\s*)?fitter\b",
    "Master Club Builder":         r"\bmaster\s+(?:club\s*)?builder\b",
    "TrackMan Certified":          r"\btrackman\s+(?:certified|master|university)\b",
    "Titleist Certified Fitter":   r"\btitleist\s+(?:certified|advanced|regional)\s+fitt?(?:er|ing)\b",
    "PING Certified Fitter":       r"\bping\s+certified\b",
    "Callaway Certified Fitter":   r"\bcallaway\s+certified\b",
    "TaylorMade Certified Fitter": r"\btaylor\s?made\s+certified\b",
    "Mizuno Certified Fitter":     r"\bmizuno\s+certified\b",
    "Golf Digest Top 100 Fitter":  r"\b(?:golf\s+digest[^.]{0,40})?top\s*100\s+(?:club\s*)?fitters?\b",
    "AGCP Member":                 r"\bagcp\b|\bassociation\s+of\s+golf\s+clubfitting\s+professionals\b",
    "GCA Accredited":              r"\bgolf\s+clubmakers\s+association\b",
    "SAM PuttLab Certified":       r"\bsam\s+putt\s?lab\s+certified\b",
}


def extract_credentials(text: str, url: str = "") -> Extraction | None:
    lower = text.lower()
    found: list[str] = []
    first_snip = ""
    for label, pattern in CREDENTIAL_PATTERNS.items():
        m = re.search(pattern, lower)
        if m:
            found.append(label)
            if not first_snip:
                first_snip = _snippet(text, m.start(), m.end(), 90)
    if not found:
        return None
    return Extraction(sorted(found), 0.55, first_snip, url)


# ---------------------------------------------------------------------------
# Bay count
# ---------------------------------------------------------------------------
BAY_RE = re.compile(
    r"\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s+"
    r"(?:private\s+|indoor\s+|state[\s-]of[\s-]the[\s-]art\s+)?"
    r"(?:hitting|fitting|simulator|sim|golf)\s+bays?\b",
    re.IGNORECASE,
)
WORD_NUMS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
             "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}


def extract_bay_count(text: str, url: str = "") -> Extraction | None:
    for m in BAY_RE.finditer(text):
        raw = m.group(1).lower()
        count = WORD_NUMS.get(raw) or int(raw)
        if 1 <= count <= 99:
            return Extraction(count, 0.55, _snippet(text, m.start(), m.end()), url)
    return None


# ---------------------------------------------------------------------------
# Mobile fitting (true-only)
# ---------------------------------------------------------------------------
MOBILE_RE = re.compile(
    r"\bmobile\s+(?:club\s+)?fitting\b|\bfitting\s+van\b|"
    r"\bwe\s+(?:come|bring\s+the\s+fitting)\s+to\s+you\b|\bon[\s-]course\s+fitting\b",
    re.IGNORECASE,
)


def extract_mobile_fitting(text: str, url: str = "") -> Extraction | None:
    m = MOBILE_RE.search(text)
    if not m:
        return None
    return Extraction(True, 0.55, _snippet(text, m.start(), m.end()), url)


# ---------------------------------------------------------------------------
# In-house club building (true-only)
# ---------------------------------------------------------------------------
BUILD_RE = re.compile(
    r"\b(?:built?|assembl\w+|hand[\s-]?built?)\s+(?:right\s+)?(?:in[\s-]house|on[\s-]site)\b|"
    r"\bin[\s-]house\s+(?:club\s+)?build(?:ing|s|er)?\b|"
    r"\bwe\s+build\s+(?:all\s+)?(?:of\s+)?(?:our|your|every)\s+(?:own\s+)?clubs?\b|"
    r"\bcustom\s+club\s+building\b",
    re.IGNORECASE,
)


def extract_in_house_build(text: str, url: str = "") -> Extraction | None:
    m = BUILD_RE.search(text)
    if not m:
        return None
    return Extraction(True, 0.55, _snippet(text, m.start(), m.end()), url)


# ---------------------------------------------------------------------------
# Launch monitors + prices — thin adapters over the proven detectors.
# ---------------------------------------------------------------------------
def extract_launch_monitors(text: str, url: str = "") -> Extraction | None:
    devices = detect_devices(text)
    if not devices:
        return None
    return Extraction(devices, 0.55, "", url)


def extract_price_range(text: str, url: str = "") -> tuple[Extraction, Extraction] | None:
    pmin, pmax, snippets = extract_prices(text)
    if pmin is None:
        return None
    return (
        Extraction(pmin, 0.55, snippets, url),
        Extraction(pmax, 0.55, snippets, url),
    )


# ---------------------------------------------------------------------------
# Run everything over a set of crawled pages ({url: text}). First page (in
# insertion order) is assumed to be the homepage; later pages are subpages.
# For each field, the first page with evidence wins.
# ---------------------------------------------------------------------------
def extract_all(pages: dict[str, str]) -> dict[str, Extraction]:
    single_field = {
        "brands_fitted":    extract_brands,
        "year_established": extract_year_established,
        "credentials":      extract_credentials,
        "bay_count":        extract_bay_count,
        "mobile_fitting":   extract_mobile_fitting,
        "in_house_build":   extract_in_house_build,
        "launch_monitors":  extract_launch_monitors,
    }
    out: dict[str, Extraction] = {}
    for url, text in pages.items():
        if not text or not text.strip():
            continue
        for field, fn in single_field.items():
            if field not in out:
                result = fn(text, url)
                if result is not None:
                    out[field] = result
        if "fitting_price_min" not in out:
            prices = extract_price_range(text, url)
            if prices is not None:
                out["fitting_price_min"], out["fitting_price_max"] = prices
    return out
