-- Additive notification infrastructure. Apply AFTER the live-alignment migrations.
-- No notification trigger touches booking creation: the scheduled worker scans
-- committed booking_requests, so push/schema/network failures cannot undo a lead.
begin;

alter table public.booking_requests add column if not exists submission_key uuid;
alter table public.booking_requests add column if not exists submission_hash text;
create unique index if not exists booking_requests_submission_key_key
  on public.booking_requests(submission_key) where submission_key is not null;

-- The original own-profile policy allowed ALL writes. Keep profile editing/RLS
-- intact, but never allow a browser JWT to provision or promote a staff role.
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      if new.role::text <> 'customer' then
        raise exception 'role_provisioning_forbidden' using errcode = '42501';
      end if;
    elsif new.role is distinct from old.role then
      raise exception 'role_change_forbidden' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role before insert or update of role on public.profiles
  for each row execute function public.guard_profile_role();
revoke all on function public.guard_profile_role() from public, anon, authenticated;

create table if not exists public.admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique check (length(endpoint) between 20 and 2048),
  p256dh text not null check (length(p256dh) between 80 and 100),
  auth text not null check (length(auth) between 20 and 30),
  user_agent text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_test_at timestamptz
);
create index if not exists admin_push_profile_idx on public.admin_push_subscriptions(profile_id);

-- Singleton records rollout boundary: do not notify historical bookings on deploy.
create table if not exists public.booking_push_config (
  id boolean primary key default true check (id),
  activated_at timestamptz not null default now()
);
insert into public.booking_push_config(id) values(true) on conflict do nothing;

create table if not exists public.booking_push_events (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  notification_type text not null default 'new_booking' check (notification_type = 'new_booking'),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  expanded_at timestamptz,
  unique(booking_request_id, notification_type)
);
create index if not exists booking_push_unexpanded_idx
  on public.booking_push_events(created_at) where expanded_at is null;

create table if not exists public.booking_push_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.booking_push_events(id) on delete cascade,
  subscription_id uuid not null references public.admin_push_subscriptions(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed','cancelled','expired')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  lease_until timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique(event_id, subscription_id)
);
create index if not exists booking_push_due_idx
  on public.booking_push_deliveries(next_attempt_at) where status in ('pending','sending');

alter table public.admin_push_subscriptions enable row level security;
alter table public.booking_push_config enable row level security;
alter table public.booking_push_events enable row level security;
alter table public.booking_push_deliveries enable row level security;
-- No browser writes, even for admins: validated Server Actions own registration.
revoke all on public.admin_push_subscriptions, public.booking_push_config,
  public.booking_push_events, public.booking_push_deliveries from anon, authenticated;
grant select on public.admin_push_subscriptions to authenticated;
drop policy if exists push_own_staff_read on public.admin_push_subscriptions;
create policy push_own_staff_read on public.admin_push_subscriptions for select to authenticated
  using (profile_id = auth.uid() and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role::text in ('admin','team')
  ));
grant all on public.admin_push_subscriptions, public.booking_push_config,
  public.booking_push_events, public.booking_push_deliveries to service_role;

