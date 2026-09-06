import { getSupabaseReadClient } from '@/lib/supabase/server'
import { classifyPaymentStatus, isCancelledBooking, isConfirmedBooking, isPendingBooking, toDateKey } from '@/lib/admin/payment-status'
import { dataError, dataOk, logQueryFailure, SUPABASE_UNCONFIGURED, type DataResult } from './result'

type PaymentRow = { id: string; booking_id: string; customer_id: string; razorpay_order_id: string | null; razorpay_payment_id: string | null; payment_type: string; amount: number | null; status: string; created_at: string }
type BookingRow = { id: string; booking_request_id: string | null; customer_id: string; event_type: string; event_date: string; city: string | null; area: string | null; address: string | null; venue_name: string | null; budget_range: string | null; decoration_styles: string[]; guest_count: number | null; venue_type: string | null; is_indoor: boolean | null; special_requirements: string | null; additional_notes: string | null; status: string; total_price: number; advance_paid: number; remaining_amount: number; created_at: string }
type RequestRow = { id: string; reference_number: string | null; customer_name: string; phone: string; whatsapp: string | null; email: string | null; status: string; event_type: string; event_date: string | null; city: string | null; area: string | null; address: string | null; venue_name: string | null; budget: string | null; budget_range: string | null; custom_budget: number | null; style: string[]; decoration_styles: string[]; guest_count: number | null; venue_type: string | null; setting: string | null; requirements: string | null; additional_notes: string | null; contact_name: string | null; contact_phone: string | null; contact_whatsapp: string | null; contact_email: string | null; selected_portfolio_media_id: string | null; selected_variant_label_snapshot: string | null; selected_price_snapshot: number | null; selected_image_url_snapshot: string | null; selected_item_title_snapshot: string | null; created_at: string }
type CustomerRow = { id: string; full_name: string; phone: string; whatsapp: string | null; email: string | null; created_at: string }
type ReviewRow = { rating: number; is_approved: boolean; customer_id: string | null; created_at: string }

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1) }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function safeAmount(v: number | string | null | undefined) { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0 }
function locationOf(r: { area?: string | null; city?: string | null; address?: string | null }) { return [r.area, r.city].filter(Boolean).join(', ') || r.address || '' }
const MONTHS = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्तूबर','नवंबर','दिसंबर']
function monthLabel(key: string) { const [y,m] = key.split('-').map(Number); return `${MONTHS[m - 1]} ${String(y).slice(2)}` }

export interface PaymentTotals { received: number; pending: number; failed: number; refunded: number; net: number; count: number }
export interface AdminPayment { id: string; bookingId: string | null; customerId: string | null; customerName: string; amount: number; reference: string; method: string; status: string; bucket: ReturnType<typeof classifyPaymentStatus>; createdAt: string }
export interface DashboardMetrics { todayEvents: number; upcomingEvents: number; pendingInquiries: number; confirmedBookings: number; totalRevenue: number; advanceReceived: number; pendingPayments: number; monthlyGrowthPercent: number | null; historyMonths: number }
export interface RecentBooking { id: string; customerName: string; eventType: string; eventDate: string | null; status: string; total: number | null }
export interface AdminCustomer { id: string; name: string; phone: string; whatsapp: string; email: string; createdAt: string; bookingCount: number; totalSpent: number; lastBookingDate: string | null }
export interface CalendarEventRecord { id: string; title: string; eventType: string; customerName: string; location: string; date: string; time: string | null; status: string; decorationAreaSqft: number | null; source: 'booking' | 'request' }
export interface MonthlyPoint { month: string; label: string; bookings: number; revenue: number }
export interface AnalyticsKeyMetrics { conversionRate: number | null; repeatCustomerRate: number | null; averageRating: number | null; pendingPaymentRate: number | null }
export interface AnalyticsData { monthly: MonthlyPoint[]; eventTypeBreakdown: Array<{ eventType: string; count: number }>; paymentTotals: PaymentTotals; keyMetrics: AnalyticsKeyMetrics; totalBookings: number; hasComparableHistory: boolean }

export function totalPayments(rows: PaymentRow[]): PaymentTotals {
  const out: PaymentTotals = { received: 0, pending: 0, failed: 0, refunded: 0, net: 0, count: rows.length }
  for (const r of rows) { const n = safeAmount(r.amount); const b = classifyPaymentStatus(r.status); if (b === 'received') out.received += n; else if (b === 'pending') out.pending += n; else if (b === 'failed') out.failed += n; else if (b === 'refunded') out.refunded += n }
  out.net = out.received - out.refunded; return out
}

