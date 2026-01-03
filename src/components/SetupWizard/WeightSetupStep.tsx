/**
 * WeightSetupStep Component
 *
 * Configure starting weights for all assigned exercises.
 */

import { WeightInput } from './WeightInput'
import { UnitSelector } from './UnitSelector'
import { SLOT_NAMES } from '@/lib/constants'
import type { ExerciseTemplate } from '@/types/hevy'
import type { GZCLPSlot, WeightUnit } from '@/types/state'

export interface WeightSetupStepProps {
  assignments: Record<GZCLPSlot, string | null>
  exercises: ExerciseTemplate[]
  weights: Record<string, number>
  onWeightChange: (slot: GZCLPSlot, weight: number) => void
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
  // Get assigned slots with exercise info
  const assignedSlots = Object.entries(assignments)
    .filter(([, templateId]) => templateId !== null)
    .map(([slot, templateId]) => {
      const exercise = exercises.find((ex) => ex.id === templateId)
      return {
        slot: slot as GZCLPSlot,
        templateId: templateId as string,
        exerciseName: exercise?.title ?? 'Unknown Exercise',
      }
    })

  if (assignedSlots.length === 0) {
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

      {/* Weight inputs */}
      <div className="space-y-6">
        {assignedSlots.map(({ slot, exerciseName }) => (
          <WeightInput
            key={slot}
            id={`weight-${slot}`}
            label={`${exerciseName} (${SLOT_NAMES[slot]})`}
            value={weights[slot] ?? 0}
            onChange={(weight) => onWeightChange(slot, weight)}
            unit={unit}
          />
        ))}
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Tip: If unsure, start lighter. You can always increase weights as you progress.
      </p>
    </div>
  )
}
