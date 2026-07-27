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
