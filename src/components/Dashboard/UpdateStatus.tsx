/**
 * UpdateStatus Component
 *
 * Displays the status of Hevy routine updates (success/failure/loading).
 */

export type UpdateStatusType = 'idle' | 'updating' | 'success' | 'error'

interface UpdateStatusProps {
  status: UpdateStatusType
  error?: string | null
  onDismiss?: () => void
}

export function UpdateStatus({ status, error, onDismiss }: UpdateStatusProps) {
  if (status === 'idle') {
    return null
  }

  if (status === 'updating') {
    return (
      <div
        data-testid="update-status"
        className="flex items-center gap-2 rounded-md bg-blue-50 px-4 py-3 text-blue-700"
      >
        <svg
          className="h-5 w-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Updating Hevy routines...</span>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div
        data-testid="update-status"
        className="flex items-center justify-between rounded-md bg-green-50 px-4 py-3 text-green-700"
      >
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Routines updated successfully!</span>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-green-600 hover:text-green-800"
          >
            Dismiss
          </button>
        )}
      </div>
    )
  }

  // status === 'error' at this point
  return (
      <div
        data-testid="update-status"
        className="flex items-center justify-between rounded-md bg-red-50 px-4 py-3 text-red-700"
      >
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span>{error ?? 'Failed to update routines'}</span>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        )}
      </div>
    )
}
