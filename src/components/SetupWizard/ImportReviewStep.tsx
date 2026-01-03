/**
 * ImportReviewStep Component
 *
 * Displays extracted exercises from assigned routines for user review.
 * Allows editing weights, stages (for manual confidence), and roles.
 *
 * T016: Added Hevy API availability check and stage auto-detection.
 */

import { useMemo, useEffect, useState, useCallback } from 'react'
import type { ImportResult, ImportedExercise, Stage, ExerciseRole } from '@/types/state'
import { MAIN_LIFT_ROLES } from '@/types/state'
import { STAGE_DISPLAY } from '@/lib/constants'
import { RoleDropdown } from '@/components/common/RoleDropdown'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export interface ImportReviewStepProps {
  importResult: ImportResult
  onExerciseUpdate: (index: number, updates: Partial<ImportedExercise>) => void
  onNext: () => void
  onBack: () => void
  /** API key for Hevy API access (reserved for future stage auto-detection) */
  apiKey?: string
}

// Note: apiKey is intentionally unused for now - reserved for T016 stage auto-detection
// The API availability check uses useOnlineStatus which doesn't require the key

/**
 * Get the display value for a stage.
 */
function getStageDisplay(stage: Stage): string {
  return STAGE_DISPLAY[stage]
}

/**
 * Get the confirmed weight (user override or detected).
 */
function getConfirmedWeight(exercise: ImportedExercise): number {
  return exercise.userWeight ?? exercise.detectedWeight
}

/**
 * Get the confirmed stage (user override or detected).
 */
function getConfirmedStage(exercise: ImportedExercise): Stage {
  return exercise.userStage ?? exercise.detectedStage
}

/**
 * Check if a role is a main lift role.
 */
function isMainLiftRole(role: ExerciseRole | undefined): boolean {
  if (!role) return false
  return (MAIN_LIFT_ROLES as readonly ExerciseRole[]).includes(role)
}

