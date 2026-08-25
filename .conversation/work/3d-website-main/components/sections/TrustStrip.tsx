'use client'

import { CheckCircle2 } from 'lucide-react'

const trustItems = [
  'अनुभवी टीम',
  'उचित मूल्य',
  'कस्टम डिजाइन',
  'समय पर सेवा',
  'WhatsApp सपोर्ट',
  'प्रोफेशनल सेटअप',
  '100% संतुष्टि',
]

export function TrustStrip() {
  // Duplicate for seamless loop
  const items = [...trustItems, ...trustItems]

  return (
    <div
      className="bg-bg-purple/60 border-y border-gold/10 py-3 overflow-hidden"
      aria-label="हमारी विशेषताएं"
    >
      <div
        className="flex gap-8 animate-marquee hover:[animation-play-state:paused] whitespace-nowrap"
        aria-hidden="true"
      >
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-sm text-text-muted flex-shrink-0">
            <CheckCircle2 size={14} className="text-gold flex-shrink-0" />
            <span className="font-devanagari">{item}</span>
          </span>
        ))}
      </div>
      {/* Accessible static version for screen readers */}
      <ul className="sr-only">
        {trustItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
