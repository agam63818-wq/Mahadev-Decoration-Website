'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/** No blanket page entrance; keep the route-keyed public wrapper and admin shell. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return <>{children}</>
  return <div key={pathname} className="min-h-[50vh]">{children}</div>
}
