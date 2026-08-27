-- ════════════════════════════════════════════════════════════════════════════
-- Mahadev Decoration — Gallery pricing, admin control & business settings
--
-- Idempotent. Safe to re-run in the Supabase SQL editor.
--
-- The prompt states these columns/tables ALREADY EXIST in the live project.
-- This file is therefore written defensively with `if not exists` /
-- `add column if not exists` everywhere so that running it against the live
-- database is a no-op for anything already present, and only fills in gaps.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── portfolio_items ─────────────────────────────────────────────────────────
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null default '',
  category_id text,
  event_type text not null default 'custom',
  location text not null default '',
  price_range text not null default '',
  description text not null default '',
  services_included text[] not null default '{}',
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  is_public boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tolerate either naming convention that may already be live (featured vs is_featured).
alter table public.portfolio_items add column if not exists slug text;
alter table public.portfolio_items add column if not exists category_id text;
alter table public.portfolio_items add column if not exists services_included text[] not null default '{}';
alter table public.portfolio_items add column if not exists tags text[] not null default '{}';
alter table public.portfolio_items add column if not exists is_featured boolean not null default false;
alter table public.portfolio_items add column if not exists is_public boolean not null default true;
alter table public.portfolio_items add column if not exists seo_title text;
alter table public.portfolio_items add column if not exists seo_description text;
alter table public.portfolio_items add column if not exists updated_at timestamptz not null default now();

-- ── portfolio_media (per-image pricing lives here) ──────────────────────────
create table if not exists public.portfolio_media (
  id uuid primary key default gen_random_uuid(),
  portfolio_item_id uuid not null references public.portfolio_items(id) on delete cascade,
  media_type text not null default 'image',
  url text not null,
  alt_text text not null default '',
  is_before_after boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- The three pricing columns this feature depends on.
alter table public.portfolio_media add column if not exists variant_label text;
alter table public.portfolio_media add column if not exists price numeric(12, 2);
alter table public.portfolio_media add column if not exists is_bookable boolean not null default true;

-- Cover image used on the public gallery card.
alter table public.portfolio_media add column if not exists is_cover boolean not null default false;
alter table public.portfolio_media add column if not exists media_type text not null default 'image';
alter table public.portfolio_media add column if not exists alt_text text not null default '';
alter table public.portfolio_media add column if not exists is_before_after boolean not null default false;
alter table public.portfolio_media add column if not exists sort_order int not null default 0;

create index if not exists portfolio_media_item_idx on public.portfolio_media (portfolio_item_id);
create index if not exists portfolio_media_sort_idx on public.portfolio_media (portfolio_item_id, sort_order);
create index if not exists portfolio_media_price_idx on public.portfolio_media (price);

-- Exactly one cover per portfolio item.
create unique index if not exists portfolio_media_one_cover_per_item
  on public.portfolio_media (portfolio_item_id)
  where is_cover;

-- ── booking_requests / bookings: which exact design was picked ──────────────
alter table if exists public.booking_requests
  add column if not exists selected_portfolio_media_id uuid references public.portfolio_media(id) on delete set null;

alter table if exists public.bookings
  add column if not exists selected_portfolio_media_id uuid references public.portfolio_media(id) on delete set null;

create index if not exists booking_requests_selected_media_idx
  on public.booking_requests (selected_portfolio_media_id);
create index if not exists bookings_selected_media_idx
  on public.bookings (selected_portfolio_media_id);

-- ── business_settings (singleton) ───────────────────────────────────────────
create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  phone text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  address text not null default '',
  city text not null default '',
  state text not null default '',
  pincode text not null default '',
  business_hours jsonb not null default '[]'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  map_embed_url text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.business_settings add column if not exists business_hours jsonb not null default '[]'::jsonb;
alter table public.business_settings add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.business_settings add column if not exists map_embed_url text not null default '';
alter table public.business_settings add column if not exists updated_at timestamptz not null default now();

-- Seed the singleton row EMPTY. Per the brief: never ship a fake-looking
-- placeholder address or phone number — the admin fills these in, and an
-- admin-only reminder banner shows until they do.
insert into public.business_settings (phone, whatsapp, address)
select '', '', ''
where not exists (select 1 from public.business_settings);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.portfolio_items   enable row level security;
alter table public.portfolio_media   enable row level security;
alter table public.business_settings enable row level security;

-- Helper: is the current user an admin (or team member)?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'team')
  );
$$;

do $$
begin
  -- Public read: only items flagged public.
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'portfolio_items' and policyname = 'portfolio_items public read') then
    create policy "portfolio_items public read" on public.portfolio_items
      for select using (is_public or public.is_admin());
  end if;

  -- Admin full write.
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'portfolio_items' and policyname = 'portfolio_items admin write') then
    create policy "portfolio_items admin write" on public.portfolio_items
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  -- Media follows its parent item's visibility.
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'portfolio_media' and policyname = 'portfolio_media public read') then
    create policy "portfolio_media public read" on public.portfolio_media
      for select using (
        public.is_admin()
        or exists (
          select 1 from public.portfolio_items i
          where i.id = portfolio_media.portfolio_item_id and i.is_public
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'portfolio_media' and policyname = 'portfolio_media admin write') then
    create policy "portfolio_media admin write" on public.portfolio_media
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  -- Business settings: world-readable (phone/address are public info), admin-writable.
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'business_settings' and policyname = 'business_settings public read') then
    create policy "business_settings public read" on public.business_settings
      for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'business_settings' and policyname = 'business_settings admin write') then
    create policy "business_settings admin write" on public.business_settings
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  -- Admins can read every booking request / booking (customers keep their
  -- existing own-rows policies from the Part 2 schema).
  if to_regclass('public.booking_requests') is not null
     and not exists (select 1 from pg_policies where schemaname = 'public'
                     and tablename = 'booking_requests' and policyname = 'booking_requests admin all') then
    create policy "booking_requests admin all" on public.booking_requests
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if to_regclass('public.bookings') is not null
     and not exists (select 1 from pg_policies where schemaname = 'public'
                     and tablename = 'bookings' and policyname = 'bookings admin all') then
    create policy "bookings admin all" on public.bookings
      for all using (public.is_admin()) with check (public.is_admin());
  end if;
end
$$;

-- ── Storage bucket for portfolio marketing images ───────────────────────────
-- Public-read because these are marketing photos shown on the public gallery.
insert into storage.buckets (id, name, public)
select 'portfolio', 'portfolio', true
where not exists (select 1 from storage.buckets where id = 'portfolio');

update storage.buckets set public = true where id = 'portfolio';

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage'
                 and tablename = 'objects' and policyname = 'portfolio bucket public read') then
    create policy "portfolio bucket public read" on storage.objects
      for select using (bucket_id = 'portfolio');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage'
                 and tablename = 'objects' and policyname = 'portfolio bucket admin write') then
    create policy "portfolio bucket admin write" on storage.objects
      for all using (bucket_id = 'portfolio' and public.is_admin())
      with check (bucket_id = 'portfolio' and public.is_admin());
  end if;
end
$$;

-- ── updated_at touch triggers ───────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists portfolio_items_touch on public.portfolio_items;
create trigger portfolio_items_touch before update on public.portfolio_items
  for each row execute function public.touch_updated_at();

drop trigger if exists business_settings_touch on public.business_settings;
create trigger business_settings_touch before update on public.business_settings
  for each row execute function public.touch_updated_at();
