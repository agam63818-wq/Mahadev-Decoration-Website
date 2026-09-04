-- ════════════════════════════════════════════════════════════════════════════
-- 0009 — Reviews table (public testimonials + admin moderation)
--
-- WHY THIS MIGRATION EXISTS
-- lib/supabase/database.types.ts already declares a `ReviewRow` and registers
-- `reviews` in Database['public']['Tables'], but NO migration in this repo ever
-- created the table. Meanwhile BOTH of these read from a static TypeScript
-- array at runtime:
--   * the public /reviews page and the home "ग्राहकों की राय" section, via
--     services/reviews.ts -> lib/data/reviews.ts
--   * the admin /admin/reviews screen, via its own hardcoded `sampleReviews`
--
-- The admin copy was pure fabrication (invented names, ratings and dates no
-- customer ever wrote) and had to go. Removing it without a real table would
-- leave the admin permanently empty, so this migration gives reviews a real
-- home and migrates the eight genuine testimonials the owner had supplied.
--
-- COLUMN NAMING — DELIBERATE
-- The column names below match the EXISTING hand-maintained ReviewRow type
-- exactly: `date` (not event_date) and `featured` (not is_featured). The brief
-- is explicit that existing Row types are authoritative and must not be
-- re-guessed. If the live database already has this table, every statement
-- below is a no-op except the seed guard, so nothing is overwritten.
--
-- Everything is idempotent — safe to run exactly once, harmless if re-run.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null default '',
  customer_location text,
  event_type text default 'custom',
  rating integer not null default 5,
  review_text text,
  event_photo_url text,
  event_photo_alt text,
  customer_photo_url text,
  customer_photo_alt text,
  -- Date of the event being reviewed. Named `date` to match ReviewRow.
  date date,
  featured boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Defensive column adds, so a partially-shaped existing table lines up with
-- the Row type instead of making PostgREST reject the whole select.
alter table public.reviews add column if not exists customer_name text not null default '';
alter table public.reviews add column if not exists customer_location text;
alter table public.reviews add column if not exists event_type text default 'custom';
alter table public.reviews add column if not exists rating integer not null default 5;
alter table public.reviews add column if not exists review_text text;
alter table public.reviews add column if not exists event_photo_url text;
alter table public.reviews add column if not exists event_photo_alt text;
alter table public.reviews add column if not exists customer_photo_url text;
alter table public.reviews add column if not exists customer_photo_alt text;
alter table public.reviews add column if not exists date date;
alter table public.reviews add column if not exists featured boolean not null default false;
alter table public.reviews add column if not exists approved boolean not null default false;
alter table public.reviews add column if not exists created_at timestamptz not null default now();
alter table public.reviews add column if not exists updated_at timestamptz not null default now();

-- Keep ratings sane at the database level, not just in the form.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reviews_rating_range') then
    alter table public.reviews
      add constraint reviews_rating_range check (rating between 1 and 5);
  end if;
end
$$;

-- ── Indexes (§18: only what the queries actually use) ───────────────────────
-- Public list: approved reviews, newest event first.
create index if not exists reviews_approved_date_idx
  on public.reviews (approved, date desc);
-- Home page featured strip.
create index if not exists reviews_featured_idx
  on public.reviews (featured)
  where featured;
-- Admin moderation queue: newest submission first.
create index if not exists reviews_created_idx
  on public.reviews (created_at desc);

-- ── updated_at trigger (shared helper, same convention as 0005/0006) ───────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists reviews_touch on public.reviews;
create trigger reviews_touch before update on public.reviews
  for each row execute function public.touch_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.reviews enable row level security;

do $$
begin
  -- Public read: only APPROVED reviews are world-readable. Admins additionally
  -- see the pending queue so they can moderate. This means the anon key cannot
  -- read an unapproved review even if application code forgot the filter.
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'reviews' and policyname = 'reviews public read approved') then
    create policy "reviews public read approved" on public.reviews
      for select using (approved = true or public.is_admin());
  end if;

  -- Admin full write (approve / feature / edit / delete).
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'reviews' and policyname = 'reviews admin write') then
    create policy "reviews admin write" on public.reviews
      for all using (public.is_admin()) with check (public.is_admin());
  end if;
end
$$;

