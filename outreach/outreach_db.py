#!/usr/bin/env python3
"""
outreach_db.py — the single DB contract for the fitter outreach engine.

Every script (and the fitter-outreach Claude Code skill) reads/writes the
outreach tables THROUGH this module, so invariants live in one place:
  * every status change also inserts an outreach_events row
  * follow-up cadence (+3d after touch 1, +3d after touch 2) is computed here
  * follow-ups landing on Sat/Sun are pushed to Monday
  * do_not_contact is terminal — batch selection excludes it unconditionally
  * fresh prospects are worked ALPHABETICALLY BY STATE, then shop name —
    the founder's 2026-07-25 plan: every shop gets 3 touches, he fit-checks
    and finds the email himself, no-fit/no-email shops are removed

Reads SUPABASE_SERVICE_ROLE_KEY from the environment, falling back to
web/.env.local so the founder never has to export anything.

CLI (all output is JSON on stdout):
  python3 outreach/outreach_db.py batch --limit 10
  python3 outreach/outreach_db.py mark-drafted <id> --gmail-draft-id X [--hook "..."]
  python3 outreach/outreach_db.py mark-sent <id> [--note "services-pitch"]
  python3 outreach/outreach_db.py mark-replied <id> [--do-not-contact] [--note "..."]
  python3 outreach/outreach_db.py set-email <id> <email>
  python3 outreach/outreach_db.py remove <id> [--reason "..."]
  python3 outreach/outreach_db.py set-status <id> <status> [--note "..."]
  python3 outreach/outreach_db.py contacted-emails
  python3 outreach/outreach_db.py close-stale [--grace-days 10]
  python3 outreach/outreach_db.py stats
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

SUPABASE_URL = "https://omwetnvnorwsxfahghce.supabase.co"
ENV_LOCAL = Path(__file__).resolve().parent.parent / "web" / ".env.local"

TERMINAL = ("do_not_contact",)
SENT_STATUSES = ("sent_1", "sent_2", "sent_3")
REPLIED_LIKE = ("replied", "call_booked", "closed_won")

# Follow-up cadence: days until next touch, keyed by the touch just sent.
# Founder plan 2026-07-25: follow-up every 3 days until 3 total touches.
CADENCE_DAYS = {1: 3, 2: 3}
MAX_TOUCHES = 3


def service_key() -> str:
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not key and ENV_LOCAL.exists():
        for line in ENV_LOCAL.read_text().splitlines():
            if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                key = line.split("=", 1)[1].strip()
    if not key or "PASTE" in key:
        sys.exit("ERROR: SUPABASE_SERVICE_ROLE_KEY not set (env or web/.env.local)")
    return key


def request(method: str, path: str, params: dict | None = None,
            body=None, prefer: str | None = None):
    """Minimal PostgREST call. Returns parsed JSON (or None for 204)."""
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params, safe="*,().:")
    key = service_key()
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        detail = e.read().decode()[:500]
        raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {detail}") from e


def get_all(path: str, params: dict):
    """Page through PostgREST's 1,000-row cap (same rule as web/fetchAllRows)."""
    rows, page = [], 0
    while True:
        p = dict(params)
        p["limit"] = 1000
        p["offset"] = page * 1000
        chunk = request("GET", path, p) or []
        rows.extend(chunk)
        if len(chunk) < 1000:
            return rows
        page += 1


def log_event(outreach_id: str, event_type: str, detail: dict | None = None):
    request("POST", "outreach_events",
            body={"outreach_id": outreach_id, "event_type": event_type,
                  "detail": detail or {}},
            prefer="return=minimal")


