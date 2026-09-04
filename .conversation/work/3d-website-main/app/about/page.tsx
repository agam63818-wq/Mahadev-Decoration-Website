import type { Metadata } from 'next'
import { SectionFlourish } from '@/components/ui/SectionFlourish'
import { getTeamMembers, getStatsBar, getBusinessSettings } from '@/services/business'
import { AboutClient } from '@/features/about/AboutClient'

export const metadata: Metadata = {
  title: 'हमारे बारे में — महादेव डेकोरेशन की कहानी',
  description:
    'महादेव डेकोरेशन — बेगूसराय में 5+ वर्षों से प्रीमियम डेकोरेशन सर्विस। 1500+ इवेंट्स, 25+ टीम मेंबर, 1000+ खुश ग्राहक।',
  openGraph: {
    title: 'हमारे बारे में | महादेव डेकोरेशन',
    description: 'बेगूसराय में 5+ वर्षों से प्रीमियम डेकोरेशन — हमारी कहानी',
  },
}

// Team members are admin-editable in the database, so this page must not be
// statically cached or the owner's edits would never appear.
export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const [teamResult, stats, business] = await Promise.all([
    getTeamMembers(),
    getStatsBar(),
    getBusinessSettings(),
  ])

  return (
    <div className="min-h-screen bg-bg-void pt-20">
      {/* Hero */}
      <div className="bg-gradient-to-b from-bg-purple to-bg-void py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <SectionFlourish className="mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold font-devanagari bg-gradient-to-r from-champagne via-gold to-champagne bg-clip-text text-transparent mb-4">
            हमारे बारे में
          </h1>
          <p className="text-text-muted text-lg font-devanagari leading-relaxed max-w-2xl mx-auto">
            {business.taglineSecondary} — बेगूसराय में 5+ वर्षों से हर खुशी को यादगार बनाते हैं।
          </p>
        </div>
      </div>

      {/* teamError tells AboutClient to render a retryable error state for the
          team section instead of silently showing the old static array. */}
      <AboutClient
        teamMembers={teamResult.ok ? teamResult.data : []}
        teamError={!teamResult.ok}
        stats={stats}
        business={business}
      />
    </div>
  )
}
