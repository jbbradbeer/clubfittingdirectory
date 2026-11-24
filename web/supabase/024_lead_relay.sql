-- ============================================================
-- 024 — Lead relay tracking
--
-- WHY: golfer requests for UNCLAIMED shops only reached the founder; nothing
-- recorded whether the shop was told. These columns track the hand-off so the
-- admin can send it, remind, and record what happened (web/lib/leads/relay.ts).
--
-- Also removes the public key's right to insert into fitting_requests: the
-- API route saves with the server key, so that right only let someone bypass
-- the form's validation and rate limits (and now these tracking columns).
--
-- HOW TO APPLY: run in the Supabase SQL editor BEFORE merging the code that
-- uses it. Safe to re-run. The live form keeps working in between.
-- ============================================================

alter table public.fitting_requests
  add column if not exists shop_email          text,
  add column if not exists shop_sent_at        timestamptz,
  add column if not exists owner_forwarded_at  timestamptz,
  add column if not exists golfer_confirmed_at timestamptz,
  add column if not exists reminded_at         timestamptz,
  add column if not exists reminder_count      integer not null default 0,
  add column if not exists outcome             text,
  add column if not exists outcome_at          timestamptz;

alter table public.fitting_requests drop constraint if exists fitting_requests_outcome_check;
alter table public.fitting_requests add constraint fitting_requests_outcome_check
  check (outcome is null or outcome in ('shop_replied','connected','booked','no_response','closed'));

-- Requests from before this feature never trigger reminders (fixed date, so a
-- re-run can't silence newer ones).
update public.fitting_requests
   set reminder_count = 3
 where created_at < '2026-11-24T18:00:00Z' and reminder_count < 3;

create index if not exists fitting_requests_open_idx
  on public.fitting_requests (created_at)
  where outcome is null;

drop policy if exists "Public can request a fitting" on public.fitting_requests;
revoke all on public.fitting_requests from anon, authenticated;

-- ============================================================
-- VERIFY (expect no rows):
--   select grantee, privilege_type from information_schema.role_table_grants
--    where table_name = 'fitting_requests' and grantee in ('anon','authenticated');
-- ROLLBACK of the access change:
--   create policy "Public can request a fitting" on public.fitting_requests
--     for insert to anon, authenticated with check (true);
--   grant insert on public.fitting_requests to anon, authenticated;
-- ============================================================
