-- 0012 — safe booking-request -> booking conversion
--
-- The admin should be able to turn an inbound request into a real booking
-- without creating duplicate customers/bookings when the button is clicked
-- twice or two admin tabs race each other.
--
-- This migration is additive. It does NOT touch payment processing.

-- A request can produce at most one booking. NULL remains allowed for future
-- manually-created bookings that did not originate from a request.
create unique index if not exists bookings_booking_request_id_key
  on public.bookings (booking_request_id)
  where booking_request_id is not null;

create or replace function public.convert_booking_request_to_booking(
  p_request_id uuid,
  p_total_price numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.booking_requests%rowtype;
  v_customer public.customers%rowtype;
  v_booking_id uuid;
  v_phone text;
  v_total numeric;
begin
  -- Never expose this operation to anonymous callers. The application also
  -- checks the admin role before invoking it; this database check is the real
  -- security boundary.
  if not public.is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if p_request_id is null then
    raise exception 'request_id_required' using errcode = '22023';
  end if;

  v_total := greatest(coalesce(p_total_price, 0), 0);

  -- Lock the request for the whole conversion. A second click waits here and
  -- then receives the already-created booking id instead of inserting again.
  select * into v_request
  from public.booking_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'booking_request_not_found' using errcode = 'P0002';
  end if;

  -- Idempotent fast path: conversion has already happened.
  select id into v_booking_id
  from public.bookings
  where booking_request_id = p_request_id
  limit 1;

  if v_booking_id is not null then
    return v_booking_id;
  end if;

  -- The public form currently writes contact_phone; older data may use the
  -- legacy phone column. Normalize only for matching, never for display.
  v_phone := nullif(regexp_replace(coalesce(v_request.contact_phone, v_request.phone, ''), '[^0-9+]', '', 'g'), '');

  -- Serialize customer lookup/creation by phone. This avoids duplicate
  -- customer rows when two admin tabs convert requests for the same person.
  if v_phone is not null then
    perform pg_advisory_xact_lock(hashtextextended(v_phone, 0));

    select * into v_customer
    from public.customers
    where phone = v_phone
    order by created_at asc
    limit 1
    for update;
  end if;

  if v_customer.id is null then
    insert into public.customers (
      full_name,
      phone,
      whatsapp,
      email,
      notes,
      total_spending,
      events_completed
    ) values (
      coalesce(nullif(v_request.contact_name, ''), nullif(v_request.customer_name, ''), 'ग्राहक'),
      coalesce(v_phone, coalesce(v_request.contact_phone, v_request.phone, 'unknown')),
      coalesce(v_request.contact_whatsapp, v_request.whatsapp),
      coalesce(v_request.contact_email, v_request.email),
      null,
      0,
      0
    )
    returning * into v_customer;
  end if;

  insert into public.bookings (
    booking_request_id,
    customer_id,
    event_type,
    event_date,
    city,
    area,
    address,
    venue_name,
    map_location,
    budget_range,
    decoration_styles,
    guest_count,
    venue_type,
    is_indoor,
    special_requirements,
    additional_notes,
    status,
    total_price,
    advance_paid,
    remaining_amount,
    admin_notes,
    selected_portfolio_media_id,
    selected_service_id,
    selected_package_id,
    selected_service_name_snapshot,
    selected_package_name_snapshot,
    selected_price_snapshot,
    selected_image_url_snapshot
  ) values (
    v_request.id,
    v_customer.id,
    v_request.event_type,
    v_request.event_date,
    v_request.city,
    v_request.area,
    v_request.address,
    v_request.venue_name,
    v_request.map_location,
    coalesce(v_request.budget_range, v_request.budget),
    coalesce(v_request.decoration_styles, v_request.style),
    v_request.guest_count,
    v_request.venue_type,
    coalesce(v_request.is_indoor, case when v_request.setting is null then null else lower(v_request.setting) in ('indoor','इनडोर') end),
    coalesce(v_request.special_requirements, v_request.requirements),
    v_request.additional_notes,
    'pending_review'::booking_status,
    v_total,
    0,
    v_total,
    null,
    v_request.selected_portfolio_media_id,
    v_request.selected_service_id,
    v_request.selected_package_id,
    v_request.selected_service_name_snapshot,
    v_request.selected_package_name_snapshot,
    v_request.selected_price_snapshot,
    v_request.selected_image_url_snapshot
  )
  returning id into v_booking_id;

  -- Keep the inbound request as the historical source record. `confirmed`
  -- here means "accepted/converted by admin", not "payment received".
  update public.booking_requests
  set status = 'confirmed'::booking_status,
      updated_at = now()
  where id = v_request.id;

  return v_booking_id;
exception
  when unique_violation then
    -- The unique request->booking index is the final race arbiter. Return the
    -- existing booking rather than surfacing a duplicate-conversion error.
    select id into v_booking_id
    from public.bookings
    where booking_request_id = p_request_id
    limit 1;
    if v_booking_id is not null then
      return v_booking_id;
    end if;
    raise;
end;
$$;

revoke all on function public.convert_booking_request_to_booking(uuid, numeric) from public;
grant execute on function public.convert_booking_request_to_booking(uuid, numeric) to authenticated;
