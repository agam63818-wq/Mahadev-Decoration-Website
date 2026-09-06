'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useReducedMotion } from 'framer-motion'
import { ArrowDown, ArrowUpRight, MapPin, Pause, Play } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { heroStats } from '@/lib/data'
import { useBusinessSettings, useContactAvailability } from '@/components/providers/BusinessSettingsProvider'
import { buildWhatsAppUrl } from '@/utils/booking'

const HERO_VIDEO = '/video/hero.mp4'
const HERO_POSTER = '/video/hero-poster.jpg'

export function HeroSection() {
  const reduce = useReducedMotion()
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const business = useBusinessSettings()
  const { whatsapp, hasWhatsapp } = useContactAvailability()
  const whatsappUrl = buildWhatsAppUrl(whatsapp, 'नमस्ते! मुझे डेकोरेशन बुकिंग के बारे में जानकारी चाहिए।')

  const toggleVideo = () => {
    const media = video.current
    if (!media) return
    if (media.paused) media.play().catch(() => setPlaying(false))
    else media.pause()
  }

  return (
    <section className="editorial-hero" aria-labelledby="hero-heading">
      <div className="hero-layout">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow"><span /> WEDDINGS & CELEBRATIONS</p>
          <p className="hero-brand-line">{business.businessNameHindi}</p>
          <h1 id="hero-heading">हर खुशी को<br />बनाएं <span>यादगार।</span></h1>
          <p className="hero-description">आपके खास दिन के लिए, आपके दिल जैसी सजावट।<br className="hidden sm:block" /> शादी से लेकर हर छोटे-बड़े जश्न तक — हर बारीकी में आपका अंदाज़।</p>
          <div className="hero-actions">
            <Link href="/booking" className="editorial-button button-brass">अपना इवेंट प्लान करें <ArrowUpRight size={18} /></Link>
            <Link href="/gallery" className="editorial-button button-outline">हमारा काम देखें <ArrowUpRight size={18} /></Link>
          </div>
          {hasWhatsapp && <a className="hero-whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={17} /><span>कुछ पूछना है? WhatsApp पर बात करें</span><ArrowUpRight size={14} /></a>}
          <dl className="hero-stats">
            {heroStats.map(stat => <div key={stat.id}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}
          </dl>
        </div>
        <div className="hero-visual">
          <div className="hero-arch-outline" aria-hidden="true" />
          <figure className="hero-photo">
            {/* Keep the existing first-party footage and an immediate still fallback. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_POSTER} alt="फूलों, रोशनी और शाही सोफे से सजा महादेव डेकोरेशन का वेडिंग स्टेज" fetchPriority="high" decoding="async" />
            {!reduce && !failed && <video ref={video} src={HERO_VIDEO} poster={HERO_POSTER} muted loop playsInline autoPlay preload="metadata" onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false) }} aria-hidden="true" tabIndex={-1} />}
            <div className="hero-photo-shade" />
            <figcaption><span className="eyebrow">THE MAHADEV TOUCH</span><span>सिर्फ सजावट नहीं,<br />एक खूबसूरत एहसास।</span></figcaption>
            {!reduce && !failed && <button className="hero-video-toggle" onClick={toggleVideo} aria-label={playing ? 'वीडियो रोकें' : 'वीडियो चलाएं'}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>}
          </figure>
          <span className="hero-side-note" aria-hidden="true">THOUGHTFULLY DESIGNED. BEAUTIFULLY CELEBRATED.</span>
        </div>
      </div>
      <div className="hero-baseline"><span><MapPin size={14} /> बेगूसराय से पूरे बिहार तक</span><a href="#trust">आगे देखें <ArrowDown size={14} /></a></div>
    </section>
  )
}
