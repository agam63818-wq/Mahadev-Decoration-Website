-- ════════════════════════════════════════════════════════════════════════════
-- 0010 — package card artwork + explicit display order
--
-- WHY THIS MIGRATION EXISTS
-- PART 2 §12 requires the packages grid to support the same card editing as
-- services and occasions: a photo, and an owner-controlled position in the
-- grid. `public.packages` (created in 0003) has neither column:
--
--   * there is no image_url, so /admin/packages could only ever show a
--     gradient placeholder and the owner had no way to put a real photo on a
--     package card, and
--   * there is no sort_order, so the public /packages page fell back to
--     ordering by created_at — meaning the only way to move a package up the
--     page was to delete it and re-create it.
--
-- Both are genuine schema gaps, not cosmetic ones, so this is the single new
-- migration PART 2 introduces. It is purely ADDITIVE: no column is dropped,
-- renamed or retyped, and no existing migration is edited (0003 stays exactly
-- as it was shipped).
--
-- image_url follows the same convention as services.image_url (0005):
--   a bucket-relative object path in the `card-images` bucket (0007),
--   e.g. `packages/<row-id>/<timestamp>-<rand>.webp`,
--   or a `/assets/...` site path, or an absolute URL. Resolve for rendering
--   with cardImagePublicUrl(). No new bucket is created here — §3 forbids it.
--
-- Idempotent: every statement is `if not exists` / `or replace`, so running it
-- twice is harmless.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Columns ──────────────────────────────────────────────────────────────────
alter table public.packages add column if not exists image_url text;
alter table public.packages add column if not exists image_alt text;

-- Default 0 rather than NULL so ordering never has to special-case nulls, and
-- so pre-existing rows all start on the same rung and keep their relative
-- created_at order until the owner reorders them (see backfill below).
alter table public.packages add column if not exists sort_order integer not null default 0;

-- ── Backfill sort_order from the previous implicit ordering ──────────────────
-- Before this migration the public page ordered by created_at. Assigning
-- sort_order in that same sequence means the live site looks IDENTICAL the
-- moment this runs — the owner sees no surprise reshuffle, and can then move
-- cards deliberately with the ↑ ↓ controls.
--
-- Guarded by the all-zeros check so a re-run cannot clobber an order the owner
-- has already set.
do $$
begin
  if not exists (select 1 from public.packages where sort_order <> 0) then
    with ranked as (
      select id, (row_number() over (order by created_at asc, id asc))::int - 1 as position
      from public.packages
    )
    update public.packages p
      set sort_order = ranked.position
      from ranked
      where p.id = ranked.id;
  end if;
end $$;

-- ── Index ────────────────────────────────────────────────────────────────────
-- The public /packages query is `where is_active order by sort_order`, so the
-- composite index covers it end to end.
create index if not exists packages_active_sort_idx
  on public.packages (is_active, sort_order);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- public.packages already has RLS enabled with the standard pair of policies
-- from 0003. Adding a column does NOT change policy coverage — policies apply
-- to rows, not columns — so no policy needs editing. They are re-asserted here
-- with the canonical `public.is_admin()` shape so that a database which was
-- created before that helper existed ends up consistent with 0005/0007, and so
-- that this file is self-contained if it is ever replayed onto a fresh project.
alter table public.packages enable row level security;

drop policy if exists "packages_public_read" on public.packages;
create policy "packages_public_read"
  on public.packages for select
  using (is_active = true or public.is_admin());

drop policy if exists "packages_admin_write" on public.packages;
create policy "packages_admin_write"
  on public.packages for all
  using (public.is_admin())
  with check (public.is_admin());

-- package_items inherits its lifetime from packages via
--   package_id uuid not null references public.packages(id) on delete cascade
-- declared in 0003, so deleting a package can never leave orphan bullet rows
-- (§8). Nothing to change here — this comment records that it was verified.
