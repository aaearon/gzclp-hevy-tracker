/**
 * ExerciseCard Component
 *
 * Displays a single exercise with its weight, rep scheme, and tier badge.
 */

import type { ExerciseConfig, ProgressionState, Tier, WeightUnit } from '@/types/state'
import { getRepScheme } from '@/lib/constants'
import { formatWeight } from '@/utils/formatting'

interface ExerciseCardProps {
  exercise: ExerciseConfig
  progression: ProgressionState
  weightUnit: WeightUnit
  tier: Tier
  hasPendingChange?: boolean
}

const tierColors: Record<string, string> = {
  T1: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  T2: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  T3: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
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
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{exercise.name}</h3>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatWeight(progression.currentWeight, weightUnit)}
          </p>
        </div>
        <span
          className={`
            rounded-md border px-2 py-1 text-xs font-semibold
            ${tierColors[tier] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}
          `}
        >
          {tier}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-mono text-gray-600 dark:text-gray-400">{scheme.display}</span>
        {progression.amrapRecord > 0 && (
          <span className="text-gray-500 dark:text-gray-400">
            PR: {progression.amrapRecord} reps
          </span>
        )}
      </div>

      {hasPendingChange && (
        <div className="mt-2 rounded bg-amber-50 dark:bg-amber-900/30 px-2 py-1 text-xs text-amber-700 dark:text-amber-300">
          Pending update
        </div>
      )}
    </div>
  )
}
