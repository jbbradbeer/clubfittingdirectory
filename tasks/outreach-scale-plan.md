# Outreach at Scale — Plan (2026-07-13)

Goal: automate the Founding Verified Listing outreach ($349/yr, 100 spots), keep cost low,
keep deliverability high, start real revenue.

## Where we actually are (from the pipeline database)

| Metric | Value |
|---|---|
| Shops in outreach table | 1,271 |
| Websites searched for an email | 491 (780 still pending) |
| Emails found | 254 |
| Emails verified valid | 102 |
| Contacted so far | 6 (segment B) |
| Replies | 0 |

**The bottleneck is NOT sending capacity — it's the list.** We can only email 102 people
today. Before any sending infrastructure matters, we need to finish email discovery on the
780 unsearched shops and verify what we find. Expected outcome: roughly 350–450 sendable
addresses across the whole directory.

**The addressable market is small and finite.** At 30 emails/day (including follow-up
touches), the entire directory is exhausted in ~2–3 months. So this is not an
"unlimited scale" problem — it's a "work through ~400 prospects efficiently, then feed
the machine with new prospect sources" problem (directory growth, repair shops, the
97-shop website-audit prospect list, non-listed golf shops nationwide).

## What the research found (July 2026)

Two independent research passes: platform landscape + deliverability best practice.

### Deliverability rules that bind us
1. **Never send cold email from clubfittingdirectory.com** (already our rule — keep it).
   Its reputation carries booking notifications and future login emails.
2. Google/Yahoo/Microsoft now hard-require SPF/DKIM/DMARC (email ID checks) on any
   sending domain. Non-compliant mail to Gmail is rejected outright since Nov 2025.
3. Practitioner ceiling: **15–25 cold emails per inbox per day**. Scale by adding
   inboxes/domains, never by pushing one inbox harder.
4. New domains need a **3–4 week manual warm-up ramp** (start 5–10/day, add ~10/week).
   Paid "warmup pool" services are now largely dead weight — Google discounts bot
   engagement and a late-2025 crackdown reportedly suspended tenants connected to the
   big warmup pools. Manual ramp instead: saves ~$88/mo, safer.
5. Spam-complaint tolerance is effectively **zero at our volume** (0.1% target =
   1 complaint per 1,000). Tight targeting + genuine personalization is the control.
6. First-touch emails: plain text, **no links, no open tracking**. Link (their listing
   URL / Stripe) belongs in touch 2–3 or after a reply. Our touch templates need a check.
7. Verify every address (MillionVerifier ~$39 for 10k credits, one-time — covers the
   entire directory several times over). Pause a domain if a batch bounces >3%.
8. CAN-SPAM: physical address + honored opt-out (we already do both). California
   §17529.5 is the real litigation risk — truthful subjects, traceable From domain.

### Platform verdicts
- **Resend: disqualified** — acceptable-use policy explicitly bans cold outreach.
- **Apollo: skip for sending** (database only, poor sending reputation).
- **Smartlead Pro ($94/mo)**: best API of the big platforms; the graduation option.
- **Woodpecker (~$40–80/mo)**: cheapest credible platform; ships an MCP server (plugs
  straight into Claude).
- **AgentMail ($20/mo Developer)**: excellent agent-native API, but no managed
  deliverability and free tier has no custom domain (a real deliverability problem).
- **DIY Google Workspace (~$25–45/mo)**: real Gmail trust, best deliverability per
  dollar at our size; cold email is a ToS gray area — mitigate with a separate
  Workspace tenant (not our main account), low volume, clean list.
- Benchmarks: AI-personalized ~4.6% reply vs ~3.4% templated. Our model (agent writes
  each email, human-quality personalization, low volume) is exactly what works in 2026.

## Recommended plan — three phases, spend follows proof

### Phase 0 — Fill the pipeline, prove the offer (this week; ~$40 one-time)
1. Run `find_emails.py` across all remaining states (780 pending rows). Free, script exists.
2. Verify everything through MillionVerifier (~$39 for 10k credits, replaces
   NeverBounce/ZeroBounce round-trip — cheapest).
3. Keep sending daily batches through the existing Gmail-drafts flow (cap 20) while the
   new domains warm up in Phase 1. This keeps testing the OFFER — 6 contacts is far too
   few to judge. The kill criterion (A+B reply <4% after 100 complete touch 3) stays.
4. Template tweak: ensure touch 1 has zero links.

> **ON HOLD (2026-07-23, founder decision):** Sending is now MANUAL — the founder
> sends every email himself from his own inbox; Claude selects the daily list and
> drafts the emails (`/fitter-outreach today`). Phase 1 below (lookalike domains,
> separate Workspace tenant, warm-up ramp) is paused, not cancelled. The
> bottleneck is unchanged and still the priority: finish email discovery on the
> ~780 unsearched shops and verify what we find.

### Phase 1 — Build the sending engine (ON HOLD; ~$32/mo when resumed)
1. Buy 2 lookalike domains (~$25/yr total): e.g. `clubfittingdir.com`,
   `getclubfitting.com`. Root of each 301-redirects to the main site.
2. New **separate** Google Workspace tenant, 3 Business Starter seats (~$22/mo):
   e.g. james@, hello@, team@ across the two domains.
3. SPF/DKIM/DMARC on both domains; register Google Postmaster Tools v2 + Microsoft SNDS.
4. Manual warm-up: weeks 1–2 light human use (newsletters, replies), week 3 start
   5–10 cold/day/inbox, week 4+ step to 20–25.
5. Extend our existing Python engine with Gmail API send/read (replaces AgentMail
   sending; keep the same outreach DB, segments, follow-up scheduler, opt-out logic).

Capacity when warm: 3 inboxes × 20–25/day = **60–75/day** — more than enough to cover
new contacts + follow-up touches for the whole directory TAM.

### Phase 2 — Automate the loop (after Phase 1 warm + reply rate proven ≥4%)
1. Flip from "founder reviews every draft" to **guardrailed auto-send**:
   agent drafts + sends within caps; founder gets a morning digest (yesterday's sends,
   replies, bounces, complaints) instead of approving each email. Hard stops: bounce >3%,
   any spam complaint, kill criterion trip.
2. Reply handling stays human (founder closes deals) — agent triages and drafts suggested
   replies.
3. New prospect sources to keep the machine fed: directory submissions, repair-shop
   segment, website-audit prospects (digital services stream), non-listed shops found
   during city-page enrichment.

### Graduation trigger (not now)
Move to Smartlead Pro ($94/mo) or Woodpecker only if volume needs exceed ~100/day
sustained — i.e., if we expand the TAM well beyond the directory. At $349/offer,
Phase 1 infrastructure pays for itself with **one sale per year**.

## Cost summary

| Phase | One-time | Monthly |
|---|---|---|
| 0 — list fill + verify | ~$40 | $0 |
| 1 — domains + Workspace | ~$25/yr domains | ~$22–32 |
| 2 — automation | $0 (code we write) | same |
| (Graduation: platform) | — | +$94 only if justified |

## Decisions needed from James
1. Approve ~$40 MillionVerifier + ~$25/yr domains + ~$22/mo Workspace tenant spend.
2. Pick the two lookalike domain names.
3. Comfort level with Phase 2 auto-send (recommend: only after ≥4% reply rate proven and
   both domains fully warm; drafts-only until then — the README "no auto-send ever" rule
   would be consciously revised at that point, not silently).
