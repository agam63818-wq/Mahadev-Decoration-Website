'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className = '' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      dialogRef.current?.focus()
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-void/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            onClick={onClose}
            aria-hidden="true"
          />
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            className={`relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gold/20 bg-bg-void p-6 shadow-card-lift animate-in fade-in zoom-in-95 duration-200 ${className}`}
          >
            {title && (
              <div className="mb-5 flex flex-shrink-0 items-center justify-between">
                <h2 id="modal-title" className="font-display font-devanagari text-xl font-semibold text-gold">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-gold/10 hover:text-gold"
                  aria-label="बंद करें"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto pr-1 overscroll-contain">
              {children}
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
