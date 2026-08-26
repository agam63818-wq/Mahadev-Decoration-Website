import Link from 'next/link'
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube } from 'lucide-react'
import { Sparkles, Star } from 'lucide-react'
import { businessSettings } from '@/lib/data'

const footerLinks = {
  pages: [
    { href: '/', label: 'होम' },
    { href: '/about', label: 'हमारे बारे में' },
    { href: '/services', label: 'सर्विसेज' },
    { href: '/gallery', label: 'गैलरी' },
    { href: '/packages', label: 'पैकेज' },
    { href: '/reviews', label: 'समीक्षाएं' },
    { href: '/contact', label: 'कॉन्टेक्ट' },
  ],
  services: [
    { href: '/services#wedding', label: 'वेडिंग डेकोरेशन' },
    { href: '/services#birthday', label: 'बर्थडे डेकोरेशन' },
    { href: '/services#haldi', label: 'हल्दी डेकोरेशन' },
    { href: '/services#mehendi', label: 'मेहंदी डेकोरेशन' },
    { href: '/services#stage', label: 'स्टेज डेकोरेशन' },
    { href: '/services#car', label: 'कार डेकोरेशन' },
  ],
}

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-bg-void to-bg-void-2 border-t border-gold/10 overflow-hidden" aria-label="फुटर">
      {/* Premium top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Background glow */}
      <div className="absolute -top-20 right-10 w-[400px] h-[400px] rounded-full bg-gold/5 blur-3xl pointer-events-none" />

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand — premium */}
          <div className="lg:col-span-1">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 mb-4 group"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
                className="text-gold transition-transform duration-200 group-hover:scale-110"
              >
                <line x1="16" y1="30" x2="16" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path
                  d="M16 10C16 10 10 8 10 4C10 2 12 1 16 1C20 1 22 2 22 4C22 8 16 10 16 10Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 10C10 10 6 9 6 6C6 4 7.5 3.5 10 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M22 10C22 10 26 9 26 6C26 4 24.5 3.5 22 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <circle cx="16" cy="15" r="1" fill="currentColor" />
              </svg>
              <div className="flex flex-col">
                <span className="text-gold font-bold text-sm font-devanagari">महादेव डेकोरेशन</span>
                <span className="text-text-muted text-xs tracking-wider">Mahadev Decoration</span>
              </div>
            </Link>

            {/* Tagline */}
            <p className="text-text-muted text-sm leading-relaxed mb-5 font-devanagari">
              {businessSettings.tagline} — बेगूसराय और आसपास के क्षेत्रों में प्रीमियम डेकोरेशन सर्विस।
            </p>

            {/* Premium stats — trust builders */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex items-center gap-1.5 text-gold text-sm font-devanagari">
                <Star size={12} fill="currentColor" className="text-gold" />
                <span>1500+</span>
              </div>
              <span className="text-text-muted/30">|</span>
              <div className="flex items-center gap-1.5 text-gold text-sm font-devanagari">
                <Sparkles size={12} className="text-gold" />
                <span>5+ वर्ष</span>
              </div>
              <span className="text-text-muted/30">|</span>
              <div className="flex items-center gap-1.5 text-gold text-sm font-devanagari">
                <Star size={12} fill="currentColor" className="text-gold" />
                <span>1000+ ग्राहक</span>
              </div>
            </div>

            {/* Social links — premium circle */}
            <div className="flex items-center gap-2.5">
              {businessSettings.socialLinks.instagram && (
                <a
                  href={businessSettings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram पर फॉलो करें"
                  className="w-9 h-9 rounded-full bg-bg-void/50 border border-gold/20 flex items-center justify-center text-text-muted hover:text-gold hover:border-gold hover:bg-gold/5 transition-all duration-200"
                >
                  <Instagram size={16} />
                </a>
              )}
              {businessSettings.socialLinks.facebook && (
                <a
                  href={businessSettings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook पर फॉलो करें"
                  className="w-9 h-9 rounded-full bg-bg-void/50 border border-gold/20 flex items-center justify-center text-text-muted hover:text-gold hover:border-gold hover:bg-gold/5 transition-all duration-200"
                >
                  <Facebook size={16} />
                </a>
              )}
              {businessSettings.socialLinks.youtube && (
                <a
                  href={businessSettings.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube पर सब्सक्राइब करें"
                  className="w-9 h-9 rounded-full bg-bg-void/50 border border-gold/20 flex items-center justify-center text-text-muted hover:text-gold hover:border-gold hover:bg-gold/5 transition-all duration-200"
                >
                  <Youtube size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Pages */}
          <div>
            <h3 className="text-champagne font-semibold text-sm mb-4 uppercase tracking-wider font-devanagari flex items-center gap-2">
              <span className="w-px h-4 bg-gold/30" />
              पेजेज
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.pages.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-muted text-sm hover:text-gold hover:translate-x-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-champagne font-semibold text-sm mb-4 uppercase tracking-wider font-devanagari flex items-center gap-2">
              <span className="w-px h-4 bg-gold/30" />
              सर्विसेज
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-muted text-sm hover:text-gold hover:translate-x-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-champagne font-semibold text-sm mb-4 uppercase tracking-wider font-devanagari flex items-center gap-2">
              <span className="w-px h-4 bg-gold/30" />
              संपर्क करें
            </h3>
            <ul className="space-y-3">
              <li className="group">
                <a
                  href={`tel:${businessSettings.phone}`}
                  className="flex items-center gap-2.5 text-text-muted text-sm hover:text-gold hover:gap-3 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 group-hover:border-gold/40 group-hover:bg-gold/10 transition-all">
                    <Phone size={13} className="text-gold" />
                  </div>
                  <span className="font-devanagari font-medium">{businessSettings.phone}</span>
                </a>
              </li>
              <li className="group">
                <a
                  href={`mailto:${businessSettings.email}`}
                  className="flex items-center gap-2.5 text-text-muted text-sm hover:text-gold hover:gap-3 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 group-hover:border-gold/40 group-hover:bg-gold/10 transition-all">
                    <Mail size={13} className="text-gold" />
                  </div>
                  <span className="font-devanagari">{businessSettings.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-text-muted text-sm group">
                <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-gold/40 transition-all">
                  <MapPin size={13} className="text-gold" />
                </div>
                <span>{businessSettings.addressHindi}</span>
              </li>
              {/* WhatsApp quick link */}
              <a
                href={businessSettings.socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-sm font-devanagari hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200"
              >
                <MessageCircle size={14} />
                WhatsApp करें
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar — premium */}
      <div className="border-t border-gold/10 bg-bg-void/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-text-muted text-xs font-devanagari flex items-center gap-1.5">
            © {new Date().getFullYear()} <span className="text-gold">महादेव डेकोरेशन</span>
            <span className="text-text-muted/50">·</span>
            सर्वाधिकार सुरक्षित
          </p>
          <p className="text-text-muted/50 text-xs font-devanagari flex items-center gap-1.5">
            <span>Begusarai, Bihar</span>
            <span className="text-gold/30">—</span>
            <span>Wedding & Event Decoration</span>
          </p>
        </div>
      </div>

      {/* Inline MessageCircle for footer */}
      <style jsx>{`
        .MessageCircle {
          display: inline;
        }
      `}</style>
    </footer>
  )
}

function MessageCircle({ size, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size ?? 14}
      height={size ?? 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}
