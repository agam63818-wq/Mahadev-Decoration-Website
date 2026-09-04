-- ════════════════════════════════════════════════════════════════════════════
-- 0005 — services table (public /services page + future admin card editor)
--
-- Until now the twelve service cards on /services came only from the static
-- array in lib/data/services.ts, so the owner could not edit a name, price,
-- description or photo without a code change. This migration gives them a real
-- table, seeded ONCE with exactly the twelve services the site currently shows
-- (same slugs / names / prices / images), so nothing changes visually the
-- moment it is applied.
--
-- Conventions copied from 0004_occasions_and_content_import.sql (the closest
-- existing table) and 0002 (RLS + touch_updated_at trigger):
--   * uuid primary key default gen_random_uuid()
--   * every column NOT NULL with a safe default, added defensively with
--     `add column if not exists` so a re-run is a no-op
--   * public.is_admin() is the authorization boundary for writes
--   * public.touch_updated_at() keeps updated_at correct on UPDATE
--
-- Idempotent: safe to run exactly once, and harmless if re-run.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null default '',
  name text not null default '',
  name_en text not null default '',
  description text not null default '',
  description_en text,
  icon text,
  event_type text not null default 'custom',
  starting_price integer not null default 0,
  image_url text,
  image_alt text,
  is_featured boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.services add column if not exists slug text not null default '';
alter table public.services add column if not exists name text not null default '';
alter table public.services add column if not exists name_en text not null default '';
alter table public.services add column if not exists description text not null default '';
alter table public.services add column if not exists description_en text;
alter table public.services add column if not exists icon text;
alter table public.services add column if not exists event_type text not null default 'custom';
alter table public.services add column if not exists starting_price integer not null default 0;
alter table public.services add column if not exists image_url text;
alter table public.services add column if not exists image_alt text;
alter table public.services add column if not exists is_featured boolean not null default true;
alter table public.services add column if not exists is_active boolean not null default true;
alter table public.services add column if not exists sort_order integer not null default 0;
alter table public.services add column if not exists created_at timestamptz not null default now();
alter table public.services add column if not exists updated_at timestamptz not null default now();

-- ── Indexes ──────────────────────────────────────────────────────────────────
-- Only what the real query patterns need: slug lookup (service detail /
-- booking prefill), active+ordered listing, featured listing.
create unique index if not exists services_slug_key on public.services (slug);
create index if not exists services_active_sort_idx on public.services (is_active, sort_order);
create index if not exists services_featured_idx on public.services (is_featured) where is_featured;

-- ── updated_at trigger (same helper as portfolio_items / business_settings) ──
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists services_touch on public.services;
create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Public (anon + authenticated customers): read ACTIVE services only.
-- Admin / team (public.is_admin()): full read + write.
-- Admin writes from Server Actions additionally go through the service-role
-- client, which bypasses RLS, but only after getAdminUser() has verified the
-- caller — these policies are the defence-in-depth layer behind that.
alter table public.services enable row level security;

drop policy if exists "services_public_read" on public.services;
create policy "services_public_read"
  on public.services for select
  using (is_active = true or public.is_admin());

drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write"
  on public.services for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── One-time seed: the twelve services the public site shows today ──────────
-- Mirrors lib/data/services.ts exactly (slug, Hindi + English name,
-- descriptions, Lucide icon, event type, starting price, image path, order,
-- featured flag). image_url keeps the existing /assets/... site-relative path
-- so the public page does not visually break; the owner can replace each one
-- with an uploaded photo later (bucket: card-images, see 0007).
--
-- `on conflict (slug) do nothing` ⇒ re-running never overwrites owner edits.
insert into public.services
  (slug, name, name_en, description, description_en, icon, event_type,
   starting_price, image_url, image_alt, is_featured, is_active, sort_order)