export function ImportReviewStep({
  importResult,
  onExerciseUpdate,
  onNext,
  onBack,
  // apiKey is reserved for future stage auto-detection (T016)
}: ImportReviewStepProps) {
  const { exercises, warnings } = importResult
  const hasExercises = exercises.length > 0

  // Track API availability (T016: FR-015)
  const { isOnline, isHevyReachable, checkHevyConnection } = useOnlineStatus()
  const [isCheckingApi, setIsCheckingApi] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Check API availability on mount
  useEffect(() => {
    const checkApi = async () => {
      setIsCheckingApi(true)
      setApiError(null)
      const reachable = await checkHevyConnection()
      if (!reachable) {
        setApiError('Hevy API is currently unavailable. Please check your connection and try again.')
      }
      setIsCheckingApi(false)
    }
    void checkApi()
  }, [checkHevyConnection])

  // Track assigned main lift roles for exclusivity validation
  const assignedMainLifts = useMemo(() => {
    const assigned = new Set<ExerciseRole>()
    exercises.forEach((ex) => {
      if (ex.role && isMainLiftRole(ex.role)) {
        assigned.add(ex.role)
      }
    })
    return assigned
  }, [exercises])

  // Check if all exercises have roles assigned
  const allRolesAssigned = exercises.every((ex) => ex.role !== undefined)
  // T016: Block continue if API is unavailable
  const isApiAvailable = isOnline && isHevyReachable && !apiError
  const canContinue = hasExercises && allRolesAssigned && isApiAvailable && !isCheckingApi

  // Handle continue
  const handleContinue = () => {
    onNext()
  }

  // Handle retry API check
  const handleRetryApiCheck = useCallback(async () => {
    setIsCheckingApi(true)
    setApiError(null)
    const reachable = await checkHevyConnection()
    if (!reachable) {
      setApiError('Hevy API is still unavailable. Please try again later.')
    }
    setIsCheckingApi(false)
  }, [checkHevyConnection])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Review Imported Exercises</h2>
        <p className="mt-1 text-sm text-gray-500">
          Assign a role to each exercise. Main lifts (Squat, Bench, OHP, Deadlift) can only be
          assigned once.
        </p>
      </div>

      {/* API Error Section (T016: FR-015) */}
      {apiError && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-500 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
              <p className="mt-1 text-sm text-red-700">{apiError}</p>
              <button
                type="button"
                onClick={() => void handleRetryApiCheck()}
                disabled={isCheckingApi}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
              >
                {isCheckingApi ? 'Checking...' : 'Retry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div role="alert" className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span data-testid="warning-icon" className="text-amber-500 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800">Import Warnings</h3>
              <ul className="mt-2 text-sm text-amber-700 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={String(index)}>{warning.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Exercises Table */}
      {hasExercises ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  role="columnheader"
                >
                  Exercise
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  role="columnheader"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  role="columnheader"
                >
                  Weight (kg)
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  role="columnheader"
                >
                  Stage
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Original
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exercises.map((exercise, index) => {
                const isManualConfidence = exercise.stageConfidence === 'manual'
                const hasMainLiftRole = isMainLiftRole(exercise.role)

                // Calculate which main lifts to exclude for this exercise
                const excludeRoles: ExerciseRole[] = []
                assignedMainLifts.forEach((role) => {
                  // Don't exclude this exercise's own role
                  if (role !== exercise.role) {
                    excludeRoles.push(role)
                  }
                })

                return (
                  <tr
                    key={`${exercise.templateId}-${String(index)}`}
                    className={isManualConfidence ? 'bg-amber-50' : ''}
                  >
                    {/* Exercise Name */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{exercise.name}</span>
                    </td>

                    {/* Role Dropdown */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <label htmlFor={`role-${String(index)}`} className="sr-only">
                        Role
                      </label>
                      <RoleDropdown
                        id={`role-${String(index)}`}
                        ariaLabel="Role"
                        value={exercise.role}
                        onChange={(role) => { onExerciseUpdate(index, { role }) }}
                        excludeRoles={excludeRoles}
                        className="w-40"
                      />
                    </td>

                    {/* Weight Input - only for main lifts */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {hasMainLiftRole ? (
                        <>
                          <label htmlFor={`weight-${String(index)}`} className="sr-only">
                            Weight
                          </label>
                          <input
                            type="number"
                            id={`weight-${String(index)}`}
                            aria-label="Weight"
                            value={getConfirmedWeight(exercise)}
                            onChange={(e) => {
                              onExerciseUpdate(index, {
                                userWeight: parseFloat(e.target.value) || 0,
                              })
                            }}
                            step="0.5"
                            min="0"
                            className="block w-20 rounded-md border-gray-300 shadow-sm text-sm
                                       focus:border-blue-500 focus:ring-blue-500"
                          />
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isManualConfidence && hasMainLiftRole ? (
                        <>
                          <label htmlFor={`stage-${String(index)}`} className="sr-only">
                            Stage
                          </label>
                          <select
                            id={`stage-${String(index)}`}
                            aria-label="Stage"
                            value={getConfirmedStage(exercise)}
                            onChange={(e) => {
                              onExerciseUpdate(index, {
                                userStage: parseInt(e.target.value, 10) as Stage,
                              })
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm text-sm
                                       focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value={0}>Stage 1</option>
                            <option value={1}>Stage 2</option>
                            <option value={2}>Stage 3</option>
                          </select>
                        </>
                      ) : (
                        <span className="text-sm text-gray-700">
                          {hasMainLiftRole ? getStageDisplay(getConfirmedStage(exercise)) : 'N/A'}
                        </span>
                      )}
                    </td>

                    {/* Original Rep Scheme */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {exercise.originalRepScheme}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No exercises to review. Please go back and assign routines.</p>
        </div>
      )}

      {/* Validation Message */}
      {hasExercises && !allRolesAssigned && (
        <div className="text-sm text-amber-600">
          All exercises must have a role assigned before continuing.
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 min-h-[44px]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium
                     hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                     min-h-[44px]"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
