# AI Services Delivery Playbook

How we fulfill the Shop Site + Growth tier once a shop pays. Written 2026-07-29,
before the first client — update after every onboarding. Companion docs:
`tasks/outreach-engine-plan.md` (selling), `web/lib/plans.ts` (the public offer).

**Operating rule until 3+ paying clients:** everything runs
manual-with-AI-drafts. Claude drafts, the founder approves and sends. No
automation infrastructure (no cron content posting, no auto review responses)
before the workload justifies it.

**Time budget: ≤ 2 hours/week per client.** If a client regularly needs more,
the price is wrong — raise it at renewal, don't absorb it.

---

## Deliverable 1 — Shop Site (one-time build, "from $750")

1. **Intake call (Cal.com, 15 min):** confirm services, pricing, hours, brands,
   photos, domain status. Get Google Business Profile access promise.
2. **Build:** 1–3 page Next.js (or plain static) site from our template:
   services/pricing, hours, Google reviews embed, map, fitting-request form
   posting to the shop's email. Deploy on Vercel, shop's domain + SSL.
3. **Review round:** one Loom walkthrough to the owner, one batch of edits.
4. **Launch checklist:** domain live, SSL green, form tested to their inbox,
   GBP website field updated, listing on clubfittingdirectory.com updated.

Time: ~4–6 hrs one-time. Template-ize after client #2.

## Deliverable 2 — AI booking assistant (Growth)

The same `FittingAssistant` widget running on our directory
(`web/components/shop-profile/FittingAssistant.tsx` + `/api/assistant`):

1. On a site WE built: enable directly — component + their shop data.
2. On a site we didn't build: embed variant (small script tag serving the same
   chat UI pointed at our `/api/assistant` with their slug). Build this embed
   only when the first non-our-site client pays — not before.
3. Onboarding: load their services/pricing/hours into the shops table (that IS
   the assistant's knowledge); test 10 common questions; show the owner how
   booking requests arrive (existing lead-forwarding to claimed shops).
4. Costs: Claude Haiku, ~300 tokens/answer — pennies per shop per month.
   Rate-limited per IP in the route.

## Deliverable 3 — Review engine (Growth)

Manual-with-AI-drafts loop, weekly:

1. **Requests:** shop sends us (or we pull from lead log) the week's completed
   fittings. Claude drafts a short review-request text/email per customer;
   founder approves; shop sends (or we send from their branded email if they
   gave us access).
2. **Responses:** check the shop's new Google reviews weekly. Claude drafts a
   response per review (thankful, specific, owner-voiced). Founder pastes into
   GBP (or owner does — their choice at onboarding).

Time: ~20–30 min/week per client.

## Deliverable 4 — GBP content autopilot (Growth)

Monthly, batched:

1. Claude drafts 2–4 Google Business Profile posts per shop (seasonal offer,
   fitting-education tip, new-brand arrival, review highlight).
2. Founder approves the batch; posts scheduled/pasted into GBP.
3. Quarterly: refresh GBP categories, services list, photos prompt to owner.

Time: ~20 min/month per client.

---

## Onboarding checklist (per new Growth client)

- [ ] Payment confirmed (quoted on call; Stripe products deferred — invoice or
      payment link for now)
- [ ] Intake call done; services/pricing/hours captured
- [ ] Shops-table row updated (this feeds both their listing AND the assistant)
- [ ] Site built/fixed (Deliverable 1 if bundled)
- [ ] Assistant enabled + 10-question test passed
- [ ] Review flow agreed (who sends requests, who pastes responses)
- [ ] GBP access or paste-workflow agreed
- [ ] Featured placement activated on the directory (part of Growth)
- [ ] Recurring calendar: weekly review sweep, monthly GBP batch

## Monthly cadence checklist (per client)

- [ ] Week 1: GBP post batch drafted + approved + posted
- [ ] Weekly: new reviews swept, responses drafted + posted
- [ ] Weekly: review requests for completed fittings
- [ ] Month-end: one-paragraph email to owner — what we did, review count,
      leads forwarded. (This email is the retention engine — never skip it.)

## Graduation triggers

- **3+ paying clients:** build the embed widget + automate review-sweep
  drafting (script pulls new reviews, Claude drafts, founder approves in one
  sitting).
- **5+ clients:** revisit pricing (raise "from $250/mo"), consider Stripe
  products for services tiers.
- **Any client at >2 hrs/week for 3 straight weeks:** reprice or descope.
