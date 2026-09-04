'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2, Menu, ExternalLink } from 'lucide-react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { NotificationBell } from '@/components/admin/NotificationBell'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/auth/roles'

interface AdminShellProps {
  children: React.ReactNode
  userEmail?: string | null
  displayName?: string | null
  role?: UserRole
}

const roleLabels: Record<string, string> = {
  admin: 'एडमिन',
  team: 'टीम',
  customer: 'ग्राहक',
}

/**
 * Admin chrome: sidebar + header + the actual page content.
 *
 * Responsive contract:
 *  - < lg  : sidebar is an off-canvas drawer opened from the hamburger in the
 *            sticky header; content is full-width with no left margin.
 *  - >= lg : sidebar is always visible (16rem, or a 4rem icon rail when
 *            collapsed) and content is offset accordingly.
 *
 * Replaces the previous AdminHeader, which never rendered `children` (so every
 * admin page body was silently dropped) and "logged out" by clearing a
 * sessionStorage flag — which did not invalidate the real Supabase session.
 */
export function AdminShell({
  children,
  userEmail,
  displayName,
  role,
}: AdminShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      const supabase = getSupabaseBrowserClient()
      // Clears the auth cookies both locally and server-side, so the
      // middleware guard immediately stops letting this browser through.
      if (supabase) await supabase.auth.signOut()
    } finally {
      router.replace('/admin/login')
      router.refresh()
    }
  }

  return (
    <div className="relative min-h-screen bg-bg-void admin-shell">
      {/* Calm ambient brand glow — same palette as the public site, far quieter */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(900px_circle_at_15%_-10%,rgba(201,168,76,0.07),transparent_60%),radial-gradient(700px_circle_at_100%_100%,rgba(139,30,63,0.10),transparent_60%)]"
      />
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      {/* Main content area — full width on phones, offset by the sidebar on desktop */}
      <div
        className={`relative z-10 min-w-0 transition-[margin] duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {/* Sticky header: hamburger (mobile) + title + user + logout */}
        <header className="sticky top-0 z-30 border-b border-gold/15 bg-bg-void/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg-void/70">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="मेनू खोलें"
              aria-expanded={mobileOpen}
              className="lg:hidden inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-bg-rich/60 text-gold hover:bg-gold/10 active:scale-95 transition-all"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg sm:text-2xl font-display font-bold font-devanagari bg-gradient-to-r from-champagne via-gold to-gold-bright bg-clip-text text-transparent leading-tight">
                एडमिन पैनल
              </h1>
              <p className="hidden sm:block text-text-muted text-xs sm:text-sm font-devanagari truncate">
                महादेव डेकोरेशन — प्रबंधन डैशबोर्ड
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/*
               * PART 3 §9/§25 — the bell lives in the shared shell so it is
               * reachable from every admin route on both phone and desktop.
               * It renders its own relative wrapper; the panel is `fixed` on
               * small screens so it can never overflow the header.
               */}
              <NotificationBell />
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                title="वेबसाइट देखें"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gold/20 text-text-muted hover:text-gold hover:border-gold/50 text-xs font-devanagari transition-all"
              >
                <ExternalLink size={14} />
                वेबसाइट
              </Link>
              {(displayName || userEmail) && (
                <div className="hidden md:block text-right max-w-[180px]">
                  <p className="text-sm text-text-primary font-devanagari leading-tight truncate">
                    {displayName || userEmail}
                  </p>
                  {role && (
                    <p className="text-xs text-gold/70 font-devanagari">
                      {roleLabels[role] ?? role}
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label="लॉग आउट"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-gold/30 bg-bg-rich/60 text-text-muted hover:text-gold hover:border-gold/60 hover:shadow-gold-glow-sm text-sm font-devanagari transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loggingOut ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogOut size={16} />
                )}
                <span className="hidden sm:inline">लॉग आउट</span>
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16">
          {/* Actual page content — this is what the old AdminHeader dropped. */}
          {/* Minimal motion in admin: a single soft fade on mount, nothing per-item. */}
          <div className="min-h-[60vh] min-w-0 motion-safe:animate-[reveal-in_0.35s_ease-out]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
