/**
 * Next Workout Modal Component
 *
 * [GAP-15] Displays a preview of the next workout with:
 * - Header showing day name + date
 * - Collapsible warmup section for T1
 * - T1 exercise with AMRAP indicator
 * - T2 exercise
 * - T3 exercises
 * - (Estimated duration - placeholder for Task 3.4)
 */

import { useMemo } from 'react'
import type { ExerciseConfig, GZCLPDay, ProgressionState, WeightUnit } from '@/types/state'
import { getRepScheme, WARMUP_CONFIG } from '@/lib/constants'
import { formatWeight, convertWeight } from '@/utils/formatting'
import { getExercisesForDay, getTierForDay, getProgressionKey } from '@/lib/role-utils'
import { CollapsibleSection } from '@/components/common/CollapsibleSection'

// =============================================================================
// Types
// =============================================================================

interface TodaysWorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  day: GZCLPDay
  exercises: Record<string, ExerciseConfig>
  progression: Record<string, ProgressionState>
  weightUnit: WeightUnit
  t3Schedule: Record<GZCLPDay, string[]>
}

interface WarmupSet {
  weight: number // in kg
  reps: number
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Round weight to nearest increment.
 */
function roundToNearest(weight: number, increment: number): number {
  return Math.round(weight / increment) * increment
}

/**
 * Generate warmup sets for display (T1 only).
 *
 * Light lifts (≤40kg): Bar only x10, 50% x5, 75% x3
 * Heavy lifts (>40kg): 50% x5, 70% x3, 85% x2
 */
function generateWarmupSetsForDisplay(workingWeightKg: number): WarmupSet[] {
  const BAR_WEIGHT = WARMUP_CONFIG.minWeight
  const isHeavy = workingWeightKg > WARMUP_CONFIG.heavyThreshold

  const percentages = isHeavy ? WARMUP_CONFIG.heavyPercentages : WARMUP_CONFIG.lightPercentages
  const reps = isHeavy ? WARMUP_CONFIG.heavyReps : WARMUP_CONFIG.lightReps

  const sets: WarmupSet[] = []

  for (let i = 0; i < percentages.length; i++) {
    const pct = percentages[i]
    if (pct === undefined) continue

    const weight =
      pct === 0 ? BAR_WEIGHT : Math.max(BAR_WEIGHT, roundToNearest(workingWeightKg * pct, 2.5))

    // Smart filtering: skip if weight equals previous set (avoid duplicates)
    const lastSet = sets[sets.length - 1]
    if (lastSet?.weight === weight) {
      continue
    }

    const repCount = reps[i]
    if (repCount !== undefined) {
      sets.push({ weight, reps: repCount })
    }
  }

  return sets
}

/**
 * Format date for display.
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// =============================================================================
// Component
// =============================================================================

export function TodaysWorkoutModal({
  isOpen,
  onClose,
  day,
  exercises,
  progression,
  weightUnit,
  t3Schedule,
}: TodaysWorkoutModalProps) {
  // Get exercises for today
  const dayExercises = useMemo(
    () => getExercisesForDay(exercises, day, t3Schedule),
    [exercises, day, t3Schedule]
  )

  // Get T1 progression and warmup sets
  const t1Data = useMemo(() => {
    if (!dayExercises.t1?.role) return null

    const tier = getTierForDay(dayExercises.t1.role, day)
    if (tier !== 'T1') return null

    const progressionKey = getProgressionKey(dayExercises.t1.id, dayExercises.t1.role, 'T1')
    const prog = progression[progressionKey]
    if (!prog) return null

    const scheme = getRepScheme('T1', prog.stage)
    const warmupSets = generateWarmupSetsForDisplay(prog.currentWeight)

    return {
      exercise: dayExercises.t1,
      progression: prog,
      scheme,
      warmupSets,
    }
  }, [dayExercises.t1, day, progression])

  // Get T2 progression
  const t2Data = useMemo(() => {
    if (!dayExercises.t2?.role) return null

    const tier = getTierForDay(dayExercises.t2.role, day)
    if (tier !== 'T2') return null

    const progressionKey = getProgressionKey(dayExercises.t2.id, dayExercises.t2.role, 'T2')
    const prog = progression[progressionKey]
    if (!prog) return null

    const scheme = getRepScheme('T2', prog.stage)

    return {
      exercise: dayExercises.t2,
      progression: prog,
      scheme,
    }
  }, [dayExercises.t2, day, progression])

  // Get T3 data
  const t3Data = useMemo(() => {
    return dayExercises.t3.map((exercise) => {
      const prog = progression[exercise.id]
      const scheme = prog ? getRepScheme('T3', prog.stage) : getRepScheme('T3', 0)

      return {
        exercise,
        progression: prog,
        scheme,
      }
    })
  }, [dayExercises.t3, progression])

  if (!isOpen) return null

  const today = new Date()

  // Convert weight for display if needed
  const displayWeight = (weightKg: number): string => {
    if (weightUnit === 'lbs') {
      return formatWeight(convertWeight(weightKg, 'kg', 'lbs'), 'lbs')
    }
    return formatWeight(weightKg, 'kg')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      data-testid="todays-workout-modal"
    >
      <div
        className="mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white dark:bg-gray-800 shadow-xl"
        onClick={(e) => { e.stopPropagation() }}
      >
        {/* Header */}
        <div className="sticky top-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Next Workout</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                GZCLP Day {day} - {formatDate(today)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Warmup Section (T1 only) - Collapsible, collapsed by default */}
          {t1Data && t1Data.warmupSets.length > 0 && (
            <CollapsibleSection
              title={`Warmup Sets (${String(t1Data.warmupSets.length)} sets)`}
              defaultOpen={false}
            >
              <div className="space-y-2">
                {t1Data.warmupSets.map((set, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-600 dark:text-gray-400">Set {index + 1}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {displayWeight(set.weight)} x {set.reps}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* T1 Exercise */}
          {t1Data && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                  T1
                </span>
                <span className="text-xs font-medium text-red-700 dark:text-red-300">Main Lift</span>
                {/* AMRAP Indicator */}
                <span className="ml-auto rounded-full bg-yellow-100 dark:bg-yellow-900/50 px-2 py-0.5 text-xs font-semibold text-yellow-800 dark:text-yellow-300">
                  Last set AMRAP
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t1Data.exercise.name}</h3>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-mono text-gray-600 dark:text-gray-400">{t1Data.scheme.display}</span>
                <span className="text-lg font-bold text-red-700 dark:text-red-300">
                  {displayWeight(t1Data.progression.currentWeight)}
                </span>
              </div>
            </div>
          )}

          {/* T2 Exercise */}
          {t2Data && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                  T2
                </span>
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Secondary Lift</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t2Data.exercise.name}</h3>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-mono text-gray-600 dark:text-gray-400">{t2Data.scheme.display}</span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {displayWeight(t2Data.progression.currentWeight)}
                </span>
              </div>
            </div>
          )}

          {/* T3 Exercises */}
          {t3Data.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Accessories (T3)</h3>
              {t3Data.map(({ exercise, progression: prog, scheme }) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/50 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-green-600 px-1.5 py-0.5 text-xs font-bold text-white">
                      T3
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{exercise.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-gray-600 dark:text-gray-400">{scheme.display}</span>
                    <span className="font-bold text-green-700 dark:text-green-300">
                      {prog ? displayWeight(prog.currentWeight) : 'TBD'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!t1Data && !t2Data && t3Data.length === 0 && (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No exercises configured for this day.</p>
              <p className="mt-1 text-sm">Complete the setup wizard to get started.</p>
            </div>
          )}
        </div>

        {/* Footer - Start Workout Action */}
        <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}
