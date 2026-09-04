'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Database,
  Download,
  Eye,
  Image as ImageIcon,
  Loader2,
  Package,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { OccasionsGrid } from './OccasionsGrid'
import { TeamGrid, type AdminTeamMember } from './TeamGrid'
import { importSeedContent, type ActionResult } from './actions'

// ─── Types shared with page.tsx ───────────────────────────────────────────────

export interface AdminOccasion {
  id: string
  slug: string
  name: string
  nameEn: string | null
  description: string | null
  eventType: string
  startingPrice: number
  /** Raw value stored in DB: storage path, `/assets/...` or absolute URL. */
  imageUrl: string | null
  /** Resolved URL ready for <Image>. */
  imagePublicUrl: string
  imageAlt: string | null
  icon: string | null
  sortOrder: number
  isActive: boolean
}

export interface ContentCounts {
  live: { packages: number; portfolio: number; occasions: number }
  seed: { packages: number; portfolio: number; occasions: number }
  occasionsTableMissing: boolean
}

interface ContentManagerProps {
  counts: ContentCounts
  initialOccasions: AdminOccasion[]
  /** §17: passed through to the grid so it can tell error from empty. */
  occasionsLoadFailed?: boolean
  /** PART 3 §14 — /about team members, from the existing team_members table. */
  initialTeam?: AdminTeamMember[]
  teamLoadFailed?: boolean
  supabaseReady: boolean
}

// The event-type and icon vocabularies now live with the grid that edits them
// (OccasionsGrid / lib/admin/event-types.ts) so they are declared once.

type Toast = { kind: 'ok' | 'error'; text: string } | null

// ─── Component ────────────────────────────────────────────────────────────────

