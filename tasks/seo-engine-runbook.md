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
- Live research first: read the current top-ranking pages for the target
  keyword; the draft must be genuinely better or fresher, not a paraphrase.
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
- `cd web && npm run build` must pass before the PR is opened. If it fails,
  fix it or don't open the PR.

## Step 2 — Maintenance mode (first Monday of the month)

On the first Monday of each calendar month, draft only ONE new article and
spend the second slot on maintenance (its own branch
`seo-maintenance-<yyyy-mm>`, own PR):

1. **Refresh the stalest guide.** Find the guide file in `web/lib/guides/`
   with the oldest `dateModified`. Update stale year references, refresh any
   numbers that have drifted, add internal links to guides published since it
   was written, and bump `dateModified`.
2. **Re-sort the queue if fresh data exists.** Look in `tasks/` for a Google
   Search Console export newer than `tasks/gsc-2026-06-10/`. If found:
   analyze it and re-order the remaining queue in `tasks/seo-keyword-map.md`,
   adding a dated note explaining what moved and why. If not found: add this
   line to the maintenance PR description —
   *"James — drop a fresh GSC export into `tasks/` so next month's run can
   re-sort the queue against real ranking data."*

## PR conventions

- Branch names: `seo-article-<slug>` / `seo-maintenance-<yyyy-mm>`.
- PR title: `New guide: <article title>` or `SEO maintenance: <month>`.
- PR description: target keyword, evidence line from the queue, word count,
  checklist confirmation, and anything James must know before merging.
- Never send email, never post externally, never touch the `shops` table or
  anything outside the files named in this runbook.

---

## Appendix — the cloud routine prompt

The routine's entire prompt should be exactly this:

> Check out the repository's default branch. Read
> `tasks/seo-engine-runbook.md` and follow it exactly. It is the single
> source of truth for this routine and overrides these instructions.
