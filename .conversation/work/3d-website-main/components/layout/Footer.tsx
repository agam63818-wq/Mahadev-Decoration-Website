import Link from 'next/link'
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube } from 'lucide-react'
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
    <footer className="bg-bg-void border-t border-gold/10" aria-label="फुटर">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="text-gold">
                <path
                  d="M16 30V10M16 10C16 10 10 8 10 4C10 2 12 1 16 1C20 1 22 2 22 4C22 8 16 10 16 10Z"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                />
                <path d="M10 10C10 10 6 9 6 6C6 4 7.5 3.5 10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M22 10C22 10 26 9 26 6C26 4 24.5 3.5 22 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <div>
                <div className="text-gold font-bold font-devanagari">महादेव डेकोरेशन</div>
                <div className="text-text-muted text-xs">Mahadev Decoration</div>
              </div>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed mb-4">
              {businessSettings.tagline} — बेगूसराय और आसपास के क्षेत्रों में प्रीमियम डेकोरेशन सर्विस।
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {businessSettings.socialLinks.instagram && (
                <a
                  href={businessSettings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram पर फॉलो करें"
                  className="p-2 rounded-full border border-gold/20 text-text-muted hover:text-gold hover:border-gold transition-colors"
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
                  className="p-2 rounded-full border border-gold/20 text-text-muted hover:text-gold hover:border-gold transition-colors"
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
                  className="p-2 rounded-full border border-gold/20 text-text-muted hover:text-gold hover:border-gold transition-colors"
                >
                  <Youtube size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Pages */}
          <div>
            <h3 className="text-champagne font-semibold mb-4 text-sm uppercase tracking-wider">पेजेज</h3>
            <ul className="space-y-2">
              {footerLinks.pages.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-muted text-sm hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-champagne font-semibold mb-4 text-sm uppercase tracking-wider">सर्विसेज</h3>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-muted text-sm hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-champagne font-semibold mb-4 text-sm uppercase tracking-wider">संपर्क</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`tel:${businessSettings.phone}`}
                  className="flex items-center gap-2 text-text-muted text-sm hover:text-gold transition-colors"
                >
                  <Phone size={14} className="text-gold flex-shrink-0" />
                  {businessSettings.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${businessSettings.email}`}
                  className="flex items-center gap-2 text-text-muted text-sm hover:text-gold transition-colors"
                >
                  <Mail size={14} className="text-gold flex-shrink-0" />
                  {businessSettings.email}
                </a>
              </li>
              <li className="flex items-start gap-2 text-text-muted text-sm">
                <MapPin size={14} className="text-gold flex-shrink-0 mt-0.5" />
                <span>{businessSettings.addressHindi}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gold/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-text-muted text-xs">
            © {new Date().getFullYear()} महादेव डेकोरेशन। सर्वाधिकार सुरक्षित।
          </p>
          <p className="text-text-muted text-xs">
            Begusarai, Bihar — Wedding &amp; Event Decoration
          </p>
        </div>
      </div>
    </footer>
  )
}