def patch_row(outreach_id: str, fields: dict):
    fields["updated_at"] = now_iso()
    request("PATCH", "outreach", params={"id": f"eq.{outreach_id}"},
            body=fields, prefer="return=minimal")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def next_touch_after(touch_just_sent: int) -> str | None:
    days = CADENCE_DAYS.get(touch_just_sent)
    if days is None:
        return None
    due = datetime.now(timezone.utc) + timedelta(days=days)
    # Never schedule a follow-up for the weekend — push to Monday.
    if due.weekday() == 5:
        due += timedelta(days=2)
    elif due.weekday() == 6:
        due += timedelta(days=1)
    return due.isoformat()


# !inner + the shops.status filter in cmd_batch drop the whole outreach row
# when the shop is no longer active — a removed listing must never be pitched
# ("claim your listing" would link to a Fitter Not Found page). Added after
# the 2026-07 directory cleanup deactivated 544 queued prospects.
SHOP_EMBED = "shops!inner(name,slug,website,city,state,state_code,shop_type,is_chain,status,claimed_at)"


# ── Subcommands ──────────────────────────────────────────────


def cmd_batch(args):
    """Today's work list: due follow-ups first, then fresh shops alphabetically
    by state (then shop name). No email gate — the founder fit-checks each new
    shop and hunts the email himself; drafts render with a [FIND EMAIL]
    placeholder when contact_email is null. Claimed shops are never pitched."""
    out = []

    followups = get_all("outreach", {
        "select": f"*,{SHOP_EMBED}",
        "status": "in.(sent_1,sent_2)",
        "next_touch_at": f"lte.{now_iso()}",
        "shops.status": "eq.active",
        "order": "next_touch_at.asc",
    })
    for r in followups[: args.limit]:
        r["touch_number"] = r["touches"] + 1
        r["touch_kind"] = "followup"
        out.append(r)

    remaining = args.limit - len(out)
    if remaining > 0:
        # PostgREST can't order a parent query by an embedded column, so pull
        # every uncontacted row (~1.2k, two pages) and sort client-side.
        fresh = get_all("outreach", {
            "select": f"*,{SHOP_EMBED}",
            "status": "eq.not_contacted",
            "shops.status": "eq.active",
            "order": "created_at.asc",
        })
        fresh = [r for r in fresh if not (r.get("shops") or {}).get("claimed_at")]
        fresh.sort(key=lambda r: ((r["shops"].get("state") or "~").lower(),
                                  (r["shops"].get("name") or "~").lower()))
        for r in fresh[:remaining]:
            r["touch_number"] = 1
            r["touch_kind"] = "first"
            out.append(r)

    print(json.dumps(out, indent=2))


def cmd_mark_drafted(args):
    rows = request("GET", "outreach", {"id": f"eq.{args.id}", "select": "touches,status"})
    if not rows:
        sys.exit(f"ERROR: outreach row {args.id} not found")
    touch = rows[0]["touches"] + 1
    fields = {"status": "drafted", "draft_gmail_id": args.gmail_draft_id}
    if args.hook:
        fields["personalization_notes"] = args.hook
    patch_row(args.id, fields)
    log_event(args.id, "draft_created",
              {"touch": touch, "gmail_draft_id": args.gmail_draft_id,
               "prev_status": rows[0]["status"], "hook": args.hook})
    print(json.dumps({"ok": True, "id": args.id, "touch": touch}))


def cmd_mark_sent(args):
    rows = request("GET", "outreach", {"id": f"eq.{args.id}", "select": "touches,status"})
    if not rows:
        sys.exit(f"ERROR: outreach row {args.id} not found")
    touch = rows[0]["touches"] + 1
    if touch > MAX_TOUCHES:
        sys.exit(f"ERROR: row already has {rows[0]['touches']} touches (max {MAX_TOUCHES})")
    fields = {
        "status": f"sent_{touch}",
        "touches": touch,
        "last_touch_at": now_iso(),
        "next_touch_at": next_touch_after(touch),
    }
    if args.note:
        fields["notes"] = args.note
    patch_row(args.id, fields)
    detail = {"touch": touch}
    if args.note:
        detail["note"] = args.note
    log_event(args.id, "send_detected", detail)
    print(json.dumps({"ok": True, "id": args.id, "status": f"sent_{touch}",
                      "next_touch_at": next_touch_after(touch)}))


