/**
 * PushConfirmDialog Component
 *
 * Modal dialog to confirm pushing progression data to Hevy.
 * Shows a diff of what will change for each day's routine.
 * Supports selective push/pull/skip per exercise.
 */

import type {
  SelectablePushPreview,
  SelectableDayDiff,
  SelectableExerciseDiff,
  SyncAction,
} from '@/lib/push-preview'
import type { WeightUnit } from '@/types/state'
import { formatWeight } from '@/utils/formatting'
import { getRepScheme } from '@/lib/constants'

// =============================================================================
// Types
// =============================================================================

export interface PushConfirmDialogProps {
  isOpen: boolean
  isLoading: boolean
  error: string | null
  preview: SelectablePushPreview | null
  weightUnit: WeightUnit
  onConfirm: () => void
  onCancel: () => void
  onRetry: () => void
  onActionChange: (progressionKey: string, action: SyncAction) => void
}

// =============================================================================
// Sub-components
// =============================================================================

/** Visual indicator for weight change direction */
function ChangeIndicator({ oldWeight, newWeight }: { oldWeight: number | null; newWeight: number }) {
  if (oldWeight === null) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
        NEW
      </span>
    )
  }

  const diff = newWeight - oldWeight
  if (Math.abs(diff) < 0.01) {
    return <span className="text-gray-400">-</span>
  }

  if (diff > 0) {
    return <span className="text-green-600 font-medium">+{diff.toFixed(1)}</span>
  }

  return <span className="text-red-600 font-medium">{diff.toFixed(1)}</span>
}

/** Three-way action selector: Push / Skip / Pull */
function ExerciseActionSelector({
  action,
  isChanged,
  canPull,
  onActionChange,
}: {
  action: SyncAction
  isChanged: boolean
  canPull: boolean // false if oldWeight is null (new routine)
  onActionChange: (action: SyncAction) => void
}) {
  // If not changed, only skip is available
  if (!isChanged) {
    return (
      <div className="flex gap-0.5 text-xs">
        <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">No change</span>
      </div>
    )
  }

  const buttonBase = "px-2 py-1 rounded text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1"

  return (
    <div className="flex gap-0.5" role="group" aria-label="Sync action">
      {/* Push button */}
      <button
        type="button"
        onClick={() => { onActionChange('push') }}
        className={`${buttonBase} ${
          action === 'push'
            ? 'bg-indigo-600 text-white focus:ring-indigo-500'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-400'
        }`}
        title="Push local weight to Hevy"
      >
        Push
      </button>
      {/* Skip button */}
      <button
        type="button"
        onClick={() => { onActionChange('skip') }}
        className={`${buttonBase} ${
          action === 'skip'
            ? 'bg-gray-600 text-white focus:ring-gray-500'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-400'
        }`}
        title="Skip - keep both unchanged"
      >
        Skip
      </button>
      {/* Pull button - disabled if no Hevy weight */}
      <button
        type="button"
        onClick={() => { onActionChange('pull') }}
        disabled={!canPull}
        className={`${buttonBase} ${
          action === 'pull'
            ? 'bg-green-600 text-white focus:ring-green-500'
            : canPull
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-400'
              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
        }`}
        title={canPull ? "Pull Hevy weight to local" : "No Hevy weight to pull"}
      >
        Pull
      </button>
    </div>
  )
}

