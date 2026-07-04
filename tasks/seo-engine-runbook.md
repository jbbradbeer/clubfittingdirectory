# SEO Engine Runbook — Weekly Drafting Agent

**This file is the single source of truth for the Monday content routine**
(claude.ai/code routine `trig_01SXFyummSJdtcFWjuUe1t5v`, Mondays 13:00 UTC).
It overrides anything remembered in the cloud routine's own prompt. If the
cloud prompt and this file disagree, this file wins.

Repo: this repository, default branch `main`. All work happens on feature
branches; **never commit to main, never merge a PR, never force-push.**
James reviews and merges every PR himself.

---

## Step 0 — Duplicate guard (hard gate, run before ANY drafting)

The June 22, 2026 run re-drafted an article that was already merged. Never
again. Before selecting queue items:

1. Read the `GUIDES` array in `web/lib/guides/index.ts` on `main`. The slugs
   registered there are the **ground truth** for what is already published.
2. Read the article queue in `tasks/seo-keyword-map.md`.
3. A queue row is eligible ONLY if it has no ✅ marker **and** no guide with
   its target slug/keyword exists in `GUIDES`.
4. If a row lacks ✅ but its guide IS in `GUIDES` (markers drifted), add the
   ✅ marker with today's date as part of your first PR — do not draft it.

## Step 1 — Normal mode (every Monday)

Draft the next **two** eligible queue articles. Each article gets:

- Its own branch `seo-article-<slug>` **and its own PR** — two separate PRs,
  never combined, so one weak draft doesn't block the other from merging.
- Live research first: use WebSearch/WebFetch to study what currently ranks
  for the target keyword (titles, angles, gaps); the draft must be genuinely
  better or fresher, not a paraphrase. Also read the supporting research in
  `tasks/research/` — especially `voice-of-customer-forums.md` (use golfers'
  real phrasings: say "get fitted", address readers by score like "if you
  shoot 100-110") and `competitor-content-inventory.md` (what to beat).
- **Statistics rule:** for any numbers about the directory itself, use ONLY
  `tasks/research/directory-stats-2026-06.md`. Never invent numbers; never
  cite review counts.
- **Voice:** honest broker for independent fitters. Golfers distrust chain
  marketing — never shill. Question-form H2s ("How much does…"); "cost"
  beats "price"; year-stamp cost/chart content.
- The typed-Guide format (`web/lib/guides/types.ts`), registered in the
  `GUIDES` array in `web/lib/guides/index.ts`.
- The full per-article checklist in `tasks/seo-content-calendar.md`, PLUS:
  - `keyTakeaways`: 3–5 answer-first bullets (REQUIRED — renders as the Key
    Takeaways box and feeds the Article JSON-LD `abstract`). Each bullet is
    one sentence that leads with the answer. No marketing fluff.
  - Internal links: pillar guide + 1–2 siblings, and link to `/repair` when
    the topic touches repair, grips, shafts, or adjustments.
  - Mark the queue row ✅ with the date in `tasks/seo-keyword-map.md` inside
    the same PR.
- `cd web && npm install && npm run build` must pass before the PR is opened.
  If it fails for a reason unrelated to your change, open the PR anyway and
  flag it clearly at the top of the PR body; otherwise fix it first.
- **File scope for article PRs:** only `web/lib/guides/` and
  `tasks/seo-keyword-map.md`. Maintenance PRs may also touch the runbook's
  named files. Nothing else.

## Step 2 — Maintenance mode (first Monday of the month)

On the first Monday of each calendar month, draft only ONE new article and
spend the second slot on maintenance (its own branch
`seo-maintenance-<yyyy-mm>`, own PR):

1. **Refresh the stalest guide.** Find the guide file in `web/lib/guides/`
   with the oldest `dateModified`. Update stale year references, refresh any
   numbers that have drifted, add internal links to guides published since it
   was written, and bump `dateModified`.
2. **Re-sort the queue against fresh data.** First try
   `python3 scripts/gsc_pull.py` — it writes a fresh export to
   `tasks/gsc-latest/` (needs the service-account key; see
   `tasks/gsc-api-setup.md`). If the script can't run (no key in this
   environment), fall back to the newest manual export in `tasks/` (dirs
   named `gsc-*`). With whichever data is newest: re-order the remaining
   queue in `tasks/seo-keyword-map.md` with a dated note explaining what
   moved and why, and append a snapshot column to `tasks/seo-baselines.md`
   if it exists. If the freshest data is over 2 months old, add this line
   to the maintenance PR description —
   *"James — the GSC key isn't set up in this environment and the manual
   export is stale; run the pull locally or drop a fresh export into
   `tasks/`."*

## PR conventions

- Branch names: `seo-article-<slug>` / `seo-maintenance-<yyyy-mm>`.
- PR title: `New guide: <article title>` or `SEO maintenance: <month>`.
- PR description: written for a non-technical reader (James). Include the
  target keyword and why it was next, a 3-bullet summary of the article's
  angle, what to double-check when reviewing, a note that merging publishes
  it live, and the checklist confirmation.
- Never send email, never post externally, never touch the `shops` table or
  anything outside the files named in this runbook.

---

## Appendix — the cloud routine prompt

The routine's entire prompt should be exactly this:

> Check out the repository's default branch. Read
> `tasks/seo-engine-runbook.md` and follow it exactly. It is the single
> source of truth for this routine and overrides these instructions.
