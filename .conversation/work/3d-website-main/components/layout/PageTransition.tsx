'use client'

import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { EASE_PREMIUM } from '@/components/motion'

/**
 * Light page-entrance transition: content fades + slides up 12px whenever the
 * route changes. Deliberately entrance-only (no exit/unmount wait) so navigation
 * is never delayed and Suspense/streaming keep working as-is.
 *
 * - Skipped for /admin (dense tools → instant) and for prefers-reduced-motion.
 * - Never hides content: opacity animates from 0 → 1 in 350ms on the client,
 *   and the server-rendered HTML is fully visible (initial={false} on first paint
 *   is not used because the same element re-keys per route; SSR output is still
 *   the final state thanks to framer's style hydration).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const isAdmin = pathname?.startsWith('/admin')

  if (reduce || isAdmin) return <>{children}</>

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_PREMIUM }}
      className="min-h-[50vh]"
    >
      {children}
    </motion.div>
  )
}
