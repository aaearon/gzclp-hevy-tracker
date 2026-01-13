/**
 * ExerciseManager Component
 *
 * Lists all configured exercises with role dropdowns for role management.
 * Detects conflicts when assigning main lift roles and offers to swap roles.
 */

import { useState, useMemo } from 'react'
import { RoleDropdown } from '@/components/common/RoleDropdown'
import { useProgram } from '@/hooks/useProgram'
import { ROLE_DISPLAY } from '@/lib/constants'
import { MAIN_LIFT_ROLES } from '@/types/state'
import type { ExerciseConfig, ExerciseRole, MainLiftRole } from '@/types/state'

interface SwapConflict {
  sourceExercise: ExerciseConfig
  targetExercise: ExerciseConfig
  newRole: MainLiftRole
  oldRole: ExerciseRole | undefined
}

export interface ExerciseManagerProps {
  /** Callback when an exercise role is changed */
  onRoleChange?: (exercise: ExerciseConfig, oldRole: ExerciseRole | undefined) => void
}

export function ExerciseManager({ onRoleChange }: ExerciseManagerProps) {
  const { state, updateExercise } = useProgram()
  const [swapConflict, setSwapConflict] = useState<SwapConflict | null>(null)

  // Convert exercises object to sorted array
  const exercises = useMemo(() => {
    return Object.values(state.exercises).sort((a, b) => a.name.localeCompare(b.name))
  }, [state.exercises])

  // Note: We don't exclude already-assigned roles from the dropdown.
  // Instead, we allow selection and show a conflict dialog for swapping.

  // Find exercise that currently has the target role
  const findExerciseWithRole = (role: ExerciseRole): ExerciseConfig | undefined => {
    return exercises.find((ex) => ex.role === role)
  }

  const handleRoleChange = (exercise: ExerciseConfig, newRole: ExerciseRole) => {
    const oldRole = exercise.role

    // Check if the new role is a main lift role
    if (MAIN_LIFT_ROLES.includes(newRole as MainLiftRole)) {
      // Check if another exercise already has this role
      const conflictingExercise = findExerciseWithRole(newRole)

      if (conflictingExercise && conflictingExercise.id !== exercise.id) {
        // Show swap confirmation dialog
        setSwapConflict({
          sourceExercise: exercise,
          targetExercise: conflictingExercise,
          newRole: newRole as MainLiftRole,
          oldRole,
        })
        return
      }
    }

    // No conflict - update directly
    updateExercise(exercise.id, { role: newRole })
    onRoleChange?.(exercise, oldRole)
  }

  const handleSwapConfirm = () => {
    if (!swapConflict) return

    const { sourceExercise, targetExercise, newRole, oldRole } = swapConflict

    // Swap roles between the two exercises
    updateExercise(sourceExercise.id, { role: newRole })
    // When oldRole is undefined, fall back to t3 (reasonable default for a swap)
    updateExercise(targetExercise.id, { role: oldRole ?? 't3' })

    // Notify callbacks
    onRoleChange?.(sourceExercise, oldRole)
    onRoleChange?.(targetExercise, newRole)

    // Close dialog
    setSwapConflict(null)
  }

  const handleSwapCancel = () => {
    setSwapConflict(null)
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No exercises have been configured yet.</p>
        <p className="text-sm mt-2">
          Import a routine to start configuring exercises.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Change exercise roles to adjust how they&apos;re used in your program.
        </p>

        {/* Mobile: Stacked card layout */}
        <div className="sm:hidden space-y-3">
          {exercises.map((exercise) => {
            const displayInfo = exercise.role ? ROLE_DISPLAY[exercise.role] : null

            return (
              <div
                key={exercise.id}
                className="py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  {displayInfo && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0
                        ${displayInfo.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : displayInfo.color === 'green' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
                    >
                      {displayInfo.label}
                    </span>
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {exercise.name}
                  </span>
                </div>
                <label
                  htmlFor={`role-mobile-${exercise.id}`}
                  className="sr-only"
                >
                  Role for {exercise.name}
                </label>
                <RoleDropdown
                  id={`role-mobile-${exercise.id}`}
                  ariaLabel={`Role for ${exercise.name}`}
                  value={exercise.role}
                  onChange={(role) => {
                    handleRoleChange(exercise, role)
                  }}
                  className="w-full"
                  showPlaceholder={false}
                />
                {exercise.role === 't3' && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Increment:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="10"
                      value={exercise.customIncrementKg ?? 2.5}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        if (value >= 0.5 && value <= 10) {
                          updateExercise(exercise.id, { customIncrementKg: value })
                        }
                      }}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      aria-label={`Increment for ${exercise.name}`}
                    />
                    <span className="text-xs text-gray-400">kg</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Desktop: Table layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Exercise
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  T3 Increment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {exercises.map((exercise) => {
                const displayInfo = exercise.role ? ROLE_DISPLAY[exercise.role] : null

                return (
                  <tr key={exercise.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {displayInfo && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                              ${displayInfo.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : displayInfo.color === 'green' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
                          >
                            {displayInfo.label}
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {exercise.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <label
                        htmlFor={`role-${exercise.id}`}
                        className="sr-only"
                      >
                        Role for {exercise.name}
                      </label>
                      <RoleDropdown
                        id={`role-${exercise.id}`}
                        ariaLabel={`Role for ${exercise.name}`}
                        value={exercise.role}
                        onChange={(role) => {
                          handleRoleChange(exercise, role)
                        }}
                        className="w-48"
                        showPlaceholder={false}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {exercise.role === 't3' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="10"
                            value={exercise.customIncrementKg ?? 2.5}
                            onChange={(e) => {
                              const value = Number(e.target.value)
                              if (value >= 0.5 && value <= 10) {
                                updateExercise(exercise.id, { customIncrementKg: value })
                              }
                            }}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            aria-label={`Increment for ${exercise.name}`}
                          />
                          <span className="text-xs text-gray-400">kg</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Swap Confirmation Dialog */}
      {swapConflict && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="swap-dialog-title"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 id="swap-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Role Conflict
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
              {ROLE_DISPLAY[swapConflict.newRole].label} is assigned to{' '}
              <strong>{swapConflict.targetExercise.name}</strong>. Swap roles?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleSwapCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSwapConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Swap Roles
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
