-- 0015 — atomic request/booking status synchronization
-- Additive only. Payment remains intentionally out of scope.
--
-- The admin UI previously updated booking_requests and bookings as two
-- separate statements. If the second statement failed (for example because
-- the date-conflict trigger rejected a newly-confirmed booking), the request
-- could be left with the new status while the real booking kept the old one.
-- This RPC makes the workflow transition one database transaction.

create or replace function public.sync_booking_request_status(
  p_request_id uuid,
  p_status booking_status
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if p_request_id is null then
    raise exception 'request_id_required' using errcode = '22023';
  end if;

  -- Lock the inbound request so two admin tabs cannot race each other.
  select id into v_request_id
  from public.booking_requests
  where id = p_request_id
  for update;

  if v_request_id is null then
    raise exception 'booking_request_not_found' using errcode = 'P0002';
  end if;

  update public.booking_requests
  set status = p_status,
      updated_at = now()
  where id = p_request_id;

  -- A request may exist without a converted booking. That is valid: the
  -- request status still changes, while the booking side is simply skipped.
  -- When a booking exists, this UPDATE is in the same transaction, so a
  -- date-conflict trigger failure rolls the request update back as well.
  update public.bookings
  set status = p_status,
      updated_at = now()
  where booking_request_id = p_request_id;

  return p_request_id;
end;
$$;

revoke all on function public.sync_booking_request_status(uuid, booking_status) from public;
grant execute on function public.sync_booking_request_status(uuid, booking_status) to authenticated;
