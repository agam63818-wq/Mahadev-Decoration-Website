-- 0014 — notification profile compatibility
-- Some existing deployments already had notifications.profile_id NOT NULL,
-- while the current 0011 definition did not include it. Make the column
-- available to the application while keeping it nullable so fresh installs
-- and environments without an admin profile can still accept a booking.

alter table public.notifications
  add column if not exists profile_id uuid references public.profiles(id) on delete cascade;

alter table public.notifications
  alter column profile_id drop not null;

create index if not exists notifications_profile_created_at_idx
  on public.notifications(profile_id, created_at desc);
