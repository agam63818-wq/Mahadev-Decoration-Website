-- ════════════════════════════════════════════════════════════════════════════
-- Mahadev Decoration — Admin control panel (Part A/B/C) live-schema alignment
--
-- Idempotent. Safe to re-run in the Supabase SQL editor.
--
-- This migration documents and defensively fills the EXACT column sets the
-- admin control panel (/admin/settings, /admin/portfolio, /admin/packages)
-- reads and writes. The column lists below were verified by probing the live
-- PostgREST spec (selecting a non-existent column errors the whole request).
--
-- IMPORTANT — live schema facts that the code relies on:
--   * portfolio_items  has NO slug and NO tags column — the row id doubles as
--                      the /gallery/[id] URL identifier. (0002 added slug/tags
--                      defensively; if those ran, the live columns are simply
--                      unused. This file does NOT drop columns, only adds.)
--   * portfolio_media  has NO is_cover and NO width/height columns — the cover
--                      image is the one with the lowest sort_order.
--   * portfolio_categories has NO created_at / name_hindi / is_active columns.
--   * packages         has NO name_en and NO event_type columns.
--   * package_items    has NO created_at column.
--   * business_settings is a singleton row with jsonb business_hours and
--                      jsonb social_links; NO city/state/pincode/map_embed_url.
--
-- Everything below uses `if not exists` so running it against the live
-- database is a no-op for anything already present.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── business_settings (Part A — /admin/settings) ─────────────────────────────
create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  phone text,
  whatsapp text,
  email text,
  address text not null default '',
  business_hours jsonb not null default '[]'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.business_settings add column if not exists phone text;
alter table public.business_settings add column if not exists whatsapp text;
alter table public.business_settings add column if not exists email text;
alter table public.business_settings add column if not exists address text not null default '';
alter table public.business_settings add column if not exists business_hours jsonb not null default '[]'::jsonb;
alter table public.business_settings add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.business_settings add column if not exists updated_at timestamptz not null default now();

-- ── portfolio_categories (Part B — gallery filter pills) ─────────────────────
create table if not exists public.portfolio_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  slug text not null default '',
  sort_order integer not null default 0
);

alter table public.portfolio_categories add column if not exists name text not null default '';
alter table public.portfolio_categories add column if not exists slug text not null default '';
alter table public.portfolio_categories add column if not exists sort_order integer not null default 0;

-- ── portfolio_items (Part B — gallery items) ─────────────────────────────────
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  category_id uuid,
  event_type text not null default 'custom',
  location text not null default '',
  price_range text not null default '',
  description text not null default '',
  services_included text[] not null default '{}',
  is_featured boolean not null default false,
  is_public boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portfolio_items add column if not exists title text not null default '';
alter table public.portfolio_items add column if not exists category_id uuid;
alter table public.portfolio_items add column if not exists event_type text not null default 'custom';
alter table public.portfolio_items add column if not exists location text not null default '';
alter table public.portfolio_items add column if not exists price_range text not null default '';
alter table public.portfolio_items add column if not exists description text not null default '';
alter table public.portfolio_items add column if not exists services_included text[] not null default '{}';
alter table public.portfolio_items add column if not exists is_featured boolean not null default false;
alter table public.portfolio_items add column if not exists is_public boolean not null default true;
alter table public.portfolio_items add column if not exists seo_title text;
alter table public.portfolio_items add column if not exists seo_description text;
alter table public.portfolio_items add column if not exists created_at timestamptz not null default now();
alter table public.portfolio_items add column if not exists updated_at timestamptz not null default now();

-- ── portfolio_media (Part B — per-item images) ───────────────────────────────
create table if not exists public.portfolio_media (
  id uuid primary key default gen_random_uuid(),
  portfolio_item_id uuid not null references public.portfolio_items(id) on delete cascade,
  media_type text not null default 'image',
  url text not null,
  alt_text text,
  is_before_after boolean not null default false,
  variant_label text,
  price numeric,
  is_bookable boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.portfolio_media add column if not exists media_type text not null default 'image';
alter table public.portfolio_media add column if not exists alt_text text;
alter table public.portfolio_media add column if not exists is_before_after boolean not null default false;
alter table public.portfolio_media add column if not exists variant_label text;
alter table public.portfolio_media add column if not exists price numeric;
alter table public.portfolio_media add column if not exists is_bookable boolean not null default true;
alter table public.portfolio_media add column if not exists sort_order integer not null default 0;
alter table public.portfolio_media add column if not exists created_at timestamptz not null default now();

-- ── packages (Part C — /admin/packages) ──────────────────────────────────────
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null default '',
  description text,
  starting_price numeric,
  price_max numeric,
  setup_time_minutes integer,
  decoration_area text,
  customizable boolean not null default true,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.packages add column if not exists description text;
alter table public.packages add column if not exists starting_price numeric;
alter table public.packages add column if not exists price_max numeric;
alter table public.packages add column if not exists setup_time_minutes integer;
alter table public.packages add column if not exists decoration_area text;
alter table public.packages add column if not exists customizable boolean not null default true;
alter table public.packages add column if not exists is_featured boolean not null default false;
alter table public.packages add column if not exists is_active boolean not null default true;
alter table public.packages add column if not exists created_at timestamptz not null default now();
alter table public.packages add column if not exists updated_at timestamptz not null default now();

-- ── package_items (Part C — bullet inclusions) ───────────────────────────────
create table if not exists public.package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  label text not null default '',
  sort_order integer not null default 0
);

alter table public.package_items add column if not exists label text not null default '';
alter table public.package_items add column if not exists sort_order integer not null default 0;

-- ── Public storage bucket for gallery uploads (Part B) ───────────────────────
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = true;

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Reads of public content are open; writes go through the service-role client
-- in Server Actions (which bypasses RLS) after getAdminUser() has verified the
-- caller's profiles.role = 'admin'. Anon/authenticated roles therefore need
-- no write policies on these tables.
alter table public.business_settings enable row level security;
alter table public.portfolio_categories enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.portfolio_media enable row level security;
alter table public.packages enable row level security;
alter table public.package_items enable row level security;

-- Public read policies (idempotent via drop-if-exists first).
drop policy if exists "business_settings_public_read" on public.business_settings;
create policy "business_settings_public_read"
  on public.business_settings for select using (true);

drop policy if exists "portfolio_categories_public_read" on public.portfolio_categories;
create policy "portfolio_categories_public_read"
  on public.portfolio_categories for select using (true);

drop policy if exists "portfolio_items_public_read" on public.portfolio_items;
create policy "portfolio_items_public_read"
  on public.portfolio_items for select using (is_public = true);

drop policy if exists "portfolio_media_public_read" on public.portfolio_media;
create policy "portfolio_media_public_read"
  on public.portfolio_media for select using (
    exists (
      select 1 from public.portfolio_items i
      where i.id = portfolio_media.portfolio_item_id and i.is_public = true
    )
  );

drop policy if exists "packages_public_read" on public.packages;
create policy "packages_public_read"
  on public.packages for select using (is_active = true);

drop policy if exists "package_items_public_read" on public.package_items;
create policy "package_items_public_read"
  on public.package_items for select using (
    exists (
      select 1 from public.packages p
      where p.id = package_items.package_id and p.is_active = true
    )
  );
