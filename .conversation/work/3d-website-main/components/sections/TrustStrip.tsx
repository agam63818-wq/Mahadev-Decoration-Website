'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Star, Sparkles, Heart, Shield, Trophy } from 'lucide-react'

const trustItems = [
  { label: 'अनुभवी टीम', icon: Users, color: 'text-gold' },
  { label: 'उचित मूल्य', icon: CreditCard, color: 'text-emerald-400' },
  { label: 'कस्टम डिजाइन', icon: Palette, color: 'text-rose' },
  { label: 'समय पर सेवा', icon: Clock, color: 'text-gold' },
  { label: '24/7 सपोर्ट', icon: Headphones, color: 'text-blue-400' },
  { label: 'प्रीमियम क्वालिटी', icon: Sparkles, color: 'text-gold' },
  { label: '100% संतुष्टि', icon: Heart, color: 'text-rose' },
  { label: '1500+ इवेंट्स', icon: Trophy, color: 'text-gold' },
]

const icons = {
  Users: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  CreditCard: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  Palette: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20v-4" />
      <path d="M4 8V4a2 2 0 012-2h8a2 2 0 012 2v4" />
      <circle cx="12" cy="8" r="3" />
      <circle cx="7" cy="11" r="2" />
      <circle cx="17" cy="11" r="2" />
    </svg>
  ),
  Clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Headphones: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0118 0v6" />
      <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
    </svg>
  ),
  Sparkles: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M18 13l1.5 4.5L24 19l-1.5 4.5L18 25l-4.5-3L9 22l4.5-3 4.5-3 4.5 3" />
    </svg>
  ),
  Heart: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  Trophy: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16v-3H4v3z" />
      <path d="M12 15v6" />
      <path d="M8 18h8" />
    </svg>
  ),
}

export function TrustStrip() {
  const items = [...trustItems, ...trustItems]

  return (
    <div
      className="relative py-2.5 overflow-hidden bg-gradient-to-r from-bg-rich via-bg-purple to-bg-rich"
      aria-label="हमारी विशेषताएं"
    >
      {/* Subtle top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div
        className="flex gap-8 animate-marquee hover:[animation-play-state:paused] whitespace-nowrap"
        aria-hidden="true"
      >
        {items.map((item, i) => (
          <motion.span
            key={i}
            className="flex items-center gap-2 text-sm text-text-muted flex-shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02 }}
          >
            <span className={`${icons[item.icon.name]} ${item.color} flex-shrink-0`} />
            <span className="font-devanagari tracking-wide">{item.label}</span>
            <span className="text-gold/40">✦</span>
          </motion.span>
        ))}
      </div>

      {/* Accessible static version */}
      <ul className="sr-only">
        {trustItems.map((item) => (
          <li key={item.label}>{item.label}</li>
        ))}
      </ul>
    </div>
  )
}
