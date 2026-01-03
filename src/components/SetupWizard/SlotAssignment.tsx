/**
 * SlotAssignment Component
 *
 * Assign exercises to GZCLP slots (T1/T2/T3).
 */

import { ExerciseSelector } from './ExerciseSelector'
import { SLOT_NAMES, T1_SLOTS, T2_SLOTS, T3_SLOTS } from '@/lib/constants'
import type { ExerciseTemplate } from '@/types/hevy'
import type { GZCLPSlot } from '@/types/state'

export interface SlotAssignment {
  slot: GZCLPSlot
  templateId: string | null
}

export interface SlotAssignmentProps {
  exercises: ExerciseTemplate[]
  assignments: Record<GZCLPSlot, string | null>
  onAssign: (slot: GZCLPSlot, templateId: string | null) => void
  isLoading?: boolean
}

export function SlotAssignmentStep({
  exercises,
  assignments,
  onAssign,
  isLoading = false,
}: SlotAssignmentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading exercises from Hevy...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Exercises</h2>
      <p className="text-gray-600 mb-6">
        Choose which exercises to use for each slot in your GZCLP program. T1 are your main lifts,
        T2 are secondary lifts, and T3 are accessories.
      </p>

      {/* T1 Exercises */}
      <section className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
          T1 - Main Lifts (5x3+)
        </h3>
        <div className="space-y-4">
          {T1_SLOTS.map((slot) => (
            <div key={slot}>
              <label htmlFor={`slot-${slot}`} className="block text-sm font-medium text-gray-700 mb-1">
                {SLOT_NAMES[slot]}
              </label>
              <ExerciseSelector
                id={`slot-${slot}`}
                exercises={exercises}
                value={assignments[slot]}
                onChange={(templateId) => onAssign(slot, templateId)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* T2 Exercises */}
      <section className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
          T2 - Secondary Lifts (3x10)
        </h3>
        <div className="space-y-4">
          {T2_SLOTS.map((slot) => (
            <div key={slot}>
              <label htmlFor={`slot-${slot}`} className="block text-sm font-medium text-gray-700 mb-1">
                {SLOT_NAMES[slot]}
              </label>
              <ExerciseSelector
                id={`slot-${slot}`}
                exercises={exercises}
                value={assignments[slot]}
                onChange={(templateId) => onAssign(slot, templateId)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* T3 Exercises */}
      <section>
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
          T3 - Accessories (3x15+)
        </h3>
        <div className="space-y-4">
          {T3_SLOTS.map((slot) => (
            <div key={slot}>
              <label htmlFor={`slot-${slot}`} className="block text-sm font-medium text-gray-700 mb-1">
                {SLOT_NAMES[slot]}
              </label>
              <ExerciseSelector
                id={`slot-${slot}`}
                exercises={exercises}
                value={assignments[slot]}
                onChange={(templateId) => onAssign(slot, templateId)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
