/**
 * WeightSetupStep Component
 *
 * Configure starting weights for all assigned exercises (main lifts + T3s).
 */

import { WeightInput } from './WeightInput'
import { UnitSelector } from './UnitSelector'
import { ROLE_DISPLAY } from '@/lib/constants'
import { MAIN_LIFT_ROLES } from '@/types/state'
import type { CreatePathAssignments } from './SlotAssignment'
import type { ExerciseTemplate } from '@/types/hevy'
import type { WeightUnit } from '@/types/state'

export interface WeightSetupStepProps {
  assignments: CreatePathAssignments
  exercises: ExerciseTemplate[]
  weights: Record<string, number>
  onWeightChange: (key: string, weight: number) => void
  unit: WeightUnit
  onUnitChange: (unit: WeightUnit) => void
}

export function WeightSetupStep({
  assignments,
  exercises,
  weights,
  onWeightChange,
  unit,
  onUnitChange,
}: WeightSetupStepProps) {
  // Get assigned main lifts with exercise info
  const assignedMainLifts = MAIN_LIFT_ROLES
    .filter((role) => assignments.mainLifts[role] !== null)
    .map((role) => {
      const templateId = assignments.mainLifts[role]!
      const exercise = exercises.find((ex) => ex.id === templateId)
      return {
        key: role,
        label: ROLE_DISPLAY[role].label,
        exerciseName: exercise?.title ?? 'Unknown Exercise',
        description: ROLE_DISPLAY[role].description,
      }
    })

  // Get assigned T3s with exercise info
  const assignedT3s = assignments.t3Exercises
    .filter((templateId) => templateId !== '')
    .map((templateId, index) => {
      const exercise = exercises.find((ex) => ex.id === templateId)
      return {
        key: `t3_${index}`,
        label: `T3: ${exercise?.title ?? 'Unknown Exercise'}`,
        exerciseName: exercise?.title ?? 'Unknown Exercise',
      }
    })

  const hasNoAssignments = assignedMainLifts.length === 0 && assignedT3s.length === 0

  if (hasNoAssignments) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <p className="text-gray-600">No exercises have been assigned. Please go back and select exercises first.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Set Starting Weights</h2>
      <p className="text-gray-600 mb-6">
        Enter your current working weight for each exercise. These should be weights you can complete with good form for the prescribed rep scheme.
      </p>

      {/* Unit selector */}
      <div className="mb-8">
        <UnitSelector value={unit} onChange={onUnitChange} />
      </div>

      {/* Main Lifts Weight Inputs */}
      {assignedMainLifts.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
            Main Lifts
          </h3>
          <div className="space-y-6">
            {assignedMainLifts.map(({ key, label, exerciseName, description }) => (
              <WeightInput
                key={key}
                id={`weight-${key}`}
                label={`${label}: ${exerciseName}`}
                hint={description}
                value={weights[key] ?? 0}
                onChange={(weight) => { onWeightChange(key, weight) }}
                unit={unit}
              />
            ))}
          </div>
        </section>
      )}

      {/* T3 Weight Inputs */}
      {assignedT3s.length > 0 && (
        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
            T3 Accessories
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            T3 exercises use 3x15+ rep scheme. Progress when you hit 25+ total reps.
          </p>
          <div className="space-y-6">
            {assignedT3s.map(({ key, label }) => (
              <WeightInput
                key={key}
                id={`weight-${key}`}
                label={label}
                value={weights[key] ?? 0}
                onChange={(weight) => { onWeightChange(key, weight) }}
                unit={unit}
              />
            ))}
          </div>
        </section>
      )}

      <p className="mt-6 text-sm text-gray-500">
        Tip: If unsure, start lighter. You can always increase weights as you progress.
      </p>
    </div>
  )
}