-- ── One-time seed: the eight real testimonials from lib/data/reviews.ts ─────
-- Copied verbatim (text, rating, location, date, featured flags). These were
-- supplied by the owner as genuine customer feedback, so this is real content
-- being MIGRATED into the database — not invented filler. `approved` is true
-- because they were already being displayed publicly.
--
-- Guarded by a name+date existence check so a re-run inserts nothing and never
-- overwrites a row the owner has since edited.
insert into public.reviews (
  customer_name, customer_location, event_type, rating, review_text,
  event_photo_url, event_photo_alt, date, featured, approved
)
select
  v.customer_name, v.customer_location, v.event_type, v.rating, v.review_text,
  v.event_photo_url, v.event_photo_alt, v.event_date::date, v.featured, v.approved
from (values
  ('अमन कुमार', 'बेगूसराय', 'wedding', 5,
   'महादेव डेकोरेशन ने हमारी शादी को सपने जैसा बना दिया। मंडप की सजावट इतनी खूबसूरत थी कि सभी मेहमान तारीफ करते रहे। टीम बहुत प्रोफेशनल और समय पर थी। पूरी तरह संतुष्ट हूं!',
   '/assets/flower-arch-hero.png', 'अमन कुमार की शादी — महादेव डेकोरेशन द्वारा',
   '2024-11-15', true, true),
  ('प्रिया कुमारी', 'पटना', 'birthday', 5,
   'मेरी बेटी के बर्थडे के लिए प्रिंसेस थीम डेकोरेशन करवाई। बच्चे बहुत खुश थे! बैलून आर्च और बैकड्रॉप बिल्कुल वैसा ही था जैसा मैंने सोचा था। कीमत भी बहुत उचित थी।',
   null, null, '2024-10-20', true, true),
  ('राहुल सिंह', 'समस्तीपुर', 'haldi', 5,
   'हल्दी सेरेमनी के लिए मैरीगोल्ड डेकोरेशन बहुत शानदार था। पूरा माहौल पारंपरिक और खूबसूरत लग रहा था। फोटोज बहुत अच्छी आईं। अगली बार भी इन्हीं से करवाएंगे।',
   null, null, '2024-09-05', true, true),
  ('सुनीता देवी', 'खगड़िया', 'mehendi', 4,
   'मेहंदी नाइट के लिए बोहो थीम डेकोरेशन बहुत अच्छी थी। फेयरी लाइट्स और लैंटर्न का कॉम्बिनेशन बेहतरीन था। थोड़ी देरी से आए लेकिन काम बहुत अच्छा किया।',
   null, null, '2024-08-12', false, true),
  ('विकास कुमार', 'मुंगेर', 'stage', 5,
   'हमारे सांस्कृतिक कार्यक्रम के लिए स्टेज डेकोरेशन बहुत भव्य था। LED बैकड्रॉप और लाइटिंग ने पूरे माहौल को जीवंत कर दिया। सभी दर्शक प्रभावित हुए।',
   null, null, '2024-07-28', true, true),
  ('नेहा गुप्ता', 'दरभंगा', 'anniversary', 5,
   'हमारी 10वीं सालगिरह के लिए रोमांटिक डेकोरेशन करवाई। रोज़ पेटल और कैंडल का सेटअप बहुत खूबसूरत था। पति बहुत खुश हुए। महादेव डेकोरेशन को धन्यवाद!',
   null, null, '2024-06-14', false, true),
  ('मोहन लाल', 'बेगूसराय', 'car', 5,
   'बेटे की शादी में कार डेकोरेशन बहुत सुंदर थी। सफेद गुलाब और गोल्ड रिबन का कॉम्बिनेशन शाही लग रहा था। कीमत भी बहुत उचित थी।',
   null, null, '2024-05-20', false, true),
  ('काजल सिंह', 'लखीसराय', 'wedding', 5,
   'वेडिंग प्रीमियम पैकेज लिया था। पूरा वेन्यू इतना खूबसूरत सजा था कि लग रहा था किसी फिल्म की शूटिंग हो रही है। डेडिकेटेड मैनेजर ने बहुत अच्छा काम किया।',
   null, null, '2024-04-10', true, true)
) as v(customer_name, customer_location, event_type, rating, review_text,
       event_photo_url, event_photo_alt, event_date, featured, approved)
where not exists (
  select 1 from public.reviews r
  where r.customer_name = v.customer_name
    and r.date = v.event_date::date
);
