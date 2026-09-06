'use client'

import Link from 'next/link'
import { ArrowUpRight, MapPin, Phone } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { buildWhatsAppUrl } from '@/utils/booking'
import type { ServiceArea, BusinessSettings } from '@/types'

interface ServiceAreaSectionProps { areas: ServiceArea[]; business: BusinessSettings }

export function ServiceAreaSection({ areas, business }: ServiceAreaSectionProps) {
  const homeBase = areas.find(area => area.isHomeBase)
  const otherAreas = areas.filter(area => !area.isHomeBase)
  return <section className="service-territory" aria-labelledby="service-area-heading">
    <div className="territory-intro">
      <p className="eyebrow">ROOTED HERE. CELEBRATING EVERYWHERE.</p>
      <h2 id="service-area-heading">जश्न जहाँ,<br /><span>हम वहाँ।</span></h2>
      <p>बेगूसराय से पूरे बिहार तक।<br />आपके अपनों की खुशियों में, हमेशा आपके साथ।</p>
      <Link href="/contact" className="text-link">अपने शहर के लिए पूछें <ArrowUpRight size={18} /></Link>
    </div>
    <div className="territory-locations">
      {homeBase && <div className="home-base">
        <div className="home-base-heading"><MapPin size={25} strokeWidth={1.3} /><div><span className="eyebrow">OUR HOME, YOUR CELEBRATION</span><h3>{homeBase.name} <span>{homeBase.nameEn}</span></h3></div></div>
        <p>{business.address.trim() || 'हमारा मुख्य केंद्र'}</p>
        <div className="home-base-contact">
          {business.phone && <a href={`tel:${business.phone}`}><Phone size={14} />{business.phone}</a>}
          {business.whatsapp && <a href={buildWhatsAppUrl(business.whatsapp, 'नमस्ते! मुझे अपने शहर में डेकोरेशन सेवा के बारे में जानकारी चाहिए।')} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={16} /> WhatsApp करें <ArrowUpRight size={14} /></a>}
        </div>
      </div>}
      <ul className="city-list">{otherAreas.map((area, i) => <li key={area.id}><span className="city-index">{String(i + 1).padStart(2, '0')}</span><span><strong>{area.name}</strong><small>{area.nameEn}</small></span><MapPin size={15} strokeWidth={1.3} /></li>)}</ul>
    </div>
  </section>
}
