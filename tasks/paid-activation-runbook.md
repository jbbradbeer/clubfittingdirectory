# Paid Activation Runbook — Founding Verified ($349/yr)

> **UPDATED 2026-07-23:** payment → activation → welcome email is now
> AUTOMATED via Stripe Checkout + webhook (see the onboarding flow build).
> The manual steps below are the backstop for when a payment arrives outside
> the flow (e.g. an old payment link).

## The automated flow (normal path)

1. Owner claims their listing (free) → you **Approve** in Admin → Submissions.
2. Intro call happens → click **Send payment link** on the approved claim
   card (Submissions tab). The owner gets an email with their payment page
   (`/onboard/pay/<slug>`).
3. They pay via Stripe Checkout → the webhook automatically: records the
   payment, activates the badge (+1-year expiry), refreshes the pages, and
   sends the welcome email (you're cc'd — that's your payment alert).
4. **Your only remaining manual step: Gear Shelf.** Add the shop to the
   newsletter rotation list in beehiiv.

## Manual backstop (payment arrives outside the flow)

1. **Find the shop's slug.** Search the site for the shop name; the slug is
   the part of the URL after `/listing/` (e.g.
   `mcgolf-custom-clubs-waverly-oh`). The Stripe email shows the payer's name
   and email — match it against the shop or the outreach thread.
2. **Activate.** Admin → **Overview** tab → *Verified listings* card → paste
   the slug → **Activate Verified**. This sets the badge live and stamps a
   1-year expiry automatically.
3. **Confirm.** Open `/listing/<slug>` — the green Verified badge should be
   there (give it a minute; the page cache refreshes on activation).
4. **If they haven't claimed their listing yet**, send them the claim link
   (`clubfittingdirectory.com/claim/<slug>`) — lead forwarding only turns on
   once a claim is approved, because that's what stores their email.
5. **Send the welcome email** (from bowtiedgolf@gmail.com, personal tone):

   > Subject: You're in — Founding Verified on Club Fitting Directory
   >
   > [Name] — payment received, and [Shop] is now Verified on the directory.
   > The badge is live on your listing.
   >
   > Three things to make the most of it:
   > 1. Reply with your booking link and I'll put it on your profile.
   > 2. Send any corrections (hours, services, photos) and I'll apply them.
   > 3. You're in the Gear Shelf rotation in The Tuxedo Collective newsletter
   >    (6,600 subscribers) — I'll let you know when your slot runs.
   > 4. Add a link to your listing from your website — "Verified on Club
   >    Fitting Directory" in the footer works. It helps your profile rank
   >    on Google, which sends more golfers through it.
   >
   > Fitting requests golfers submit on your page go straight to this email.
   > Grandfathered at $349/yr as a founding partner. Questions, just reply.
   >
   > James

6. **Gear Shelf.** Add the shop to the newsletter rotation list in beehiiv.

## Monthly renewal check (first Monday, alongside the SEO PRs)

- Admin → Overview → *Verified listings* card. Expiry dates are listed;
  **past-due rows show in red**.
- ~30 days before a shop's expiry, click **Renewal link** on their roster row
  — it emails them their payment page. Paying extends the expiry from the
  current expiry date (no paid time lost on early renewal).
- If a shop lapses (no renewal after a grace week or two):
  1. Click **Lapse** on their row (badge comes off; history is kept).
  2. Send the courteous note:

     > [Name] — your Founding Verified year on the directory has wrapped up,
     > so the badge is paused for now. Your free listing (and lead
     > forwarding) stays live either way. If you want the badge and Gear
     > Shelf rotation back, same founding price holds for you: [Stripe link]

## Notes

- Claiming is FREE and separate from Verified. Approving a claim (Submissions
  tab) stores the owner's email and turns on lead forwarding. Verified is the
  paid badge on top.
- Never edit `listing_tier` by hand in Supabase anymore — the admin buttons
  also stamp `verified_at` / `verified_expires_at` and refresh the cached
  pages, which raw SQL doesn't.
- Volume trigger: when manual activation becomes a chore (~20+ paying shops),
  it's time to build the Stripe webhook + shop portal (Phase B — see the
  plan history).