export async function getAdminPayments(): Promise<DataResult<{ payments: AdminPayment[]; totals: PaymentTotals }>> {
  const supabase = getSupabaseReadClient(); if (!supabase) return dataError(SUPABASE_UNCONFIGURED)
  const { data, error } = await supabase.from('payments').select('id, booking_id, customer_id, razorpay_order_id, razorpay_payment_id, payment_type, amount, status, created_at').order('created_at', { ascending: false }).limit(500)
  if (error) { logQueryFailure('admin-payments', error.message); return dataError(error.message) }
  const rows = (data ?? []) as unknown as PaymentRow[]; const totals = totalPayments(rows)
  const ids = [...new Set(rows.map(r => r.customer_id).filter(Boolean))]; const names = new Map<string,string>()
  if (ids.length) { const { data: cs, error: ce } = await supabase.from('customers').select('id, full_name').in('id', ids); if (ce) logQueryFailure('admin-payments/customers', ce.message); for (const c of (cs ?? []) as unknown as Array<{id:string;full_name:string}>) names.set(c.id, c.full_name) }
  return dataOk({ totals, payments: rows.map(r => ({ id:r.id, bookingId:r.booking_id, customerId:r.customer_id, customerName:names.get(r.customer_id) || '—', amount:safeAmount(r.amount), reference:r.razorpay_payment_id || r.razorpay_order_id || '—', method:r.payment_type || '—', status:r.status || 'unknown', bucket:classifyPaymentStatus(r.status), createdAt:r.created_at })) })
}

export async function getDashboardMetrics(): Promise<DataResult<DashboardMetrics>> {
  const supabase = getSupabaseReadClient(); if (!supabase) return dataError(SUPABASE_UNCONFIGURED)
  const now = new Date(), today = toDateKey(now), week = toDateKey(addDays(now,7)), thisMonth = startOfMonth(now), lastMonth = addMonths(thisMonth,-1)
  const [todayRes, upcomingRes, reqRes, bookRes, payRes] = await Promise.all([
    supabase.from('bookings').select('id',{count:'exact',head:true}).eq('event_date',today),
    supabase.from('bookings').select('id',{count:'exact',head:true}).gt('event_date',today).lte('event_date',week),
    supabase.from('booking_requests').select('id,status'),
    supabase.from('bookings').select('id,status,advance_paid,total_price,event_date'),
    supabase.from('payments').select('id,amount,status,created_at').gte('created_at',lastMonth.toISOString()),
  ])
  const err = todayRes.error || upcomingRes.error || reqRes.error || bookRes.error || payRes.error; if (err) { logQueryFailure('admin-dashboard',err.message); return dataError(err.message) }
  const reqs = (reqRes.data ?? []) as unknown as Array<{id:string;status:string}>; const books = (bookRes.data ?? []) as unknown as Array<{id:string;status:string;advance_paid:number;total_price:number;event_date:string}>; const pays = (payRes.data ?? []) as unknown as PaymentRow[]
  let advance=0,pending=0; for(const b of books){ if(isCancelledBooking(b.status)) continue; const a=safeAmount(b.advance_paid), t=safeAmount(b.total_price); advance+=a; pending+=Math.max(0,t-a) }
  const thisPays = pays.filter(p => new Date(p.created_at) >= thisMonth); const lastPays = pays.filter(p => { const d=new Date(p.created_at); return d>=lastMonth && d<thisMonth })
  const current = totalPayments(thisPays).net, previous = totalPayments(lastPays).net
  return dataOk({ todayEvents:todayRes.count ?? 0, upcomingEvents:upcomingRes.count ?? 0, pendingInquiries:reqs.filter(r=>isPendingBooking(r.status)).length, confirmedBookings:books.filter(b=>isConfirmedBooking(b.status)).length, totalRevenue:current, advanceReceived:advance, pendingPayments:pending, monthlyGrowthPercent:previous>0 ? Math.round(((current-previous)/previous)*1000)/10 : null, historyMonths:previous>0 ? 1 : 0 })
}

