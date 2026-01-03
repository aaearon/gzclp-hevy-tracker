/**
 * DiscrepancyAlert Component
 *
 * Displays weight discrepancy alerts with resolution options.
 */

import type { WeightUnit } from '@/types/state'

export interface DiscrepancyInfo {
  exerciseId: string
  exerciseName: string
  storedWeight: number
  actualWeight: number
  workoutId: string
  workoutDate: string
}

export interface DiscrepancyAlertProps {
  discrepancies: DiscrepancyInfo[]
  unit: WeightUnit
  onUseActualWeight: (exerciseId: string, actualWeight: number) => void
  onKeepStoredWeight: (exerciseId: string) => void
  onDismiss?: () => void
}

export function DiscrepancyAlert({
  discrepancies,
  unit,
  onUseActualWeight,
  onKeepStoredWeight,
  onDismiss,
}: DiscrepancyAlertProps) {
  if (discrepancies.length === 0) {
    return null
  }

  return (
    <div
      role="alert"
      className="rounded-md bg-yellow-50 border border-yellow-200 p-4"
    >
      <div className="flex items-start">
        <svg
          className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>

        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Weight Discrepancy Detected
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            The following exercises have different weights than expected.
            Choose how to proceed for each:
          </p>

          <ul className="mt-3 space-y-3">
            {discrepancies.map((discrepancy) => (
              <li
                key={`${discrepancy.exerciseId}-${discrepancy.workoutId}`}
                className="bg-white rounded-md p-3 border border-yellow-100"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="font-medium text-gray-900">
                      {discrepancy.exerciseName}
                    </span>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="text-red-600">
                        Stored: {discrepancy.storedWeight}
                        {unit}
                      </span>
                      <span className="mx-2">vs</span>
                      <span className="text-green-600">
                        Actual: {discrepancy.actualWeight}
                        {unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        onUseActualWeight(discrepancy.exerciseId, discrepancy.actualWeight)
                      }
                      className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100
                                 hover:bg-green-200 rounded-md min-h-[44px]
                                 transition-colors"
                    >
                      Use {discrepancy.actualWeight}
                      {unit}
                    </button>
                    <button
                      type="button"
                      onClick={() => onKeepStoredWeight(discrepancy.exerciseId)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100
                                 hover:bg-gray-200 rounded-md min-h-[44px]
                                 transition-colors"
                    >
                      Keep {discrepancy.storedWeight}
                      {unit}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {onDismiss && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onDismiss}
                className="text-sm font-medium text-yellow-800 hover:text-yellow-900
                           underline min-h-[44px]"
              >
                Dismiss all
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