def cmd_mark_replied(args):
    new_status = "do_not_contact" if args.do_not_contact else "replied"
    fields = {"status": new_status, "next_touch_at": None}
    if args.note:
        fields["notes"] = args.note
    patch_row(args.id, fields)
    log_event(args.id, "reply_received",
              {"status": new_status, "note": args.note})
    print(json.dumps({"ok": True, "id": args.id, "status": new_status}))


def cmd_set_email(args):
    """Record an email the founder found by hand for a shop."""
    email = args.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        sys.exit(f"ERROR: '{args.email}' doesn't look like an email address")
    rows = request("GET", "outreach", {"id": f"eq.{args.id}", "select": "contact_email"})
    if not rows:
        sys.exit(f"ERROR: outreach row {args.id} not found")
    patch_row(args.id, {
        "contact_email": email,
        "email_source": "founder_manual",
        "email_search_status": "found",
        "email_verified": "unknown",
    })
    log_event(args.id, "email_discovered",
              {"email": email, "source": "founder_manual",
               "previous": rows[0]["contact_email"]})
    print(json.dumps({"ok": True, "id": args.id, "contact_email": email}))


def cmd_remove(args):
    """Founder verdict: not a fit / no email findable. Terminal for outreach
    (do_not_contact) AND deactivates the shop listing itself — the founder's
    rule: if he can't confirm fit or find an email, the shop leaves the
    directory. The live page disappears on the next revalidate/deploy."""
    rows = request("GET", "outreach",
                   {"id": f"eq.{args.id}", "select": f"shop_id,status,{SHOP_EMBED}"})
    if not rows:
        sys.exit(f"ERROR: outreach row {args.id} not found")
    row = rows[0]
    if (row.get("shops") or {}).get("claimed_at"):
        sys.exit("ERROR: shop is owner-claimed — refusing to deactivate. Handle manually.")
    reason = args.reason or "founder: no fit / no email found"
    patch_row(args.id, {"status": "do_not_contact", "next_touch_at": None,
                        "notes": reason})
    request("PATCH", "shops", params={"id": f"eq.{row['shop_id']}"},
            body={"status": "inactive"}, prefer="return=minimal")
    log_event(args.id, "status_changed",
              {"status": "do_not_contact", "shop_deactivated": True, "reason": reason})
    print(json.dumps({"ok": True, "id": args.id, "shop": row["shops"]["slug"],
                      "outreach_status": "do_not_contact", "shop_status": "inactive",
                      "note": "revalidate the shop's pages so the listing drops off the live site"}))


def cmd_set_status(args):
    valid = ("not_contacted", "drafted", "sent_1", "sent_2", "sent_3", "replied",
             "call_booked", "closed_won", "closed_lost", "do_not_contact")
    if args.status not in valid:
        sys.exit(f"ERROR: invalid status. One of: {', '.join(valid)}")
    fields = {"status": args.status}
    if args.status in ("do_not_contact", "closed_won", "closed_lost"):
        fields["next_touch_at"] = None
    if args.note:
        fields["notes"] = args.note
    patch_row(args.id, fields)
    log_event(args.id, "status_changed", {"status": args.status, "note": args.note})
    print(json.dumps({"ok": True, "id": args.id, "status": args.status}))


def cmd_contacted_emails(args):
    """email -> outreach id for every row we've ever emailed (for reply scans)."""
    rows = get_all("outreach", {
        "select": "id,contact_email,status",
        "status": "in.(drafted,sent_1,sent_2,sent_3)",
        "contact_email": "not.is.null",
    })
    print(json.dumps({r["contact_email"].lower(): r["id"] for r in rows}, indent=2))


