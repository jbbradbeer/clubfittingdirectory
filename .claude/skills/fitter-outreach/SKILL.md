---
name: fitter-outreach
description: Prepare the daily fitter outreach list — Claude selects shops (alphabetically by state), drafts personalized emails, and hands the founder a copy-paste-ready batch; the FOUNDER sends manually, fit-checks each shop, and hunts missing emails himself. Use when the founder says "today's outreach", "/fitter-outreach", "who do I email today", "outreach sample", "I sent them", "remove <shop>", gives an email address he found, pastes a reply, or asks about pipeline status. Supports `today [--limit N]`, `sent <ids|all>`, `email <id> <address>`, `remove <ids> [reason]`, `replies`, `status`, and `sample`.
---

# Fitter Outreach — manual sending, Claude-prepared, alphabetical by state

You are preparing cold outreach for James (the founder) pitching his golf
fitting directory's free claim (free Verified badge + lead forwarding) with
the paid Featured tier ($49/mo | $499/yr placement upsell) pitched in later touches.

**The campaign plan (founder, 2026-07-25):** work through EVERY active shop
**alphabetically by state**, 10 total emails per day, follow-ups every 3 days
until 3 touches, weekdays only. The founder fit-checks each new shop and finds
the email address himself; if he can't confirm fit or find an email, the shop
is removed from the directory (`remove`). Claude's job: the daily list — who,
which touch, drafted email — and keeping the pipeline true.

**Sending is MANUAL: the founder sends every email himself from his own
inbox.** Claude never sends email. Every DB read/write goes through
`outreach/outreach_db.py`. `outreach/send_batch.py` is used DRY-RUN ONLY
(selection + template rendering). Run everything with `python3` from the repo
root.

## ABSOLUTE RULES

1. **Claude never sends email.** No `send_batch.py --commit`, no AgentMail
   calls, no Gmail sends, no exceptions. The founder sends manually.
2. Never write to the `shops` table directly — the ONLY sanctioned path is
   `outreach_db.py remove`, and only after the founder explicitly says a shop
   is no fit / has no findable email.
3. Respect the daily cap: `min(--limit, DAILY_CAP=10)` minus rows already
   marked sent today.
4. `do_not_contact` rows are untouchable forever.
5. **Mark-sent only after the founder confirms he actually sent.** Never mark
   rows sent when handing him the batch.
6. Hooks must be TRUE and verifiable (their website, or our own directory
   data). Never invent a claim about a shop.
7. Touch 1 emails: plain text, ONE link only (the claim URL — founder-approved
   template). No other links until touch 2–3 or a reply. CAN-SPAM footer
   (mailing address + opt-out line) stays in every email.
8. Weekdays only — if it's Saturday or Sunday, say so and stop (the cadence
   scheduler already pushes weekend follow-ups to Monday).

## Modes

### `today [--limit N]` — the daily list (default N = 10)
1. **Preflight.** `python3 outreach/outreach_db.py stats` must succeed. If
   `stats.kill_warning` is true, print it prominently.
2. **Replies first.** Ask the founder if any replies landed since last time;
   process anything he pastes via `replies` mode before selecting new sends.
3. **Select.** `python3 outreach/outreach_db.py batch --limit <N>` — due
   follow-ups (touch 2/3) come FIRST, then new touch-1 shops alphabetically
   by state then shop name. Claimed shops are excluded automatically.
4. **Hooks.** For each FIRST touch: WebFetch the shop's website (homepage;
   /about if thin) and write ONE hook line (see Voice) into `hooks.json`.
   Follow-ups reuse stored `personalization_notes` — don't re-fetch.
5. **Render.** `python3 outreach/send_batch.py --limit <N> --hooks-file
   hooks.json` (dry run — its only permitted use) to render final emails.
6. **Hand off.** Present the batch copy-paste-ready: for each shop —
   outreach id, shop name, city/state, touch number, TO address (or
   **[FIND EMAIL]** when none is on file), SUBJECT, then the full body in a
   code block. Follow-ups first. For each NEW shop also print its website URL
   and listing URL so the founder can fit-check and email-hunt in one pass.
   Remind him: send from his own inbox; touches 2/3 as replies in the
   original thread.
7. **Progress footer.** From stats: current state being worked, shops left in
   it, total not-contacted remaining (e.g. "Alabama: 14 left · 1,231 shops to
   go overall").
8. Do NOT mark anything sent yet.

### `sent <ids|all>` — after the founder confirms sending
For each confirmed id: `python3 outreach/outreach_db.py mark-sent <id>`.
`all` = every id from the most recent `today` batch (skip any still marked
[FIND EMAIL] unless he also gave the address — prompt for it). This schedules
the next touch automatically (+3 days, weekend → Monday). Then a short
summary: marked sent, next follow-up dates, remaining budget today.

### `email <id> <address>` — founder found an address
`python3 outreach/outreach_db.py set-email <id> <address>`, then re-render
that one draft with the real TO line. If he says he already sent it, follow
with `mark-sent`.

### `remove <ids> [reason]` — founder verdict: no fit / no email
For each id: `python3 outreach/outreach_db.py remove <id> --reason "<his
words>"`. This sets do_not_contact AND deactivates the shop listing (the
founder's rule — unverifiable shops leave the directory). Then refresh the
dead listing's pages: POST `/api/revalidate` (secret in `web/.env.local`,
REVALIDATE_SECRET) with the shop's slug/state/city/shop_type as an UPDATE
payload — same pattern as badge changes. Confirm: shop removed, N remaining
today.

### `replies` — founder pastes or forwards replies
1. Identify the shop (match sender/name against the outreach table).
2. `python3 outreach/outreach_db.py mark-replied <id>` (add
   `--do-not-contact` for opt-outs — record verbatim wording in the note).
3. Draft a suggested response in chat, flag it **NEEDS FOUNDER APPROVAL**.
   Interested prospects get the claim link; pricing questions get the
   payment-page link (`/onboard/pay/<slug>` — works once their claim is
   approved); edits/claims handled concierge-style.
4. Periodically: `python3 outreach/outreach_db.py close-stale` (touch-3 rows
   past grace → closed_lost).

### `status`
Run `python3 outreach/outreach_db.py stats` and present it readably: funnel,
reply rate, kill-criterion state, today's remaining budget, and the
alphabetical progress footer (current state, shops remaining).

### `sample` — template iteration (no DB writes)
`python3 outreach/send_batch.py --limit 3` (dry run) and show the rendered
emails in chat.

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

## Deliverability guardrails

The founder sends from his personal inbox — its reputation carries his real
mail. Stay at or under DAILY_CAP (10). If he reports bounces on more than ~5%
of a day's sends, pause and reassess before suggesting more sends. Never
suggest link-heavy touch-1 emails.
