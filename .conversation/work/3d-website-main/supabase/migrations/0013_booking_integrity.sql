-- 0013 — booking integrity: immutable status history + double-booking guard
-- Additive only. Payment is intentionally untouched.

-- ---------------------------------------------------------------------------
-- TASK 1: Keep a real append-only status history for every booking.
-- ---------------------------------------------------------------------------
-- The booking_status_history table is already part of the live schema:
--   id, booking_id, status, actor_id, note, created_at
-- Record the initial status on INSERT and every actual status transition on
-- UPDATE. This lives in the database so admin/server/client code cannot
-- accidentally forget the audit entry.
create or replace function public.record_booking_status_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_status_history (booking_id, status, actor_id, note)
    values (new.id, new.status, auth.uid(), null);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.booking_status_history (booking_id, status, actor_id, note)
    values (new.id, new.status, auth.uid(), null);
  end if;

  return new;
end;
$$;

drop trigger if exists booking_status_history_trigger on public.bookings;
create trigger booking_status_history_trigger
after insert or update of status on public.bookings
for each row
execute function public.record_booking_status_history();

-- ---------------------------------------------------------------------------
-- TASK 2: Prevent the same decoration team from accepting two active events
-- on the same date. Pending requests are intentionally NOT blocked: several
-- customers may ask for the same date, and the admin decides which request
-- becomes a real booking. Only an accepted/active booking occupies the date.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_active_booking_date_conflict()
returns trigger
language plpgsql
as $$
begin
  if new.event_date is null then
    return new;
  end if;

  if new.status in (
    'confirmed',
    'in_preparation',
    'team_assigned',
    'in_progress'
  )::public.booking_status[] then
    if exists (
      select 1
      from public.bookings b
      where b.event_date = new.event_date
        and b.id <> new.id
        and b.status in (
          'confirmed',
          'in_preparation',
          'team_assigned',
          'in_progress'
        )::public.booking_status[]
    ) then
      raise exception 'booking_date_conflict'
        using errcode = '23P01',
              hint = 'An active booking already occupies this event date.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_active_date_conflict_trigger on public.bookings;
create trigger bookings_active_date_conflict_trigger
before insert or update of event_date, status on public.bookings
for each row
execute function public.prevent_active_booking_date_conflict();

-- Helpful index for the conflict lookup. Not unique because cancelled/closed
-- and pending records can legitimately share a date.
create index if not exists bookings_active_date_lookup_idx
  on public.bookings (event_date, status);

-- Keep the trigger functions callable only through table triggers / trusted
-- database execution paths.
revoke all on function public.record_booking_status_history() from public;
revoke all on function public.prevent_active_booking_date_conflict() from public;
