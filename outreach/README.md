# Fitter Outreach Engine

Email outreach for the Founding Verified Listing offer ($349/yr, 100 spots).
Everything creates **Gmail drafts only** — James reviews and sends by hand.
Pipeline state lives in the `outreach` / `outreach_events` tables (migration
`web/supabase/008_outreach.sql`); the `shops` table is never written.

## Daily workflow (once set up)

1. In Claude Code: **"run today's outreach batch"** (the `fitter-outreach` skill).
2. Open Gmail → Drafts → review each email → send the ones you like.
3. Check replies the skill surfaced, and `clubfittingdirectory.com/admin/outreach`
   for the funnel. Reply to interested fitters personally.

The skill handles everything else: detects which drafts you sent, scans for
replies, schedules follow-ups (+4 days, +8 days, then stop), honors "pass"
opt-outs forever, and warns if the kill criterion trips (A+B reply rate < 4%
after 100 contacts complete touch 3 → don't touch Segment C).

## One-time setup order

1. **Migration**: run `web/supabase/008_outreach.sql` in the Supabase SQL editor.
   Sanity: `select count(*) from outreach` ≈ number of active shops.
2. **Find emails** (pilot first):
   `python3 outreach/find_emails.py --state PA --limit 25`
   Eyeball the found emails in Supabase, then scale (`--limit 500`, other states).
3. **Segment**: `python3 outreach/segment.py` (add `--csv your_people.csv` when
   the Segment A list is ready — columns: `slug` or `name,state_code`).
4. **Verify emails**: `python3 outreach/export_verification.py` → upload the CSV
   to NeverBounce/ZeroBounce (pay-as-you-go) → download results →
   `python3 outreach/import_verification.py <results.csv>`.
5. **Fill config**: `.claude/skills/fitter-outreach/config.json` needs your
   Stripe Payment Link, Calendly URL, and mailing address. The skill refuses
   to draft while placeholders remain. Templates are editable in
   `.claude/skills/fitter-outreach/templates/`.
6. **Sample gate**: "outreach sample" in Claude Code → 3 dry-run drafts in chat.
   Iterate the templates until you like the voice.
7. **First real batch**: "run today's outreach batch with limit 5" → review in
   Gmail → send. Then daily at the default cap (20).

## Scripts

| Script | Purpose |
|---|---|
| `outreach_db.py` | The DB contract (batch selection, status changes, stats). All other tools go through it. |
| `find_emails.py` | Scrape shop websites for contact emails (shops table has none). |
| `segment.py` | Tag rows A (founder CSV) / B (priority states + fitter/retailer + website, chains excluded) / C. |
| `export_verification.py` / `import_verification.py` | CSV round-trip with an email verification vendor. |

All scripts read `SUPABASE_SERVICE_ROLE_KEY` from the environment or
`web/.env.local` automatically.

## Rules encoded in the system

- Drafts only. Nothing sends automatically. No cron for sending, ever.
- Max 20 drafts/day (config `DAILY_CAP`).
- Every email ends with the mailing address + "reply 'pass'" opt-out (CAN-SPAM).
- Sends come from the founder's Gmail (`bowtiedgolf@gmail.com`), never from
  clubfittingdirectory.com — the domain's reputation stays clean for
  transactional mail (booking notifications, future magic-link logins).
- `do_not_contact` is terminal. The unique index on `contact_email` also stops
  a chain's shared address from being contacted through a second location.
