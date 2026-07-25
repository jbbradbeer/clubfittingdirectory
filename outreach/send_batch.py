#!/usr/bin/env python3
"""
send_batch.py — render and SEND today's outreach batch through AgentMail.

Replaces the old Gmail-drafts flow (founder sent by hand) now that the engine
has its own sending inbox. The DB contract is unchanged: batch selection and
status transitions still go through outreach_db.py, so cadence, do_not_contact
and the audit log keep working exactly as before.

Safety model:
  * DRY RUN by default — prints fully rendered emails, sends nothing.
  * --commit actually sends, capped at min(--limit, DAILY_CAP, warm-up cap).
    The warm-up cap starts at 5/day on the first sending day and grows by 2
    per calendar day since first send (a fresh inbox must build reputation
    slowly or everything lands in spam).
  * One email per contact address per day, duplicates skipped.
  * Every email ends with the CAN-SPAM signature (address + "reply 'pass'").
  * Touches 2/3 are sent as replies in the original thread when we have the
    touch-1 AgentMail message id (stored in draft_gmail_id as "am:<id>").

Personalization: pass --hooks-file hooks.json  ({outreach_id: {"hook_line":
"...", "greeting": "..."}}) — written by the fitter-outreach skill after it
reads each shop's website. Rows without a hook get a deterministic fallback
built from the shop's own directory data (launch monitor / city), never an
invented claim.

Usage:
  python3 outreach/send_batch.py --limit 10                 # dry run
  python3 outreach/send_batch.py --limit 10 --commit
  python3 outreach/send_batch.py --limit 10 --hooks-file hooks.json --commit
  python3 outreach/send_batch.py --test-to you@example.com  # one real test email
"""

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

import agentmail_client as am  # noqa: E402
import outreach_db as db       # noqa: E402

TEMPLATES = ROOT / ".claude" / "skills" / "fitter-outreach" / "templates"
CONFIG = ROOT / ".claude" / "skills" / "fitter-outreach" / "config.json"
SITE = "https://clubfittingdirectory.com"

WARMUP_START = 5   # sends allowed on day 1
WARMUP_STEP = 2    # extra sends allowed per calendar day since first send


def load_config() -> dict:
    cfg = json.loads(CONFIG.read_text())
    for k in ("STRIPE_LINK", "CALENDLY_URL", "MAILING_ADDRESS", "SIGNATURE_NAME", "AGENTMAIL_INBOX"):
        if not cfg.get(k) or "{{" in str(cfg.get(k)):
            sys.exit(f"ERROR: config.json {k} is missing/unfilled — refusing to send.")
    return cfg


def render_signature(cfg: dict) -> str:
    raw = (TEMPLATES / "signature.md").read_text()
    body = "\n".join(l for l in raw.splitlines() if not l.startswith("#")).strip()
    return body.replace("{{SIGNATURE_NAME}}", cfg["SIGNATURE_NAME"]) \
               .replace("{{MAILING_ADDRESS}}", cfg["MAILING_ADDRESS"])


def display_name(name: str) -> str:
    """Shop names come from the scraper with shouty tokens ("Total Fit GOLF")
    or flattened case ("Mcgolf"). Recase any all-caps alphabetic word of 3+
    letters; leave short tokens (state codes, acronyms like "PGA" or "USA")
    and other mixed-case words alone. Then restore Mc/Mac capitalization."""
    cleaned = " ".join(
        w.capitalize() if w.isalpha() and w.isupper() and len(w) >= 4 else w
        for w in (name or "").split()
    )
    return re.sub(r"\b(Mc|Mac)([a-z])", lambda m: m.group(1) + m.group(2).upper(), cleaned)


def has_mx(email: str) -> bool:
    """True if the address's domain publishes MX records (or dig is unavailable
    — never let a missing tool block the batch). A domain with no MX can't
    receive mail, so sending would bounce and burn sender reputation."""
    domain = email.rsplit("@", 1)[-1]
    try:
        out = subprocess.run(["dig", "+short", "MX", domain],
                             capture_output=True, text=True, timeout=10)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return True
    return bool(out.stdout.strip())


