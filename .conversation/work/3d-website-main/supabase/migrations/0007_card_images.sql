-- ════════════════════════════════════════════════════════════════════════════
-- 0007 — `card-images` storage bucket for admin-managed card photos
--
-- Why a second bucket instead of reusing `portfolio`?
--   The existing `portfolio` bucket (0002/0003) holds GALLERY media: real event
--   photos attached to portfolio_items/portfolio_media rows, plus the
--   `occasions/` prefix added by 0004. `card-images` is for the *card artwork*
--   of the catalogue tables — services, occasions, packages and team members —
--   so that deleting a gallery item can never take a service card photo with
--   it, and so a future storage cleanup job can reason about one bucket at a
--   time. Existing `portfolio` objects are left exactly where they are; nothing
--   is migrated or deleted here.
--
-- BUCKET NAME (Part 2 must use this exact id): card-images
--   Object path convention:  <entity>/<row-id>/<timestamp>.<ext>
--   e.g.  services/9f1c…/1717171717171.webp
--         team/3ab2…/1717171717171.jpg
--   The path is always SERVER-GENERATED — never a user-supplied filename.
--
-- Visibility: public read (these are marketing images rendered on the public
-- website by next/image), admin-only write. Anonymous users get read only.
--
-- Idempotent: safe to run exactly once, and harmless if re-run.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Bucket ───────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do update set public = true;

-- ── Storage policies ─────────────────────────────────────────────────────────
-- Same shape as the `portfolio` bucket policies in 0002: world-readable
-- objects, writes gated by public.is_admin() (profiles.role in admin/team).
--
-- Anonymous/authenticated customers deliberately get NO insert/update/delete
-- policy — only SELECT. Admin writes performed from Server Actions use the
-- service-role client (which bypasses RLS) *after* getAdminUser() has verified
-- the caller; these policies are the defence-in-depth layer behind that, and
-- the only path available to a normal logged-in admin session.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'card-images public read'
  ) then
    create policy "card-images public read" on storage.objects
      for select using (bucket_id = 'card-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'card-images admin insert'
  ) then
    create policy "card-images admin insert" on storage.objects
      for insert with check (bucket_id = 'card-images' and public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'card-images admin update'
  ) then
    create policy "card-images admin update" on storage.objects
      for update using (bucket_id = 'card-images' and public.is_admin())
      with check (bucket_id = 'card-images' and public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'card-images admin delete'
  ) then
    create policy "card-images admin delete" on storage.objects
      for delete using (bucket_id = 'card-images' and public.is_admin());
  end if;
end
$$;

-- ── Part 2 upload requirements (documented here so they are not forgotten) ──
-- The upload implementation that Part 2 adds MUST:
--   1. verify getAdminUser() before touching storage;
--   2. validate the MIME type against an allow-list (image/jpeg, image/png,
--      image/webp, image/avif) — not just `startsWith('image/')`;
--   3. enforce a maximum file size server-side;
--   4. generate the object path itself (<entity>/<row-id>/<timestamp>.<ext>)
--      and never interpolate the user-provided filename;
--   5. upload with upsert:false so one admin cannot clobber another's object;
--   6. write the resulting path to the row ONLY after a successful upload, and
--      remove the just-uploaded object if that row update fails (no orphans);
--   7. delete the previous object after a successful replace, but only when it
--      is a bucket-relative path (never when it is an external http(s) URL or a
--      site-relative /assets/... path);
--   8. never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
