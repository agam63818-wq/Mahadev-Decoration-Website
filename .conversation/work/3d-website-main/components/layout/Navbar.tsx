'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Phone, Sparkles } from 'lucide-react'
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
        {/* Logo — premium trishul mark */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          {/* Trishul SVG */}
          <svg
            width="36"
            height="36"
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
            {/* Decorative dots */}
            <circle cx="16" cy="15" r="1" fill="currentColor" />
            <circle cx="12" cy="16.5" r="0.7" fill="currentColor" />
            <circle cx="20" cy="16.5" r="0.7" fill="currentColor" />
          </svg>
          <div className="flex flex-col leading-none">
            <span className="text-gold font-bold text-sm font-devanagari tracking-tight">
              महादेव
            </span>
            <span className="text-text-muted text-xs font-medium tracking-wider">
              D E C O R A T I O N
            </span>
          </div>
        </Link>

        {/* Desktop nav links — premium */}
        <ul className="hidden lg:flex items-center gap-1" role="list">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1',
                    isActive
                      ? 'text-gold bg-gold/5 border-b-2 border-gold'
                      : 'text-text-muted hover:text-champagne hover:bg-white/3 hover:border-b-2 hover:border-gold/20'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                  {/* Active indicator — small gold dot */}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gold shadow-sm" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Desktop right actions — premium */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Phone — elegant */}
          <a
            href={`tel:${businessSettings.phone}`}
            className="flex items-center gap-2 px-3 py-2 rounded-full border border-gold/20 text-champagne text-sm hover:border-gold hover:text-gold hover:bg-gold/5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label={`कॉल करें: ${businessSettings.phone}`}
          >
            <Phone size={14} className="text-gold" />
            <span className="tabular-nums">{businessSettings.phone}</span>
          </a>

          {/* Book CTAs */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => (window.location.href = '/booking')}
            className="font-devanagari gap-1.5"
          >
            बुकिंग करें <span className="text-bg-void text-xs">→</span>
          </Button>
        </div>

        {/* Mobile hamburger — premium */}
        <button
          className="lg:hidden p-2 text-text-muted hover:text-gold hover:bg-gold/5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-lg border border-transparent hover:border-gold/20"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'मेनू बंद करें' : 'मेनू खोलें'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X size={22} className="text-gold" />
          ) : (
            <Menu size={22} className="text-text-muted group-hover:text-gold" />
          )}
        </button>
      </nav>

      {/* Mobile menu — premium slide */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="lg:hidden bg-bg-void/98 backdrop-blur-md border-b border-gold/10 overflow-hidden"
          >
            {/* Mobile menu header */}
            <div className="px-4 py-4 flex items-center justify-between border-b border-gold/10">
              <span className="text-gold text-sm font-devanagari font-medium">मेनू</span>
              <button
                className="p-1 text-text-muted hover:text-gold hover:bg-gold/5 transition-all rounded"
                onClick={() => setMobileOpen(false)}
                aria-label="बंद करें"
              >
                <X size={18} />
              </button>
            </div>

            <ul className="px-4 py-3 flex flex-col gap-1" role="list">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                        isActive
                          ? 'bg-gradient-to-r from-gold/5 to-gold/10 text-gold border-l-2 border-gold pl-[10px]'
                          : 'text-text-muted hover:bg-white/3 hover:text-champagne border-l-2 border-transparent pl-4'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
              {/* Divider + contact */}
              <li className="pt-3 border-t border-gold/10">
                <a
                  href={`tel:${businessSettings.phone}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gold/5 text-gold hover:bg-gold/10 transition-all"
                >
                  <Phone size={16} className="text-gold" />
                  <div className="flex flex-col">
                    <span className="text-sm font-devanagari">{businessSettings.phone}</span>
                    <span className="text-text-muted text-xs">कॉल करें</span>
                  </div>
                </a>
              </li>
            </ul>

            {/* Mobile CTA buttons — premium */}
            <div className="px-4 py-4 border-t border-gold/10">
              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => (window.location.href = '/booking')}
                  className="font-devanagari"
                  fullWidth
                >
                  बुकिंग करें <span className="text-bg-void text-sm">→</span>
                </Button>
                <a
                  href={`tel:${businessSettings.phone}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gold/10 border border-gold/20 text-gold hover:bg-gold/20 transition-all font-devanagari text-sm"
                >
                  <Phone size={14} />
                  अभी कॉल करें — {businessSettings.phone}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
