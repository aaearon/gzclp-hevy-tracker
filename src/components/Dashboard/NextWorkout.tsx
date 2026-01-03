/**
 * NextWorkout Component
 *
 * Shows the exercises for the next scheduled workout day.
 */

import type { ExerciseConfig, GZCLPDay, ProgressionState, WeightUnit } from '@/types/state'
import { DAY_EXERCISES, T3_SLOTS, getRepScheme } from '@/lib/constants'
import { formatWeight } from '@/utils/formatting'

interface NextWorkoutProps {
  day: GZCLPDay
  exercises: Record<string, ExerciseConfig>
  progression: Record<string, ProgressionState>
  weightUnit: WeightUnit
}

function findExerciseBySlot(
  slot: string,
  exercises: Record<string, ExerciseConfig>
): ExerciseConfig | undefined {
  return Object.values(exercises).find((ex) => ex.slot === slot)
}

interface WorkoutExerciseRowProps {
  exercise: ExerciseConfig
  progression: ProgressionState
  weightUnit: WeightUnit
}

function WorkoutExerciseRow({ exercise, progression, weightUnit }: WorkoutExerciseRowProps) {
  const scheme = getRepScheme(exercise.tier, progression.stage)

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <span
          className={`
            w-8 rounded px-1.5 py-0.5 text-center text-xs font-semibold
            ${exercise.tier === 'T1' ? 'bg-red-100 text-red-700' : ''}
            ${exercise.tier === 'T2' ? 'bg-blue-100 text-blue-700' : ''}
            ${exercise.tier === 'T3' ? 'bg-green-100 text-green-700' : ''}
          `}
        >
          {exercise.tier}
        </span>
        <span className="font-medium text-gray-900">{exercise.name}</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="font-mono text-gray-600">{scheme.display}</span>
        <span className="font-semibold text-gray-900">
          {formatWeight(progression.currentWeight, weightUnit)}
        </span>
      </div>
    </div>
  )
}

export function NextWorkout({ day, exercises, progression, weightUnit }: NextWorkoutProps) {
  const dayConfig = DAY_EXERCISES[day]

  // Find T1 and T2 exercises for this day
  const t1Exercise = findExerciseBySlot(dayConfig.t1, exercises)
  const t2Exercise = findExerciseBySlot(dayConfig.t2, exercises)

  // Find all T3 exercises (same for every day)
  const t3Exercises: ExerciseConfig[] = []
  for (const slot of T3_SLOTS) {
    const ex = findExerciseBySlot(slot, exercises)
    if (ex) t3Exercises.push(ex)
  }

  return (
    <div data-testid="next-workout" className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Next Workout</h2>
          <p className="text-sm text-gray-500">GZCLP Day {day}</p>
        </div>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-lg font-bold text-indigo-700">
          {day}
        </span>
      </div>

      <div className="mt-3 divide-y divide-gray-100">
        {t1Exercise && progression[t1Exercise.id] && (
          <WorkoutExerciseRow
            exercise={t1Exercise}
            progression={progression[t1Exercise.id]!}
            weightUnit={weightUnit}
          />
        )}
        {t2Exercise && progression[t2Exercise.id] && (
          <WorkoutExerciseRow
            exercise={t2Exercise}
            progression={progression[t2Exercise.id]!}
            weightUnit={weightUnit}
          />
        )}
        {t3Exercises.map(
          (ex) =>
            progression[ex.id] && (
              <WorkoutExerciseRow
                key={ex.id}
                exercise={ex}
                progression={progression[ex.id]!}
                weightUnit={weightUnit}
              />
            )
        )}
      </div>
    </div>
  )
}
