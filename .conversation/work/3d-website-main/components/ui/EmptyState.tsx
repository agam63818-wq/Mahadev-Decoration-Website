import { cn } from '@/utils/cn'

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="w-16 h-16 rounded-full bg-bg-purple border border-gold/20 flex items-center justify-center mb-4">
        <span className="text-2xl">🌸</span>
      </div>
      <h3 className="text-lg font-semibold text-champagne mb-2">{title}</h3>
      {description && <p className="text-text-muted text-sm max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}
