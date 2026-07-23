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
