/**
 * ImportConfirmDialog Component
 *
 * Modal dialog to confirm import and show preview of imported data.
 */

import type { GZCLPState } from '@/types/state'

interface ImportConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  importData: GZCLPState
}

export function ImportConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  importData,
}: ImportConfirmDialogProps) {
  if (!isOpen) return null

  const exerciseCount = Object.keys(importData.exercises).length
  const pendingChangesCount = importData.pendingChanges.length
  const lastSync = importData.lastSync
    ? new Date(importData.lastSync).toLocaleDateString()
    : 'Never'

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2
          id="import-dialog-title"
          className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4"
        >
          Confirm Import
        </h2>

        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Warning:</strong> This will overwrite your current data. This action cannot be
            undone.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Import Preview:</h3>
          <dl className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <dt>Program Name:</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">{importData.program.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Exercises configured:</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">{exerciseCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Pending workout changes:</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">{pendingChangesCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Last sync:</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">{lastSync}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Weight unit:</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">{importData.settings.weightUnit}</dd>
            </div>
          </dl>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[44px] px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Confirm Import
          </button>
        </div>
      </div>
    </div>
  )
}
