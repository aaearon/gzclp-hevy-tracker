/**
 * ExerciseCard Component
 *
 * Displays a single exercise with its weight, rep scheme, and tier badge.
 */

import type { ExerciseConfig, ProgressionState, WeightUnit } from '@/types/state'
import { getRepScheme } from '@/lib/constants'
import { formatWeight } from '@/utils/formatting'

interface ExerciseCardProps {
  exercise: ExerciseConfig
  progression: ProgressionState
  weightUnit: WeightUnit
  hasPendingChange?: boolean
}

const tierColors: Record<string, string> = {
  T1: 'bg-red-100 text-red-800 border-red-200',
  T2: 'bg-blue-100 text-blue-800 border-blue-200',
  T3: 'bg-green-100 text-green-800 border-green-200',
}

export function ExerciseCard({
  exercise,
  progression,
  weightUnit,
  hasPendingChange = false,
}: ExerciseCardProps) {
  const scheme = getRepScheme(exercise.tier, progression.stage)

  return (
    <div
      data-testid={`exercise-card-${exercise.id}`}
      className={`
        rounded-lg border bg-white p-4 shadow-sm
        ${hasPendingChange ? 'ring-2 ring-amber-400' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{exercise.name}</h3>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatWeight(progression.currentWeight, weightUnit)}
          </p>
        </div>
        <span
          className={`
            rounded-md border px-2 py-1 text-xs font-semibold
            ${tierColors[exercise.tier] ?? 'bg-gray-100 text-gray-800'}
          `}
        >
          {exercise.tier}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-mono text-gray-600">{scheme.display}</span>
        {progression.amrapRecord > 0 && (
          <span className="text-gray-500">
            PR: {progression.amrapRecord} reps
          </span>
        )}
      </div>

      {hasPendingChange && (
        <div className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
          Pending update
        </div>
      )}
    </div>
  )
}
