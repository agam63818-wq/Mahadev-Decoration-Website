'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/utils/cn'

type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  open: boolean
  onClose: () => void
  type?: ToastType
  title: string
  description?: string
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
}

const colors = {
  success: 'text-emerald border-emerald/30 bg-emerald/10',
  error: 'text-floral-red border-floral-red/30 bg-floral-red/10',
  info: 'text-gold border-gold/30 bg-gold/10',
}

export function Toast({ open, onClose, type = 'info', title, description }: ToastProps) {
  const Icon = icons[type]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'fixed bottom-24 left-1/2 -translate-x-1/2 z-50',
            'flex items-start gap-3 p-4 rounded-xl border shadow-card-lift',
            'min-w-[280px] max-w-sm',
            'bg-bg-purple',
            colors[type]
          )}
          role="alert"
          aria-live="polite"
        >
          <Icon size={20} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-champagne">{title}</p>
            {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="बंद करें"
            className="flex-shrink-0 text-text-muted hover:text-champagne transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
