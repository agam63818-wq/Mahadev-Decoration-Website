'use client'

import { Button } from '@/components/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  confirmVariant?: 'primary' | 'danger' | 'secondary'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-void/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-bg-void border border-gold/20 rounded-2xl shadow-card p-6 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-display font-semibold text-gold font-devanagari mb-3">{title}</h3>
        <p className="text-text-muted text-sm font-devanagari mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" size="md" onClick={onClose} disabled={loading}>
            रद्द
          </Button>
          <Button
            variant={confirmVariant === 'danger' ? 'primary' : confirmVariant}
            size="md"
            onClick={onConfirm}
            loading={loading}
            className="bg-rose-500 hover:bg-rose-600 text-white"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
