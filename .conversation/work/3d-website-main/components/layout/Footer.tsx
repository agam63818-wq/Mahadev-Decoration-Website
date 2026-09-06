'use client'

import Link from 'next/link'
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube, ArrowUpRight } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useBusinessSettings } from '@/components/providers/BusinessSettingsProvider'
import { buildWhatsAppUrl } from '@/utils/booking'

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
  const business = useBusinessSettings()
  const whatsappHref = business.socialLinks?.whatsapp || (business.whatsapp ? buildWhatsAppUrl(business.whatsapp) : '')
  const socials = [
    { href: business.socialLinks?.instagram, label: 'Instagram', icon: Instagram },
    { href: business.socialLinks?.facebook, label: 'Facebook', icon: Facebook },
    { href: business.socialLinks?.youtube, label: 'YouTube', icon: Youtube },
  ]
  return <footer className="site-footer" aria-label="फुटर">
    <div className="footer-content">
      <div className="footer-brand">
        <BrandLogo />
        <p>{business.tagline}।<br />हर बारीकी में प्यार, हर सजावट में आपकी कहानी।</p>
        <span className="eyebrow">WEDDINGS · EVENTS · CELEBRATIONS</span>
        <div className="footer-socials">{socials.map(({ href, label, icon: Icon }) => href ? <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"><Icon size={17} /></a> : null)}</div>
      </div>
      <div className="footer-link-column"><h3>हमारे साथ जुड़ें</h3><ul>{footerLinks.pages.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></div>
      <div className="footer-link-column"><h3>आपके खास अवसर</h3><ul>{footerLinks.services.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></div>
      <div className="footer-contact"><h3>आइए, बात करें</h3>
        {business.phone && <a className="footer-phone" href={`tel:${business.phone}`}><Phone size={17} />{business.phone}</a>}
        {business.email && <a href={`mailto:${business.email}`}><Mail size={16} />{business.email}</a>}
        {business.address && <p><MapPin size={17} />{business.address}</p>}
        {whatsappHref && <a className="footer-whatsapp" href={whatsappHref} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18} /> WhatsApp पर बात करें <ArrowUpRight size={16} /></a>}
        <Link href="/contact" className="text-link">संपर्क की जानकारी <ArrowUpRight size={15} /></Link>
      </div>
    </div>
    <div className="footer-bottom"><p>© {new Date().getFullYear()} महादेव डेकोरेशन। सर्वाधिकार सुरक्षित।</p><span>BEAUTIFUL CELEBRATIONS, THOUGHTFULLY CRAFTED.</span></div>
  </footer>
}