export async function getRecentBookings(limit=5): Promise<DataResult<RecentBooking[]>> {
  const supabase=getSupabaseReadClient(); if(!supabase) return dataError(SUPABASE_UNCONFIGURED)
  const {data,error}=await supabase.from('bookings').select('id,customer_id,event_type,event_date,status,total_price,created_at').order('created_at',{ascending:false}).limit(limit)
  if(error){logQueryFailure('admin-recent-bookings',error.message);return dataError(error.message)}
  const rows=(data??[]) as unknown as Array<{id:string;customer_id:string;event_type:string;event_date:string;status:string;total_price:number;created_at:string}>; const ids=[...new Set(rows.map(r=>r.customer_id).filter(Boolean))]; const names=new Map<string,string>()
  if(ids.length){const {data:cs,error:ce}=await supabase.from('customers').select('id,full_name').in('id',ids);if(ce)logQueryFailure('admin-recent-bookings/customers',ce.message);for(const c of (cs??[]) as unknown as Array<{id:string;full_name:string}>)names.set(c.id,c.full_name)}
  return dataOk(rows.map(r=>({id:r.id,customerName:names.get(r.customer_id)||'—',eventType:r.event_type,eventDate:r.event_date,status:r.status,total:safeAmount(r.total_price)})))
}

export async function getAdminCustomers(): Promise<DataResult<{customers:AdminCustomer[];newThisMonth:number}>> {
  const supabase=getSupabaseReadClient(); if(!supabase)return dataError(SUPABASE_UNCONFIGURED)
  const [cr,br,pr]=await Promise.all([supabase.from('customers').select('id,full_name,phone,whatsapp,email,created_at').order('created_at',{ascending:false}).limit(500),supabase.from('bookings').select('id,customer_id,status,event_date,total_price'),supabase.from('payments').select('id,customer_id,amount,status')])
  const err=cr.error||br.error||pr.error;if(err){logQueryFailure('admin-customers',err.message);return dataError(err.message)}
  const customers=(cr.data??[]) as unknown as CustomerRow[]; const bookings=(br.data??[]) as unknown as Array<{id:string;customer_id:string;status:string;event_date:string;total_price:number}>; const payments=(pr.data??[]) as unknown as PaymentRow[]
  const now=new Date(), month=startOfMonth(now), count=new Map<string,number>(), last=new Map<string,string>(), spent=new Map<string,number>()
  for(const b of bookings){if(isCancelledBooking(b.status))continue;count.set(b.customer_id,(count.get(b.customer_id)||0)+1);if(b.event_date && (!last.has(b.customer_id)||b.event_date>last.get(b.customer_id)!))last.set(b.customer_id,b.event_date)}
  for(const p of payments){const b=classifyPaymentStatus(p.status);if(b==='received')spent.set(p.customer_id,(spent.get(p.customer_id)||0)+safeAmount(p.amount));else if(b==='refunded')spent.set(p.customer_id,(spent.get(p.customer_id)||0)-safeAmount(p.amount))}
  return dataOk({newThisMonth:customers.filter(c=>new Date(c.created_at)>=month).length,customers:customers.map(c=>({id:c.id,name:c.full_name,phone:c.phone,whatsapp:c.whatsapp||'',email:c.email||'',createdAt:c.created_at,bookingCount:count.get(c.id)||0,totalSpent:Math.max(0,spent.get(c.id)||0),lastBookingDate:last.get(c.id)||null}))})
}

export async function getCalendarEvents(): Promise<DataResult<CalendarEventRecord[]>> {
  const supabase=getSupabaseReadClient();if(!supabase)return dataError(SUPABASE_UNCONFIGURED)
  const [br,rr]=await Promise.all([supabase.from('bookings').select('id,customer_id,event_type,event_date,city,area,address,venue_name,status').not('event_date','is',null),supabase.from('booking_requests').select('id,reference_number,customer_name,event_type,event_date,city,area,address,venue_name,status').not('event_date','is',null)])
  const err=br.error||rr.error;if(err){logQueryFailure('admin-calendar',err.message);return dataError(err.message)}
  const bookings=(br.data??[]) as unknown as Array<{id:string;customer_id:string;event_type:string;event_date:string;city:string|null;area:string|null;address:string|null;venue_name:string|null;status:string}>; const reqs=(rr.data??[]) as unknown as Array<{id:string;reference_number:string|null;customer_name:string;event_type:string;event_date:string;city:string|null;area:string|null;address:string|null;venue_name:string|null;status:string}>
  const ids=[...new Set(bookings.map(b=>b.customer_id).filter(Boolean))];const names=new Map<string,string>();if(ids.length){const {data:cs,error:ce}=await supabase.from('customers').select('id,full_name').in('id',ids);if(ce)logQueryFailure('admin-calendar/customers',ce.message);for(const c of (cs??[]) as unknown as Array<{id:string;full_name:string}>)names.set(c.id,c.full_name)}
  const a:CalendarEventRecord[]=bookings.map(b=>({id:b.id,title:b.venue_name||b.event_type,eventType:b.event_type,customerName:names.get(b.customer_id)||'—',location:locationOf(b),date:b.event_date,time:null,status:b.status,decorationAreaSqft:null,source:'booking'}));
  const b:CalendarEventRecord[]=reqs.map(r=>({id:r.id,title:r.venue_name||r.event_type,eventType:r.event_type,customerName:r.customer_name,location:locationOf(r),date:r.event_date,time:null,status:r.status,decorationAreaSqft:null,source:'request'}));
  return dataOk([...a,...b].sort((x,y)=>x.date.localeCompare(y.date)))
}

