/**
 * PendingChangeCard Component
 *
 * Displays a single pending change with current vs proposed values.
 * Read-only presentation with Apply/Reject actions.
 */

import type { PendingChange, WeightUnit } from '@/types/state'

export interface PendingChangeCardProps {
  change: PendingChange
  unit: WeightUnit
  onApply: (change: PendingChange) => void
  onReject: (changeId: string) => void
}

/**
 * Get display label and color for change type.
 */
function getChangeTypeBadge(type: PendingChange['type']): { label: string; className: string } {
  switch (type) {
    case 'progress':
      return { label: 'Progress', className: 'bg-green-100 text-green-800' }
    case 'stage_change':
      return { label: 'Stage Change', className: 'bg-yellow-100 text-yellow-800' }
    case 'deload':
      return { label: 'Deload', className: 'bg-red-100 text-red-800' }
    case 'repeat':
      return { label: 'Repeat', className: 'bg-gray-100 text-gray-800' }
  }
}

export function PendingChangeCard({
  change,
  unit,
  onApply,
  onReject,
}: PendingChangeCardProps) {
  const badge = getChangeTypeBadge(change.type)

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">{change.exerciseName}</h3>
          <span className="text-sm text-gray-500">({change.tier})</span>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* Weight Change Display */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-center">
          <div className="text-sm text-gray-500">Current</div>
          <div className="text-lg font-semibold text-gray-900">
            {change.currentWeight}
            {unit}
          </div>
        </div>

        <svg
          className="h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
            clipRule="evenodd"
          />
        </svg>

        <div className="text-center">
          <div className="text-sm text-gray-500">Proposed</div>
          <div
            className={`text-lg font-semibold ${
              change.newWeight > change.currentWeight
                ? 'text-green-600'
                : change.newWeight < change.currentWeight
                  ? 'text-red-600'
                  : 'text-gray-900'
            }`}
          >
            {change.newWeight}
            {unit}
          </div>
        </div>
      </div>

      {/* Scheme Change */}
      {change.currentStage !== change.newStage && (
        <div className="mb-3 text-sm text-gray-600">
          Scheme: {change.newScheme}
        </div>
      )}

      {/* Reason */}
      <p className="text-sm text-gray-600 mb-4">{change.reason}</p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { onApply(change) }}
          aria-label="Apply change"
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600
                     hover:bg-blue-700 rounded-md min-h-[44px] transition-colors"
        >
          Apply
        </button>

        <button
          type="button"
          onClick={() => { onReject(change.id) }}
          aria-label="Reject change"
          className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50
                     hover:bg-red-100 rounded-md min-h-[44px] transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
