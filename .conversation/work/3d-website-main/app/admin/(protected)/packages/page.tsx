import { getSupabaseReadClient } from '@/lib/supabase/server'
import { isSupabaseConfigured, cardImagePublicUrl } from '@/lib/supabase/config'
import { PackagesManager, type AdminPackage } from './PackagesManager'

export const dynamic = 'force-dynamic'

export default async function AdminPackagesPage() {
  const { packages, failed } = await loadPackages()
  return <PackagesManager initialPackages={packages} supabaseReady={isSupabaseConfigured()} loadFailed={failed} />
}

async function loadPackages(): Promise<{ packages: AdminPackage[]; failed: boolean }> {
  const supabase = getSupabaseReadClient()
  if (!supabase) return { packages: [], failed: true }

  const { data, error } = await supabase
    .from('packages')
    .select(`id, slug, name, description, starting_price, price_max, setup_time_minutes, decoration_area, customizable, is_featured, is_active, sort_order, created_at, package_items(id, package_id, label, sort_order), package_card_media(id, package_id, image_url, image_alt, sort_order)`)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !data) {
    if (error) console.error('[admin/packages] load failed:', error.message)
    return { packages: [], failed: true }
  }

  type Row = {
    id:string; slug:string; name:string; description:string|null; starting_price:number|null; price_max:number|null; setup_time_minutes:number|null; decoration_area:string|null; customizable:boolean; is_featured:boolean; is_active:boolean; sort_order:number|null;
    package_items:Array<{id:string;package_id:string;label:string;sort_order:number}>|null;
    package_card_media:Array<{id:string;package_id:string;image_url:string;image_alt:string|null;sort_order:number}>|null;
  }

  return { failed:false, packages:(data as unknown as Row[]).map(row=>{
    const media=[...(row.package_card_media??[])].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0))[0]??null
    return { id:row.id, slug:row.slug, name:row.name, description:row.description??'', startingPrice:row.starting_price, priceMax:row.price_max, setupTimeMinutes:row.setup_time_minutes, decorationArea:row.decoration_area??'', customizable:row.customizable, isFeatured:row.is_featured, isActive:row.is_active, imageUrl:media?.image_url??null, imagePublicUrl:cardImagePublicUrl(media?.image_url??''), imageAlt:media?.image_alt??'', sortOrder:row.sort_order??0, items:(row.package_items??[]).map(item=>({id:item.id,label:item.label,sortOrder:item.sort_order??0})).sort((a,b)=>a.sortOrder-b.sortOrder) }
  }) }
}
