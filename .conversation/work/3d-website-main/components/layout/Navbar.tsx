'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Phone } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { businessSettings } from '@/lib/data'

const navLinks = [
  { href: '/', label: 'होम' },
  { href: '/about', label: 'हमारे बारे में' },
  { href: '/services', label: 'सर्विसेज' },
  { href: '/gallery', label: 'गैलरी' },
  { href: '/packages', label: 'पैकेज' },
  { href: '/booking', label: 'बुकिंग' },
  { href: '/contact', label: 'कॉन्टेक्ट' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        scrolled
          ? 'bg-bg-void/95 backdrop-blur-md border-b border-gold/10 shadow-lg'
          : 'bg-transparent'
      )}
    >
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
        aria-label="मुख्य नेविगेशन"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          {/* Trishul SVG logo mark */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className="text-gold group-hover:scale-110 transition-transform duration-200"
          >
            <path
              d="M16 30V10M16 10C16 10 10 8 10 4C10 2 12 1 16 1C20 1 22 2 22 4C22 8 16 10 16 10Z"
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
          </svg>
          <div className="flex flex-col leading-none">
            <span className="text-gold font-bold text-sm font-devanagari">महादेव</span>
            <span className="text-champagne text-xs font-medium tracking-wide">DECORATION</span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden lg:flex items-center gap-1" role="list">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                    isActive
                      ? 'text-gold border-b border-gold'
                      : 'text-text-muted hover:text-champagne'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Desktop right actions */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href={`tel:${businessSettings.phone}`}
            className="flex items-center gap-2 px-3 py-2 rounded-full border border-gold/30 text-champagne text-sm hover:border-gold hover:text-gold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label={`कॉल करें: ${businessSettings.phone}`}
          >
            <Phone size={14} />
            <span className="tabular-nums">{businessSettings.phone}</span>
          </a>
          <Button
            variant="primary"
            size="sm"
            onClick={() => (window.location.href = '/booking')}
            className="font-devanagari"
          >
            बुकिंग करें
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 text-text-muted hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-md"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'मेनू बंद करें' : 'मेनू खोलें'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="lg:hidden bg-bg-void/98 backdrop-blur-md border-b border-gold/10 overflow-hidden"
          >
            <ul className="px-4 py-4 flex flex-col gap-1" role="list">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'block px-4 py-3 rounded-lg text-base font-medium transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                        isActive
                          ? 'bg-gold/10 text-gold'
                          : 'text-text-muted hover:bg-white/5 hover:text-champagne'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
              <li className="pt-2 border-t border-gold/10">
                <a
                  href={`tel:${businessSettings.phone}`}
                  className="flex items-center gap-2 px-4 py-3 text-champagne text-base"
                >
                  <Phone size={16} className="text-gold" />
                  {businessSettings.phone}
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
