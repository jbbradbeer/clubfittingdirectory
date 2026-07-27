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
