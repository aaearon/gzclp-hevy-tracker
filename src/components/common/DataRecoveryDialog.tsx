/**
 * Data Recovery Dialog
 *
 * Modal dialog for handling corrupted localStorage data.
 * Forces user action: download corrupted data or discard and start fresh.
 *
 * This dialog appears when schema validation fails on localStorage read,
 * which could indicate:
 * - App update with breaking schema changes
 * - Data corruption from browser issues
 * - External modification of localStorage
 */

import { useStorageErrors } from '@/contexts/StorageContext'
import { STORAGE_KEYS } from '@/lib/constants'

// =============================================================================
// Friendly key names
// =============================================================================

const keyDisplayNames: Record<string, string> = {
  [STORAGE_KEYS.CONFIG]: 'Program Configuration',
  [STORAGE_KEYS.PROGRESSION]: 'Workout Progression',
  [STORAGE_KEYS.HISTORY]: 'Workout History',
}

function getKeyDisplayName(key: string): string {
  return keyDisplayNames[key] ?? key
}

// =============================================================================
// Icons
// =============================================================================

function AlertIcon() {
  return (
    <svg
      className="w-12 h-12 text-red-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  )
}

// =============================================================================
// Component
// =============================================================================

export function DataRecoveryDialog() {
  const {
    corruptedData,
    hasCorruptedData,
    downloadCorruptedData,
    discardCorruptedData,
    discardAllCorruptedData,
  } = useStorageErrors()

  if (!hasCorruptedData) {
    return null
  }

  const corruptedKeys = Array.from(corruptedData.keys())

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="recovery-dialog-title"
      aria-describedby="recovery-dialog-description"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <AlertIcon />
          <div>
            <h2
              id="recovery-dialog-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              Data Recovery Required
            </h2>
            <p
              id="recovery-dialog-description"
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              Some of your saved data could not be loaded.
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            This can happen after an app update or if data was modified externally.
            You can download the affected data for manual recovery, or discard it
            and start fresh with defaults.
          </p>
        </div>

        {/* Affected data list */}
        <div className="mb-6 space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Affected Data:
          </h3>
          {corruptedKeys.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {getKeyDisplayName(key)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    downloadCorruptedData(key)
                  }}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5
                    text-sm text-blue-700 dark:text-blue-300
                    bg-blue-50 dark:bg-blue-900/30
                    hover:bg-blue-100 dark:hover:bg-blue-900/50
                    rounded transition-colors
                  "
                  aria-label={`Download ${getKeyDisplayName(key)}`}
                >
                  <DownloadIcon />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    discardCorruptedData(key)
                  }}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5
                    text-sm text-red-700 dark:text-red-300
                    bg-red-50 dark:bg-red-900/30
                    hover:bg-red-100 dark:hover:bg-red-900/50
                    rounded transition-colors
                  "
                  aria-label={`Discard ${getKeyDisplayName(key)}`}
                >
                  <TrashIcon />
                  <span>Discard</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {corruptedKeys.length > 1 && (
            <button
              type="button"
              onClick={discardAllCorruptedData}
              className="
                min-h-[44px] px-4 py-2
                text-red-700 dark:text-red-300
                bg-red-50 dark:bg-red-900/30
                hover:bg-red-100 dark:hover:bg-red-900/50
                font-medium rounded-lg transition-colors
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                dark:focus:ring-offset-gray-800
              "
            >
              Discard All and Continue
            </button>
          )}
          {corruptedKeys.length === 1 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
              Download or discard the data above to continue using the app.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
