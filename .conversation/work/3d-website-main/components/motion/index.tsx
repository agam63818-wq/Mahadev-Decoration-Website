'use client'

// ─── Shared motion primitives ─────────────────────────────────────────────────
// One place for the site's motion language so every page animates the same way:
//   - Reveal        : fade + slide-up on scroll-in (once)
//   - Stagger/Item  : cascading children (cards in a row/grid)
//   - TextReveal    : word-by-word heading reveal on scroll-in
//   - Counter       : number counts up from 0 the first time it's visible
//   - Magnetic      : subtle cursor-follow for primary CTAs (desktop only)
//   - TiltCard      : gentle 3D tilt on hover (desktop only)
//
// Every primitive respects prefers-reduced-motion: content is rendered instantly
// with no transform, never hidden. Nothing here ever gates content visibility on
// an animation that might not fire.

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
  type MouseEvent,
} from 'react'
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion'
import { cn } from '@/utils/cn'

export const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const
export const EASE_OUT = [0.25, 0.46, 0.45, 0.94] as const

/** Coarse-pointer / narrow screens get lighter effects. */
export function useIsDesktopPointer(): boolean {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(pointer: fine) and (min-width: 1024px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return isDesktop
}

// ─── Reveal ───────────────────────────────────────────────────────────────────

interface RevealProps {
  children: ReactNode
  className?: string
  /** Pixels to slide up from. */
  y?: number
  delay?: number
  duration?: number
  once?: boolean
  as?: 'div' | 'section' | 'article' | 'li' | 'span' | 'header' | 'footer'
  style?: CSSProperties
}

export function Reveal({
  children,
  className,
  y = 20,
  delay = 0,
  duration = 0.6,
  once = true,
  as = 'div',
  style,
}: RevealProps) {
  const reduce = useReducedMotion()
  const Comp = motion[as] as typeof motion.div

  if (reduce) {
    const Plain = as as ElementType
    return (
      <Plain className={className} style={style}>
        {children}
      </Plain>
    )
  }

  return (
    <Comp
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-60px 0px' }}
      transition={{ duration, delay, ease: EASE_PREMIUM }}
      className={className}
      style={style}
    >
      {children}
    </Comp>
  )
}

// ─── Stagger container + item ─────────────────────────────────────────────────

interface StaggerProps {
  children: ReactNode
  className?: string
  /** Delay between children. */
  stagger?: number
  delay?: number
  as?: 'div' | 'ul' | 'section'
  style?: CSSProperties
}

export function Stagger({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  as = 'div',
  style,
}: StaggerProps) {
  const reduce = useReducedMotion()
  const Comp = motion[as] as typeof motion.div

  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: reduce ? 0 : delay } },
  }

  return (
    <Comp
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px 0px' }}
      className={className}
      style={style}
    >
      {children}
    </Comp>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
  y?: number
  as?: 'div' | 'li' | 'article'
  style?: CSSProperties
}

export function StaggerItem({ children, className, y = 22, as = 'div', style }: StaggerItemProps) {
  const reduce = useReducedMotion()
  const Comp = motion[as] as typeof motion.div

  const variants: Variants = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_PREMIUM } },
      }

  return (
    <Comp variants={variants} className={className} style={style}>
      {children}
    </Comp>
  )
}

// ─── TextReveal (word-by-word) ────────────────────────────────────────────────

interface TextRevealProps {
  text: string
  className?: string
  /** Wrapper element (h1/h2/p …). */
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  id?: string
  delay?: number
  stagger?: number
  /** Animate immediately on mount instead of on scroll-in (hero use). */
  immediate?: boolean
  /**
   * Classes applied to each word span. Put `bg-clip-text` gradients HERE (not on
   * `className`): a parent clip-text with transformed children paints invisible
   * text in Chromium.
   */
  wordClassName?: string
}

