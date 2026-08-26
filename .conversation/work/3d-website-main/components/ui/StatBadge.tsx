import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface StatBadgeProps {
  stat: {
    id: string
    icon: string
    value: string
    label: string
    labelEn: string
  }
  variant?: 'rail' | 'bar' | 'card' | 'compact'
  index?: number
  compact?: boolean
  className?: string
}

const variantStyles: Record<StatBadgeProps['variant'], string> = {
  rail:
    'bg-bg-void/80 border border-gold/15 rounded-xl px-3 py-3 hover:bg-bg-void/90 hover:border-gold/25 transition-all duration-200',
  bar:
    'bg-bg-void/60 border border-gold/10 rounded-xl p-4 hover:border-gold/20 hover:bg-bg-void/80 transition-all duration-200',
  card:
    'bg-gradient-to-br from-bg-void/95 via-bg-rich to-bg-void/95 border border-gold/15 rounded-xl p-4 shadow-lg shadow-gold/3 hover:shadow-xl hover:shadow-gold/5 transition-all duration-300',
  compact:
    'flex items-center gap-3 bg-bg-void/70 border border-gold/10 rounded-xl px-4 py-3 hover:border-gold/25 transition-all duration-200',
}

export function StatBadge({ stat, variant = 'bar', index = 0, compact, className }: StatBadgeProps) {
  const delay = index * 0.1

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={cn('relative', variantStyles[variant], className)}
    >
      {/* Icon */}
      <div className="flex items-center gap-3">
        {/* Gold accent dot/ring */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center flex-shrink-0">
          <span className="text-gold text-sm">
            {stat.icon === 'Users' ? '👥' :
             stat.icon === 'Award' ? '🏆' :
             stat.icon === 'Headphones' ? '🎧' :
             stat.icon === 'Trophy' ? '🏅' :
             stat.icon === 'MapPin' ? '📍' :
             stat.icon === 'Smile' ? '😊' :
             stat.icon === 'CalendarCheck' ? '📅' :
             stat.icon === 'FileText' ? '📝' :
             stat.icon === 'CreditCard' ? '💳' :
             stat.icon === 'DollarSign' ? '💰' :
             stat.icon === 'TrendingUp' ? '📈' :
             stat.icon === 'Clock' ? '⏰' :
             '✦'}
          </span>
        </div>

        {/* Content */}
        <div className="min-w-0">
          {variant === 'compact' ? (
            <div className="flex flex-col">
              <span className="text-text-muted text-xs font-devanagari">{stat.label}</span>
              <span className="text-gold font-bold text-sm font-devanagari">{stat.value}</span>
            </div>
          ) : (
            <>
              <p className="text-text-muted text-xs font-devanagari mb-0.5">{stat.label}</p>
              <p className="text-xl md:text-2xl font-display font-bold text-gold font-devanagari tracking-tight">
                {stat.value}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Premium shimmer line at bottom for bar variant */}
      {variant === 'bar' && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      )}
    </motion.div>
  )
}
