'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, MessageCircle, Mail, MapPin, Clock, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { BusinessSettings, ServiceArea } from '@/types'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { buildWhatsAppUrl } from '@/utils/booking'

const contactSchema = z.object({
  name: z.string().min(2, 'नाम कम से कम 2 अक्षर का होना चाहिए'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'सही मोबाइल नंबर डालें'),
  eventType: z.string().min(1, 'इवेंट टाइप चुनें'),
  message: z.string().min(10, 'संदेश कम से कम 10 अक्षर का होना चाहिए'),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactPageClientProps {
  business: BusinessSettings
  areas: ServiceArea[]
}

export function ContactPageClient({ business, areas }: ContactPageClientProps) {
  // Human-readable location built from business_settings. Empty string when the
  // admin has not added an address yet, which hides the label entirely rather
  // than printing an invented city.
  const locationLabel = [business.address, business.city].filter(Boolean).join(', ')

  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; title: string }>({
    open: false,
    type: 'success',
    title: '',
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    // Part 2 will persist this to contact_inquiries table via Supabase
    await new Promise((r) => setTimeout(r, 800)) // Simulate async
    console.log('Contact form submission (Part 2 will persist):', data)
    reset()
    setToast({ open: true, type: 'success', title: 'संदेश भेज दिया गया! हम जल्द संपर्क करेंगे।' })
  }

  const whatsappUrl = buildWhatsAppUrl(business.whatsapp, 'नमस्ते! मुझे डेकोरेशन के बारे में जानकारी चाहिए।')

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact info */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-champagne font-devanagari mb-6">हमसे संपर्क करें</h2>

            {/* Quick contact cards */}
            <div className="space-y-4">
              <a
                href={`tel:${business.phone}`}
                className="flex items-center gap-4 p-4 bg-bg-purple border border-gold/20 rounded-xl hover:border-gold transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <Phone size={20} className="text-gold" />
                </div>
                <div>
                  <p className="text-champagne font-semibold">{business.phone}</p>
                  <p className="text-text-muted text-sm font-devanagari">कॉल करें — 24/7 उपलब्ध</p>
                </div>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-bg-purple border border-gold/20 rounded-xl hover:border-[#25D366] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
              >
                <div className="w-12 h-12 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center group-hover:bg-[#25D366]/20 transition-colors">
                  <MessageCircle size={20} className="text-[#25D366]" />
                </div>
                <div>
                  <p className="text-champagne font-semibold">WhatsApp</p>
                  <p className="text-text-muted text-sm font-devanagari">तुरंत जवाब पाएं</p>
                </div>
              </a>

              <a
                href={`mailto:${business.email}`}
                className="flex items-center gap-4 p-4 bg-bg-purple border border-gold/20 rounded-xl hover:border-gold transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <Mail size={20} className="text-gold" />
                </div>
                <div>
                  <p className="text-champagne font-semibold">{business.email}</p>
                  <p className="text-text-muted text-sm font-devanagari">ईमेल करें</p>
                </div>
              </a>

              <div className="flex items-start gap-4 p-4 bg-bg-purple border border-gold/20 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-gold" />
                </div>
                <div>
                  <p className="text-champagne font-semibold font-devanagari">{business.addressHindi}</p>
                  <p className="text-text-muted text-sm">{business.city}, {business.state} — {business.pincode}</p>
                </div>
              </div>
            </div>

            {/* Business hours */}
            <div className="mt-6 p-5 bg-bg-purple border border-gold/10 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-gold" />
                <h3 className="text-champagne font-semibold font-devanagari">कार्य समय</h3>
              </div>
              <div className="space-y-2">
                {business.businessHours.map((h) => (
                  <div key={h.day} className="flex justify-between text-sm">
                    <span className="text-text-muted font-devanagari">{h.dayHindi}</span>
                    <span className={h.isClosed ? 'text-floral-red' : 'text-champagne'}>
                      {h.isClosed ? 'बंद' : `${h.open} – ${h.close}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Contact form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-champagne font-devanagari mb-6">संदेश भेजें</h2>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-champagne text-sm font-devanagari mb-1">
                आपका नाम *
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                placeholder="जैसे: अमन कुमार"
                className="w-full px-4 py-3 rounded-xl bg-bg-void border border-gold/20 text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold font-devanagari"
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-floral-red text-xs mt-1 font-devanagari" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-champagne text-sm font-devanagari mb-1">
                मोबाइल नंबर *
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="10 अंकों का मोबाइल नंबर"
                className="w-full px-4 py-3 rounded-xl bg-bg-void border border-gold/20 text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold tabular-nums"
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
              {errors.phone && (
                <p id="phone-error" className="text-floral-red text-xs mt-1 font-devanagari" role="alert">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="eventType" className="block text-champagne text-sm font-devanagari mb-1">
                इवेंट टाइप *
              </label>
              <select
                id="eventType"
                {...register('eventType')}
                className="w-full px-4 py-3 rounded-xl bg-bg-void border border-gold/20 text-text-primary focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold font-devanagari"
                aria-describedby={errors.eventType ? 'event-error' : undefined}
              >
                <option value="">इवेंट चुनें</option>
                <option value="wedding">वेडिंग</option>
                <option value="birthday">बर्थडे</option>
                <option value="haldi">हल्दी</option>
                <option value="mehendi">मेहंदी</option>
                <option value="stage">स्टेज</option>
                <option value="car">कार</option>
                <option value="anniversary">एनिवर्सरी</option>
                <option value="custom">कस्टम</option>
              </select>
              {errors.eventType && (
                <p id="event-error" className="text-floral-red text-xs mt-1 font-devanagari" role="alert">
                  {errors.eventType.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-champagne text-sm font-devanagari mb-1">
                संदेश *
              </label>
              <textarea
                id="message"
                {...register('message')}
                rows={4}
                placeholder="अपनी जरूरत बताएं — तारीख, जगह, बजट..."
                className="w-full px-4 py-3 rounded-xl bg-bg-void border border-gold/20 text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold font-devanagari resize-none"
                aria-describedby={errors.message ? 'message-error' : undefined}
              />
              {errors.message && (
                <p id="message-error" className="text-floral-red text-xs mt-1 font-devanagari" role="alert">
                  {errors.message.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full font-devanagari"
            >
              <Send size={18} />
              संदेश भेजें
            </Button>

            <p className="text-text-muted text-xs text-center font-devanagari">
              * Part 2 में यह फॉर्म Supabase से जुड़ेगा और आपका संदेश सेव होगा।
            </p>
          </form>
        </motion.div>
      </div>

      {/* Map — location text and embed both come from business_settings. The
          whole block is hidden until the admin actually fills in an address, so
          the page never shows a placeholder location as if it were real. */}
      {(business.address || business.city || business.mapEmbedUrl) && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-champagne font-devanagari mb-4">हमारा स्थान</h2>
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-gold/20 bg-bg-purple">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-0">
              <MapPin size={40} className="text-gold opacity-40" />
              {locationLabel && (
                <p className="text-text-muted font-devanagari text-center px-4">{locationLabel}</p>
              )}
            </div>
            {business.mapEmbedUrl && (
              <iframe
                src={business.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`महादेव डेकोरेशन${locationLabel ? ` — ${locationLabel}` : ''} का नक्शा`}
                className="relative z-10"
              />
            )}
          </div>
        </div>
      )}

      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        type={toast.type}
        title={toast.title}
      />
    </>
  )
}
