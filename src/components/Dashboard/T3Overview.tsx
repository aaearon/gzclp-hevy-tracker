/**
 * T3Overview Component
 *
 * Summary display of all configured T3 accessories with:
 * - Current weight for each T3
 * - Which days each T3 is scheduled (e.g., "A1, B1" or "All days")
 *
 * Provides visibility into T3 progression similar to MainLiftCard for T1/T2.
 */

import { useMemo, useState } from 'react'
import type { ExerciseConfig, GZCLPDay, ProgressionState, WeightUnit } from '@/types/state'
import { getRepScheme } from '@/lib/constants'
import { displayWeight } from '@/utils/formatting'

interface T3OverviewProps {
  exercises: Record<string, ExerciseConfig>
  progression: Record<string, ProgressionState>
  weightUnit: WeightUnit
  t3Schedule: Record<GZCLPDay, string[]>
}

const ALL_DAYS: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']

/** Default number of T3 exercises to show (3x3 grid) */
const DEFAULT_DISPLAY_COUNT = 9

/**
 * Get the days an exercise is scheduled for.
 */
function getScheduledDays(exerciseId: string, t3Schedule: Record<GZCLPDay, string[]>): GZCLPDay[] {
  const days: GZCLPDay[] = []
  for (const day of ALL_DAYS) {
    if (t3Schedule[day].includes(exerciseId)) {
      days.push(day)
    }
  }
  return days
}

export function T3Overview({
  exercises,
  progression,
  weightUnit,
  t3Schedule,
}: T3OverviewProps) {
  // State for showing all exercises vs limited set
  const [showAll, setShowAll] = useState(false)

  // Get all T3 exercises with their schedule info
  const t3Exercises = useMemo(() => {
    const t3s: {
      exercise: ExerciseConfig
      prog: ProgressionState | undefined
      scheduledDays: GZCLPDay[]
    }[] = []

    for (const exercise of Object.values(exercises)) {
      if (exercise.role === 't3') {
        const prog = progression[exercise.id]
        const scheduledDays = getScheduledDays(exercise.id, t3Schedule)
        t3s.push({ exercise, prog, scheduledDays })
      }
    }

    // Sort by name
    return t3s.sort((a, b) => a.exercise.name.localeCompare(b.exercise.name))
  }, [exercises, progression, t3Schedule])

  if (t3Exercises.length === 0) {
    return null
  }

  const scheme = getRepScheme('T3', 0)

  // Determine which exercises to display
  const hasMore = t3Exercises.length > DEFAULT_DISPLAY_COUNT
  const displayedExercises = showAll ? t3Exercises : t3Exercises.slice(0, DEFAULT_DISPLAY_COUNT)
  const hiddenCount = t3Exercises.length - DEFAULT_DISPLAY_COUNT

  return (
    <section className="space-y-4" data-testid="t3-overview">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Accessories (T3)</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t3Exercises.length} exercise{t3Exercises.length !== 1 ? 's' : ''} configured - {scheme.display}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {displayedExercises.map(({ exercise, prog, scheduledDays }) => (
          <div
            key={exercise.id}
            className="rounded-lg border border-green-200 dark:border-green-800 bg-white dark:bg-green-900/30 p-4 shadow-sm"
          >
            {/* Exercise name with day pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100" title={exercise.name}>
                {exercise.name}
              </h3>
              {scheduledDays.map((day) => (
                <span
                  key={day}
                  className="rounded bg-green-100 dark:bg-green-800/50 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Weight and PR */}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-bold text-green-700 dark:text-green-300">
                {prog ? displayWeight(prog.currentWeight, weightUnit) : 'TBD'}
              </span>
              {prog && prog.amrapRecord > 0 && (
                <span
                  className="text-xs text-gray-500 dark:text-gray-400 cursor-help"
                  title={prog.amrapRecordDate
                    ? `Set on ${new Date(prog.amrapRecordDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}`
                    : 'PR date unknown'
                  }
                >
                  PR: {prog.amrapRecord} reps
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Show more/less button */}
      {hasMore && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => { setShowAll(!showAll) }}
            className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
          >
            {showAll ? 'Show less' : `Show ${String(hiddenCount)} more exercise${hiddenCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </section>
  )
}
