'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
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
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

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
    <div className="relative min-h-screen bg-bg-void">
      {/* Calm ambient brand glow — same palette as the public site, far quieter */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(900px_circle_at_15%_-10%,rgba(201,168,76,0.07),transparent_60%),radial-gradient(700px_circle_at_100%_100%,rgba(139,30,63,0.10),transparent_60%)]"
      />
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      {/* Main content area */}
      <div
        className={`relative z-10 transition-all duration-300 pt-16 px-4 lg:px-8 pb-12 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header bar */}
          <header className="relative flex flex-wrap items-center justify-between gap-4 mb-8 pb-5">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-gold/40 via-gold/10 to-transparent" aria-hidden="true" />
            <div>
              <h1 className="text-2xl font-display font-bold font-devanagari bg-gradient-to-r from-champagne via-gold to-gold-bright bg-clip-text text-transparent">
                एडमिन पैनल
              </h1>
              <p className="text-text-muted text-sm mt-1 font-devanagari">
                महादेव डेकोरेशन — प्रबंधन डैशबोर्ड
              </p>
            </div>

            <div className="flex items-center gap-3">
              {(displayName || userEmail) && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm text-text-primary font-devanagari leading-tight">
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gold/30 bg-bg-rich/60 text-text-muted hover:text-gold hover:border-gold/60 hover:shadow-gold-glow-sm text-sm font-devanagari transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loggingOut ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogOut size={16} />
                )}
                लॉग आउट
              </button>
            </div>
          </header>

          {/* Actual page content — this is what the old AdminHeader dropped. */}
          {/* Minimal motion in admin: a single soft fade on mount, nothing per-item. */}
          <div className="min-h-[60vh] motion-safe:animate-[reveal-in_0.35s_ease-out]">{children}</div>
        </div>
      </div>
    </div>
  )
}
