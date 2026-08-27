'use client'

import { MessageCircle, Phone, Calendar } from 'lucide-react'
import { cn } from '@/utils/cn'
import { buildWhatsAppUrl } from '@/utils/booking'
import { useContactAvailability } from '@/components/providers/BusinessSettingsProvider'

export function FloatingActions() {
  // Live values from business_settings. A CTA whose number the admin hasn't
  // filled in yet is hidden rather than rendered as a dead tel:/wa.me link.
  const { phone, whatsapp, hasPhone, hasWhatsapp } = useContactAvailability()

  const whatsappUrl = buildWhatsAppUrl(
    whatsapp,
    `नमस्ते! मुझे महादेव डेकोरेशन के बारे में जानकारी चाहिए।`
  )

  return (
    <>
      {/* Desktop floating buttons — premium stacked */}
      <div className="hidden md:flex fixed bottom-6 left-6 z-30 flex-col gap-3" aria-label="त्वरित संपर्क">
        {/* WhatsApp button — only when a number is configured */}
        {hasWhatsapp && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp पर संपर्क करें"
          className={cn(
            'flex items-center gap-2.5 px-5 py-3.5 rounded-full',
            'bg-[#25D366] text-white font-medium text-sm shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-250',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void'
          )}
          style={{
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
          }}
        >
          <MessageCircle size={18} />
          <span>WhatsApp करें</span>
        </a>
        )}

        {/* Small decorative divider */}
        {hasWhatsapp && hasPhone && (
          <div className="w-0.5 h-6 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        )}

        {/* Call Now button — premium gold */}
        {hasPhone && (
        <a
          href={`tel:${phone}`}
          aria-label={`अभी कॉल करें: ${phone}`}
          className={cn(
            'flex items-center gap-2.5 px-5 py-3.5 rounded-full',
            'bg-gradient-to-r from-gold-warm to-gold text-bg-void font-semibold text-sm shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 hover:scale-105 transition-all duration-250',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void'
          )}
        >
          <Phone size={18} />
          <span>अभी कॉल करें</span>
        </a>
        )}
      </div>

      {/* Right-side floating bar (alternative desktop layout) */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-30">
        {/* Scroll-to-top premium */}
        <ScrollToTopButton />
      </div>

      {/* Mobile sticky bottom action bar — premium */}
      <MobileActionBar whatsappUrl={whatsappUrl} />
    </>
  )
}

function ScrollToTopButton() {
  return (
    <a
      href="#home"
      className="hidden md:block w-11 h-11 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 text-gold shadow-lg shadow-gold/10 hover:shadow-xl hover:shadow-gold/20 hover:border-gold hover:scale-105 transition-all duration-250 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      aria-label="ऊपर जाएं"
      onClick={(e) => {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </a>
  )
}

function MobileActionBar({ whatsappUrl }: { whatsappUrl: string }) {
  // Same single source of truth as the desktop buttons: business_settings.
  const { phone, hasPhone, hasWhatsapp } = useContactAvailability()

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg-void/95 backdrop-blur-md border-t border-gold/20 safe-area-pb"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="मोबाइल एक्शन बार"
    >
      {/* Top gold accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="flex items-stretch h-14 px-2">
        {/* Call — hidden until the admin adds a phone number */}
        {hasPhone && (
        <a
          href={`tel:${phone}`}
          aria-label={`कॉल करें: ${phone}`}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-text-muted hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-lg"
        >
          <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Phone size={16} className="text-gold" />
          </div>
          <span className="text-[10px] font-devanagari">कॉल</span>
        </a>
        )}

        {/* Divider */}
        {hasPhone && hasWhatsapp && <div className="w-px bg-gold/10 my-2" />}

        {/* WhatsApp — hidden until the admin adds a WhatsApp number */}
        {hasWhatsapp && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp पर संपर्क करें"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[#25D366] hover:text-[#20BA5A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] rounded-lg"
        >
          <div className="w-8 h-8 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center">
            <MessageCircle size={16} />
          </div>
          <span className="text-[10px] font-devanagari">WhatsApp</span>
        </a>
        )}

        {/* Divider */}
        {(hasPhone || hasWhatsapp) && <div className="w-px bg-gold/10 my-2" />}

        {/* Book Now — primary gold */}
        <a
          href="/booking"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-gradient-to-r from-gold-warm to-gold text-bg-void font-semibold hover:scale-[1.02] hover:shadow-lg hover:shadow-gold/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-lg"
        >
          <div className="w-8 h-8 rounded-full bg-bg-void/20 border border-bg-void/20 flex items-center justify-center">
            <Calendar size={16} className="text-bg-void" />
          </div>
          <span className="text-[10px] font-devanagari">बुकिंग</span>
        </a>
      </div>
    </div>
  )
}
