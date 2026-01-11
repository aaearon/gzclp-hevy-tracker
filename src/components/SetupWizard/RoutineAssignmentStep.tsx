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
  /** Loading state when fetching workout history */
  isLoading?: boolean
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
  isLoading = false,
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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Assign Routines to GZCLP Days
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Match your existing Hevy routines to each GZCLP workout day.
        </p>
      </div>

      {/* Duplicate warning */}
      {hasDuplicates && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> Same routine is assigned to multiple days. This is allowed but
          may affect exercise detection.
        </div>
      )}

      {/* Day slots */}
      <div className="space-y-4">
        {DAY_SLOTS.map(({ day, label, description }) => {
          const assignedRoutine = getRoutineById(assignment[day])
          const assignedId = assignment[day]
          const isDuplicate = assignedId !== null && duplicates.has(assignedId)

          return (
            <div
              key={day}
              className={`border rounded-lg p-4 ${
                isDuplicate
                  ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{label}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                </div>
                {isDuplicate && (
                  <span className="text-xs text-amber-600 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                    Duplicate
                  </span>
                )}
              </div>

              {assignedRoutine ? (
                <div className="flex items-center justify-between mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{assignedRoutine.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {assignedRoutine.exercisePreview.slice(0, 2).join(', ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { onAssign(day, null) }}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-3 py-1 min-h-[44px]"
                    aria-label="Clear"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setSelectorOpen(day) }}
                  className="w-full mt-3 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600
                             rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500
                             hover:text-blue-600 dark:hover:text-blue-400
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
          disabled={isLoading}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 min-h-[44px]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium
                     hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                     min-h-[44px] flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading workout history...
            </>
          ) : (
            `Next (${String(assignedCount)} assigned)`
          )}
        </button>
      </div>

      {/* Routine selector modal */}
      <RoutineSelector
        routines={routines}
        selectedId={selectorOpen ? assignment[selectorOpen] : null}
        onSelect={handleSelectRoutine}
        onClose={() => { setSelectorOpen(null) }}
        isOpen={selectorOpen !== null}
      />
    </div>
  )
}