export function ContentManager({
  counts,
  initialOccasions,
  occasionsLoadFailed = false,
  initialTeam = [],
  teamLoadFailed = false,
  supabaseReady,
}: ContentManagerProps) {
  const router = useRouter()
  const [toast, setToast] = useState<Toast>(null)
  const [pending, startTransition] = useTransition()

  const [importPackages, setImportPackages] = useState(counts.live.packages === 0)
  const [importPortfolio, setImportPortfolio] = useState(counts.live.portfolio === 0)
  const [importOccasions, setImportOccasions] = useState(
    counts.live.occasions === 0 && !counts.occasionsTableMissing,
  )

  function notify(result: ActionResult, okText: string) {
    if (result.ok) {
      setToast({ kind: 'ok', text: result.summary ?? okText })
      router.refresh()
    } else {
      setToast({ kind: 'error', text: result.error ?? 'कुछ गलत हो गया' })
    }
    window.setTimeout(() => setToast(null), 6000)
  }

  function runImport() {
    if (!importPackages && !importPortfolio && !importOccasions) {
      setToast({ kind: 'error', text: 'कम से कम एक चीज़ चुनें' })
      return
    }
    startTransition(async () => {
      const res = await importSeedContent({
        packages: importPackages,
        portfolio: importPortfolio,
        occasions: importOccasions,
      })
      notify(res, 'इम्पोर्ट पूरा हुआ')
    })
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-champagne">वेबसाइट कंटेंट</h1>
          <p className="mt-1 text-sm text-text-muted font-devanagari">
            होम पेज के अवसर कार्ड, पैकेज और गैलरी की तस्वीरें — सब यहाँ से बदलें या हटाएँ।
          </p>
        </div>
        {/* Creating a card now happens through the "+ नया कार्ड जोड़ें" tile at the
            end of the grid, so the add affordance sits next to the cards it
            adds to instead of far away in the page header (§7). */}
      </div>

      {toast && (
        <div
          role="status"
          className={cn(
            'rounded-xl border px-4 py-3 text-sm font-devanagari',
            toast.kind === 'ok'
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
              : 'border-floral-red/40 bg-floral-red/15 text-rose',
          )}
        >
          {toast.text}
        </div>
      )}

      {!supabaseReady && (
        <Card variant="outline" className="p-5 border-floral-red/40">
          <p className="text-sm text-rose font-devanagari">
            Supabase कॉन्फ़िगर नहीं है — वेबसाइट अभी सिर्फ़ बिल्ट-इन सैंपल कंटेंट दिखा रही है। पहले
            Vercel में Supabase environment variables सेट करें।
          </p>
        </Card>
      )}

      {/* Import panel */}
      <Card variant="premium" className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-bright to-gold-warm flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-bg-void" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg text-champagne">सैंपल कंटेंट को एडमिन में लाएँ</h2>
            <p className="mt-1 text-sm text-text-muted font-devanagari">
              वेबसाइट पर जो पैकेज, डिज़ाइन और अवसर कार्ड बिल्ट-इन दिख रहे हैं, उन्हें एक क्लिक में
              Supabase में कॉपी करें। इसके बाद हर चीज़ पोर्टफोलियो / पैकेज / यहाँ से बदली या हटाई जा
              सकेगी। पहले से मौजूद चीज़ें दोबारा नहीं बनेंगी।
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ImportRow
            icon={Package}
            title="पैकेज"
            live={counts.live.packages}
            seed={counts.seed.packages}
            checked={importPackages}
            onChange={setImportPackages}
            disabled={!supabaseReady || pending}
          />
          <ImportRow
            icon={ImageIcon}
            title="गैलरी डिज़ाइन"
            live={counts.live.portfolio}
            seed={counts.seed.portfolio}
            checked={importPortfolio}
            onChange={setImportPortfolio}
            disabled={!supabaseReady || pending}
          />
          <ImportRow
            icon={Sparkles}
            title="अवसर कार्ड"
            live={counts.live.occasions}
            seed={counts.seed.occasions}
            checked={importOccasions}
            onChange={setImportOccasions}
            disabled={!supabaseReady || pending || counts.occasionsTableMissing}
            note={
              counts.occasionsTableMissing
                ? 'पहले Supabase SQL editor में migration 0004_occasions_and_content_import.sql चलाएँ'
                : undefined
            }
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={runImport} disabled={!supabaseReady || pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            इम्पोर्ट करें
          </Button>
          <p className="text-xs text-text-muted font-devanagari">
            इम्पोर्ट के बाद: पैकेज →{' '}
            <a href="/admin/packages" className="text-gold-light underline-offset-2 hover:underline">
              पैकेज मैनेजर
            </a>
            , तस्वीरें →{' '}
            <a href="/admin/portfolio" className="text-gold-light underline-offset-2 hover:underline">
              पोर्टफोलियो मैनेजर
            </a>
            , अवसर कार्ड → नीचे।
          </p>
        </div>
      </Card>

      {/* Occasions (§11) — the grid itself is OccasionsGrid, which uses the
          shared EditableCard so occasions, services and packages all behave
          identically for the owner. */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl text-champagne">
            होम पेज अवसर कार्ड{' '}
            <span className="text-sm text-text-muted font-devanagari">
              ({initialOccasions.length})
            </span>
          </h2>
        </div>

        {counts.occasionsTableMissing ? (
          <Card variant="outline" className="p-5">
            <p className="text-sm text-text-muted font-devanagari">
              <span className="text-gold-light">occasions</span> टेबल अभी Supabase में नहीं है। Supabase →
              SQL Editor में{' '}
              <code className="text-champagne">supabase/migrations/0004_occasions_and_content_import.sql</code>{' '}
              चलाएँ, फिर यह पेज रीफ़्रेश करें।
            </p>
          </Card>
        ) : (
          <OccasionsGrid
            occasions={initialOccasions}
            loadFailed={occasionsLoadFailed}
            supabaseReady={supabaseReady}
          />
        )}
      </section>

      {/*
        PART 3 §14–§16 — team members.

        Placed here rather than at a new /admin/team route because §15 asks for
        the EXISTING settings/content area, and this page is already "everything
        the public site shows". Same EditableCard, same ↑↓ reorder, same
        card-images bucket as every other card in the panel.
      */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl text-champagne">
            टीम सदस्य{' '}
            <span className="text-sm text-text-muted font-devanagari">({initialTeam.length})</span>
          </h2>
          <p className="font-devanagari text-xs text-text-muted">
            वेबसाइट के “हमारे बारे में → हमारी टीम” वाले कार्ड
          </p>
        </div>

        <TeamGrid
          members={initialTeam}
          loadFailed={teamLoadFailed}
          supabaseReady={supabaseReady}
        />
      </section>
    </div>
  )
}

// ─── Import row ───────────────────────────────────────────────────────────────

function ImportRow({
  icon: Icon,
  title,
  live,
  seed,
  checked,
  onChange,
  disabled,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  live: number
  seed: number
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  note?: string
}) {
  const usingSeed = live === 0
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
        checked ? 'border-gold/50 bg-gold/5' : 'border-gold/15 bg-bg-void/40',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-[#C9A84C]"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gold" />
          <span className="font-devanagari text-sm text-champagne">{title}</span>
        </div>
        <p className="mt-1 text-xs text-text-muted font-devanagari">
          सैंपल: {seed} · एडमिन में: {live}
        </p>
        <span
          className={cn(
            'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-devanagari',
            usingSeed ? 'bg-gold/10 text-gold-light' : 'bg-emerald-400/10 text-emerald-300',
          )}
        >
          {usingSeed ? (
            <>
              <Eye className="w-3 h-3" /> वेबसाइट सैंपल दिखा रही है
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3" /> वेबसाइट एडमिन डेटा दिखा रही है
            </>
          )}
        </span>
        {note && <p className="mt-2 text-[11px] text-rose font-devanagari">{note}</p>}
      </div>
    </label>
  )
}
