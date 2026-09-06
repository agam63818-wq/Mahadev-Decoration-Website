import { getSupabaseReadClient } from '@/lib/supabase/server'
import { portfolioPublicUrl } from '@/lib/supabase/config'
import type { BookingRequestRow } from '@/lib/supabase/database.types'

export interface SelectedLook {
  mediaId: string | null
  url: string
  alt: string
  variantLabel: string | null
  price: number | null
  portfolioItemId: string | null
  portfolioItemTitle: string | null
  portfolioItemSlug: string | null
  priceIsHistorical: boolean
  catalogRowMissing: boolean
}

export interface AdminBookingRequest {
  id: string
  reference: string
  status: string
  eventType: string
  eventDate: string
  location: string
  venueName: string
  budget: string
  guestCount: number | null
  venueType: string
  setting: string
  style: string[]
  requirements: string
  contactName: string
  contactPhone: string
  contactWhatsapp: string
  contactEmail: string | null
  createdAt: string
  selectedLook: SelectedLook | null
}

const REQUEST_COLUMNS = ['id','reference_number','selected_variant_label_snapshot','selected_price_snapshot','selected_image_url_snapshot','selected_item_title_snapshot','status','event_type','event_date','city','area','address','venue_name','budget','custom_budget','style','guest_count','venue_type','setting','requirements','contact_name','contact_phone','contact_whatsapp','contact_email','selected_portfolio_media_id','created_at'].join(', ')

type MediaJoin = { id:string; url:string|null; alt_text:string|null; variant_label:string|null; price:number|null; portfolio_item_id:string|null; portfolio_items:{id:string;title:string|null}|null }

function mapSelectedLook(row:Pick<BookingRequestRow,'selected_portfolio_media_id'|'selected_variant_label_snapshot'|'selected_price_snapshot'|'selected_image_url_snapshot'|'selected_item_title_snapshot'>,media:MediaJoin|null):SelectedLook|null{
  const snapshotPrice=row.selected_price_snapshot==null?null:Number(row.selected_price_snapshot)
  const hasSnapshot=(snapshotPrice!=null&&Number.isFinite(snapshotPrice))||Boolean(row.selected_image_url_snapshot)||Boolean(row.selected_variant_label_snapshot)||Boolean(row.selected_item_title_snapshot)
  if(!media&&!hasSnapshot)return null
  const livePrice=media?.price!=null&&Number.isFinite(Number(media.price))?Number(media.price):null
  return {
    mediaId:row.selected_portfolio_media_id??media?.id??null,
    url:portfolioPublicUrl(row.selected_image_url_snapshot??media?.url??''),
    alt:media?.alt_text??row.selected_item_title_snapshot??'चुना हुआ डिज़ाइन',
    variantLabel:row.selected_variant_label_snapshot??media?.variant_label??null,
    price:snapshotPrice!=null&&Number.isFinite(snapshotPrice)?snapshotPrice:livePrice,
    portfolioItemId:media?.portfolio_items?.id??media?.portfolio_item_id??null,
    portfolioItemTitle:row.selected_item_title_snapshot??media?.portfolio_items?.title??null,
    // portfolio_items has no slug in the live database. The public gallery route accepts the item id.
    portfolioItemSlug:media?.portfolio_items?.id??media?.portfolio_item_id??null,
    priceIsHistorical:hasSnapshot,
    catalogRowMissing:!media&&hasSnapshot,
  }
}

function joinLocation(row:BookingRequestRow){return [row.area,row.city].filter((p)=>p&&p.trim()).join(', ')}

export async function getAdminBookingRequests():Promise<{bookings:AdminBookingRequest[];failed:boolean}>{
  const supabase=getSupabaseReadClient();if(!supabase)return{bookings:[],failed:true}
  const {data,error}=await supabase.from('booking_requests').select(`${REQUEST_COLUMNS}, portfolio_media:portfolio_media!booking_requests_selected_portfolio_media_id_fkey (id, url, alt_text, variant_label, price, portfolio_item_id, portfolio_items(id, title))`).order('created_at',{ascending:false}).limit(200)
  if(error||!data){if(error)console.error('[admin/bookings] load failed:',error.message);return{bookings:[],failed:true}}
  const rows=data as unknown as Array<BookingRequestRow&{portfolio_media:MediaJoin|null}>
  return {failed:false,bookings:rows.map(row=>({id:row.id,reference:row.reference_number??row.id.slice(0,8).toUpperCase(),status:row.status??'pending_review',eventType:row.event_type??'—',eventDate:row.event_date??'',location:joinLocation(row)||(row.address??''),venueName:row.venue_name??'',budget:row.budget??(row.custom_budget!=null?`₹${row.custom_budget}`:''),guestCount:row.guest_count,venueType:row.venue_type??'',setting:row.setting??'',style:Array.isArray(row.style)?row.style:[],requirements:row.requirements??'',contactName:row.contact_name??'नाम नहीं दिया',contactPhone:row.contact_phone??'',contactWhatsapp:row.contact_whatsapp??'',contactEmail:row.contact_email,createdAt:row.created_at,selectedLook:mapSelectedLook(row,row.portfolio_media??null)}))}
}
