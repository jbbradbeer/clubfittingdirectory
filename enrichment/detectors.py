"""
Launch-monitor and fitting-price detectors — pure text functions, no crawler
dependency. Moved verbatim from enrich_fitting_attrs_crawl.py (which now
imports from here) so the extractors can be used without a browser stack.
"""

import re

# ---------------------------------------------------------------------------
# Launch monitor device map — canonical display name → regexes.
# Order matters: specific devices before the generic brand (a GCQuad page
# usually also says "Foresight"; we keep the specific device and only fall
# back to "Foresight" when no specific model matched).
# ---------------------------------------------------------------------------
DEVICE_PATTERNS: dict[str, list[str]] = {
    "TrackMan":     [r"\btrack\s?man\b"],
    "GCQuad":       [r"\bgc\s?quad\b"],
    "GC3":          [r"\bgc3\b"],
    "FlightScope":  [r"\bflight\s?scope\b"],
    "SkyTrak":      [r"\bsky\s?trak\b"],
    "Mevo":         [r"\bmevo\+?\b"],
    "Full Swing":   [r"\bfull\s?swing\s+(golf|sim|simulator|kit)\b"],
    "SAM PuttLab":  [r"\bsam\s+putt\s?lab\b"],
    "Quintic":      [r"\bquintic\b"],
    "Foresight":    [r"\bforesight\b"],  # generic — dropped if GCQuad/GC3 hit
}
# Generic brand → its specific devices (keep the device, drop the brand)
GENERIC_TO_SPECIFIC = {
    "Foresight": {"GCQuad", "GC3"},
    "FlightScope": {"Mevo"},
}

# ---------------------------------------------------------------------------
# Price extraction — a $ amount only counts when fitting words appear nearby,
# which filters membership fees, sim-rental rates and sale prices.
# ---------------------------------------------------------------------------
PRICE_RE = re.compile(r"\$\s?(\d{2,4}(?:\.\d{2})?)")
FITTING_CONTEXT_RE = re.compile(
    r"fit(?:ting|ted)?s?|full\s+bag|driver|iron|wedge|putter|woods|hybrid|bag\s+mapping",
    re.IGNORECASE,
)
# A price whose nearby text matches these is NOT a fitting price (memberships,
# rentals, merchandise, lessons) even if a fitting word also appears nearby.
NEGATIVE_CONTEXT_RE = re.compile(
    r"member(?:ship)?|/\s?mo\b|per\s+month|monthly|annual|subscription|"
    r"sale|clearance|shoes?|apparel|shirt|glove|"
    r"lesson|rental|per\s+hour|/\s?hr\b|gift\s+card",
    re.IGNORECASE,
)
CONTEXT_BEFORE = 70    # chars before the $ that must mention fitting
CONTEXT_AFTER  = 40    # chars after
PRICE_MIN, PRICE_MAX = 40, 1500  # sane band for a fitting session


def detect_devices(text: str) -> list[str]:
    text_lower = text.lower()
    found = []
    for device, patterns in DEVICE_PATTERNS.items():
        if any(re.search(p, text_lower) for p in patterns):
            found.append(device)
    for generic, specifics in GENERIC_TO_SPECIFIC.items():
        if generic in found and any(d in found for d in specifics):
            found.remove(generic)
    return sorted(found)


def extract_prices(text: str) -> tuple[int | None, int | None, str]:
    """Return (min, max, snippets) for fitting-context prices on the page."""
    prices: list[int] = []
    snippets: list[str] = []
    for m in PRICE_RE.finditer(text):
        try:
            value = int(float(m.group(1)))
        except ValueError:
            continue
        if not (PRICE_MIN <= value <= PRICE_MAX):
            continue
        window = text[max(0, m.start() - CONTEXT_BEFORE): m.end() + CONTEXT_AFTER]
        if not FITTING_CONTEXT_RE.search(window):
            continue
        # The label for a price nearly always PRECEDES it ("Membership $99"),
        # so only the preceding text (+ a few trailing chars for "/mo") vetoes.
        neg_window = text[max(0, m.start() - CONTEXT_BEFORE): m.end() + 8]
        if NEGATIVE_CONTEXT_RE.search(neg_window):
            continue
        prices.append(value)
        snippet = " ".join(window.split())
        if snippet not in snippets and len(snippets) < 6:
            snippets.append(snippet)
    if not prices:
        return None, None, ""
    return min(prices), max(prices), " || ".join(snippets)
