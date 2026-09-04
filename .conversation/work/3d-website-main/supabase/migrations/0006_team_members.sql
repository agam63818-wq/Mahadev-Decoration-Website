-- ════════════════════════════════════════════════════════════════════════════
-- 0006 — team_members table (public /about "हमारी टीम" section)
--
-- The About page team cards came from the static teamMembers array in
-- lib/data/business.ts, so the owner could not add a new decorator, change a
-- role or upload a photo without a code change. This migration gives them a
-- real table, seeded ONCE with exactly the three members the site shows today.
--
-- Conventions follow 0004/0005: uuid pk, NOT NULL columns with safe defaults,
-- defensive `add column if not exists`, public.is_admin() as the write
-- boundary, and the shared public.touch_updated_at() trigger.
--
-- Only the fields the About card actually renders are stored — name, role,
-- photo, ordering, active flag — plus phone, which the owner needs for their
-- own team contact list. No invented columns.
--
-- Idempotent: safe to run exactly once, and harmless if re-run.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  role text not null default '',
  photo_url text,
  phone text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_members add column if not exists name text not null default '';
alter table public.team_members add column if not exists role text not null default '';
alter table public.team_members add column if not exists photo_url text;
alter table public.team_members add column if not exists phone text;
alter table public.team_members add column if not exists is_active boolean not null default true;
alter table public.team_members add column if not exists sort_order integer not null default 0;
alter table public.team_members add column if not exists created_at timestamptz not null default now();
alter table public.team_members add column if not exists updated_at timestamptz not null default now();

-- ── Index ────────────────────────────────────────────────────────────────────
-- The only query is "active members, in display order".
create index if not exists team_members_active_sort_idx
  on public.team_members (is_active, sort_order);

-- ── updated_at trigger (shared helper, same as services/portfolio_items) ────
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

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Team members are shown publicly on /about, so public read of ACTIVE rows is
-- required. Writes are admin/team only (public.is_admin()).
--
-- NOTE: `phone` is a column on a publicly-readable table. It is intentionally
-- NOT selected by the public data-access layer (lib/data/team.ts selects only
-- the columns the public card renders) — it exists for the owner's own admin
-- list. If a team phone number must never be visible to the public, keep it
-- empty until Part 2 moves it behind an admin-only view.
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

-- ── One-time seed: the three members the About page shows today ─────────────
-- Mirrors lib/data/business.ts `teamMembers`. photo_url is left NULL because
-- the static entries had an empty photoUrl — the About card already falls back
-- to the member's initial, so nothing looks broken. `role` stores the Hindi
-- role, which is what the card shows most prominently.
--
-- Guarded by a name check so a re-run never duplicates or overwrites rows the
-- owner has since edited. No employees are invented.
insert into public.team_members (name, role, photo_url, phone, is_active, sort_order)
select v.name, v.role, null, null, true, v.sort_order
from (values
  ('महादेव कुमार', 'संस्थापक और मुख्य डेकोरेटर', 0),
  ('राजेश कुमार', 'वरिष्ठ डेकोरेटर', 1),
  ('सुनीता देवी', 'फ्लोरल डिजाइनर', 2)
) as v(name, role, sort_order)
where not exists (
  select 1 from public.team_members t where t.name = v.name
);
