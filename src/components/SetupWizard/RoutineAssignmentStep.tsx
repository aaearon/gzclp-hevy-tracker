/**
 * RoutineAssignmentStep Component
 *
 * Allows user to assign Hevy routines to each GZCLP day (A1, B1, A2, B2).
 * Shows duplicate warnings when the same routine is assigned to multiple days.
 */

import { useState, useMemo } from 'react'
import { RoutineSelector } from '@/components/common/RoutineSelector'
import type { AvailableRoutine, RoutineAssignment, GZCLPDay } from '@/types/state'

export interface RoutineAssignmentStepProps {
  routines: AvailableRoutine[]
  assignment: RoutineAssignment
  onAssign: (day: GZCLPDay, routineId: string | null) => void
  onNext: () => void
  onBack: () => void
}

interface DaySlotInfo {
  day: GZCLPDay
  label: string
  description: string
}

const DAY_SLOTS: DaySlotInfo[] = [
  { day: 'A1', label: 'Day A1', description: 'Squat (T1), Bench (T2), T3 accessories' },
  { day: 'B1', label: 'Day B1', description: 'OHP (T1), Deadlift (T2), T3 accessories' },
  { day: 'A2', label: 'Day A2', description: 'Bench (T1), Squat (T2), T3 accessories' },
  { day: 'B2', label: 'Day B2', description: 'Deadlift (T1), OHP (T2), T3 accessories' },
]

export function RoutineAssignmentStep({
  routines,
  assignment,
  onAssign,
  onNext,
  onBack,
}: RoutineAssignmentStepProps) {
  const [selectorOpen, setSelectorOpen] = useState<GZCLPDay | null>(null)

  // Check for duplicates
  const duplicates = useMemo(() => {
    const ids = Object.values(assignment).filter((id): id is string => id !== null)
    const seen = new Set<string>()
    const dupes = new Set<string>()
    for (const id of ids) {
      if (seen.has(id)) {
        dupes.add(id)
      }
      seen.add(id)
    }
    return dupes
  }, [assignment])

  const hasDuplicates = duplicates.size > 0

  // Count assigned routines
  const assignedCount = Object.values(assignment).filter((id) => id !== null).length
  const canProceed = assignedCount > 0

  // Get routine by ID
  const getRoutineById = (id: string | null): AvailableRoutine | undefined => {
    if (!id) return undefined
    return routines.find((r) => r.id === id)
  }

  const handleSelectRoutine = (routineId: string) => {
    if (selectorOpen) {
      onAssign(selectorOpen, routineId)
      setSelectorOpen(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Assign Routines to GZCLP Days
        </h2>
        <p className="text-gray-600">
          Match your existing Hevy routines to each GZCLP workout day.
        </p>
      </div>

      {/* Duplicate warning */}
      {hasDuplicates && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <strong>Note:</strong> Same routine is assigned to multiple days. This is allowed but
          may affect exercise detection.
        </div>
      )}

      {/* Day slots */}
      <div className="space-y-4">
        {DAY_SLOTS.map(({ day, label, description }) => {
          const assignedRoutine = getRoutineById(assignment[day])
          const isDuplicate = assignment[day] !== null && duplicates.has(assignment[day]!)

          return (
            <div
              key={day}
              className={`border rounded-lg p-4 ${
                isDuplicate ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{label}</h3>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
                {isDuplicate && (
                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                    Duplicate
                  </span>
                )}
              </div>

              {assignedRoutine ? (
                <div className="flex items-center justify-between mt-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{assignedRoutine.title}</p>
                    <p className="text-sm text-gray-500">
                      {assignedRoutine.exercisePreview.slice(0, 2).join(', ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAssign(day, null)}
                    className="text-sm text-red-600 hover:text-red-700 px-3 py-1 min-h-[44px]"
                    aria-label="Clear"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectorOpen(day)}
                  className="w-full mt-3 px-4 py-3 border-2 border-dashed border-gray-300
                             rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600
                             transition-colors min-h-[44px]"
                  aria-label="Select routine"
                >
                  + Select routine
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 min-h-[44px]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium
                     hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                     min-h-[44px]"
        >
          Next ({assignedCount} assigned)
        </button>
      </div>

      {/* Routine selector modal */}
      <RoutineSelector
        routines={routines}
        selectedId={selectorOpen ? assignment[selectorOpen] : null}
        onSelect={handleSelectRoutine}
        onClose={() => setSelectorOpen(null)}
        isOpen={selectorOpen !== null}
      />
    </div>
  )
}