export async function getAnalytics(monthsBack=6): Promise<DataResult<AnalyticsData>> {
  const supabase=getSupabaseReadClient();if(!supabase)return dataError(SUPABASE_UNCONFIGURED)
  const end=new Date(), start=addMonths(startOfMonth(end),-(monthsBack-1))
  const [br,rr,pr,rev]=await Promise.all([supabase.from('bookings').select('id,customer_id,event_type,status,created_at'),supabase.from('booking_requests').select('id,event_type,status,created_at'),supabase.from('payments').select('id,amount,status,created_at'),supabase.from('reviews').select('rating,is_approved,customer_id,created_at')])
  const err=br.error||rr.error||pr.error||rev.error;if(err){logQueryFailure('admin-analytics',err.message);return dataError(err.message)}
  const bookings=(br.data??[]) as unknown as Array<{id:string;customer_id:string;event_type:string;status:string;created_at:string}>;const requests=(rr.data??[]) as unknown as Array<{id:string;event_type:string;status:string;created_at:string}>;const payments=(pr.data??[]) as unknown as PaymentRow[];const reviews=(rev.data??[]) as unknown as ReviewRow[]
  const monthly:MonthlyPoint[]=[];for(let i=0;i<monthsBack;i++){const d=addMonths(start,i),key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,next=addMonths(d,1);const bs=bookings.filter(b=>!isCancelledBooking(b.status)&&new Date(b.created_at)>=d&&new Date(b.created_at)<next);const ps=payments.filter(p=>new Date(p.created_at)>=d&&new Date(p.created_at)<next);monthly.push({month:key,label:monthLabel(key),bookings:bs.length,revenue:totalPayments(ps).net})}
  const typeMap=new Map<string,number>();for(const b of bookings)if(!isCancelledBooking(b.status))typeMap.set(b.event_type,(typeMap.get(b.event_type)||0)+1);for(const r of requests)if(isPendingBooking(r.status))typeMap.set(r.event_type,(typeMap.get(r.event_type)||0)+1)
  const customerCounts=new Map<string,number>();for(const b of bookings)if(!isCancelledBooking(b.status))customerCounts.set(b.customer_id,(customerCounts.get(b.customer_id)||0)+1);const repeat=[...customerCounts.values()].filter(n=>n>1).length;const totalCustomers=customerCounts.size;const approved=reviews.filter(r=>r.is_approved&&Number.isFinite(r.rating));const pending=totalPayments(payments).pending,received=totalPayments(payments).received
  return dataOk({monthly,eventTypeBreakdown:[...typeMap.entries()].map(([eventType,count])=>({eventType,count})).sort((a,b)=>b.count-a.count),paymentTotals:totalPayments(payments),keyMetrics:{conversionRate:requests.length?Math.round((bookings.filter(b=>!isCancelledBooking(b.status)).length/requests.length)*1000)/10:null,repeatCustomerRate:totalCustomers?Math.round((repeat/totalCustomers)*1000)/10:null,averageRating:approved.length?Math.round((approved.reduce((s,r)=>s+r.rating,0)/approved.length)*10)/10:null,pendingPaymentRate:(received+pending)>0?Math.round((pending/(received+pending))*1000)/10:null},totalBookings:bookings.filter(b=>!isCancelledBooking(b.status)&&new Date(b.created_at)>=start).length,hasComparableHistory:monthly.slice(0,-1).some(m=>m.bookings>0||m.revenue>0)})
}
