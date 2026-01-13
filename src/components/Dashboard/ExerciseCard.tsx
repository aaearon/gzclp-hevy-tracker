/**
 * ExerciseCard Component
 *
 * Displays a single exercise with its weight, rep scheme, and tier badge.
 */

import type { ExerciseConfig, ProgressionState, Tier, WeightUnit } from '@/types/state'
import { getRepScheme } from '@/lib/constants'
import { WeightDisplay } from '@/components/common/WeightDisplay'
import { TierBadge } from '@/components/common/TierBadge'

interface ExerciseCardProps {
  exercise: ExerciseConfig
  progression: ProgressionState
  weightUnit: WeightUnit
  tier: Tier
  hasPendingChange?: boolean
}

export function ExerciseCard({
  exercise,
  progression,
  weightUnit,
  tier,
  hasPendingChange = false,
}: ExerciseCardProps) {
  const scheme = getRepScheme(tier, progression.stage)

  return (
    <div
      data-testid={`exercise-card-${exercise.id}`}
      className={`
        rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm
        ${hasPendingChange ? 'ring-2 ring-amber-400' : ''}
      `}
    >
      {/* Name row with tier badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{exercise.name}</h3>
        <TierBadge tier={tier} />
        {progression.amrapRecord > 0 && (
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            PR: {progression.amrapRecord} reps
          </span>
        )}
      </div>

      {/* Weight and scheme row */}
      <div className="mt-2 flex items-center justify-between">
        <WeightDisplay
          weight={progression.currentWeight}
          unit={weightUnit}
        />
        <span className="font-mono text-sm text-gray-500 dark:text-gray-400">{scheme.display}</span>
      </div>

      {hasPendingChange && (
        <div className="mt-2 rounded bg-amber-50 dark:bg-amber-900/30 px-2 py-1 text-xs text-amber-700 dark:text-amber-300">
          Pending update
        </div>
      )}
    </div>
  )
}