values
  ('wedding-decoration', 'वेडिंग डेकोरेशन', 'Wedding Decoration',
   'आपकी शादी को एक सपने जैसा बनाएं — शाही मंडप, फूलों की सजावट, और रोशनी का जादू।',
   'Make your wedding a dream come true with royal mandap, floral decoration, and magical lighting.',
   'Heart', 'wedding', 15000, '/assets/flower-arch-hero.png',
   'बेगूसराय में शानदार वेडिंग डेकोरेशन — महादेव डेकोरेशन', true, true, 1),

  ('stage-decoration', 'स्टेज डेकोरेशन', 'Stage Decoration',
   'हर प्रोग्राम के लिए भव्य स्टेज सजावट — LED बैकड्रॉप, फूल, और लाइटिंग।',
   'Grand stage decoration for every program — LED backdrop, flowers, and lighting.',
   'Star', 'stage', 5000, '/assets/stage.png',
   'बेगूसराय में स्टेज डेकोरेशन — महादेव डेकोरेशन', true, true, 2),

  ('birthday-decoration', 'बर्थडे डेकोरेशन', 'Birthday Decoration',
   'जन्मदिन को खास बनाएं — बैलून, थीम डेकोर, और सरप्राइज सेटअप।',
   'Make birthdays special with balloons, themed decor, and surprise setups.',
   'Cake', 'birthday', 2000, '/assets/birthday.png',
   'बेगूसराय में बर्थडे डेकोरेशन — महादेव डेकोरेशन', true, true, 3),

  ('anniversary-decoration', 'एनिवर्सरी डेकोरेशन', 'Anniversary Decoration',
   'सालगिरह को रोमांटिक और यादगार बनाएं — रोज़ पेटल, कैंडल, और लव थीम।',
   'Make anniversaries romantic and memorable with rose petals, candles, and love themes.',
   'HeartHandshake', 'anniversary', 3000, '/assets/anniversary.png',
   'बेगूसराय में एनिवर्सरी डेकोरेशन — महादेव डेकोरेशन', false, true, 4),

  ('haldi-decoration', 'हल्दी डेकोरेशन', 'Haldi Decoration',
   'हल्दी सेरेमनी को रंगीन और पारंपरिक बनाएं — मैरीगोल्ड, पीले फूल, और देसी थीम।',
   'Make haldi ceremony colorful and traditional with marigolds, yellow flowers, and desi themes.',
   'Sun', 'haldi', 4000, '/assets/haldi.png',
   'बेगूसराय में हल्दी डेकोरेशन — महादेव डेकोरेशन', true, true, 5),

  ('mehendi-decoration', 'मेहंदी डेकोरेशन', 'Mehendi Decoration',
   'मेहंदी नाइट को खूबसूरत बनाएं — बोहो थीम, फूल, और रंगीन सजावट।',
   'Make mehendi night beautiful with boho themes, flowers, and colorful decoration.',
   'Flower2', 'mehendi', 4000, '/assets/mehendi.png',
   'बेगूसराय में मेहंदी डेकोरेशन — महादेव डेकोरेशन', true, true, 6),

  ('car-decoration', 'कार डेकोरेशन', 'Car Decoration',
   'दूल्हे की गाड़ी को शाही अंदाज में सजाएं — फूल, रिबन, और LED लाइट्स।',
   'Decorate the groom''s car royally with flowers, ribbons, and LED lights.',
   'Car', 'car', 1500, '/assets/car-decoration-hero.png',
   'बेगूसराय में कार डेकोरेशन — महादेव डेकोरेशन', true, true, 7),

  ('mandap-decoration', 'मंडप डेकोरेशन', 'Mandap Decoration',
   'पवित्र मंडप को भव्य और सुंदर बनाएं — फूल, कपड़े, और पारंपरिक सजावट।',
   'Make the sacred mandap grand and beautiful with flowers, fabric, and traditional decoration.',
   'Building2', 'mandap', 8000, '/assets/flower-arch-hero.png',
   'बेगूसराय में मंडप डेकोरेशन — महादेव डेकोरेशन', false, true, 8),

  ('home-decoration', 'होम डेकोरेशन', 'Home Decoration',
   'घर को त्योहार और खास मौकों के लिए सजाएं — दीप, फूल, और रंगोली।',
   'Decorate home for festivals and special occasions with lamps, flowers, and rangoli.',
   'Home', 'home', 2500, '/assets/anniversary.png',
   'बेगूसराय में होम डेकोरेशन — महादेव डेकोरेशन', false, true, 9),

  ('flower-decoration', 'फ्लावर डेकोरेशन', 'Flower Decoration',
   'ताजे फूलों से हर जगह को महका दें — गुलाब, गेंदा, और विदेशी फूलों की सजावट।',
   'Fragrance every space with fresh flowers — roses, marigolds, and exotic floral arrangements.',
   'Flower', 'flower', 3000, '/assets/flower-arch-hero.png',
   'बेगूसराय में फ्लावर डेकोरेशन — महादेव डेकोरेशन', false, true, 10),

  ('lighting-decoration', 'लाइटिंग डेकोरेशन', 'Lighting Decoration',
   'LED, फेयरी लाइट्स, और नियॉन से हर जगह को रोशन करें।',
   'Illuminate every space with LED, fairy lights, and neon lighting.',
   'Lightbulb', 'lighting', 2000, '/assets/stage.png',
   'बेगूसराय में लाइटिंग डेकोरेशन — महादेव डेकोरेशन', false, true, 11),

  ('custom-decoration', 'कस्टम इवेंट', 'Custom Event',
   'कोई भी खास मौका — हम आपकी सोच को हकीकत में बदलते हैं।',
   'Any special occasion — we turn your vision into reality.',
   'Wand2', 'custom', 5000, '/assets/birthday1.png',
   'बेगूसराय में कस्टम इवेंट डेकोरेशन — महादेव डेकोरेशन', false, true, 12)
on conflict (slug) do nothing;
