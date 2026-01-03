/**
 * ImportReviewStep Component
 *
 * Displays extracted exercises from assigned routines for user review.
 * Allows editing weights, stages (for manual confidence), and slots.
 */

import type { ImportResult, ImportedExercise, GZCLPSlot, Stage } from '@/types/state'
import { ALL_SLOTS, SLOT_NAMES, STAGE_DISPLAY } from '@/lib/constants'

export interface ImportReviewStepProps {
  importResult: ImportResult
  onExerciseUpdate: (index: number, updates: Partial<ImportedExercise>) => void
  onNext: () => void
  onBack: () => void
}

/**
 * Get the tier from a slot name.
 */
function getTierFromSlot(slot: GZCLPSlot): 'T1' | 'T2' | 'T3' {
  if (slot.startsWith('t1_')) return 'T1'
  if (slot.startsWith('t2_')) return 'T2'
  return 'T3'
}

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
 * Get the confirmed slot (user override or original).
 */
function getConfirmedSlot(exercise: ImportedExercise): GZCLPSlot {
  return exercise.userSlot ?? exercise.slot
}

export function ImportReviewStep({
  importResult,
  onExerciseUpdate,
  onNext,
  onBack,
}: ImportReviewStepProps) {
  const { exercises, warnings } = importResult
  const hasExercises = exercises.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Review Imported Exercises</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review the exercises extracted from your routines. You can adjust weights, stages, and
          slots before continuing.
        </p>
      </div>

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
                  <li key={index}>{warning.message}</li>
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
                  Slot
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
                const tier = getTierFromSlot(getConfirmedSlot(exercise))
                const isManualConfidence = exercise.stageConfidence === 'manual'
                const isT3 = tier === 'T3'

                return (
                  <tr
                    key={`${exercise.templateId}-${index}`}
                    className={isManualConfidence ? 'bg-amber-50' : ''}
                  >
                    {/* Exercise Name */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {tier}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{exercise.name}</span>
                      </div>
                    </td>

                    {/* Slot Dropdown */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <label htmlFor={`slot-${index}`} className="sr-only">
                        Slot
                      </label>
                      <select
                        id={`slot-${index}`}
                        aria-label="Slot"
                        value={getConfirmedSlot(exercise)}
                        onChange={(e) =>
                          onExerciseUpdate(index, { userSlot: e.target.value as GZCLPSlot })
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm text-sm
                                   focus:border-blue-500 focus:ring-blue-500"
                      >
                        {ALL_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {SLOT_NAMES[slot]}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Weight Input */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <label htmlFor={`weight-${index}`} className="sr-only">
                        Weight
                      </label>
                      <input
                        type="number"
                        id={`weight-${index}`}
                        aria-label="Weight"
                        value={getConfirmedWeight(exercise)}
                        onChange={(e) =>
                          onExerciseUpdate(index, { userWeight: parseFloat(e.target.value) || 0 })
                        }
                        step="0.5"
                        min="0"
                        className="block w-20 rounded-md border-gray-300 shadow-sm text-sm
                                   focus:border-blue-500 focus:ring-blue-500"
                      />
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isManualConfidence && !isT3 ? (
                        <>
                          <label htmlFor={`stage-${index}`} className="sr-only">
                            Stage
                          </label>
                          <select
                            id={`stage-${index}`}
                            aria-label="Stage"
                            value={getConfirmedStage(exercise)}
                            onChange={(e) =>
                              onExerciseUpdate(index, {
                                userStage: parseInt(e.target.value, 10) as Stage,
                              })
                            }
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
                          {isT3 ? 'N/A' : getStageDisplay(getConfirmedStage(exercise))}
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
          onClick={onNext}
          disabled={!hasExercises}
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
