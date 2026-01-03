/**
 * ErrorState Component
 *
 * Displays an error state with retry button and optional cached data indicator.
 */

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  showCachedIndicator?: boolean
  helpLink?: string
  className?: string
}

export function ErrorState({
  title = 'Error',
  message,
  onRetry,
  showCachedIndicator = false,
  helpLink,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>

          {showCachedIndicator && (
            <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
              Showing cached data
            </p>
          )}

          <div className="mt-3 flex items-center gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="min-h-[44px] px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Try Again
              </button>
            )}

            {helpLink && (
              <a
                href={helpLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-red-700 hover:text-red-800 underline"
              >
                Get Help
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * NetworkErrorState Component
 *
 * Specialized error state for network/API errors.
 */
interface NetworkErrorStateProps {
  onRetry?: () => void
  showCachedIndicator?: boolean
  className?: string
}

export function NetworkErrorState({
  onRetry,
  showCachedIndicator = false,
  className = '',
}: NetworkErrorStateProps) {
  return (
    <ErrorState
      title="Connection Error"
      message="Unable to connect to Hevy. Please check your internet connection and try again."
      {...(onRetry && { onRetry })}
      showCachedIndicator={showCachedIndicator}
      className={className}
    />
  )
}

/**
 * EmptyState Component
 *
 * Displays when there's no data to show.
 */
interface EmptyStateProps {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  icon?: 'inbox' | 'search' | 'document'
  className?: string
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon = 'inbox',
  className = '',
}: EmptyStateProps) {
  const icons = {
    inbox: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    ),
    search: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    ),
    document: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    ),
  }

  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {icons[icon]}
        </svg>
      </div>

      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{message}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
