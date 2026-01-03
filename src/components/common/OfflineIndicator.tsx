/**
 * OfflineIndicator Component
 *
 * Displays a banner when the user is offline or Hevy is unreachable.
 * [T102] Offline detection and cached data viewing
 */

interface OfflineIndicatorProps {
  isOnline: boolean
  isHevyReachable: boolean
  onRetry?: () => void
}

export function OfflineIndicator({
  isOnline,
  isHevyReachable,
  onRetry,
}: OfflineIndicatorProps) {
  // Only show if there's a connectivity issue
  if (isOnline && isHevyReachable) {
    return null
  }

  const message = !isOnline
    ? 'You are currently offline. Viewing cached data.'
    : 'Unable to reach Hevy. Viewing cached data.'

  return (
    <div
      role="alert"
      className="bg-amber-50 border-b border-amber-200 px-4 py-3"
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Offline icon */}
          <svg
            className="h-5 w-5 text-amber-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {!isOnline ? (
              // Wifi off icon
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            ) : (
              // Cloud off icon
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            )}
          </svg>
          <span className="text-sm text-amber-800">{message}</span>
        </div>

        {onRetry && isOnline && (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-medium text-amber-700 hover:text-amber-900 underline min-h-[44px] px-2"
          >
            Retry connection
          </button>
        )}
      </div>
    </div>
  )
}
