/**
 * MainLiftVerification Component
 *
 * Displays detected T1/T2 weights for main lifts during import.
 * Allows user to verify, edit, and swap weights.
 *
 * Tasks: T020, T021, T022, T023
 */

import { useCallback } from 'react'
import type { MainLiftWeights, MainLiftRole } from '@/types/state'
import { ROLE_DISPLAY, STAGE_SCHEMES } from '@/lib/constants'

export interface MainLiftVerificationProps {
  mainLiftWeights: MainLiftWeights[]
  onWeightsUpdate: (role: MainLiftRole, updates: { t1Weight: number; t2Weight: number }) => void
}

/**
 * Single row for a main lift with T1/T2 weight inputs and swap button.
 */
function MainLiftRow({
  liftWeights,
  onWeightsUpdate,
}: {
  liftWeights: MainLiftWeights
  onWeightsUpdate: MainLiftVerificationProps['onWeightsUpdate']
}) {
  const { role, t1, t2, hasWarning } = liftWeights
  const displayName = ROLE_DISPLAY[role].label

  const handleT1Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value) || 0
      onWeightsUpdate(role, { t1Weight: value, t2Weight: t2.weight })
    },
    [role, t2.weight, onWeightsUpdate]
  )

  const handleT2Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value) || 0
      onWeightsUpdate(role, { t1Weight: t1.weight, t2Weight: value })
    },
    [role, t1.weight, onWeightsUpdate]
  )

  const handleSwap = useCallback(() => {
    onWeightsUpdate(role, { t1Weight: t2.weight, t2Weight: t1.weight })
  }, [role, t1.weight, t2.weight, onWeightsUpdate])

  const isT1Estimated = t1.source.toLowerCase().includes('estimated')
  const isT2Estimated = t2.source.toLowerCase().includes('estimated')

  return (
    <div
      data-testid="main-lift-row"
      className={`border rounded-lg p-4 ${hasWarning ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{displayName}</h4>
        {hasWarning && (
          <span
            data-testid="partial-data-warning"
            title="One or more weights were estimated due to missing data"
            className="text-amber-500"
          >
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
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
        {/* T1 Input */}
        <div>
          <label
            htmlFor={`${role}-t1`}
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            T1 ({STAGE_SCHEMES.T1[0]})
            {isT1Estimated && (
              <span className="ml-1 text-amber-600 font-normal">Estimated</span>
            )}
          </label>
          <div className="relative">
            <input
              type="number"
              id={`${role}-t1`}
              aria-label={`${displayName} T1 weight`}
              value={t1.weight}
              onChange={handleT1Change}
              step="0.5"
              min="0"
              className="block w-full rounded-md border-gray-300 shadow-sm text-sm
                         focus:border-blue-500 focus:ring-blue-500 pr-8"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              kg
            </span>
          </div>
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={handleSwap}
          aria-label={`Swap ${displayName} T1 and T2 weights`}
          className="min-h-[44px] min-w-[44px] p-2 text-gray-400 hover:text-gray-600
                     hover:bg-gray-100 rounded-md transition-colors"
          title="Swap T1 and T2 weights"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 mx-auto"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
            />
          </svg>
        </button>

        {/* T2 Input */}
        <div>
          <label
            htmlFor={`${role}-t2`}
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            T2 ({STAGE_SCHEMES.T2[0]})
            {isT2Estimated && (
              <span className="ml-1 text-amber-600 font-normal">Estimated</span>
            )}
          </label>
          <div className="relative">
            <input
              type="number"
              id={`${role}-t2`}
              aria-label={`${displayName} T2 weight`}
              value={t2.weight}
              onChange={handleT2Change}
              step="0.5"
              min="0"
              className="block w-full rounded-md border-gray-300 shadow-sm text-sm
                         focus:border-blue-500 focus:ring-blue-500 pr-8"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              kg
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Main lift weight verification section.
 * Displays all four main lifts with their detected T1/T2 weights.
 */
export function MainLiftVerification({
  mainLiftWeights,
  onWeightsUpdate,
}: MainLiftVerificationProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Main Lift Weights</h3>
        <p className="mt-1 text-sm text-gray-500">
          Verify the detected T1 and T2 weights for each main lift. Use the swap button if they
          appear reversed.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {mainLiftWeights.map((liftWeights) => (
          <MainLiftRow
            key={liftWeights.role}
            liftWeights={liftWeights}
            onWeightsUpdate={onWeightsUpdate}
          />
        ))}
      </div>
    </div>
  )
}
