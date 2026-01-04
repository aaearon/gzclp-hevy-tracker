/**
 * NextWorkout Component
 *
 * Shows the exercises for the next scheduled workout day.
 */

import type { ExerciseConfig, GZCLPDay, ProgressionState, WeightUnit } from '@/types/state'
import { getRepScheme } from '@/lib/constants'
import { formatWeight } from '@/utils/formatting'
import { getExercisesForDay, getTierForDay } from '@/lib/role-utils'

interface NextWorkoutProps {
  day: GZCLPDay
  exercises: Record<string, ExerciseConfig>
  progression: Record<string, ProgressionState>
  weightUnit: WeightUnit
  t3Schedule: Record<GZCLPDay, string[]>
}

interface WorkoutExerciseRowProps {
  exercise: ExerciseConfig
  progression: ProgressionState
  weightUnit: WeightUnit
  day: GZCLPDay
}

function WorkoutExerciseRow({ exercise, progression, weightUnit, day }: WorkoutExerciseRowProps) {
  // Derive tier from role + day
  const tier = exercise.role ? getTierForDay(exercise.role, day) ?? 'T3' : 'T3'
  const scheme = getRepScheme(tier, progression.stage)

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <span
          className={`
            w-8 rounded px-1.5 py-0.5 text-center text-xs font-semibold
            ${tier === 'T1' ? 'bg-red-100 text-red-700' : ''}
            ${tier === 'T2' ? 'bg-blue-100 text-blue-700' : ''}
            ${tier === 'T3' ? 'bg-green-100 text-green-700' : ''}
          `}
        >
          {tier}
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

export function NextWorkout({ day, exercises, progression, weightUnit, t3Schedule }: NextWorkoutProps) {
  // Get exercises for this day using role-based grouping
  const dayExercises = getExercisesForDay(exercises, day, t3Schedule)

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
        {(() => {
          const t1Prog = dayExercises.t1 ? progression[dayExercises.t1.id] : undefined
          return dayExercises.t1 && t1Prog ? (
            <WorkoutExerciseRow
              exercise={dayExercises.t1}
              progression={t1Prog}
              weightUnit={weightUnit}
              day={day}
            />
          ) : null
        })()}
        {(() => {
          const t2Prog = dayExercises.t2 ? progression[dayExercises.t2.id] : undefined
          return dayExercises.t2 && t2Prog ? (
            <WorkoutExerciseRow
              exercise={dayExercises.t2}
              progression={t2Prog}
              weightUnit={weightUnit}
              day={day}
            />
          ) : null
        })()}
        {dayExercises.t3.map((ex) => {
          const exProg = progression[ex.id]
          return exProg ? (
            <WorkoutExerciseRow
              key={ex.id}
              exercise={ex}
              progression={exProg}
              weightUnit={weightUnit}
              day={day}
            />
          ) : null
        })}
      </div>
    </div>
  )
}
