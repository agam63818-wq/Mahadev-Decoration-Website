'use client'

import { useEffect } from 'react'
import { useReducedMotion } from './useReducedMotion'

export function useLenis() {
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (prefersReduced) return

    let lenis: { destroy: () => void; raf: (time: number) => void } | null = null
    let rafId: number

    const init = async () => {
      try {
        const { default: Lenis } = await import('lenis')
        lenis = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
        })

        function raf(time: number) {
          lenis?.raf(time)
          rafId = requestAnimationFrame(raf)
        }
        rafId = requestAnimationFrame(raf)
      } catch {
        // Lenis not available — graceful fallback to native scroll
      }
    }

    init()

    return () => {
      cancelAnimationFrame(rafId)
      lenis?.destroy()
    }
  }, [prefersReduced])
}
