"""
Enrichment engine — extract differentiating fitting attributes from a shop's
website into review-ready facts.

Standalone module with a clean interface so it can be reused as the
fitter-facing website-audit product:

    from enrichment import extract_all, crawl_site

    pages = await crawl_site("https://example-fitter.com")   # {url: markdown}
    facts = extract_all(pages)                                # {field: Extraction}

Nothing here touches the database. The CLI wrappers at the repo root
(enrich_listing_depth.py -> review CSV -> push_listing_facts.py) handle the
staged human-review workflow.
"""

from .extractors import Extraction, extract_all

__all__ = ["Extraction", "extract_all", "crawl_site", "crawl_sites"]


def __getattr__(name):
    # Lazy: the crawler needs crawl4ai (venv-only). The pure extractors must
    # stay importable everywhere — e.g. the audit product's text-only mode.
    if name in ("crawl_site", "crawl_sites"):
        from . import crawler
        return getattr(crawler, name)
    raise AttributeError(name)
