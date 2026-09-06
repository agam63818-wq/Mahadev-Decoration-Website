'use client'

import Link from 'next/link'
import { ArrowUpRight, Phone } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useBusinessSettings, useContactAvailability } from '@/components/providers/BusinessSettingsProvider'
import { buildWhatsAppUrl } from '@/utils/booking'

export function FinalCTASection() {
  const business = useBusinessSettings()
  const { phone, whatsapp, hasPhone, hasWhatsapp } = useContactAvailability()
  const whatsappUrl = buildWhatsAppUrl(whatsapp, 'नमस्ते! मुझे अपने इवेंट के लिए डेकोरेशन बुक करनी है।')
  return <section className="closing-section" aria-labelledby="final-cta-heading">
    <div className="closing-frame">
      <span className="eyebrow">LET’S MAKE IT MEMORABLE</span>
      <h2 id="final-cta-heading">आपका खास दिन।<br /><span>हमारी पूरी लगन।</span></h2>
      <p>{business.taglineSecondary}। अपने अगले जश्न की शुरुआत हमारे साथ करें।</p>
      <div className="closing-actions">
        <Link href="/booking" className="editorial-button button-brass">बुकिंग शुरू करें <ArrowUpRight size={18} /></Link>
        {hasWhatsapp && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="editorial-button button-whatsapp"><WhatsAppIcon size={19} /> WhatsApp पर बात करें</a>}
      </div>
      {hasPhone && <a className="closing-phone" href={`tel:${phone}`}><Phone size={14} /> या सीधे कॉल करें <span>{phone}</span></a>}
    </div>
  </section>
}
