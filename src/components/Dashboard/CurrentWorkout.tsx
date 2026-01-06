/**
 * CurrentWorkout Component
 *
 * Prominent inline display of today's workout at the top of the Dashboard.
 * Shows T1, T2, and T3 exercises with correct weights.
 *
 * Replaces the separate NextWorkout sidebar and TierSection displays.
 */

import { useMemo } from 'react'
import type { ExerciseConfig, GZCLPDay, ProgressionState, WeightUnit } from '@/types/state'
import { getRepScheme } from '@/lib/constants'
import { formatWeight } from '@/utils/formatting'
import { getExercisesForDay, getProgressionKey } from '@/lib/role-utils'

interface CurrentWorkoutProps {
  day: GZCLPDay
  exercises: Record<string, ExerciseConfig>
  progression: Record<string, ProgressionState>
  weightUnit: WeightUnit
  t3Schedule: Record<GZCLPDay, string[]>
  onStartWorkout: () => void
}

export function CurrentWorkout({
  day,
  exercises,
  progression,
  weightUnit,
  t3Schedule,
  onStartWorkout,
}: CurrentWorkoutProps) {
  // Get exercises for today using role-based grouping
  const dayExercises = useMemo(
    () => getExercisesForDay(exercises, day, t3Schedule),
    [exercises, day, t3Schedule]
  )

  // Get T1 data with correct progression key lookup
  const t1Data = useMemo(() => {
    if (!dayExercises.t1?.role) return null

    // Use correct progression key: "squat-T1", "bench-T1", etc.
    const progressionKey = getProgressionKey(dayExercises.t1.id, dayExercises.t1.role, 'T1')
    const prog = progression[progressionKey]
    if (!prog) return null

    const scheme = getRepScheme('T1', prog.stage)

    return {
      exercise: dayExercises.t1,
      progression: prog,
      scheme,
    }
  }, [dayExercises.t1, progression])

  // Get T2 data with correct progression key lookup
  const t2Data = useMemo(() => {
    if (!dayExercises.t2?.role) return null

    // Use correct progression key: "squat-T2", "bench-T2", etc.
    const progressionKey = getProgressionKey(dayExercises.t2.id, dayExercises.t2.role, 'T2')
    const prog = progression[progressionKey]
    if (!prog) return null

    const scheme = getRepScheme('T2', prog.stage)

    return {
      exercise: dayExercises.t2,
      progression: prog,
      scheme,
    }
  }, [dayExercises.t2, progression])

  // Get T3 data (T3s use exerciseId directly as key)
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

  const hasExercises = t1Data || t2Data || t3Data.length > 0

  return (
    <div data-testid="current-workout" className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Today&apos;s Workout</h2>
          <p className="text-sm text-gray-500">GZCLP Day {day}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-indigo-600 px-4 py-2 text-lg font-bold text-white">
            {day}
          </span>
          <button
            type="button"
            onClick={onStartWorkout}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 min-h-[44px]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Details
          </button>
        </div>
      </div>

      {hasExercises ? (
        <div className="space-y-4">
          {/* Main Lifts Row - T1 and T2 side by side */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* T1 Exercise */}
            {t1Data && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                    T1
                  </span>
                  <span className="text-xs font-medium text-red-700">Main Lift</span>
                  <span className="ml-auto rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                    AMRAP
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t1Data.exercise.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-sm text-gray-600">{t1Data.scheme.display}</span>
                  <span className="text-xl font-bold text-red-700">
                    {formatWeight(t1Data.progression.currentWeight, weightUnit)}
                  </span>
                </div>
              </div>
            )}

            {/* T2 Exercise */}
            {t2Data && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                    T2
                  </span>
                  <span className="text-xs font-medium text-blue-700">Secondary Lift</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t2Data.exercise.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-sm text-gray-600">{t2Data.scheme.display}</span>
                  <span className="text-xl font-bold text-blue-700">
                    {formatWeight(t2Data.progression.currentWeight, weightUnit)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* T3 Accessories */}
          {t3Data.length > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                  T3
                </span>
                <span className="text-xs font-medium text-green-700">
                  Accessories ({t3Data.length})
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {t3Data.map(({ exercise, progression: prog, scheme }) => (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between rounded bg-white/60 px-3 py-2"
                  >
                    <span className="font-medium text-gray-900 truncate mr-2">{exercise.name}</span>
                    <div className="flex items-center gap-2 text-sm shrink-0">
                      <span className="font-mono text-gray-500">{scheme.display}</span>
                      <span className="font-bold text-green-700">
                        {prog ? formatWeight(prog.currentWeight, weightUnit) : 'TBD'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">
          <p>No exercises configured for this day.</p>
          <p className="mt-1 text-sm">Complete the setup wizard to get started.</p>
        </div>
      )}
    </div>
  )
}
