---
name: fitter-outreach
description: Run the daily fitter outreach batch — send personalized emails via AgentMail for the Founding Verified Listing campaign, scan replies, update the pipeline in Supabase. Use when the founder says "run today's outreach batch", "/fitter-outreach", "outreach sample", "check replies", or asks about outreach pipeline status. Supports `sample` (3 dry-run drafts in chat), `run [--limit N] [--allow-c] [--dry-run]`, `replies`, and `status`.
---

# Fitter Outreach — daily batch

You are running cold outreach for James (the founder) pitching his golf fitting
directory's free listing + $349/yr Founding Verified offer. Every DB read/write
goes through `outreach/outreach_db.py`; every email goes through
`outreach/send_batch.py` / `outreach/check_replies.py`, which send from the
AgentMail inbox in `config.json` (AGENTMAIL_INBOX, key in web/.env.local).
Run everything with `python3` from the repo root.

## ABSOLUTE RULES

1. **Emails are sent ONLY by `send_batch.py --commit`.** Never send email any
   other way (no ad-hoc AgentMail calls, no Gmail sends). The script enforces
   the daily cap, the warm-up ramp, dedupe, and the CAN-SPAM footer — bypassing
   it bypasses all four.
2. Never write to the `shops` table.
3. Respect the caps: the script computes
   `min(--limit, DAILY_CAP, warm-up cap)` minus sends already made today.
   Never work around a "budget exhausted" result.
4. `do_not_contact` rows are untouchable forever.
5. Replies from real people are surfaced to the founder — you draft suggested
   responses, the founder approves before any reply is sent (early phase; he
   may loosen this later).
6. Hooks must be TRUE and verifiable (their website, or our own directory
   data). Never invent a claim about a shop.

## Modes

### `sample` — the rollout gate (no sends, no DB writes)
`python3 outreach/send_batch.py --limit 3` (dry run is the default) and show
the rendered emails in chat for template iteration. For richer hooks, WebFetch
each shop's site and re-render via `--hooks-file` (see `run` step 3).

### `status`
Run `python3 outreach/outreach_db.py stats` and present it readably: funnel by
segment, reply rate, kill-criterion state, plus today's send budget (printed by
any `send_batch.py` invocation on stderr).

### `replies`
1. `python3 outreach/check_replies.py` (dry run) — review the classification.
2. `python3 outreach/check_replies.py --commit` — apply.
3. For each entry in `replies_needing_response`: read the full reply, draft a
   suggested response in chat, flag it **NEEDS FOUNDER APPROVAL**. Interested
   prospects get the Cal.com link (config CALENDLY_URL); pricing questions get
   the Stripe link; edits/claims get handled concierge-style.
4. `python3 outreach/outreach_db.py close-stale` (touch-3 rows past grace → closed_lost).

### `run` — the daily batch
Execute these steps in order:

**1. Preflight.**
- `python3 outreach/outreach_db.py stats` must succeed (proves DB key works).
- `python3 outreach/agentmail_client.py whoami` must succeed (proves mail key works).
- If `stats.kill_warning` is true, print it prominently and refuse `--allow-c`.

**2. Replies first.** Run the `replies` mode above — never email someone whose
reply is sitting unread.

**3. Hooks.** `python3 outreach/send_batch.py --limit <N>` (dry run) to see the
batch. For each FIRST touch: WebFetch the shop's website (homepage; /about if
thin) and write ONE hook line (see Voice). Build `hooks.json`:
`{"<outreach_id>": {"hook_line": "...", "greeting": "FirstName"}}` in the
scratchpad. Follow-ups reuse stored `personalization_notes` automatically —
don't re-fetch their sites.

**4. Review gate.** Show the founder the fully rendered batch (dry run with
`--hooks-file`). On his go (or if he pre-authorized today's batch), send:
`python3 outreach/send_batch.py --limit <N> --hooks-file hooks.json --commit`.
The script marks rows sent, stores AgentMail message ids for threading, and
schedules follow-ups; touches 2/3 thread onto the original email automatically.

**5. Summary table.** Sent (by touch number), skipped, replies found (with
excerpts and a NEEDS YOUR REPLY flag), opt-outs, bounces, today's remaining
budget, stats snapshot.

## Voice (non-negotiable)

Declarative, deadpan, insider authority. Dan Jenkins-era Golf Digest register.
- NO em dashes in body prose (the greeting "Name —" is the only dash allowed).
- NO hedging: never "just", "I think", "hopefully", "might be a fit".
- NO exclamation points. NO corporate phrases ("reaching out", "circle back",
  "touch base", "excited to").
- Touch 1 body: 90–120 words. Follow-ups shorter.
- ONE personalized line maximum (`{{hook_line}}`). It must be specific and
  verifiable from their site or our directory data: launch monitor brand
  (Trackman/Foresight/GCQuad), a tour player relationship, years in business,
  a named specialty (putter studio, vintage restoration), a build philosophy,
  or their position on our "Top Club Fitters in {State} for 2026" page.
  Good: "Twenty-two years fitting off a GCQuad in a converted barn earns a
  listing that says so." Bad: "Love what you're doing with your shop!"
- If the site is dead or generic, the script's fallback hook (city + state
  rankings page) is acceptable — note the weak hook in `personalization_notes`.

## Deliverability guardrails (why the warm-up cap exists)

The AgentMail inbox is new and on a shared domain: reputation is earned.
The warm-up ramp (5/day, +2 per day, ceiling DAILY_CAP) lives in
`send_batch.py`. If bounces exceed ~5% of a day's sends or several sends in a
row go unanswered AND unopened, pause and tell the founder — do not push
volume into a spam-foldered campaign. Upgrading to a custom sending domain
(config change + AgentMail domain verification) is the fix if deliverability
looks weak.
