# OUTREACH ENGINE PLAN — "Claim your free listing" (drafted 2026-06-29)

Goal: get in touch with shop owners and start a relationship BEFORE we flip on the
leads dashboard. First wave = a soft "you're listed — claim your free page" email.

## Strategy & decisions (locked with founder 2026-06-29)
- **Offer:** "Claim your free listing" (soft intro, easiest yes; no payment ask).
- **Channel:** Email only.
- **Find emails:** Scrape shop websites (free) — we have ~most shops' website URLs.
- **Scale:** Small pilot first (~25–50 shops, e.g. one city/state).

## NON-NEGOTIABLE deliverability rule (why the pilot is shaped this way)
- **Do NOT cold-email from clubfittingdirectory.com.** That domain's reputation must
  stay clean for transactional mail — booking notifications now, and the shop-owner
  **magic-link login** emails the future claim feature needs ([[project_claim_shop_plan]]).
- **Pilot sends from the founder's personal / Google Workspace Gmail** — high
  deliverability, personal, replies come back naturally, zero risk to the main domain.
- Tooling: I can generate each email as a **Gmail draft** (via the Gmail connector) for
  the founder to review + send by hand. No cold-email software, no spend, founder in control.
- Compliance: clear identity, real reply-to, easy opt-out ("reply and I'll remove you"),
  honest framing ("you're listed on our directory"). Keep it personal, not a blast.

## Reality check on the CTA (important)
- The full "claim your shop" system (Supabase Auth, owner dashboard, RLS) is DESIGNED but
  NOT built ([[project_claim_shop_plan]], Milestone 1). We do NOT need it for a 25–50 pilot.
- Pilot CTA = lightweight concierge: "Here's your page [link]. Want to add photos / fix
  details / get the golfer requests we're starting to send? Just reply." Founder handles
  edits + claims manually. This VALIDATES owner interest before we build the claim auth.
- If response is good → THEN build the real claim flow (unpause Milestone 1).

## What the codebase gives us (reuse, don't reinvent)
- Scraping infra: `crawl4ai` AsyncWebCrawler, `asyncio.Semaphore(5)`, 15–25s timeouts,
  checkpoint/resume JSON (enrich_services_crawl.py, recrawl_failed.py). Reuse the politeness.
- Python→Supabase: urllib + REST (`migrate_to_supabase.py`), SERVICE_ROLE_KEY from env.
  ⚠ web/.env.local currently has a PLACEHOLDER service key — need the real one to write to
  the DB (or scrape to CSV only and I import it).
- shops table already has unused `outreach_ready BOOLEAN`. NO email column yet.
- Admin dashboard pattern (just built /admin/leads) → clone for an /admin/outreach tracker.

## PHASE 0 — Data columns (small SQL migration)
- [ ] 0.1 web/supabase/004_outreach.sql: add to shops —
      `contact_email TEXT`, `email_source TEXT` (homepage/contact-page/mailto),
      `contacted_at TIMESTAMPTZ`, `outreach_status TEXT DEFAULT 'none'`
      (none → found → queued → sent → replied → claimed → bounced → opted_out),
      `outreach_notes TEXT`. Reuse existing `outreach_ready`. Run on live DB.

## PHASE 1 — Email finder (Python scraper)
- [ ] 1.1 Pick the pilot set: 25–50 active shops WITH a website in one metro/state
      (script flag, e.g. --state=CO --limit=50). Output a CSV for review first.
- [ ] 1.2 scrape_emails.py: for each shop, fetch homepage + likely contact pages
      (/contact, /about, /contact-us). Start lightweight (requests + regex on mailto: and
      visible text); fall back to crawl4ai for JS-heavy sites (Wix/Squarespace). Reuse
      Semaphore(5) + timeouts + checkpoint.
- [ ] 1.3 Extract + clean: collect mailto: and text emails; DROP junk (sentry/wix/godaddy/
      example/.png-style/privacy@/no-reply); prefer a single best contact (info@, the shop
      domain, owner-looking addresses). Record email_source. Flag "no email found".
- [ ] 1.4 Write results to pilot CSV (shop, website, found email, source, confidence).
      Founder eyeballs it. Then update shops.contact_email + outreach_status='found'
      (or 'none' if not found). Verify a couple by hand.

## PHASE 2 — Draft + send (concierge, founder-in-the-loop)
- [ ] 2.1 Email copy: one short, warm, personalized template — merge {owner_or_shop},
      {city}, {listing_url}. Plain, human, not markety. 2 variants to A/B if we want.
- [ ] 2.2 Generate a Gmail DRAFT per pilot shop (Gmail connector), to contact_email,
      reply-to founder, with opt-out line. Founder reviews + sends in batches (e.g. 10/day
      to stay personal and warm the sending pattern).
- [ ] 2.3 On send, mark contacted_at + outreach_status='sent' (founder clicks, or I batch-
      update the rows we drafted).

## PHASE 3 — Track responses (lightweight CRM)
- [ ] 3.1 /admin/outreach page (clone /admin/leads): list pilot shops with outreach_status,
      contact_email, contacted_at, quick status buttons (sent/replied/claimed/bounced/opted-out)
      + mailto link. Gives a single cockpit and the proof-of-traction for monetization.
- [ ] 3.2 Measure pilot: % emails found, % delivered (bounces), % replied, % want to claim.
      Decide: scale the wave (next state) and/or build the real claim flow.

## Sequencing note
Runs in parallel with the booking engine. The leads dashboard (built, undeployed) can ship
whenever; this outreach is what gives those leads a warm owner to land on. Natural next wave
of outreach = "you have fitting requests" once real leads exist.

## Open questions for founder (before building)
- Which metro/state for the pilot? (somewhere you know / care about helps replies)
- Which Gmail address to send from (personal vs a Workspace one on the brand)?
- OK to add the contact_email columns to the live DB now?

---

## SERVICES ANGLE — website-overhaul prospects (added 2026-07-05)

Second revenue stream folded into the same outreach motion: **digital services
for fitting shops** ($200–500/mo web presence management). Bigger ticket than
the Verified badge — 10 customers ≈ $2–5k MRR vs ~100 needed for badges.

**The prospect data (already generated):**
- `scripts/website_audit.py` classifies every active shop's web presence and
  live-probes real sites (browser UA; 403s = bot wall, NOT dead). Re-run
  monthly: `python3 scripts/website_audit.py --probe`.
- `tasks/services-prospects.csv` — 97 ranked prospects: 38 dead sites,
  27 SSL-broken, 22 social-only, 8 free-builder, 2 no site. Score favors
  strong businesses (rating/reviews) with the worst web presence.

**How it changes outreach:**
- These 97 get a **variant email**: same "claim your free listing" opener, plus
  one specific, honest observation — "heads up, your site returned an error
  when we linked to it" / "your listing points to your Facebook page — want a
  real site golfers can book through?" Specificity = credibility = replies.
- HAND-CHECK the site the morning of the send (dead sites revive; never pitch
  from stale data). Note what you saw in the draft.
- On founding-partner intro calls (Cal.com), listen for web-presence pain and
  quote services there. The claim funnel is the same front door for both
  products.
- Keep the deliverability rules above: Gmail drafts, founder sends, no blast.

**Pricing hypothesis to validate on calls (not committed):** setup fee
($500–1,500 rebuild) + $200–500/mo care plan (hosting, edits, Google Business,
booking link). Target: 3 paying services customers from the first 97 by
September to prove the stream.
