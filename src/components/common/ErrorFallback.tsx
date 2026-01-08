/**
 * ErrorFallback Component
 *
 * Reusable error display component for use with ErrorBoundary.
 * [Task 3.5] Error boundary implementation
 */

interface ErrorFallbackProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorFallback({
  title = 'Something went wrong',
  message = 'An error occurred while loading this content.',
  onRetry,
}: ErrorFallbackProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <h3 className="text-lg font-semibold text-red-800">{title}</h3>
      <p className="mt-2 text-sm text-red-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
