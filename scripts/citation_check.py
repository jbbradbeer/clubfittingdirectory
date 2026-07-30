#!/usr/bin/env python3
"""
citation_check.py — weekly AI-citation scoreboard for clubfittingdirectory.com.

Holds the CANONICAL prompt set and the time-series store
(tasks/citations/history.csv). Three modes:

  --prompts            Print the canonical prompt list (one per line). The
                       Monday cloud agent uses this as its checklist, runs each
                       through web search, then records results with --append.

  --append ENGINE PROMPT CITED LISTINGS COMPETITORS
                       Append one observation. CITED = yes|no.
                       LISTINGS/COMPETITORS = semicolon-separated or "-".
                       Example:
                         python3 scripts/citation_check.py --append google-serp \
                           "best independent club fitter in austin" no - \
                           "fittingpros.com;clubchampion.com"

  (default)            Run every available engine automatically:
                       - duckduckgo (zero-key SERP presence; best-effort — a
                         blocked request records engine_error, not a false 'no')
                       - openai / anthropic / perplexity model sampling, 5
                         samples per prompt, ONLY when the matching key
                         (OPENAI_API_KEY / ANTHROPIC_API_KEY /
                         PERPLEXITY_API_KEY) exists in web/.env.local.
                       Adding a key upgrades measurement with zero code change.

CSV columns: date, engine, prompt, sample, cited, listings, competitors
Single-run SERP checks are deterministic (sample=1); model modes take 5
samples per prompt because single-run LLM measurements are noisy.
"""

import argparse
import csv
import datetime
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ENV_PATH = REPO / "web" / ".env.local"
CSV_PATH = REPO / "tasks" / "citations" / "history.csv"
FIELDS = ["date", "engine", "prompt", "sample", "cited", "listings", "competitors"]

OUR_DOMAIN = "clubfittingdirectory.com"
COMPETITOR_DOMAINS = [
    "fittingpros.com", "golffittingfinder.com", "clubchampion.com",
    "truespecgolf.com", "golftec.com", "pgatoursuperstore.com",
    "golfgalaxy.com", "mygolfspy.com",
]

# Canonical prompt set: the 8 fixed queries from tasks/ai-citation-log.md plus
# the AI-answer-shaped local/comparison prompts from the Phase 5 plan.
CITY_SAMPLE = ["austin", "charlotte", "phoenix", "columbus", "denver"]
PROMPTS = [
    "club fitting directory",
    "golf club fitting near me",
    "independent golf club fitter",
    "where to get fitted for golf clubs",
    "golf club fitting cost",
    "best golf club fitters in the us",
    "golf club fitting austin",
    "golf club fitting charlotte nc",
    *[f"where can I get fitted for irons near {c}" for c in CITY_SAMPLE],
    *[f"best independent club fitter in {c}" for c in CITY_SAMPLE],
    "club champion vs independent fitter",
]

MODEL_SAMPLES = 5


def load_env() -> dict[str, str]:
    env = {}
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k] = v.strip()
    return env


def append_rows(rows: list[dict]) -> None:
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    new_file = not CSV_PATH.exists()
    with CSV_PATH.open("a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        if new_file:
            w.writeheader()
        w.writerows(rows)


def classify_text(text: str) -> tuple[str, str]:
    """Return (cited yes/no, competitors present) for a block of answer/SERP text."""
    low = text.lower()
    cited = "yes" if OUR_DOMAIN in low else "no"
    competitors = ";".join(d for d in COMPETITOR_DOMAINS if d in low) or "-"
    return cited, competitors


# ── Zero-key SERP engine (DuckDuckGo HTML endpoint; best-effort) ────────────
def duckduckgo_serp(prompt: str) -> str | None:
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(prompt)
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) citation-check/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.read().decode("utf-8", "replace")
    except Exception:
        return None


# ── Model engines (activate per available key) ──────────────────────────────
def post_json(url: str, headers: dict, body: dict, timeout: int = 90) -> dict:
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", **headers})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def ask_perplexity(key: str, prompt: str) -> str:
    out = post_json("https://api.perplexity.ai/chat/completions",
                    {"Authorization": f"Bearer {key}"},
                    {"model": "sonar", "messages": [{"role": "user", "content": prompt}]})
    msg = out["choices"][0]["message"]["content"]
    cites = " ".join(out.get("citations", []))
    return f"{msg} {cites}"


