#!/usr/bin/env python3
"""
agentmail_client.py — minimal AgentMail REST client for the outreach engine.

Same philosophy as outreach_db.py: plain urllib, no dependencies, one module
that owns the API contract. Reads AGENTMAIL_API_KEY from the environment,
falling back to web/.env.local.

API: https://docs.agentmail.to (v0). The inbox we send from is configured in
.claude/skills/fitter-outreach/config.json as AGENTMAIL_INBOX.

CLI (for quick checks; scripts import the functions):
  python3 outreach/agentmail_client.py whoami          # list inboxes
  python3 outreach/agentmail_client.py received [--limit 20]
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE = "https://api.agentmail.to/v0"
ENV_LOCAL = Path(__file__).resolve().parent.parent / "web" / ".env.local"
CONFIG = Path(__file__).resolve().parent.parent / ".claude" / "skills" / "fitter-outreach" / "config.json"


def api_key() -> str:
    key = os.environ.get("AGENTMAIL_API_KEY", "")
    if not key and ENV_LOCAL.exists():
        for line in ENV_LOCAL.read_text().splitlines():
            if line.startswith("AGENTMAIL_API_KEY="):
                key = line.split("=", 1)[1].strip()
    if not key:
        sys.exit("ERROR: AGENTMAIL_API_KEY not set (env or web/.env.local)")
    return key


def inbox_id() -> str:
    cfg = json.loads(CONFIG.read_text())
    inbox = cfg.get("AGENTMAIL_INBOX", "")
    if not inbox:
        sys.exit("ERROR: AGENTMAIL_INBOX missing from fitter-outreach config.json")
    return inbox


def request(method: str, path: str, params: dict | None = None, body=None):
    url = f"{BASE}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            "Authorization": f"Bearer {api_key()}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        detail = e.read().decode()[:500]
        raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {detail}") from e


# ── Operations the outreach scripts use ──────────────────────


def send_message(to: str, subject: str, text: str, labels: list[str] | None = None) -> dict:
    """Send a fresh email. Returns the API response (includes message_id)."""
    body = {"to": [to], "subject": subject, "text": text}
    if labels:
        body["labels"] = labels
    return request("POST", f"/inboxes/{inbox_id()}/messages/send", body=body)


def reply_to_message(message_id: str, to: str, subject: str, text: str) -> dict:
    """Reply in-thread to one of our own earlier messages (keeps Re: threading).
    Falls back to a fresh send if the original message can't be replied to."""
    try:
        return request(
            "POST",
            f"/inboxes/{inbox_id()}/messages/{urllib.parse.quote(message_id, safe='')}/reply",
            body={"text": text},
        )
    except RuntimeError:
        return send_message(to, subject, text)


def list_messages(limit: int = 50, labels: list[str] | None = None) -> list[dict]:
    params: dict = {"limit": limit}
    if labels:
        params["labels"] = ",".join(labels)
    data = request("GET", f"/inboxes/{inbox_id()}/messages", params=params) or {}
    return data.get("messages", [])


def get_message(message_id: str) -> dict:
    return request(
        "GET",
        f"/inboxes/{inbox_id()}/messages/{urllib.parse.quote(message_id, safe='')}",
    )


def list_inboxes() -> dict:
    return request("GET", "/inboxes")


# ── CLI for quick manual checks ──────────────────────────────


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("whoami")
    r = sub.add_parser("received")
    r.add_argument("--limit", type=int, default=20)
    args = p.parse_args()

    if args.cmd == "whoami":
        print(json.dumps(list_inboxes(), indent=2))
    elif args.cmd == "received":
        msgs = list_messages(limit=args.limit, labels=["received"])
        print(json.dumps([
            {"message_id": m.get("message_id"), "from": m.get("from"),
             "subject": m.get("subject"), "timestamp": m.get("timestamp"),
             "preview": (m.get("preview") or "")[:140]}
            for m in msgs
        ], indent=2))


if __name__ == "__main__":
    main()