-- Atomic endpoint ownership check; a second account cannot take a device over.
create or replace function public.register_admin_push(
  p_profile_id uuid, p_endpoint text, p_p256dh text, p_auth text, p_user_agent text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not exists(select 1 from public.profiles where id=p_profile_id and role::text in ('admin','team')) then
    raise exception 'not_authorized' using errcode='42501';
  end if;
  insert into public.admin_push_subscriptions(profile_id,endpoint,p256dh,auth,user_agent)
  values(p_profile_id,p_endpoint,p_p256dh,p_auth,left(p_user_agent,300))
  on conflict(endpoint) do update set p256dh=excluded.p256dh,auth=excluded.auth,
    user_agent=excluded.user_agent,enabled=true,updated_at=now()
  where public.admin_push_subscriptions.profile_id=excluded.profile_id
  returning id into v_id;
  if v_id is null then raise exception 'device_owned_by_another_account' using errcode='42501'; end if;
  return v_id;
end;
$$;

-- Reconciliation is the event trigger. The existing created_at index supports
-- scanning only post-rollout rows; unique events survive cron retries/restarts.
create or replace function public.prepare_booking_push()
returns void language plpgsql security definer set search_path = '' as $$
declare v_event public.booking_push_events%rowtype;
begin
  if not pg_try_advisory_xact_lock(731625811) then return; end if;
  insert into public.booking_push_events(booking_request_id,payload,expires_at)
  select b.id, jsonb_build_object(
    'bookingId', b.id, 'customer', coalesce(b.contact_name,b.customer_name,''),
    'event', b.event_type, 'date', b.event_date, 'location', b.city,
    'package', coalesce(b.selected_package_name_snapshot,b.selected_item_title_snapshot,b.selected_service_name_snapshot)
  ), b.created_at + interval '24 hours'
  from public.booking_requests b
  where b.created_at >= (select activated_at from public.booking_push_config where id)
    and b.created_at > now() - interval '24 hours'
    and not exists(select 1 from public.booking_push_events e where e.booking_request_id=b.id)
  order by b.created_at limit 200
  on conflict(booking_request_id,notification_type) do nothing;

  -- A fan-out is sealed only when at least one valid device exists. No-device
  -- events wait up to 24h; later registrations don't replay already-fanned events.
  for v_event in select * from public.booking_push_events
    where expanded_at is null and expires_at > now() order by created_at limit 200 for update
  loop
    insert into public.booking_push_deliveries(event_id,subscription_id)
    select v_event.id,s.id from public.admin_push_subscriptions s
      join public.profiles p on p.id=s.profile_id
    where s.enabled and p.role::text in ('admin','team')
    on conflict(event_id,subscription_id) do nothing;
    if exists(select 1 from public.booking_push_deliveries where event_id=v_event.id) then
      update public.booking_push_events set expanded_at=now() where id=v_event.id;
    end if;
  end loop;

  update public.booking_push_deliveries d set status='expired',lease_token=null,lease_until=null
  from public.booking_push_events e where d.event_id=e.id and e.expires_at<=now()
    and d.status in ('pending','sending');
  update public.booking_push_deliveries d set status='cancelled',lease_token=null,lease_until=null
  where d.status in ('pending','sending') and not exists (
    select 1 from public.admin_push_subscriptions s join public.profiles p on p.id=s.profile_id
    where s.id=d.subscription_id and s.enabled and p.role::text in ('admin','team')
  );
  update public.booking_push_deliveries set status='failed',last_error='attempts_exhausted',lease_token=null,lease_until=null
  where status in ('pending','sending') and attempt_count>=8 and (lease_until is null or lease_until<=now());
end;
$$;

create or replace function public.claim_booking_push()
returns table(delivery_id uuid,event_id uuid,subscription_id uuid,lease_token uuid,payload jsonb,
  endpoint text,p256dh text,auth text)
language sql security definer set search_path = '' as $$
  with due as (
    select d.id from public.booking_push_deliveries d
      join public.booking_push_events e on e.id=d.event_id
      join public.admin_push_subscriptions s on s.id=d.subscription_id
      join public.profiles p on p.id=s.profile_id
    where d.status in ('pending','sending') and d.next_attempt_at<=now()
      and (d.lease_until is null or d.lease_until<=now()) and d.attempt_count<8
      and e.expires_at>now() and s.enabled and p.role::text in ('admin','team')
    order by d.next_attempt_at limit 10 for update of d skip locked
  ), claimed as (
    update public.booking_push_deliveries d set status='sending',attempt_count=d.attempt_count+1,
      lease_token=gen_random_uuid(),lease_until=now()+interval '5 minutes'
    from due where d.id=due.id returning d.*
  )
  select c.id,c.event_id,c.subscription_id,c.lease_token,e.payload,s.endpoint,s.p256dh,s.auth
  from claimed c join public.booking_push_events e on e.id=c.event_id
    join public.admin_push_subscriptions s on s.id=c.subscription_id;
$$;

-- Fenced acknowledgement: an expired worker cannot overwrite a newer attempt.
create or replace function public.finish_booking_push(
  p_delivery_id uuid,p_lease_token uuid,p_result text,p_error text default null,p_retry_seconds integer default null
) returns boolean language plpgsql security definer set search_path = '' as $$
declare d public.booking_push_deliveries%rowtype;
begin
  if p_result not in ('sent','retry','invalid','failed') then raise exception 'invalid_result'; end if;
  select * into d from public.booking_push_deliveries
    where id=p_delivery_id and lease_token=p_lease_token and status='sending' for update;
  if not found then return false; end if;
  update public.booking_push_deliveries set
    status=case when p_result='sent' then 'sent' when p_result='retry' and d.attempt_count<8 then 'pending' else 'failed' end,
    sent_at=case when p_result='sent' then now() else null end,
    last_error=left(p_error,100), lease_token=null,lease_until=null,
    next_attempt_at=now()+make_interval(secs=>greatest(30,least(21600,coalesce(p_retry_seconds,30*power(2,d.attempt_count)::integer))))
  where id=d.id;
  update public.admin_push_subscriptions set
    last_success_at=case when p_result='sent' then now() else last_success_at end,
    last_failure_at=case when p_result<>'sent' then now() else last_failure_at end,
    enabled=case when p_result='invalid' then false else enabled end
  where id=d.subscription_id;
  return true;
end;
$$;

revoke all on function public.register_admin_push(uuid,text,text,text,text) from public,anon,authenticated;
revoke all on function public.prepare_booking_push() from public,anon,authenticated;
revoke all on function public.claim_booking_push() from public,anon,authenticated;
revoke all on function public.finish_booking_push(uuid,uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.register_admin_push(uuid,text,text,text,text) to service_role;
grant execute on function public.prepare_booking_push() to service_role;
grant execute on function public.claim_booking_push() to service_role;
grant execute on function public.finish_booking_push(uuid,uuid,text,text,integer) to service_role;
commit;
