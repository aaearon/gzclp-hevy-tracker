/**
 * ImportReviewStep Component
 *
 * Tabbed interface for reviewing imported exercises per GZCLP day.
 * Uses DayTabBar for navigation and DayReviewPanel for day content.
 *
 * @see docs/006-per-day-t3-and-import-ux.md - Phase 7
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import type {
  ImportResult,
  ImportedExercise,
  GZCLPDay,
  WeightUnit,
  MainLiftWeights,
  MainLiftRole,
} from '@/types/state'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { DayTabBar } from './DayTabBar'
import { DayReviewPanel } from './DayReviewPanel'

const GZCLP_DAYS: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']

export interface ImportReviewStepProps {
  importResult: ImportResult
  onDayExerciseUpdate: (day: GZCLPDay, position: 'T1' | 'T2', updates: Partial<ImportedExercise>) => void
  onDayT3Remove: (day: GZCLPDay, index: number) => void
  onNext: () => void
  onBack: () => void
  /** API key for Hevy API access (reserved for future use) */
  apiKey?: string
  /** Weight unit for display */
  unit?: WeightUnit
  /** @deprecated MainLiftWeights now obtained from byDay structure */
  mainLiftWeights?: MainLiftWeights[]
  /** @deprecated Not used - weights edited in DayReviewPanel */
  onMainLiftWeightsUpdate?: (role: MainLiftRole, updates: { t1Weight: number; t2Weight: number }) => void
}

export function ImportReviewStep({
  importResult,
  onDayExerciseUpdate,
  onDayT3Remove,
  onNext,
  onBack,
  unit = 'kg',
}: ImportReviewStepProps) {
  const { warnings, byDay } = importResult

  // Active day tab state
  const [activeDay, setActiveDay] = useState<GZCLPDay>('A1')

  // API availability check
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

  // Calculate validated days (days with both T1 and T2)
  const validatedDays = useMemo(() => {
    return GZCLP_DAYS.filter((day) => {
      const dayData = byDay[day]
      return dayData.t1 !== null && dayData.t2 !== null
    })
  }, [byDay])

  // Check if all days are validated
  const allDaysValidated = validatedDays.length === 4

  // Check if continue is allowed
  const isApiAvailable = isOnline && isHevyReachable && !apiError
  const canContinue = allDaysValidated && isApiAvailable && !isCheckingApi

  // Get current day data
  const currentDayData = byDay[activeDay]

  // Callbacks for DayReviewPanel
  const handleT1Update = useCallback(
    (updates: Partial<ImportedExercise>) => {
      onDayExerciseUpdate(activeDay, 'T1', updates)
    },
    [activeDay, onDayExerciseUpdate]
  )

  const handleT2Update = useCallback(
    (updates: Partial<ImportedExercise>) => {
      onDayExerciseUpdate(activeDay, 'T2', updates)
    },
    [activeDay, onDayExerciseUpdate]
  )

  const handleT3Remove = useCallback(
    (index: number) => {
      onDayT3Remove(activeDay, index)
    },
    [activeDay, onDayT3Remove]
  )

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
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Review Imported Exercises</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review each day's exercises. Verify T1 and T2 weights for each workout day.
        </p>
      </div>

      {/* API Error Section */}
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

      {/* Day Tab Bar */}
      <DayTabBar
        activeDay={activeDay}
        validatedDays={validatedDays}
        onDayChange={setActiveDay}
      />

      {/* Day Review Panel */}
      <DayReviewPanel
        dayData={currentDayData}
        onT1Update={handleT1Update}
        onT2Update={handleT2Update}
        onT3Remove={handleT3Remove}
        unit={unit}
      />

      {/* Validation Message */}
      {!allDaysValidated && (
        <div className="text-sm text-amber-600">
          All days must have T1 and T2 exercises assigned before continuing.
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
