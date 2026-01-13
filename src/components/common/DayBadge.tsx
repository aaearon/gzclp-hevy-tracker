/**
 * DayBadge Component
 *
 * Displays a workout day indicator (A1, A2, B1, B2) with consistent styling.
 */

import type { GZCLPDay } from '@/types/state'
import { DAY_COLORS } from '@/lib/tier-colors'

export interface DayBadgeProps {
  day: GZCLPDay
  className?: string
}

export function DayBadge({ day, className = '' }: DayBadgeProps) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${DAY_COLORS[day]} ${className}`}
    >
      {day}
    </span>
  )
}
