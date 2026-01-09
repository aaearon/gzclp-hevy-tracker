/**
 * UpdateHevyButton Component
 *
 * Button to push current progression state to Hevy routines.
 * Shows a dot indicator when local progression differs from Hevy.
 */

interface UpdateHevyButtonProps {
  onClick: () => void | Promise<void>
  isUpdating: boolean
  disabled?: boolean
  /** Whether there are unpushed progression changes */
  needsPush?: boolean
}

export function UpdateHevyButton({ onClick, isUpdating, disabled = false, needsPush = false }: UpdateHevyButtonProps) {
  const handleClick = () => {
    void onClick()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isUpdating || disabled}
      className={`
        relative inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium
        ${
          isUpdating || disabled
            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
        }
      `}
    >
      {/* Badge indicator for pending push */}
      {needsPush && !isUpdating && !disabled && (
        <span
          className="absolute -right-1 -top-1 flex h-3 w-3"
          aria-label="Changes need to be pushed to Hevy"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
        </span>
      )}
      {isUpdating ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
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
          <span>Updating...</span>
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Push to Hevy</span>
        </>
      )}
    </button>
  )
}
