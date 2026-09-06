-- ════════════════════════════════════════════════════════════════════════════
-- 0006 — team_members table (public /about "हमारी टीम" section)
--
-- The base project already has a legacy `team_members.full_name` column. This
-- migration deliberately keeps it for compatibility and adds the richer fields
-- used by the admin/public team UI. It is safe on both the legacy live schema
-- and a fresh database.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '',
  name text not null default '',
  role text not null default '',
  photo_url text,
  phone text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_members add column if not exists full_name text not null default '';
alter table public.team_members add column if not exists name text not null default '';
alter table public.team_members add column if not exists role text not null default '';
alter table public.team_members add column if not exists photo_url text;
alter table public.team_members add column if not exists phone text;
alter table public.team_members add column if not exists is_active boolean not null default true;
alter table public.team_members add column if not exists sort_order integer not null default 0;
alter table public.team_members add column if not exists created_at timestamptz not null default now();
alter table public.team_members add column if not exists updated_at timestamptz not null default now();

-- Keep the two name fields synchronized for existing legacy rows without
-- overwriting either side when an owner has already edited it.
update public.team_members
set name = full_name
where coalesce(nullif(name, ''), '') = '' and full_name <> '';

update public.team_members
set full_name = name
where coalesce(nullif(full_name, ''), '') = '' and name <> '';

create index if not exists team_members_active_sort_idx
  on public.team_members (is_active, sort_order);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists team_members_touch on public.team_members;
create trigger team_members_touch before update on public.team_members
  for each row execute function public.touch_updated_at();

alter table public.team_members enable row level security;

drop policy if exists "team_members_public_read" on public.team_members;
create policy "team_members_public_read"
  on public.team_members for select
  using (is_active = true or public.is_admin());

drop policy if exists "team_members_admin_write" on public.team_members;
create policy "team_members_admin_write"
  on public.team_members for all
  using (public.is_admin())
  with check (public.is_admin());

-- One-time seed: preserves the three team cards the site already documented.
-- Re-running never duplicates or overwrites an existing member.
insert into public.team_members (full_name, name, role, photo_url, phone, is_active, sort_order)
select v.name, v.name, v.role, null, null, true, v.sort_order
from (values
  ('महादेव कुमार', 'संस्थापक और मुख्य डेकोरेटर', 0),
  ('राजेश कुमार', 'वरिष्ठ डेकोरेटर', 1),
  ('सुनीता देवी', 'फ्लोरल डिजाइनर', 2)
) as v(name, role, sort_order)
where not exists (
  select 1 from public.team_members t where t.name = v.name or t.full_name = v.name
);