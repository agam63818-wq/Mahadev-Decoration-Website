'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Phone, ArrowUp, ArrowUpRight } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { buildWhatsAppUrl } from '@/utils/booking'
import { useContactAvailability } from '@/components/providers/BusinessSettingsProvider'

export function FloatingActions() {
  const { phone, whatsapp, hasPhone, hasWhatsapp } = useContactAvailability()
  const [pastHero, setPastHero] = useState(false)
  const whatsappUrl = buildWhatsAppUrl(whatsapp, 'नमस्ते! मुझे महादेव डेकोरेशन के बारे में जानकारी चाहिए।')
  useEffect(() => {
    const update = () => setPastHero(window.scrollY > 500)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return <>
    <aside className="contact-dock" aria-label="त्वरित संपर्क">
      {pastHero && <button className="dock-top" aria-label="ऊपर जाएं" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}><ArrowUp size={18} /></button>}
      {hasWhatsapp && <a className="dock-whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp पर संपर्क करें"><WhatsAppIcon size={22} /><span>बात करें</span></a>}
    </aside>
    <nav className="mobile-action-bar" aria-label="मोबाइल एक्शन बार">
      {hasPhone && <a href={`tel:${phone}`} aria-label={`कॉल करें: ${phone}`}><Phone size={18} /><span>कॉल करें</span></a>}
      {hasWhatsapp && <a className="mobile-whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={19} /><span>WhatsApp</span></a>}
      <Link className="mobile-booking" href="/booking">बुकिंग करें <ArrowUpRight size={18} /></Link>
    </nav>
  </>
}
