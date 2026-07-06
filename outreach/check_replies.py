#!/usr/bin/env python3
"""
check_replies.py — scan the AgentMail inbox for replies and update the pipeline.

For every received message whose sender matches a contacted outreach row:
  * "pass" / unsubscribe language  -> status do_not_contact (never emailed again)
  * bounce / mailer-daemon notices -> status do_not_contact, noted as bounce
  * everything else                -> status replied (stops the sequence), and
    the full reply text is printed so the founder/skill can classify it and
    respond (interested -> send the Cal.com link, questions -> draft an answer).

Idempotent: already-processed rows (status not in sent_*) are reported but not
re-transitioned, so running this daily is safe.

Usage:
  python3 outreach/check_replies.py             # dry run — shows what it would do
  python3 outreach/check_replies.py --commit    # apply status changes
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

import agentmail_client as am  # noqa: E402

OPT_OUT = re.compile(r"^\s*(pass|no thanks?|not interested|unsubscribe|remove me|stop)\b", re.I)
BOUNCE_SENDERS = ("mailer-daemon", "postmaster", "no-reply", "noreply")
BOUNCE_SUBJECTS = re.compile(r"undeliver|delivery (status|failure)|returned mail|bounce", re.I)


def contacted_map() -> dict:
    out = subprocess.run(
        [sys.executable, str(ROOT / "outreach" / "outreach_db.py"), "contacted-emails"],
        capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def db_cmd(*argv):
    return subprocess.run(
        [sys.executable, str(ROOT / "outreach" / "outreach_db.py"), *argv],
        capture_output=True, text=True, check=True).stdout


def sender_address(msg: dict) -> str:
    raw = msg.get("from") or ""
    if isinstance(raw, list):
        raw = raw[0] if raw else ""
    m = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", str(raw))
    return m.group(0).lower() if m else ""


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--commit", action="store_true")
    p.add_argument("--limit", type=int, default=100, help="received messages to scan")
    args = p.parse_args()

    contacts = contacted_map()
    messages = am.list_messages(limit=args.limit, labels=["received"])

    replies, bounces, optouts, unmatched = [], [], [], []
    for msg in messages:
        addr = sender_address(msg)
        subject = msg.get("subject") or ""
        # Bounce notices come from the mail system, not the contact — try to
        # recover the original recipient from the bounce body/preview.
        is_bounce = any(b in addr for b in BOUNCE_SENDERS) or BOUNCE_SUBJECTS.search(subject)
        preview = msg.get("preview") or ""

        if is_bounce:
            hit = next((e for e in contacts if e in preview.lower()), None)
            if hit:
                bounces.append({"outreach_id": contacts[hit], "email": hit,
                                "message_id": msg.get("message_id"), "subject": subject})
            continue

        if addr not in contacts:
            if addr:
                unmatched.append({"from": addr, "subject": subject})
            continue

        entry = {"outreach_id": contacts[addr], "email": addr,
                 "message_id": msg.get("message_id"), "subject": subject,
                 "preview": preview[:500]}
        if OPT_OUT.match(preview.strip()):
            optouts.append(entry)
        else:
            replies.append(entry)

    if args.commit:
        for r in replies:
            db_cmd("mark-replied", r["outreach_id"],
                   "--note", f"reply via agentmail msg {r['message_id']}")
        for o in optouts:
            db_cmd("mark-replied", o["outreach_id"], "--do-not-contact",
                   "--note", "opted out by reply")
        for b in bounces:
            db_cmd("set-status", b["outreach_id"], "do_not_contact",
                   "--note", "bounced")

    print(json.dumps({
        "mode": "commit" if args.commit else "dry_run",
        "scanned": len(messages),
        "replies_needing_response": replies,
        "opt_outs": optouts,
        "bounces": bounces,
        "unmatched_senders": unmatched[:10],
    }, indent=2))


if __name__ == "__main__":
    main()
