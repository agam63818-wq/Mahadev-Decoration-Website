-- ════════════════════════════════════════════════════════════════════════════
-- 0011 — historical booking snapshots + admin notifications
--
-- WHY THIS MIGRATION EXISTS
--
-- (1) SNAPSHOTS (PART 3 §3–§6). `booking_requests` stores only
--     `selected_portfolio_media_id` (added in 0002). Every price, label and
--     photo the admin console shows for a past booking is therefore resolved
--     by JOINing to the CURRENT `portfolio_media` row:
--
--         booking_requests.selected_portfolio_media_id
--            -> portfolio_media.price        <-- today's price, not the booked one
--
--     That makes booking history mutable by a catalog edit. The moment the
--     owner re-prices a look in /admin/portfolio, every historical booking of
--     that look silently changes to the new price — and if the photo is
--     replaced or deleted, the old booking's image changes or disappears
--     (the FK is `on delete set null`, so the whole look reference vanishes).
--
--     The booking API already accepted `selectedVariantLabel` and
--     `selectedPrice` from the client and then threw them away — they were
--     validated and never written to any column, because no column existed.
--
--     Fix: four additive snapshot columns, written once at creation time from
--     values the SERVER reads out of the database (never from the client
--     payload — a browser must not be able to declare its own price).
--
-- (2) NOTIFICATIONS (§7–§13). There is no notifications table anywhere in the
--     project; `profiles.notification_preferences` is an unrelated jsonb
--     column. This creates the table, its RLS, its indexes, and — critically —
--     the UNIQUE constraint that makes notification creation idempotent (§8)
--     so a retried or double-submitted booking cannot produce two bells.
--
-- Purely ADDITIVE. No column is dropped, renamed or retyped; no existing
-- migration is edited. Every statement is `if not exists` / `or replace`, so
-- running this twice is harmless.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Booking snapshot columns ──────────────────────────────────────────────
-- Nullable by design: bookings created BEFORE this migration genuinely have no
-- recorded historical price, and inventing one would be fabricated data. The
-- admin UI falls back to the live catalog value for those old rows and labels
-- it honestly (see services/bookings.ts `priceIsHistorical`).

alter table public.booking_requests
  add column if not exists selected_variant_label_snapshot text;

-- numeric(12,2) matches bookings.total_price / payments.amount so money never
-- changes precision as it moves between tables.
alter table public.booking_requests
  add column if not exists selected_price_snapshot numeric(12,2);

-- The storage object path (or absolute URL) as it was at booking time.
-- §6: this is what the admin console renders, so replacing the catalog photo
-- later cannot alter what the owner sees for an old booking.
alter table public.booking_requests
  add column if not exists selected_image_url_snapshot text;

-- Denormalised on purpose: the design title is part of the historical record.
alter table public.booking_requests
  add column if not exists selected_item_title_snapshot text;

comment on column public.booking_requests.selected_price_snapshot is
  'Price of the chosen look AT BOOKING TIME, read server-side from portfolio_media. Never recompute from the current catalog.';

-- ── 2. Notifications ─────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  -- Free text rather than an enum: adding a new notification kind should not
  -- require an enum migration (ALTER TYPE cannot run inside a transaction in
  -- some Postgres versions, which makes enums awkward for this).
  type text not null default 'booking_request',
  -- The project's inbound customer record is booking_requests, and the admin
  -- route /admin/bookings lists exactly that table, so this is the only link
  -- column needed. §7 explicitly warns against adding both booking_request_id
  -- and booking_id unless the domain truly requires both — it does not.
  --
  -- `on delete cascade`: if the owner deletes a booking request, its
  -- notification must not survive as an undeletable dead link.
  booking_request_id uuid references public.booking_requests(id) on delete cascade,
  title text not null default '',
  message text not null default '',
  -- Snapshot again, for the same reason as the booking: the bell must keep
  -- showing what was true when the booking arrived.
  image_url_snapshot text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Defensive column adds so a database that already has a partial
-- `notifications` table converges to this shape (same style as 0006).
alter table public.notifications add column if not exists type text not null default 'booking_request';
alter table public.notifications add column if not exists title text not null default '';
alter table public.notifications add column if not exists message text not null default '';
alter table public.notifications add column if not exists image_url_snapshot text;
alter table public.notifications add column if not exists is_read boolean not null default false;
alter table public.notifications add column if not exists read_at timestamptz;

-- ── 3. Idempotency (§8, §23) ─────────────────────────────────────────────────
-- THE important constraint. A "check then insert" in application code is
-- race-prone: two concurrent submits both read "no notification yet" and both
-- insert. A UNIQUE index makes the database the arbiter — the second insert
-- fails with 23505, which the API treats as success (the notification already
-- exists, which is precisely the desired end state).
--
-- One notification per (booking request, type). Partial, so the rows with a
-- null booking_request_id (future non-booking notification kinds) are exempt.
create unique index if not exists notifications_booking_request_type_key
  on public.notifications (booking_request_id, type)
  where booking_request_id is not null;

-- ── 4. Indexes for the actual access patterns (§23) ──────────────────────────
-- The panel query is `order by created_at desc limit 20`.
create index if not exists notifications_created_at_idx
  on public.notifications (created_at desc);

-- The badge query is `count(*) where is_read = false`. A partial index keeps
-- it proportional to the UNREAD count, not the whole table, so the badge stays
-- fast after thousands of bookings.
create index if not exists notifications_unread_idx
  on public.notifications (created_at desc)
  where is_read = false;

-- ── 5. RLS (§13) ─────────────────────────────────────────────────────────────
-- Notifications are pure business data: they contain the customer's name and
-- the booked price. There is deliberately NO public/anonymous SELECT policy.
alter table public.notifications enable row level security;

-- Read: admin/team only, via the same public.is_admin() boundary used by
-- services (0005), card images (0007) and team members (0006).
drop policy if exists "notifications_admin_read" on public.notifications;
create policy "notifications_admin_read"
  on public.notifications for select
  using (public.is_admin());

-- Write (mark-as-read, delete): admin/team only.
drop policy if exists "notifications_admin_write" on public.notifications;
create policy "notifications_admin_write"
  on public.notifications for all
  using (public.is_admin())
  with check (public.is_admin());
--
-- NOTE ON INSERTS: the public booking form is anonymous, so it cannot satisfy
-- is_admin(). Notification rows are therefore inserted by the existing
-- /api/booking-requests route handler using SUPABASE_SERVICE_ROLE_KEY, which
-- bypasses RLS and runs ONLY on the server — the same mechanism that already
-- inserts the booking request itself. No anonymous INSERT policy is added,
-- because that would let anyone forge admin notifications.

-- ── 6. Realtime (§12) ────────────────────────────────────────────────────────
-- Deliberately NOT enabled. The admin console is server-rendered with
-- `force-dynamic` and the bell re-fetches on open and on navigation, which
-- covers the owner's actual usage (he checks the panel; he does not leave it
-- open on a wall display). §12 says not to introduce realtime complexity
-- without need, so this is left out rather than half-built. Adding it later is
-- a one-line publication change plus a subscription — no schema change:
--   alter publication supabase_realtime add table public.notifications;
