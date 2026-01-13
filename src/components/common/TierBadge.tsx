/**
 * TierBadge Component
 *
 * Displays a tier indicator (T1, T2, T3) with consistent styling.
 */

import type { Tier } from '@/types/state'
import { TIER_COLORS } from '@/lib/tier-colors'

export interface TierBadgeProps {
  tier: Tier
  className?: string
}

export function TierBadge({ tier, className = '' }: TierBadgeProps) {
  return (
    <span
      className={`rounded border px-2 py-0.5 text-xs font-semibold ${TIER_COLORS[tier]} ${className}`}
    >
      {tier}
    </span>
  )
}
