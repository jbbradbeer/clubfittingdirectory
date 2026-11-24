-- ============================================================
-- 025 — Fix fact promotion (recompute_current_fact)
--
-- WHY: the function swapped the old and new "current" fact in ONE update. The
-- one-current-fact-per-attribute index is checked row by row, so depending on
-- row order it was refused with 23505 and the correction didn't apply. Found
-- 2026-11-24 on an owner's price correction; it would also make approving
-- owner edits in the admin fail at random.
--
-- Only that step changed; the winner rule and permissions are as in 006.
-- HOW TO APPLY: run in the Supabase SQL editor. Safe to re-run.
-- ============================================================

create or replace function public.recompute_current_fact(p_listing_id uuid, p_attribute text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner uuid;
  v_value  jsonb;
  v_col    text;
  v_kind   text;
begin
  -- Winner rule: human-verified first, then confidence, then source
  -- precedence, then most recently fetched.
  select f.id, f.value
    into v_winner, v_value
  from public.listing_facts f
  join public.fact_sources s on s.source = f.source
  where f.listing_id = p_listing_id
    and f.attribute  = p_attribute
  order by (f.verified_by = 'human') desc,
           f.confidence desc,
           s.precedence desc,
           f.fetched_at desc
  limit 1;

  -- Clear the old winner BEFORE marking the new one. A single UPDATE that does
  -- both can be refused by uq_listing_facts_current, because uniqueness is
  -- checked row by row and the new row may be visited first.
  update public.listing_facts
     set is_current = false
   where listing_id = p_listing_id
     and attribute  = p_attribute
     and is_current
     and id is distinct from v_winner;

  update public.listing_facts
     set is_current = true
   where id = v_winner
     and not is_current;

  if v_winner is null then
    return;
  end if;

  select shops_column, value_kind into v_col, v_kind
  from public.fact_attributes where attribute = p_attribute;
  if v_col is null then
    return;
  end if;

  -- Promote the winning value into the shops materialized cache, cast to the
  -- column's real type.
  if v_kind = 'text' then
    execute format('update public.shops set %I = $1 where id = $2', v_col)
      using (v_value #>> '{}'), p_listing_id;
  elsif v_kind = 'number' then
    execute format('update public.shops set %I = $1 where id = $2', v_col)
      using (v_value #>> '{}')::numeric, p_listing_id;
  elsif v_kind = 'boolean' then
    execute format('update public.shops set %I = $1 where id = $2', v_col)
      using (v_value #>> '{}')::boolean, p_listing_id;
  elsif v_kind = 'text_array' then
    execute format('update public.shops set %I = $1 where id = $2', v_col)
      using array(select jsonb_array_elements_text(v_value)), p_listing_id;
  elsif v_kind = 'jsonb' then
    execute format('update public.shops set %I = $1 where id = $2', v_col)
      using v_value, p_listing_id;
  end if;
end;
$$;

revoke all on function public.recompute_current_fact(uuid, text) from public, anon, authenticated;
grant execute on function public.recompute_current_fact(uuid, text) to service_role;
