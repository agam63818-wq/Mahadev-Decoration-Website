import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ─── Icon resolver ─────────────────────────────────────────────────────────────
// Safely resolves a Lucide icon by name string.
// Returns null if the icon doesn't exist.
export function getIcon(name: string): LucideIcon | null {
  const icon = (LucideIcons as unknown as Record<string, LucideIcon>)[name]
  return icon ?? null
}
