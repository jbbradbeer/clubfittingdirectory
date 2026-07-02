---
name: fitter-outreach
description: Run the daily fitter outreach batch — create personalized Gmail DRAFTS (never send) for the Founding Verified Listing campaign, detect sends and replies, update the pipeline in Supabase. Use when the founder says "run today's outreach batch", "/fitter-outreach", "outreach sample", or asks about outreach pipeline status. Supports `sample` (3 dry-run drafts in chat), `run [--limit N] [--allow-c] [--dry-run]`, and `status`.
---

# Fitter Outreach — daily batch

You are drafting cold outreach for James (the founder) pitching his golf fitting
directory's free listing + $349/yr Founding Verified offer. Every DB read/write
goes through `outreach/outreach_db.py` (run with `python3`, from the repo root).
Gmail access is via the Gmail MCP connector, account per `config.json` FROM_EMAIL.

## ABSOLUTE RULES

1. **NEVER send an email. Drafts only.** If any Gmail operation could send,
   stop and ask. If the connector offers only "send", do not use it — fall back
   to asking the founder to set up the OAuth script (see Fallback).
2. Never write to the `shops` table.
3. Every email body must end with the signature block from
   `templates/signature.md` (mailing address + "reply 'pass'" opt-out).
4. Respect the batch cap: `min(requested limit, config DAILY_CAP)`.
5. `do_not_contact` rows are untouchable forever.

## Modes

### `sample` — the rollout gate (no Gmail, no DB writes)
Pick 3 varied shops from `batch --limit 30` output (one with a strong website,
one with a weak/minimal site, one where no personalization hook can be found).
Render their touch-1 drafts fully and show them in chat for template iteration.

### `status`
Run `python3 outreach/outreach_db.py stats` and present it readably: funnel by
segment, reply rate, and the kill-criterion state.

### `run` — the daily batch
Execute these steps in order:

**1. Preflight.**
- `python3 outreach/outreach_db.py stats` must succeed (proves DB key works).
- Read `config.json`. If STRIPE_LINK / CALENDLY_URL / MAILING_ADDRESS still
  contain literal `{{`, REFUSE to create drafts and tell the founder what to fill in.
- Confirm the Gmail connector is authenticated (authenticate if needed).

**2. Sent detection.** For every row in status `drafted`
(`contacted-emails` includes them): search Gmail Sent for
`to:<contact_email> newer_than:14d`. If a sent message exists →
`python3 outreach/outreach_db.py mark-sent <id>`. If the draft is >7 days old
and still unsent, flag it in the summary (don't touch the row).

**3. Reply scan.** Get `python3 outreach/outreach_db.py contacted-emails`.
Search the inbox (`newer_than:14d`) and match sender addresses against that map.
For each reply:
- Body contains "pass", "unsubscribe", "remove me", "not interested" →
  `mark-replied <id> --do-not-contact --note "<one-line excerpt>"`
- Otherwise → `mark-replied <id> --note "<one-line excerpt>"` and surface the
  full reply in the summary — the founder answers these personally.
Also `python3 outreach/outreach_db.py close-stale` (touch-3 rows past grace → closed_lost).

**4. Kill check.** From `stats`: if `kill_warning` is true, print the warning
prominently and refuse `--allow-c` even if requested.

**5. Batch.** `python3 outreach/outreach_db.py batch --limit <N>` (add
`--allow-c` only if the founder asked and no kill warning).

**6. Per shop, in order:**
- **Follow-ups** (`touch_kind: followup`): reuse stored `personalization_notes`;
  do NOT re-fetch the website. Render touch2/touch3 template.
- **First touches**: WebFetch the shop's website (homepage; /about if the
  homepage is thin). Extract ONE hook for `{{hook_line}}` — see Voice below.
- Render the template for the touch number. Fill `{{greeting}}` with the
  contact first name if known, else "Gents". `{{listing_url}}` =
  `https://clubfittingdirectory.com/listing/<slug>`. Touch 3 `{{closing_angle}}`:
  use config SOCIAL_PROOF numbers if set, else the listing-value line with the
  shop's state.
- Create a Gmail **draft** to `contact_email` from FROM_EMAIL.
- IMMEDIATELY `python3 outreach/outreach_db.py mark-drafted <id>
  --gmail-draft-id <draftId> --hook "<the hook used>"`.
- `--dry-run`: render to chat instead of Gmail, no DB writes.

**7. Summary table.** Drafts created (by touch number), sends detected,
replies found (with excerpts and a NEEDS YOUR REPLY flag), do_not_contact
additions, stale drafts, stats snapshot. End with: **"Drafts are in Gmail —
review each one and send manually."**

## Voice (non-negotiable)

Declarative, deadpan, insider authority. Dan Jenkins-era Golf Digest register.
- NO em dashes in body prose (the greeting "Name —" is the only dash allowed).
- NO hedging: never "just", "I think", "hopefully", "might be a fit".
- NO exclamation points. NO corporate phrases ("reaching out", "circle back",
  "touch base", "excited to").
- Touch 1 body: 90–120 words. Follow-ups shorter.
- ONE personalized line maximum (`{{hook_line}}`). It must be specific and
  verifiable from their site: launch monitor brand (Trackman/Foresight/GCQuad),
  a tour player relationship, years in business, a named specialty (putter
  studio, vintage restoration), a build philosophy. Never generic flattery.
  Good: "Twenty-two years fitting off a GCQuad in a converted barn earns a
  listing that says so." Bad: "Love what you're doing with your shop!"
- If the site is dead or generic, use a city/regional angle instead
  ("Golfers in Scottsdale search for fitters year-round.") and note the weak
  hook in `personalization_notes`.

## Fallback if the Gmail connector can't create drafts or search

Tell the founder, then scaffold `outreach/gmail_drafts.py` using Google's
official API (installed-app OAuth, scopes `gmail.compose` + `gmail.readonly`,
token cached at `outreach/.gmail_token.json` which is gitignored). Same
contract: create-draft, search-sent, search-inbox. One-time setup: founder
creates OAuth credentials in Google Cloud Console.
