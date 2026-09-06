-- 0013 — preserve legacy booking field compatibility
-- Additive/backfill only. Keep old column values intact while the application
-- standardizes on the normalized booking fields.

update public.booking_requests
set customer_name = coalesce(customer_name, contact_name),
    phone = coalesce(phone, contact_phone),
    whatsapp = coalesce(whatsapp, contact_whatsapp),
    email = coalesce(email, contact_email),
    budget_range = coalesce(budget_range, budget),
    decoration_styles = case when cardinality(decoration_styles) = 0 then style else decoration_styles end,
    special_requirements = coalesce(special_requirements, requirements),
    reference_images = case
      when cardinality(reference_images) = 0
        then array(select jsonb_array_elements_text(coalesce(reference_files, '[]'::jsonb)))
      else reference_images
    end,
    is_indoor = coalesce(is_indoor, setting = 'Indoor')
where contact_name is not null
   or contact_phone is not null
   or budget is not null
   or cardinality(style) > 0
   or requirements is not null;

update public.booking_requests
set contact_name = coalesce(contact_name, customer_name),
    contact_phone = coalesce(contact_phone, phone),
    contact_whatsapp = coalesce(contact_whatsapp, whatsapp),
    contact_email = coalesce(contact_email, email),
    budget = coalesce(budget, budget_range),
    style = case when cardinality(style) = 0 then decoration_styles else style end,
    requirements = coalesce(requirements, special_requirements, additional_notes),
    reference_files = case when reference_files = '[]'::jsonb then to_jsonb(reference_images) else reference_files end
where contact_name is null
   or contact_phone is null
   or budget is null
   or cardinality(style) = 0
   or requirements is null;
