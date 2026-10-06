-- ============================================================
-- 020 — Lead notification tracking (audit 2026-09)
--
-- WHY: /api/request-fitting always SAVES the lead, then emails the founder /
-- shop owner best-effort. The email result was discarded, so a Resend outage
-- meant a saved lead nobody heard about. Now:
--   * notified_at   — set when the notification email was accepted by Resend
--   * notify_attempts — how many sends were tried (route = 1, cron adds more)
-- The daily cron (web/app/api/cron/daily) re-sends any lead with
-- notified_at IS NULL and fewer than 5 attempts.
--
-- Existing rows are backfilled as notified (they were all sent under the old
-- code path or are already worked), so the cron doesn't re-email old leads.
--
-- HOW TO APPLY: paste into the Supabase SQL editor and Run. Safe to re-run.
-- ============================================================

alter table public.fitting_requests
  add column if not exists notified_at     timestamptz,
  add column if not exists notify_attempts integer not null default 0;

update public.fitting_requests
   set notified_at = coalesce(notified_at, created_at, now()),
       notify_attempts = greatest(notify_attempts, 1)
 where notified_at is null
   and created_at < now() - interval '1 hour';

create index if not exists fitting_requests_unnotified_idx
  on public.fitting_requests (created_at)
  where notified_at is null;

-- ============================================================
-- VERIFY:
--   select count(*) filter (where notified_at is null) as unnotified from public.fitting_requests;
-- ROLLBACK:
--   alter table public.fitting_requests drop column notified_at, drop column notify_attempts;
-- ============================================================
