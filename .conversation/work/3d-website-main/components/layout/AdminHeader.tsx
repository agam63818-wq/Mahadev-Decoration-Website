'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export function AdminHeader() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    // Clear any auth state and navigate to login
    sessionStorage.removeItem('admin_auth')
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-bg-void">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />

      {/* Main content area */}
      <div
        className={`transition-all duration-300 pt-16 px-4 lg:px-8 pb-12 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header bar */}
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-display font-bold text-gold font-devanagari">
                एडमिन पैनल
              </h1>
              <p className="text-text-muted text-sm mt-1 font-devanagari">
                महादेव डेकोरेशन — प्रबंधन डैशबोर्ड
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gold/30 text-text-muted hover:text-gold hover:border-gold/50 text-sm font-devanagari transition-all duration-200"
              >
                <LogOut size={16} />
                लॉग आउट
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {/* Outlet will be mounted by Next.js nested routing */}
            <div className="min-h-[60vh]">
              {/* Page content is rendered by child route's page component */}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
