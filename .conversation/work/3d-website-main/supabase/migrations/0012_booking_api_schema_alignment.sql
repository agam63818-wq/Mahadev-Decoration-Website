-- 0012 — booking API/live-schema reconciliation
-- Additive only. The production database historically used legacy column names
-- while the current admin/API code uses the normalized names below.

alter table public.booking_requests add column if not exists reference_number text;
alter table public.booking_requests add column if not exists budget text;
alter table public.booking_requests add column if not exists style text[] not null default '{}';
alter table public.booking_requests add column if not exists guest_count integer;
alter table public.booking_requests add column if not exists venue_type text;
alter table public.booking_requests add column if not exists setting text;
alter table public.booking_requests add column if not exists requirements text;
alter table public.booking_requests add column if not exists reference_files jsonb not null default '[]'::jsonb;
alter table public.booking_requests add column if not exists contact_name text;
alter table public.booking_requests add column if not exists contact_phone text;
alter table public.booking_requests add column if not exists contact_whatsapp text;
alter table public.booking_requests add column if not exists contact_email text;
alter table public.booking_requests add column if not exists selected_portfolio_media_id uuid references public.portfolio_media(id) on delete set null;
alter table public.booking_requests add column if not exists selected_service_id uuid references public.services(id) on delete set null;
alter table public.booking_requests add column if not exists selected_package_id uuid references public.packages(id) on delete set null;
alter table public.booking_requests add column if not exists selected_service_name_snapshot text;
alter table public.booking_requests add column if not exists selected_package_name_snapshot text;

create unique index if not exists booking_requests_reference_number_key
  on public.booking_requests(reference_number)
  where reference_number is not null;
create index if not exists booking_requests_created_at_idx
  on public.booking_requests(created_at desc);
create index if not exists booking_requests_status_created_idx
  on public.booking_requests(status, created_at desc);
create index if not exists booking_requests_event_date_idx
  on public.booking_requests(event_date);

-- Backfill only rows that predate the normalized columns. Existing data is not deleted.
update public.booking_requests
set reference_number = 'MD-' || to_char(created_at, 'YYYY') || '-' || upper(substr(replace(id::text, '-', ''), 1, 8))
where reference_number is null;

update public.booking_requests
set budget = budget_range
where budget is null and budget_range is not null;

update public.booking_requests
set style = decoration_styles
where cardinality(style) = 0 and decoration_styles is not null;

update public.booking_requests
set contact_name = customer_name,
    contact_phone = phone,
    contact_whatsapp = whatsapp,
    contact_email = email
where contact_name is null or contact_phone is null;

update public.booking_requests
set requirements = coalesce(special_requirements, additional_notes, ''),
    reference_files = to_jsonb(reference_images),
    setting = case when is_indoor is true then 'Indoor' when is_indoor is false then 'Outdoor' else null end
where requirements is null or reference_files = '[]'::jsonb or setting is null;
