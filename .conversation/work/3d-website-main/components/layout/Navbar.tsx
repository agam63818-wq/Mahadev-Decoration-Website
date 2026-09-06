'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Phone, ArrowUpRight } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { useContactAvailability } from '@/components/providers/BusinessSettingsProvider'

const navLinks = [
  { href: '/', label: 'होम' },
  { href: '/about', label: 'हमारे बारे में' },
  { href: '/services', label: 'सर्विसेज' },
  { href: '/gallery', label: 'गैलरी' },
  { href: '/packages', label: 'पैकेज' },
  { href: '/booking', label: 'बुकिंग' },
  { href: '/contact', label: 'संपर्क' },
]

export function Navbar() {
  const { phone, hasPhone } = useContactAvailability()
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const menuButton = useRef<HTMLButtonElement>(null)
  const header = useRef<HTMLElement>(null)

  useEffect(() => { setMobileOpen(false) }, [pathname])
  useEffect(() => {
    if (!mobileOpen) return
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMobileOpen(false); menuButton.current?.focus() }
    }
    const outside = (e: PointerEvent) => {
      if (header.current && !header.current.contains(e.target as Node)) setMobileOpen(false)
    }
    document.addEventListener('keydown', close)
    document.addEventListener('pointerdown', outside)
    return () => {
      document.removeEventListener('keydown', close)
      document.removeEventListener('pointerdown', outside)
    }
  }, [mobileOpen])

  const active = (href: string) => href === '/' ? pathname === '/' : pathname?.startsWith(href)
  return (
    <header ref={header} className="site-header">
      <a href="#main-content" className="skip-link">मुख्य सामग्री पर जाएं</a>
      <nav className="site-nav" aria-label="मुख्य नेविगेशन">
        <BrandLogo />
        <ul className="desktop-nav">
          {navLinks.map(link => (
            <li key={link.href}>
              <Link href={link.href} aria-current={active(link.href) ? 'page' : undefined}>{link.label}</Link>
            </li>
          ))}
        </ul>
        <div className="nav-actions">
          {hasPhone && <a className="nav-phone" href={`tel:${phone}`} aria-label={`कॉल करें: ${phone}`}><Phone size={14} /><span>{phone}</span></a>}
          <Link href="/booking" className="editorial-button button-brass nav-booking">बुकिंग करें <ArrowUpRight size={16} /></Link>
          <button ref={menuButton} className="menu-toggle" aria-controls="mobile-navigation" aria-expanded={mobileOpen} aria-label={mobileOpen ? 'मेनू बंद करें' : 'मेनू खोलें'} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <nav id="mobile-navigation" className="mobile-navigation" aria-label="मोबाइल नेविगेशन">
          <p className="eyebrow">EXPLORE MAHADEV</p>
          {navLinks.map((link, i) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} aria-current={active(link.href) ? 'page' : undefined}>
              <span className="menu-number">0{i + 1}</span>{link.label}<ArrowUpRight size={16} />
            </Link>
          ))}
          {hasPhone && <a className="mobile-menu-phone" href={`tel:${phone}`}><Phone size={16} />{phone}</a>}
        </nav>
      )}
    </header>
  )
}
