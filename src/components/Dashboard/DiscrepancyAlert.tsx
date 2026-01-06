/**
 * DiscrepancyAlert Component
 *
 * Displays weight discrepancy alerts with resolution options.
 */

import type { WeightUnit, Tier } from '@/types/state'

export interface DiscrepancyInfo {
  exerciseId: string
  exerciseName: string
  /** Tier of the exercise (T1, T2, T3) for display clarity */
  tier: Tier
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
            {discrepancies.map((discrepancy) => {
              const isHigher = discrepancy.actualWeight > discrepancy.storedWeight
              const arrow = isHigher ? '\u2191' : '\u2193'
              const actualColorClass = isHigher ? 'text-green-600' : 'text-amber-600'
              const formattedDate = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
              }).format(new Date(discrepancy.workoutDate))

              return (
                <li
                  key={`${discrepancy.exerciseId}-${discrepancy.workoutId}`}
                  className="bg-white rounded-md p-3 border border-yellow-100"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {discrepancy.exerciseName} ({discrepancy.tier})
                        </span>
                        <span className="text-xs text-gray-500">
                          from {formattedDate}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Hevy shows{' '}
                        <span className={actualColorClass}>
                          {arrow} {discrepancy.actualWeight}
                          {unit}
                        </span>
                        {' '}but we expected{' '}
                        <span className="font-medium">
                          {discrepancy.storedWeight}
                          {unit}
                        </span>
                        {' '}based on saved progression
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => {
                            onUseActualWeight(discrepancy.exerciseId, discrepancy.actualWeight)
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100
                                     hover:bg-green-200 rounded-md min-h-[44px]
                                     transition-colors"
                        >
                          Use {discrepancy.actualWeight}
                          {unit}
                        </button>
                        <span className="text-xs text-gray-500 mt-1">
                          Update progression
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => { onKeepStoredWeight(discrepancy.exerciseId) }}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100
                                     hover:bg-gray-200 rounded-md min-h-[44px]
                                     transition-colors"
                        >
                          Keep {discrepancy.storedWeight}
                          {unit}
                        </button>
                        <span className="text-xs text-gray-500 mt-1">
                          Keep current value
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
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
