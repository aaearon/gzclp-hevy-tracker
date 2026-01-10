/**
 * SyncStatus Component
 *
 * Displays the last sync timestamp and any sync errors.
 */

export interface SyncStatusProps {
  lastSyncTime: string | null
  error: string | null
  onDismissError?: () => void
}

/**
 * Format a timestamp into a human-readable relative time string.
 */
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) {
    return 'Just now'
  } else if (diffMinutes < 60) {
    return `${String(diffMinutes)} minute${diffMinutes !== 1 ? 's' : ''} ago`
  } else if (diffHours < 24) {
    return `${String(diffHours)} hour${diffHours !== 1 ? 's' : ''} ago`
  } else if (diffDays < 7) {
    return `${String(diffDays)} day${diffDays !== 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString()
  }
}

export function SyncStatus({ lastSyncTime, error, onDismissError }: SyncStatusProps) {
  return (
    <div className="space-y-2">
      {/* Last Sync Time */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {lastSyncTime ? (
          <span>
            Last synced: <time dateTime={lastSyncTime}>{formatRelativeTime(lastSyncTime)}</time>
          </span>
        ) : (
          <span>Not synced yet</span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
        >
          <div className="flex items-center">
            <svg
              className="h-5 w-5 mr-2 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{error}</span>
          </div>

          {onDismissError && (
            <button
              type="button"
              onClick={onDismissError}
              className="ml-4 text-red-500 hover:text-red-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Dismiss error"
            >
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