def render_touch(touch: int, row: dict, cfg: dict, hook: dict) -> tuple[str, str]:
    """Returns (subject, body) with every placeholder resolved."""
    shop = row["shops"]
    raw = (TEMPLATES / f"touch{touch}.md").read_text()
    lines = [l for l in raw.splitlines() if not l.startswith("#")]
    text = "\n".join(lines).strip()

    subject = ""
    if text.startswith("Subject:"):
        subject, _, text = text.partition("\n")
        subject = subject.replace("Subject:", "").strip()
        text = text.strip()

    greeting = hook.get("greeting") or "Hi there"
    hook_line = hook.get("hook_line") or fallback_hook(shop)
    closing_angle = closing_angle_for(shop, cfg)

    for k, v in {
        "{{greeting}}": greeting,
        "{{shop_name}}": display_name(shop["name"]),
        "{{listing_url}}": f"{SITE}/listing/{shop['slug']}",
        "{{claim_url}}": f"{SITE}/claim/{shop['slug']}?src=outreach",
        "{{hook_line}}": hook_line,
        "{{closing_angle}}": closing_angle,
        "{{state}}": shop.get("state") or shop.get("state_code") or "your state",
        "{{STRIPE_LINK}}": cfg["STRIPE_LINK"],
        "{{CALENDLY_URL}}": cfg["CALENDLY_URL"],
        "{{SIGNATURE}}": render_signature(cfg),
    }.items():
        subject = subject.replace(k, v)
        text = text.replace(k, v)
    return subject, text


def fallback_hook(shop: dict) -> str:
    """Deterministic hook from data we KNOW is true (never an invented claim)."""
    city = shop.get("city") or "your area"
    return (f"Golfers comparing fitters in {city} see your page alongside our new "
            f"\"Top Club Fitters in {shop.get('state') or shop.get('state_code')} for 2026\" rankings.")


def closing_angle_for(shop: dict, cfg: dict) -> str:
    sp = cfg.get("SOCIAL_PROOF") or {}
    if sp.get("founding_spots_sold"):
        example = f", including {sp['example_shop']}" if sp.get("example_shop") else ""
        return f"{sp['founding_spots_sold']} shops have claimed their listing{example}."
    return ("Your listing is live and getting traffic. Claiming it is free and "
            "puts the Verified badge on it.")


def get_batch(limit: int) -> list[dict]:
    cmd = [sys.executable, str(ROOT / "outreach" / "outreach_db.py"), "batch", "--limit", str(limit)]
    out = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def sends_today_and_first_day() -> tuple[int, str | None]:
    rows = db.get_all("outreach", {
        "select": "last_touch_at",
        "last_touch_at": "not.is.null",
        "order": "last_touch_at.asc",
    })
    if not rows:
        return 0, None
    today = datetime.now(timezone.utc).date().isoformat()
    sent_today = len([r for r in rows if (r["last_touch_at"] or "").startswith(today)])
    return sent_today, rows[0]["last_touch_at"][:10]


