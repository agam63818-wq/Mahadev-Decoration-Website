-- ════════════════════════════════════════════════════════════════════════════
-- 0008 — Admin reporting access (payments / customers) + reporting indexes
--
-- WHY THIS MIGRATION EXISTS
-- The original schema (supabase/schema.sql) gave `public.payments` and
-- `public.customers` ONLY "own row" SELECT policies scoped to the signed-in
-- customer:
--
--     create policy "payments own rows"  on public.payments
--       for select using (customer_id in (select id from public.customers
--                                         where profile_id = auth.uid()));
--     create policy "customers own row"  on public.customers
--       for select using (profile_id = auth.uid());
--
-- An admin session therefore reads ZERO rows from those two tables, because an
-- admin's profile has no `customers` row of its own. Migration 0002 already
-- added `bookings admin all` and `booking_requests admin all` but never the
-- equivalent for payments/customers. The result: the admin dashboard and the
-- admin payments screen literally cannot see real money, which is exactly why
-- those screens were shipped with hardcoded sample arrays.
--
-- This migration is ADDITIVE ONLY:
--   * it never drops or weakens the existing customer-facing "own row" policies
--   * it adds admin-only SELECT policies gated on the existing public.is_admin()
--     SECURITY DEFINER helper created in migration 0002
--   * it defensively asserts the payments table/columns so a database that was
--     provisioned from a partial schema still lines up with the app
--   * it adds the indexes the new (real) dashboard / payments / calendar /
--     customers aggregates need, and nothing more
--
-- Everything is idempotent (`if not exists` / pg_policies existence guards), so
-- it can be re-run safely against the live database.
--
-- ── PAYMENT STATUS VOCABULARY (used by the app's aggregates) ────────────────
-- `payments.status` is free-text (Razorpay + manual entry), so the reporting
-- code groups it case-insensitively as follows. Keep this list in sync with
-- lib/admin/payment-status.ts:
--   received  : captured | completed | success | paid | settled
--   pending   : created  | pending   | authorized | attempted
--   failed    : failed   | error
--   refunded  : refunded | refund | reversed
-- Anything unrecognised is counted as "other" and never silently added to the
-- received total (§4: no double counting, no inflating revenue).
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── 1. Defensively assert public.payments ───────────────────────────────────
-- Note: booking_id/customer_id are intentionally created WITHOUT a NOT NULL
-- constraint here. The original schema had `booking_id ... not null`; we do not
-- relax an existing constraint, we only make sure the column exists.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id),
  customer_id uuid references public.customers(id),
  razorpay_order_id text,
  razorpay_payment_id text,
  payment_type text,
  amount numeric(12,2),
  status text not null default 'created',
  created_at timestamptz not null default now()
);

alter table public.payments add column if not exists booking_id uuid;
alter table public.payments add column if not exists customer_id uuid;
alter table public.payments add column if not exists razorpay_order_id text;
alter table public.payments add column if not exists razorpay_payment_id text;
alter table public.payments add column if not exists payment_type text;
alter table public.payments add column if not exists amount numeric(12,2);
alter table public.payments add column if not exists status text not null default 'created';
alter table public.payments add column if not exists created_at timestamptz not null default now();

alter table public.payments enable row level security;

-- ── 2. Reporting indexes ────────────────────────────────────────────────────
-- Only indexes that a query added in this upgrade actually uses (§18).

-- payments: status roll-ups and month-over-month buckets.
create index if not exists payments_status_idx  on public.payments (status);
create index if not exists payments_created_idx on public.payments (created_at desc);
create index if not exists payments_booking_idx on public.payments (booking_id);

-- bookings: dashboard "today / upcoming / confirmed" and the admin calendar,
-- all of which filter on status and order by event_date.
create index if not exists bookings_event_date_idx   on public.bookings (event_date);
create index if not exists bookings_status_date_idx  on public.bookings (status, event_date);
create index if not exists bookings_created_idx      on public.bookings (created_at desc);

-- booking_requests: "pending inquiries" count + newest-first admin list.
create index if not exists booking_requests_status_idx  on public.booking_requests (status);
create index if not exists booking_requests_created_idx on public.booking_requests (created_at desc);
create index if not exists booking_requests_event_date_idx
  on public.booking_requests (event_date);

-- customers: "new customers this month" + newest-first admin list.
create index if not exists customers_created_idx on public.customers (created_at desc);

-- ── 3. Additive admin SELECT policies ───────────────────────────────────────
do $$
begin
  -- Admins may read every payment row (revenue reporting). Customers keep the
  -- pre-existing "payments own rows" policy — RLS policies are OR-ed, so this
  -- widens admin access without touching customer access.
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'payments' and policyname = 'payments admin read') then
    create policy "payments admin read" on public.payments
      for select using (public.is_admin());
  end if;

  -- Payment WRITES stay off the anon/authenticated key entirely: they happen
  -- through the service-role client in Server Actions / webhooks, which bypass
  -- RLS. We deliberately do NOT add an admin write policy here so a leaked
  -- browser session can never fabricate a payment record.

  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'customers' and policyname = 'customers admin read') then
    create policy "customers admin read" on public.customers
      for select using (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'customers' and policyname = 'customers admin write') then
    create policy "customers admin write" on public.customers
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  -- Admins need the customer's name/phone to label rows in the admin UI. The
  -- existing "profiles own row" policy is FOR ALL scoped to id = auth.uid(),
  -- so an admin cannot read any other profile. Add an admin-only read.
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'profiles' and policyname = 'profiles admin read') then
    create policy "profiles admin read" on public.profiles
      for select using (public.is_admin());
  end if;

  -- Quotations: the admin needs the full list for revenue/booking detail.
  if to_regclass('public.quotations') is not null
     and not exists (select 1 from pg_policies where schemaname = 'public'
                     and tablename = 'quotations' and policyname = 'quotations admin read') then
    create policy "quotations admin read" on public.quotations
      for select using (public.is_admin());
  end if;

  -- Booking status history: powers the admin booking timeline.
  if to_regclass('public.booking_status_history') is not null
     and not exists (select 1 from pg_policies where schemaname = 'public'
                     and tablename = 'booking_status_history'
                     and policyname = 'booking_status_history admin read') then
    create policy "booking_status_history admin read" on public.booking_status_history
      for select using (public.is_admin());
  end if;
end
$$;
