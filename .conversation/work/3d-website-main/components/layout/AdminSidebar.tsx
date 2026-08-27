'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  CreditCard,
  Image,
  Package,
  Star,
  BarChart3,
  Settings,
  LogOut,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface AdminSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
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
  { href: '/admin/portfolio', label: 'पोर्टफोलियो', icon: Image, labelHindi: 'पोर्टफोलियो प्रबंधक' },
  { href: '/admin/packages', label: 'पैकेज', icon: Package, labelHindi: 'पैकेज प्रबंधक' },
  { href: '/admin/reviews', label: 'रिव्यू', icon: Star, labelHindi: 'रिव्यू मध्यस्थ' },
  { href: '/admin/analytics', label: 'एनालिटिक्स', icon: BarChart3, labelHindi: 'एनालिटिक्स' },
  { href: '/admin/settings', label: 'सेटिंग्स', icon: Settings, labelHindi: 'सेटिंग्स' },
]

export function AdminSidebar({
  collapsed = false,
  onToggle,
  onLogout,
  loggingOut = false,
}: AdminSidebarProps) {
  const pathname = usePathname() ?? ''

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-bg-void border-r border-gold/20 flex flex-col transition-all duration-300 lg:translate-x-0',
        collapsed ? 'w-16' : 'w-64'
      )}
      aria-label="एडमिन साइडबार"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gold/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-burgundy flex items-center justify-center flex-shrink-0">
          <span className="text-bg-void font-bold text-sm font-devanagari">म</span>
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display font-bold text-gold text-sm font-devanagari whitespace-nowrap"
          >
            महादेव <span className="text-text-muted font-normal">एडमिन</span>
          </motion.div>
        )}
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
                  ? 'bg-gold/10 text-gold shadow-sm'
                  : 'text-text-muted hover:bg-white/5 hover:text-gold'
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-gold' : 'text-text-muted group-hover:text-gold'
                )}
              />
              {!collapsed && (
                <span className="whitespace-nowrap font-devanagari">{item.labelHindi}</span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-gold"
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
            'text-text-muted hover:bg-white/5 hover:text-gold'
          )}
          title="सेटिंग्स"
        >
          <Settings size={20} className="flex-shrink-0" />
          {!collapsed && <span className="whitespace-nowrap font-devanagari">सेटिंग्स</span>}
        </Link>
        {onLogout && (
          <button
            onClick={onLogout}
            disabled={loggingOut}
            title="लॉग आउट"
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-white/5 hover:text-gold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loggingOut ? (
              <Loader2 size={20} className="flex-shrink-0 animate-spin" />
            ) : (
              <LogOut size={20} className="flex-shrink-0" />
            )}
            {!collapsed && <span className="whitespace-nowrap font-devanagari">लॉग आउट</span>}
          </button>
        )}
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-white/5 hover:text-gold transition-all duration-200"
        >
          <ChevronDown
            size={20}
            className={cn('transition-transform duration-300', collapsed && 'rotate-180')}
          />
          {!collapsed && <span className="font-devanagari">साइडबार टॉगल करें</span>}
        </button>
      </div>
    </aside>
  )
}
