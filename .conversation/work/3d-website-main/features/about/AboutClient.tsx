'use client'

import { motion } from 'framer-motion'
import { Award, Users, MapPin, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { TeamMember, Stat, BusinessSettings } from '@/types'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StatBadge } from '@/components/ui/StatBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'

interface AboutClientProps {
  teamMembers: TeamMember[]
  /** True when the team_members query failed — shows a retryable error state. */
  teamError?: boolean
  stats: Stat[]
  business: BusinessSettings
}

/**
 * One team card. Renders the admin-uploaded photo_url when present and falls
 * back to the member's initial only when there is genuinely no photo (or the
 * photo fails to load), so a deleted storage object never leaves a broken
 * image on the page.
 */
function TeamCard({ member, index }: { member: TeamMember; index: number }) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const showPhoto = Boolean(member.photoUrl) && !photoFailed

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-bg-purple border border-gold/10 rounded-2xl p-6 hover:border-gold/30 transition-colors"
    >
      {/* Avatar — real photo, else initial */}
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-gold/30 to-bg-burgundy border-2 border-gold/30 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gold">
        {showPhoto ? (
          <Image
            src={member.photoUrl}
            alt={member.photoAlt || member.name}
            fill
            sizes="80px"
            onError={() => setPhotoFailed(true)}
            className="object-cover"
          />
        ) : (
          member.name.charAt(0)
        )}
      </div>
      <div className="text-center">
        <h3 className="text-champagne font-bold font-devanagari">{member.name}</h3>
        {member.roleHindi && (
          <p className="text-gold text-sm font-devanagari">{member.roleHindi}</p>
        )}
        {/* The bio and years-of-experience lines are only rendered when the
            row actually has that data. team_members has no bio/experience
            columns, so inventing "5+ वर्ष" for every member would be fake. */}
        {member.bio && (
          <p className="mt-3 text-text-muted text-sm font-devanagari leading-relaxed">
            {member.bio}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export function AboutClient({ teamMembers, teamError, stats, business }: AboutClientProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
      {/* Brand story */}
      <section aria-labelledby="story-heading">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 id="story-heading" className="text-3xl font-bold text-champagne font-devanagari mb-4">
              हमारी कहानी
            </h2>
            <div className="space-y-4 text-text-muted font-devanagari leading-relaxed">
              <p>
                महादेव डेकोरेशन की शुरुआत एक सपने से हुई — बेगूसराय के हर खास मौके को और भी खूबसूरत बनाने का सपना।
                5+ वर्षों पहले, जब हमने शुरुआत की थी, तो हमारे पास सिर्फ एक छोटी सी टीम और एक बड़ा जुनून था।
              </p>
              <p>
                आज, 1500+ सफल इवेंट्स और 1000+ खुश ग्राहकों के साथ, हम बेगूसराय और आसपास के 10+ शहरों में
                प्रीमियम डेकोरेशन सर्विस दे रहे हैं। हमारी 25+ सदस्यों की टीम हर इवेंट को एक यादगार अनुभव बनाती है।
              </p>
              <p>
                हमारा मानना है कि हर खुशी का मौका खास होता है — चाहे वो एक छोटा बर्थडे हो या एक भव्य शादी।
                हम हर इवेंट में अपना दिल लगाते हैं।
              </p>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            {stats.map((stat, i) => (
              <div
                key={stat.id}
                className="bg-bg-purple border border-gold/20 rounded-2xl p-6 text-center hover:border-gold/40 transition-colors"
              >
                <StatBadge stat={stat} variant="bar" index={i} />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section aria-labelledby="values-heading">
        <SectionHeading id="values-heading" title="हमारे मूल्य" className="mb-10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Heart, title: 'जुनून', desc: 'हर काम में दिल लगाते हैं — सिर्फ सजावट नहीं, यादें बनाते हैं।' },
            { icon: Award, title: 'गुणवत्ता', desc: 'प्रीमियम मटेरियल, प्रोफेशनल टीम, और बेहतरीन रिजल्ट।' },
            { icon: Users, title: 'विश्वास', desc: '1000+ ग्राहकों का भरोसा — हमारी सबसे बड़ी उपलब्धि।' },
            { icon: MapPin, title: 'स्थानीय', desc: 'बेगूसराय का अपना ब्रांड — स्थानीय समझ, वैश्विक स्तर।' },
          ].map((value, i) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-bg-purple border border-gold/10 rounded-2xl p-6 text-center hover:border-gold/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                <value.icon size={22} className="text-gold" />
              </div>
              <h3 className="text-champagne font-bold font-devanagari mb-2">{value.title}</h3>
              <p className="text-text-muted text-sm font-devanagari leading-relaxed">{value.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section aria-labelledby="team-heading">
        <SectionHeading id="team-heading" title="हमारी टीम" className="mb-10" />
        {teamError ? (
          <RetryableErrorState />
        ) : teamMembers.length === 0 ? (
          <EmptyState
            title="टीम की जानकारी उपलब्ध नहीं"
            description="अभी टीम के सदस्य जोड़े नहीं गए हैं।"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member, i) => (
              <TeamCard key={member.id} member={member} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="text-center py-12 bg-bg-purple/30 rounded-3xl border border-gold/10">
        <h2 className="text-2xl font-bold text-champagne font-devanagari mb-4">
          अपना इवेंट हमारे साथ यादगार बनाएं
        </h2>
        <p className="text-text-muted font-devanagari mb-6">
          {business.phone} पर कॉल करें या बुकिंग फॉर्म भरें
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/booking"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gold text-bg-void font-bold hover:bg-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold font-devanagari"
          >
            बुकिंग करें
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-gold text-gold hover:bg-gold hover:text-bg-void transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold font-devanagari"
          >
            संपर्क करें
          </Link>
        </div>
      </section>
    </div>
  )
}