/** Single exercise row in the diff view */
function ExerciseRow({
  diff,
  weightUnit,
  onActionChange,
}: {
  diff: SelectableExerciseDiff
  weightUnit: WeightUnit
  onActionChange: (progressionKey: string, action: SyncAction) => void
}) {
  const tierColors = {
    T1: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    T2: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    T3: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  }

  // Get rep scheme display for T1/T2
  const schemeDisplay = diff.stage !== null ? getRepScheme(diff.tier as 'T1' | 'T2', diff.stage).display : null

  // Determine visual styling based on action
  const rowBg = diff.action === 'push'
    ? 'bg-indigo-50 dark:bg-indigo-900/20'
    : diff.action === 'pull'
      ? 'bg-green-50 dark:bg-green-900/20'
      : diff.isChanged
        ? 'bg-white dark:bg-gray-800'
        : 'bg-gray-50 dark:bg-gray-800/50'

  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded ${rowBg}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${tierColors[diff.tier]}`}
        >
          {diff.tier}
        </span>
        <span className={`text-sm truncate ${diff.isChanged ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
          {diff.name}
        </span>
        {schemeDisplay && (
          <span className="text-xs text-gray-400 dark:text-gray-500">({schemeDisplay})</span>
        )}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className={diff.isChanged ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}>
          {diff.oldWeight !== null ? formatWeight(diff.oldWeight, weightUnit) : '-'}
        </span>
        <span className="text-gray-400 dark:text-gray-500">&rarr;</span>
        <span className={diff.isChanged ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
          {formatWeight(diff.newWeight, weightUnit)}
        </span>
        <span className="w-12 text-right mr-2">
          <ChangeIndicator oldWeight={diff.oldWeight} newWeight={diff.newWeight} />
        </span>
        <ExerciseActionSelector
          action={diff.action}
          isChanged={diff.isChanged}
          canPull={diff.oldWeight !== null}
          onActionChange={(action) => { onActionChange(diff.progressionKey, action) }}
        />
      </div>
    </div>
  )
}

/** Day section with collapsible exercises */
function DaySection({
  day,
  weightUnit,
  defaultOpen,
  onActionChange,
}: {
  day: SelectableDayDiff
  weightUnit: WeightUnit
  defaultOpen: boolean
  onActionChange: (progressionKey: string, action: SyncAction) => void
}) {
  const hasChanges = day.changeCount > 0

  return (
    <details open={defaultOpen} className="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <summary className="flex items-center justify-between cursor-pointer list-none py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">{day.routineName}</span>
          {!day.routineExists && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              NEW ROUTINE
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasChanges ? (
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{day.changeCount} change(s)</span>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">No changes</span>
          )}
          <svg
            className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </summary>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {day.exercises.length === 0 ? (
          <div className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 italic">No exercises configured</div>
        ) : (
          day.exercises.map((exercise) => (
            <ExerciseRow
              key={exercise.exerciseId}
              diff={exercise}
              weightUnit={weightUnit}
              onActionChange={onActionChange}
            />
          ))
        )}
      </div>
    </details>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function PushConfirmDialog({
  isOpen,
  isLoading,
  error,
  preview,
  weightUnit,
  onConfirm,
  onCancel,
  onRetry,
  onActionChange,
}: PushConfirmDialogProps) {
  if (!isOpen) return null

  // Loading state
  if (isLoading) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-dialog-title"
      >
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex flex-col items-center py-8">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p id="push-dialog-title" className="text-gray-600 dark:text-gray-400">
              Loading current routines from Hevy...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-dialog-title"
      >
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 id="push-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Error Loading Routines
          </h2>
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="min-h-[44px] px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No preview data (shouldn't happen, but handle gracefully)
  if (!preview) return null

  const hasActions = preview.pushCount > 0 || preview.pullCount > 0

  // Determine button label
  const buttonLabel = preview.pullCount > 0 && preview.pushCount > 0
    ? 'Sync Changes'
    : preview.pullCount > 0
      ? 'Pull Changes'
      : 'Push Changes'

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-dialog-title"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="push-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Sync with Hevy
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded transition-colors"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Choose an action for each exercise:
          </p>
          <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <span><span className="font-medium text-indigo-600 dark:text-indigo-400">Push</span> = update Hevy</span>
            <span><span className="font-medium text-gray-600 dark:text-gray-400">Skip</span> = no change</span>
            <span><span className="font-medium text-green-600 dark:text-green-400">Pull</span> = update local</span>
          </div>

          <div className="space-y-3">
            {preview.days.map((day, index) => (
              <DaySection
                key={day.day}
                day={day}
                weightUnit={weightUnit}
                defaultOpen={index < 2}
                onActionChange={onActionChange}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {hasActions ? (
                <span className="flex gap-3">
                  {preview.pushCount > 0 && (
                    <span><span className="font-medium text-indigo-600 dark:text-indigo-400">{preview.pushCount}</span> push</span>
                  )}
                  {preview.pullCount > 0 && (
                    <span><span className="font-medium text-green-600 dark:text-green-400">{preview.pullCount}</span> pull</span>
                  )}
                  {preview.skipCount > 0 && (
                    <span><span className="font-medium text-gray-500 dark:text-gray-400">{preview.skipCount}</span> skip</span>
                  )}
                </span>
              ) : (
                <span className="text-green-600 dark:text-green-400">All weights are already up to date</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="min-h-[44px] px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={!hasActions}
                className="min-h-[44px] px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {buttonLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