def warmup_cap(first_send_day: str | None) -> int:
    if first_send_day is None:
        return WARMUP_START
    days = (datetime.now(timezone.utc).date()
            - datetime.fromisoformat(first_send_day).date()).days
    return WARMUP_START + WARMUP_STEP * days


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--limit", type=int, default=10)
    p.add_argument("--hooks-file", help="JSON: {outreach_id: {hook_line, greeting}}")
    p.add_argument("--allow-generic", action="store_true",
                   help="permit touch-1 sends WITHOUT a per-shop hook (founder review 2026-07-08: generic first touches read as mail merge, so they are blocked by default)")
    p.add_argument("--commit", action="store_true", help="actually send (default: dry run)")
    p.add_argument("--test-to", help="send ONE touch-1 test email to this address and exit")
    args = p.parse_args()

    cfg = load_config()
    hooks = json.loads(Path(args.hooks_file).read_text()) if args.hooks_file else {}

    # ── Test mode: one real email to the founder's own address ──
    if args.test_to:
        fake = {"shops": {"name": "Test Golf Shop", "slug": "test-golf-shop",
                          "city": "Denver", "state": "Colorado", "state_code": "CO"}}
        subject, body = render_touch(1, fake, cfg, {})
        resp = am.send_message(args.test_to, f"[TEST] {subject}", body, labels=["outreach", "test"])
        print(json.dumps({"ok": True, "test_sent_to": args.test_to,
                          "message_id": resp.get("message_id")}, indent=2))
        return

    # ── Caps ──
    sent_today, first_day = sends_today_and_first_day()
    cap = min(args.limit, int(cfg.get("DAILY_CAP", 20)), warmup_cap(first_day))
    budget = max(0, cap - sent_today)
    print(f"# cap={cap} (limit {args.limit}, daily {cfg.get('DAILY_CAP')}, "
          f"warm-up {warmup_cap(first_day)}) — sent today {sent_today} — budget {budget}",
          file=sys.stderr)
    if budget == 0:
        print(json.dumps({"sent": 0, "note": "daily budget exhausted"}))
        return

    batch = get_batch(budget)

    seen_emails: set[str] = set()
    results = []
    for row in batch:
        email = (row["contact_email"] or "").lower()
        touch = row["touch_number"]
        # Founder-driven flow: a fresh shop with no email still renders — the
        # founder hunts the address himself and reports it back (`email <id>`).
        # Commit-mode (unused; skill forbids it) still refuses null emails.
        if email and email in seen_emails:
            results.append({"id": row["id"], "skipped": "duplicate email"})
            continue
        if not email and (args.commit or touch > 1):
            results.append({"id": row["id"], "shop": row["shops"]["name"],
                            "touch": touch, "skipped": "no email on file"})
            continue
        if email:
            seen_emails.add(email)

        hook = hooks.get(row["id"], {})
        subject, body = render_touch(touch, row, cfg, hook)

        # A first touch with no researched hook reads as a mail merge — block
        # it (founder review of the 2026-07-07 batch). Dry runs still render
        # so the skill can see the batch it needs to write hooks for.
        needs_hook = touch == 1 and not (hook.get("hook_line") and hook.get("greeting"))
        if needs_hook and args.commit and not args.allow_generic:
            results.append({"id": row["id"], "touch": touch, "to": email,
                            "shop": row["shops"]["name"],
                            "skipped": "touch 1 without hook/greeting (build hooks.json or pass --allow-generic)"})
            continue

        if args.commit and not has_mx(email):
            results.append({"id": row["id"], "touch": touch, "to": email,
                            "shop": row["shops"]["name"],
                            "skipped": "domain has no MX records — would bounce"})
            continue

        if not args.commit:
            results.append({"id": row["id"], "touch": touch,
                            "to": email or "[FIND EMAIL — founder]",
                            "shop": row["shops"]["name"], "subject": subject,
                            "body": body, "dry_run": True,
                            "needs_hook": needs_hook, "needs_email": not email,
                            "mx_ok": has_mx(email) if email else None})
            continue

        # Send — as an in-thread reply for touches 2/3 when we have the
        # original AgentMail message id.
        prior = row.get("draft_gmail_id") or ""
        if touch > 1 and prior.startswith("am:"):
            resp = am.reply_to_message(prior[3:], email, subject, body)
        else:
            resp = am.send_message(email, subject, body, labels=["outreach", f"touch{touch}"])
        message_id = resp.get("message_id", "")

        # Record: status transition through the single DB contract, then store
        # the AgentMail id (reusing draft_gmail_id) for future threading.
        subprocess.run([sys.executable, str(ROOT / "outreach" / "outreach_db.py"),
                        "mark-sent", row["id"]], capture_output=True, text=True, check=True)
        db.patch_row(row["id"], {"draft_gmail_id": f"am:{message_id}"})
        if hook.get("hook_line"):
            db.patch_row(row["id"], {"personalization_notes": hook["hook_line"]})

        results.append({"id": row["id"], "touch": touch, "to": email,
                        "shop": row["shops"]["name"], "message_id": message_id, "sent": True})

    sent = len([r for r in results if r.get("sent")])
    print(json.dumps({"mode": "commit" if args.commit else "dry_run",
                      "batch": len(batch), "sent": sent, "results": results}, indent=2))


if __name__ == "__main__":
    main()
