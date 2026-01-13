/**
 * StageBadge Component
 *
 * Displays a stage indicator (Stage 0, 1, 2) with consistent styling.
 */

import type { Stage } from '@/types/state'
import { STAGE_COLORS } from '@/lib/tier-colors'
import { STAGE_DISPLAY } from '@/lib/constants'

export interface StageBadgeProps {
  stage: Stage
  showLabel?: boolean
  className?: string
}

export function StageBadge({ stage, showLabel = true, className = '' }: StageBadgeProps) {
  const label = showLabel ? STAGE_DISPLAY[stage] : `S${stage}`

  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[stage]} ${className}`}
    >
      {label}
    </span>
  )
}
