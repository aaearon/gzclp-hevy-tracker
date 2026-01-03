/**
 * RoleAssignment Component
 *
 * Assign exercises to GZCLP roles (main lifts + T3 accessories).
 * Replaces the old slot-based assignment system.
 */

import { ExerciseSelector } from './ExerciseSelector'
import { ROLE_DISPLAY } from '@/lib/constants'
import { MAIN_LIFT_ROLES } from '@/types/state'
import type { ExerciseTemplate } from '@/types/hevy'
import type { MainLiftRole } from '@/types/state'

export interface CreatePathAssignments {
  mainLifts: Record<MainLiftRole, string | null>
  t3Exercises: string[]
}

export interface RoleAssignmentProps {
  exercises: ExerciseTemplate[]
  assignments: CreatePathAssignments
  onMainLiftAssign: (role: MainLiftRole, templateId: string | null) => void
  onT3Add: (templateId: string) => void
  onT3Remove: (index: number) => void
  onT3Update: (index: number, templateId: string | null) => void
  isLoading?: boolean
}

export function SlotAssignmentStep({
  exercises,
  assignments,
  onMainLiftAssign,
  onT3Add,
  onT3Remove,
  onT3Update,
  isLoading = false,
}: RoleAssignmentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading exercises from Hevy...</div>
      </div>
    )
  }

  const handleAddT3 = () => {
    // Add empty T3 slot for user to fill
    onT3Add('')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Exercises</h2>
      <p className="text-gray-600 mb-6">
        Choose exercises for your GZCLP program. Main lifts rotate between T1 and T2
        each workout day. T3 accessories are optional.
      </p>

      {/* Main Lifts Section */}
      <section className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
          Main Lifts
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Each main lift alternates between T1 (5x3+) and T2 (3x10) across workout days.
        </p>
        <div className="space-y-4">
          {MAIN_LIFT_ROLES.map((role) => (
            <div key={role}>
              <label htmlFor={`role-${role}`} className="block text-sm font-medium text-gray-700 mb-1">
                {ROLE_DISPLAY[role].label}
              </label>
              <p className="text-xs text-gray-500 mb-1">
                {ROLE_DISPLAY[role].description}
              </p>
              <ExerciseSelector
                id={`role-${role}`}
                exercises={exercises}
                value={assignments.mainLifts[role]}
                onChange={(templateId) => { onMainLiftAssign(role, templateId) }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* T3 Accessories Section */}
      <section>
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
          T3 Accessories (Optional)
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Add accessory exercises using 3x15+ rep scheme. Progress when you hit 25+ total reps.
        </p>
        <div className="space-y-4">
          {assignments.t3Exercises.map((templateId, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1">
                <label htmlFor={`t3-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  T3 Exercise {index + 1}
                </label>
                <ExerciseSelector
                  id={`t3-${index}`}
                  exercises={exercises}
                  value={templateId || null}
                  onChange={(newTemplateId) => { onT3Update(index, newTemplateId) }}
                />
              </div>
              <button
                type="button"
                onClick={() => { onT3Remove(index) }}
                className="mt-6 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md
                           min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={`Remove T3 exercise ${index + 1}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddT3}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg
                       text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50
                       transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add T3 Exercise
          </button>
        </div>
      </section>
    </div>
  )
}
