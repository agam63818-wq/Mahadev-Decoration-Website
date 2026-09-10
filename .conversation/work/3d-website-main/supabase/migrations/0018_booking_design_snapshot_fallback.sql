-- Preserve the selected gallery design even when an older/public booking link
-- supplies only portfolioItemId. This is additive and does not touch payment.

create or replace function public.capture_booking_design_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_media public.portfolio_media%rowtype;
begin
  if new.selected_portfolio_media_id is null and new.source_portfolio_item_id is not null then
    select * into v_media
    from public.portfolio_media
    where portfolio_item_id = new.source_portfolio_item_id
      and coalesce(is_bookable, true) = true
    order by sort_order asc nulls last, created_at asc
    limit 1;

    if v_media.id is not null then
      new.selected_portfolio_media_id := v_media.id;
      new.selected_variant_label_snapshot := coalesce(new.selected_variant_label_snapshot, v_media.variant_label);
      new.selected_price_snapshot := coalesce(new.selected_price_snapshot, v_media.price);
      new.selected_image_url_snapshot := coalesce(new.selected_image_url_snapshot, v_media.url);
      if new.selected_item_title_snapshot is null then
        select title into new.selected_item_title_snapshot
        from public.portfolio_items
        where id = new.source_portfolio_item_id;
      end if;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.capture_booking_design_snapshot() from public;
drop trigger if exists booking_requests_capture_design_snapshot on public.booking_requests;
create trigger booking_requests_capture_design_snapshot
before insert or update of source_portfolio_item_id, selected_portfolio_media_id,
  selected_variant_label_snapshot, selected_price_snapshot,
  selected_image_url_snapshot, selected_item_title_snapshot
on public.booking_requests
for each row execute function public.capture_booking_design_snapshot();

with chosen as (
  select br.id as request_id, pm.id as media_id, pm.variant_label, pm.price, pm.url,
         pi.title as item_title
  from public.booking_requests br
  join lateral (
    select pm0.*
    from public.portfolio_media pm0
    where pm0.portfolio_item_id = br.source_portfolio_item_id
      and coalesce(pm0.is_bookable, true) = true
    order by pm0.sort_order asc nulls last, pm0.created_at asc
    limit 1
  ) pm on true
  left join public.portfolio_items pi on pi.id = br.source_portfolio_item_id
  where br.selected_portfolio_media_id is null
    and br.source_portfolio_item_id is not null
)
update public.booking_requests br
set selected_portfolio_media_id = c.media_id,
    selected_variant_label_snapshot = coalesce(br.selected_variant_label_snapshot, c.variant_label),
    selected_price_snapshot = coalesce(br.selected_price_snapshot, c.price),
    selected_image_url_snapshot = coalesce(br.selected_image_url_snapshot, c.url),
    selected_item_title_snapshot = coalesce(br.selected_item_title_snapshot, c.item_title)
from chosen c
where br.id = c.request_id;

update public.bookings b
set selected_portfolio_media_id = coalesce(b.selected_portfolio_media_id, br.selected_portfolio_media_id),
    selected_price_snapshot = coalesce(b.selected_price_snapshot, br.selected_price_snapshot),
    selected_image_url_snapshot = coalesce(b.selected_image_url_snapshot, br.selected_image_url_snapshot),
    selected_service_id = coalesce(b.selected_service_id, br.selected_service_id),
    selected_package_id = coalesce(b.selected_package_id, br.selected_package_id),
    selected_service_name_snapshot = coalesce(b.selected_service_name_snapshot, br.selected_service_name_snapshot),
    selected_package_name_snapshot = coalesce(b.selected_package_name_snapshot, br.selected_package_name_snapshot)
from public.booking_requests br
where b.booking_request_id = br.id
  and (
    (b.selected_portfolio_media_id is null and br.selected_portfolio_media_id is not null) or
    (b.selected_price_snapshot is null and br.selected_price_snapshot is not null) or
    (b.selected_image_url_snapshot is null and br.selected_image_url_snapshot is not null)
  );