export function TextReveal({
  text,
  className,
  as = 'h2',
  id,
  delay = 0,
  stagger = 0.06,
  immediate = false,
  wordClassName,
}: TextRevealProps) {
  const reduce = useReducedMotion()
  const words = text.split(' ')
  const Wrapper = motion[as] as typeof motion.h2

  if (reduce) {
    const Plain = as as ElementType
    return (
      <Plain id={id} className={className}>
        {wordClassName ? <span className={wordClassName}>{text}</span> : text}
      </Plain>
    )
  }

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }
  const word: Variants = {
    hidden: { opacity: 0, y: '0.6em', rotateX: -30, filter: 'blur(6px)' },
    show: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.7, ease: EASE_PREMIUM },
    },
  }

  return (
    <Wrapper
      id={id}
      className={className}
      variants={container}
      initial="hidden"
      {...(immediate
        ? { animate: 'show' }
        : { whileInView: 'show', viewport: { once: true, margin: '-40px 0px' } })}
      aria-label={text}
      style={{ perspective: 600 }}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block align-baseline" aria-hidden="true">
          <motion.span
            variants={word}
            className={cn('inline-block will-change-transform py-[0.08em]', wordClassName)}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </Wrapper>
  )
}

// ─── Counter ──────────────────────────────────────────────────────────────────

/**
 * Parses "1000+", "4.9★", "₹2,000", "25+" → animates the numeric part from 0
 * and keeps the prefix/suffix. Falls back to plain text if no number found.
 */
export function Counter({
  value,
  className,
  duration = 1.6,
}: {
  value: string
  className?: string
  duration?: number
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px 0px' })
  const match = value.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/)
  const [display, setDisplay] = useState(() => (match ? `${match[1]}0${match[3]}` : value))

  useEffect(() => {
    if (!match) return
    if (reduce || !inView) {
      if (reduce) setDisplay(value)
      return
    }
    const target = parseFloat(match[2].replace(/,/g, ''))
    const decimals = (match[2].split('.')[1] ?? '').length
    const useGrouping = match[2].includes(',')
    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000))
      const eased = 1 - Math.pow(1 - t, 3)
      const current = target * eased
      const formatted = useGrouping
        ? current.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
        : current.toFixed(decimals)
      setDisplay(`${match[1]}${formatted}${match[3]}`)
      if (t < 1) raf = requestAnimationFrame(tick)
      else setDisplay(value)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, value, duration])

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {display}
    </span>
  )
}

// ─── Magnetic (cursor-follow) ─────────────────────────────────────────────────

export function Magnetic({
  children,
  className,
  strength = 0.25,
  radius = 120,
}: {
  children: ReactNode
  className?: string
  strength?: number
  radius?: number
}) {
  const reduce = useReducedMotion()
  const desktop = useIsDesktopPointer()
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })

  const enabled = desktop && !reduce

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    const dist = Math.hypot(dx, dy)
    if (dist > radius) {
      x.set(0)
      y.set(0)
      return
    }
    x.set(dx * strength)
    y.set(dy * strength)
  }
  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={enabled ? { x: sx, y: sy } : undefined}
      className={cn('inline-block', className)}
    >
      {children}
    </motion.div>
  )
}

// ─── TiltCard (3D hover) ──────────────────────────────────────────────────────

export function TiltCard({
  children,
  className,
  maxTilt = 6,
  lift = 6,
  glow = true,
  style,
  onClick,
}: {
  children: ReactNode
  className?: string
  maxTilt?: number
  lift?: number
  glow?: boolean
  style?: CSSProperties
  onClick?: () => void
}) {
  const reduce = useReducedMotion()
  const desktop = useIsDesktopPointer()
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 180, damping: 20 })
  const sry = useSpring(ry, { stiffness: 180, damping: 20 })
  const glowX = useMotionValue(50)
  const glowY = useMotionValue(50)
  const glowBg = useTransform(
    [glowX, glowY],
    ([gx, gy]) =>
      `radial-gradient(400px circle at ${gx}% ${gy}%, rgba(212,175,55,0.14), transparent 60%)`,
  )

  const enabled = desktop && !reduce

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * maxTilt * 2)
    rx.set((0.5 - py) * maxTilt * 2)
    glowX.set(px * 100)
    glowY.set(py * 100)
  }
  const onLeave = () => {
    rx.set(0)
    ry.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      whileHover={reduce ? undefined : { y: -lift }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        rotateX: enabled ? srx : 0,
        rotateY: enabled ? sry : 0,
      }}
      className={cn('relative will-change-transform', className)}
    >
      {children}
      {glow && enabled && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glowBg }}
        />
      )}
    </motion.div>
  )
}

// ─── Section divider glow line ────────────────────────────────────────────────

export function DrawLine({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: EASE_PREMIUM }}
      className={cn('h-px origin-left bg-gradient-to-r from-transparent via-gold/50 to-transparent', className)}
    />
  )
}
