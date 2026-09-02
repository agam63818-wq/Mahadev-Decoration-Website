-- ════════════════════════════════════════════════════════════════════════════
-- 0004 — Occasions table (home page "अपने अवसर को चुनें" cards)
--
-- Until now the six occasion cards on the home page came only from static seed
-- data in lib/data/services.ts, so the admin could not replace their photos,
-- prices or text. This migration gives them a real table with public read
-- access; writes go through the service-role client in Server Actions after
-- getAdminUser() has verified the caller (same pattern as packages/portfolio).
--
-- Everything is idempotent (`if not exists` / drop-then-create policies) so it
-- can be re-run safely against the live database.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

create table if not exists public.occasions (
  id uuid primary key default gen_random_uuid(),
  slug text not null default '',
  name text not null default '',
  name_en text not null default '',
  description text not null default '',
  event_type text not null default 'custom',
  starting_price integer not null default 0,
  image_url text not null default '',
  image_alt text not null default '',
  icon text not null default 'Sparkles',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.occasions add column if not exists slug text not null default '';
alter table public.occasions add column if not exists name text not null default '';
alter table public.occasions add column if not exists name_en text not null default '';
alter table public.occasions add column if not exists description text not null default '';
alter table public.occasions add column if not exists event_type text not null default 'custom';
alter table public.occasions add column if not exists starting_price integer not null default 0;
alter table public.occasions add column if not exists image_url text not null default '';
alter table public.occasions add column if not exists image_alt text not null default '';
alter table public.occasions add column if not exists icon text not null default 'Sparkles';
alter table public.occasions add column if not exists sort_order integer not null default 0;
alter table public.occasions add column if not exists is_active boolean not null default true;
alter table public.occasions add column if not exists created_at timestamptz not null default now();
alter table public.occasions add column if not exists updated_at timestamptz not null default now();

create unique index if not exists occasions_slug_key on public.occasions (slug) where slug <> '';
create index if not exists occasions_sort_idx on public.occasions (sort_order);

-- Row-level security: anyone can read active occasions; no anon/auth write
-- policies (admin writes use the service-role key from Server Actions).
alter table public.occasions enable row level security;

drop policy if exists "occasions_public_read" on public.occasions;
create policy "occasions_public_read"
  on public.occasions for select using (is_active = true);

-- Occasion card photos can be uploaded into the existing public `portfolio`
-- bucket under an `occasions/` prefix, so no new bucket is required.
