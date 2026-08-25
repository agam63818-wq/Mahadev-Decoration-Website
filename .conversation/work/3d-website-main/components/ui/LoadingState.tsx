import { cn } from '@/utils/cn'

interface LoadingStateProps {
  className?: string
  message?: string
}

export function LoadingState({ className, message = 'लोड हो रहा है...' }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 gap-4', className)}>
      <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      <p className="text-text-muted text-sm">{message}</p>
    </div>
  )
}
