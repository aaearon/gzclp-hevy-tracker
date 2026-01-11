/**
 * Storage Error Banner
 *
 * Displays storage errors and warnings to the user.
 * - Quota warnings: dismissible banner
 * - Write failures: actionable banner with retry option
 * - Corruption: triggers modal dialog (handled by DataRecoveryDialog)
 */

import { useStorageErrors, getStorageErrorMessage } from '@/contexts/StorageContext'
import type { StorageErrorType } from '@/types/storage'

// =============================================================================
// Icons
// =============================================================================

function WarningIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0"
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

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}

// =============================================================================
// Styles by error type
// =============================================================================

const errorStyles: Record<
  StorageErrorType,
  { bg: string; border: string; text: string; icon: string }
> = {
  quota_exceeded: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-400',
  },
  write_blocked: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  write_failed: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-400',
  },
  corruption: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-400',
  },
  unavailable: {
    bg: 'bg-gray-50 dark:bg-gray-900',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-800 dark:text-gray-200',
    icon: 'text-gray-600 dark:text-gray-400',
  },
}

// =============================================================================
// Component
// =============================================================================

export function StorageErrorBanner() {
  const { errors, dismissError, hasCorruptedData } = useStorageErrors()

  // Filter out corruption errors - those are handled by DataRecoveryDialog
  const displayErrors = errors.filter((e) => e.type !== 'corruption')

  if (displayErrors.length === 0) {
    return null
  }

  return (
    <div className="space-y-2" role="alert" aria-live="polite">
      {displayErrors.map((error, index) => {
        const styles = errorStyles[error.type]
        const message = getStorageErrorMessage(error.type, error.key)

        return (
          <div
            key={`${error.key}-${error.timestamp}`}
            className={`
              ${styles.bg} ${styles.border} ${styles.text}
              border rounded-lg px-4 py-3
              flex items-start gap-3
            `}
          >
            <span className={styles.icon}>
              <WarningIcon />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{message}</p>
              {error.type === 'quota_exceeded' && (
                <p className="text-xs mt-1 opacity-80">
                  Go to Settings to export your data or clear old workout history.
                </p>
              )}
            </div>
            <button
              onClick={() => {
                dismissError(index)
              }}
              className={`
                ${styles.text} opacity-60 hover:opacity-100
                p-1 rounded transition-opacity
              `}
              aria-label="Dismiss error"
            >
              <CloseIcon />
            </button>
          </div>
        )
      })}

      {/* Show hint about corruption if there's corrupted data but it's being handled by dialog */}
      {hasCorruptedData && displayErrors.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Some data issues require your attention. A dialog will appear to help you recover.
        </p>
      )}
    </div>
  )
}
