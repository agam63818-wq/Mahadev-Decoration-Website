'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  CreditCard,
  Image,
  LayoutTemplate,
  Package,
  Star,
  BarChart3,
  Settings,
  LogOut,
  Loader2,
  ChevronDown,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface AdminSidebarProps {
  /** Desktop only: icon-rail mode. */
  collapsed?: boolean
  onToggle?: () => void
  /** Mobile only (< lg): off-canvas drawer open state. */
  mobileOpen?: boolean
  onMobileClose?: () => void
  /** Real Supabase sign-out, provided by AdminShell. */
  onLogout?: () => void
  loggingOut?: boolean
}

const navItems = [
  { href: '/admin', label: 'डैशबोर्ड', icon: LayoutDashboard, labelHindi: 'डैशबोर्ड' },
  { href: '/admin/calendar', label: 'कैलेंडर', icon: Calendar, labelHindi: 'कैलेंडर' },
  { href: '/admin/bookings', label: 'बुकिंग', icon: ClipboardList, labelHindi: 'बुकिंग प्रबंधन' },
  { href: '/admin/customers', label: 'ग्राहक', icon: Users, labelHindi: 'ग्राहक प्रबंधन' },
  { href: '/admin/payments', label: 'पेमेंट', icon: CreditCard, labelHindi: 'पेमेंट प्रबंधन' },
  { href: '/admin/content', label: 'कंटेंट', icon: LayoutTemplate, labelHindi: 'वेबसाइट कंटेंट' },
  { href: '/admin/portfolio', label: 'पोर्टफोलियो', icon: Image, labelHindi: 'पोर्टफोलियो प्रबंधक' },
  { href: '/admin/packages', label: 'पैकेज', icon: Package, labelHindi: 'पैकेज प्रबंधक' },
  { href: '/admin/reviews', label: 'रिव्यू', icon: Star, labelHindi: 'रिव्यू मध्यस्थ' },
  { href: '/admin/analytics', label: 'एनालिटिक्स', icon: BarChart3, labelHindi: 'एनालिटिक्स' },
  { href: '/admin/settings', label: 'सेटिंग्स', icon: Settings, labelHindi: 'सेटिंग्स' },
]

export function AdminSidebar({
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose,
  onLogout,
  loggingOut = false,
}: AdminSidebarProps) {
  const pathname = usePathname() ?? ''

  // Close the drawer whenever the route changes (tap a nav item → navigate → close).
  useEffect(() => {
    onMobileClose?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Escape closes the drawer; lock body scroll while it is open on phones.
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [mobileOpen, onMobileClose])

  // Note: on phones the sidebar is always the full 16rem drawer, so labels are
  // always rendered and only hidden via `lg:hidden` when collapsed on desktop.

  return (
    <>
      {/* Backdrop — mobile drawer only */}
      <div
        aria-hidden="true"
        onClick={onMobileClose}
        className={cn(
          'fixed inset-0 z-40 bg-bg-void/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-[100dvh] bg-gradient-to-b from-bg-rich via-bg-void to-bg-void border-r border-gold/20 flex flex-col transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.35)]',
        // Mobile: off-canvas drawer, always 16rem wide
        'w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: always visible, width follows `collapsed`
        'lg:translate-x-0',
        collapsed ? 'lg:w-16' : 'lg:w-64'
      )}
      aria-label="एडमिन साइडबार"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gold/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-bg-burgundy flex items-center justify-center flex-shrink-0">
          <span className="text-bg-void font-bold text-sm font-devanagari">म</span>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'font-display font-bold text-gold text-sm font-devanagari whitespace-nowrap',
            collapsed && 'lg:hidden'
          )}
        >
          महादेव <span className="text-text-muted font-normal">एडमिन</span>
        </motion.div>
        {/* Close (mobile drawer) */}
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="मेनू बंद करें"
          className="ml-auto lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 text-text-muted hover:text-gold hover:bg-gold/5 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-gold/10 text-gold border border-gold/20 shadow-gold-glow-sm'
                  : 'text-text-muted border border-transparent hover:bg-gold/5 hover:text-gold hover:border-gold/15'
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-gold' : 'text-text-muted group-hover:text-gold'
                )}
              />
              <span className={cn('whitespace-nowrap font-devanagari', collapsed && 'lg:hidden')}>
                {item.labelHindi}
              </span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className={cn('ml-auto w-1.5 h-1.5 rounded-full bg-gold', collapsed && 'lg:hidden')}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-2 border-t border-gold/10">
        <Link
          href="/admin/settings"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            'text-text-muted hover:bg-gold/5 hover:text-gold'
          )}
          title="सेटिंग्स"
        >
          <Settings size={20} className="flex-shrink-0" />
          <span className={cn('whitespace-nowrap font-devanagari', collapsed && 'lg:hidden')}>सेटिंग्स</span>
        </Link>
        {onLogout && (
          <button
            onClick={onLogout}
            disabled={loggingOut}
            title="लॉग आउट"
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-gold/5 hover:text-gold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loggingOut ? (
              <Loader2 size={20} className="flex-shrink-0 animate-spin" />
            ) : (
              <LogOut size={20} className="flex-shrink-0" />
            )}
            <span className={cn('whitespace-nowrap font-devanagari', collapsed && 'lg:hidden')}>लॉग आउट</span>
          </button>
        )}
        {/* Collapse toggle — desktop only; on phones the drawer just closes */}
        <button
          onClick={onToggle}
          className="hidden lg:flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-gold/5 hover:text-gold transition-all duration-200"
          title={collapsed ? 'साइडबार खोलें' : 'साइडबार छोटा करें'}
        >
          <ChevronDown
            size={20}
            className={cn('transition-transform duration-300', collapsed ? 'rotate-90' : '-rotate-90')}
          />
          {!collapsed && <span className="font-devanagari">साइडबार छोटा करें</span>}
        </button>
      </div>
    </aside>
    </>
  )
}