def cmd_close_stale(args):
    """sent_3 rows with no reply after the grace window -> closed_lost."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=args.grace_days)).isoformat()
    rows = get_all("outreach", {
        "select": "id",
        "status": "eq.sent_3",
        "last_touch_at": f"lte.{cutoff}",
    })
    for r in rows:
        patch_row(r["id"], {"status": "closed_lost", "next_touch_at": None})
        log_event(r["id"], "status_changed",
                  {"status": "closed_lost", "reason": f"no reply {args.grace_days}d after touch 3"})
    print(json.dumps({"closed_lost": len(rows)}))


def cmd_stats(args):
    rows = get_all("outreach", {
        "select": "segment,status,touches,contact_email,email_verified,email_search_status",
    })

    by = {}
    for r in rows:
        seg = r["segment"] or "-"
        by.setdefault(seg, {}).setdefault(r["status"], 0)
        by[seg][r["status"]] += 1

    def rate(segs):
        pool = [r for r in rows if r["segment"] in segs and r["touches"] >= 1]
        replied = [r for r in pool if r["status"] in REPLIED_LIKE]
        return len(replied) / len(pool) if pool else None, len(pool), len(replied)

    ab_rate, ab_contacted, ab_replied = rate(("A", "B"))
    completed_t3 = len([r for r in rows if r["segment"] in ("A", "B") and (
        r["touches"] >= MAX_TOUCHES
        or r["status"] in ("closed_lost", "closed_won", "call_booked", "replied", "do_not_contact")
    ) and r["touches"] >= 1])

    kill_warning = (completed_t3 >= 100 and ab_rate is not None and ab_rate < 0.04)

    print(json.dumps({
        "total_rows": len(rows),
        "emails_found": len([r for r in rows if r["contact_email"]]),
        "emails_valid": len([r for r in rows if r["email_verified"] == "valid"]),
        "search_status": {s: len([r for r in rows if r["email_search_status"] == s])
                          for s in ("pending", "found", "not_found", "fetch_failed", "no_website")},
        "funnel_by_segment": by,
        "ab_contacted": ab_contacted,
        "ab_replied": ab_replied,
        "ab_reply_rate": round(ab_rate, 4) if ab_rate is not None else None,
        "ab_completed_touch3": completed_t3,
        "kill_warning": kill_warning,
        "kill_criterion": "A+B reply rate < 4% after 100 contacts complete touch 3",
    }, indent=2))


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("batch")
    b.add_argument("--limit", type=int, default=10)
    b.set_defaults(fn=cmd_batch)

    d = sub.add_parser("mark-drafted")
    d.add_argument("id")
    d.add_argument("--gmail-draft-id", required=True)
    d.add_argument("--hook", help="the personalization hook used")
    d.set_defaults(fn=cmd_mark_drafted)

    s = sub.add_parser("mark-sent")
    s.add_argument("id")
    s.add_argument("--note", help='e.g. "services-pitch" when the services variant was sent')
    s.set_defaults(fn=cmd_mark_sent)

    r = sub.add_parser("mark-replied")
    r.add_argument("id")
    r.add_argument("--do-not-contact", action="store_true")
    r.add_argument("--note")
    r.set_defaults(fn=cmd_mark_replied)

    se = sub.add_parser("set-email")
    se.add_argument("id")
    se.add_argument("email")
    se.set_defaults(fn=cmd_set_email)

    rm = sub.add_parser("remove")
    rm.add_argument("id")
    rm.add_argument("--reason")
    rm.set_defaults(fn=cmd_remove)

    st = sub.add_parser("set-status")
    st.add_argument("id")
    st.add_argument("status")
    st.add_argument("--note")
    st.set_defaults(fn=cmd_set_status)

    ce = sub.add_parser("contacted-emails")
    ce.set_defaults(fn=cmd_contacted_emails)

    cs = sub.add_parser("close-stale")
    cs.add_argument("--grace-days", type=int, default=10)
    cs.set_defaults(fn=cmd_close_stale)

    stt = sub.add_parser("stats")
    stt.set_defaults(fn=cmd_stats)

    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