def ask_openai(key: str, prompt: str) -> str:
    out = post_json("https://api.openai.com/v1/responses",
                    {"Authorization": f"Bearer {key}"},
                    {"model": "gpt-5.2", "tools": [{"type": "web_search"}], "input": prompt})
    return json.dumps(out)


def ask_anthropic(key: str, prompt: str) -> str:
    out = post_json("https://api.anthropic.com/v1/messages",
                    {"x-api-key": key, "anthropic-version": "2023-06-01"},
                    {"model": "claude-sonnet-5", "max_tokens": 1024,
                     "tools": [{"type": "web_search_20250305", "name": "web_search", "max_uses": 3}],
                     "messages": [{"role": "user", "content": prompt}]})
    return json.dumps(out)


MODEL_ENGINES = [
    ("perplexity", "PERPLEXITY_API_KEY", ask_perplexity),
    ("openai", "OPENAI_API_KEY", ask_openai),
    ("anthropic", "ANTHROPIC_API_KEY", ask_anthropic),
]


def extract_listing_names(text: str) -> str:
    """Directory listing slugs mentioned via our own URLs."""
    slugs = set(re.findall(r"clubfittingdirectory\.com/listing/([a-z0-9-]+)", text.lower()))
    return ";".join(sorted(slugs)) or "-"


def run_auto() -> None:
    env = load_env()
    today = datetime.date.today().isoformat()
    rows: list[dict] = []

    print(f"Prompts: {len(PROMPTS)}")
    print("Engine: duckduckgo (zero-key SERP)")
    for prompt in PROMPTS:
        html = duckduckgo_serp(prompt)
        if html is None:
            rows.append({"date": today, "engine": "duckduckgo", "prompt": prompt,
                         "sample": 1, "cited": "engine_error", "listings": "-", "competitors": "-"})
        else:
            cited, competitors = classify_text(html)
            rows.append({"date": today, "engine": "duckduckgo", "prompt": prompt,
                         "sample": 1, "cited": cited,
                         "listings": extract_listing_names(html), "competitors": competitors})
        time.sleep(2)  # be polite

    for engine, key_name, ask in MODEL_ENGINES:
        key = env.get(key_name)
        if not key:
            print(f"Engine: {engine} — skipped ({key_name} not set)")
            continue
        print(f"Engine: {engine} ({MODEL_SAMPLES} samples/prompt)")
        for prompt in PROMPTS:
            for sample in range(1, MODEL_SAMPLES + 1):
                try:
                    text = ask(key, prompt)
                    cited, competitors = classify_text(text)
                    rows.append({"date": today, "engine": engine, "prompt": prompt,
                                 "sample": sample, "cited": cited,
                                 "listings": extract_listing_names(text),
                                 "competitors": competitors})
                except Exception as e:
                    rows.append({"date": today, "engine": engine, "prompt": prompt,
                                 "sample": sample, "cited": "engine_error",
                                 "listings": "-", "competitors": str(e)[:60]})

    append_rows(rows)
    ok = [r for r in rows if r["cited"] != "engine_error"]
    cited = [r for r in ok if r["cited"] == "yes"]
    print(f"\nRecorded {len(rows)} observations → {CSV_PATH}")
    print(f"Cited in {len(cited)}/{len(ok)} successful checks"
          + (f" ({len(rows) - len(ok)} engine errors)" if len(rows) != len(ok) else ""))
    for r in cited:
        print(f"  CITED  [{r['engine']}] {r['prompt']}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompts", action="store_true", help="print canonical prompt list")
    ap.add_argument("--append", nargs=5,
                    metavar=("ENGINE", "PROMPT", "CITED", "LISTINGS", "COMPETITORS"),
                    help="append one observation recorded externally (e.g. by the Monday agent)")
    args = ap.parse_args()

    if args.prompts:
        print("\n".join(PROMPTS))
        return 0
    if args.append:
        engine, prompt, cited, listings, competitors = args.append
        if cited not in ("yes", "no"):
            sys.exit("CITED must be yes|no")
        append_rows([{"date": datetime.date.today().isoformat(), "engine": engine,
                      "prompt": prompt, "sample": 1, "cited": cited,
                      "listings": listings, "competitors": competitors}])
        print(f"appended → {CSV_PATH}")
        return 0
    run_auto()
    return 0


if __name__ == "__main__":
    main()
