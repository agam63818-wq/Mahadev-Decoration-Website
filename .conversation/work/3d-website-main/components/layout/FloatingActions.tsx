'use client'

import { MessageCircle, Phone } from 'lucide-react'
import { cn } from '@/utils/cn'
import { businessSettings } from '@/lib/data'
import { buildWhatsAppUrl } from '@/utils/booking'

export function FloatingActions() {
  const whatsappUrl = buildWhatsAppUrl(
    businessSettings.whatsapp,
    `नमस्ते! मुझे महादेव डेकोरेशन के बारे में जानकारी चाहिए।`
  )

  return (
    <>
      {/* Desktop floating buttons */}
      <div className="hidden md:flex fixed bottom-6 left-6 z-30 flex-col gap-3" aria-label="त्वरित संपर्क">
        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp पर संपर्क करें"
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-full',
            'bg-[#25D366] text-white font-medium text-sm',
            'shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-250',
            'animate-pulse-gold',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void'
          )}
        >
          <MessageCircle size={18} />
          <span>WhatsApp</span>
        </a>
      </div>

      <div className="hidden md:flex fixed bottom-6 right-6 z-30">
        {/* Call Now */}
        <a
          href={`tel:${businessSettings.phone}`}
          aria-label={`अभी कॉल करें: ${businessSettings.phone}`}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-full',
            'bg-gold text-bg-void font-semibold text-sm',
            'shadow-gold-glow hover:shadow-gold-glow hover:scale-105 transition-all duration-250',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void'
          )}
        >
          <Phone size={18} />
          <span>अभी कॉल करें</span>
        </a>
      </div>

      {/* Mobile sticky bottom action bar */}
      <MobileActionBar />
    </>
  )
}

function MobileActionBar() {
  const whatsappUrl = buildWhatsAppUrl(
    businessSettings.whatsapp,
    `नमस्ते! मुझे महादेव डेकोरेशन के बारे में जानकारी चाहिए।`
  )

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg-void/95 backdrop-blur-md border-t border-gold/20 safe-area-pb"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="मोबाइल एक्शन बार"
    >
      <div className="flex items-stretch h-14">
        <a
          href={`tel:${businessSettings.phone}`}
          aria-label={`कॉल करें: ${businessSettings.phone}`}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-text-muted hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <Phone size={18} />
          <span className="text-xs">कॉल</span>
        </a>
        <div className="w-px bg-gold/10" />
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp पर संपर्क करें"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[#25D366] hover:text-[#20BA5A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
        >
          <MessageCircle size={18} />
          <span className="text-xs">WhatsApp</span>
        </a>
        <div className="w-px bg-gold/10" />
        <a
          href="/booking"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-gold text-bg-void font-semibold hover:bg-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <span className="text-base">📅</span>
          <span className="text-xs font-devanagari">बुकिंग</span>
        </a>
      </div>
    </div>
  )
}
