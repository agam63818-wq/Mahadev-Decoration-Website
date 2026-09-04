'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { ErrorState } from './ErrorState'

interface RetryableErrorStateProps {
  title?: string
  description?: string
  className?: string
}

/**
 * Server-Component-friendly wrapper around <ErrorState>.
 *
 * The pages changed in this upgrade are Server Components, so they cannot pass
 * an `onRetry` function to a client component. This thin client wrapper owns
 * the retry handler and calls router.refresh(), which re-runs the server render
 * (and therefore the Supabase query) without a full page reload.
 *
 * Default copy is the wording required by the brief: "डेटा लोड नहीं हो सका" /
 * "कृपया फिर कोशिश करें".
 */
export function RetryableErrorState({
  title = 'डेटा लोड नहीं हो सका',
  description = 'कृपया फिर कोशिश करें',
  className,
}: RetryableErrorStateProps) {
  const router = useRouter()
  const [isRetrying, startTransition] = useTransition()

  const handleRetry = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <ErrorState
      title={title}
      description={isRetrying ? 'फिर कोशिश कर रहे हैं...' : description}
      onRetry={handleRetry}
      className={className}
    />
  )
}
