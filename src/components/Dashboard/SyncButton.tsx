/**
 * SyncButton Component
 *
 * Button to trigger workout synchronization with loading state.
 */

export interface SyncButtonProps {
  onSync: () => void | Promise<void>
  isSyncing: boolean
  disabled?: boolean
}

export function SyncButton({ onSync, isSyncing, disabled = false }: SyncButtonProps) {
  const handleClick = () => {
    void onSync()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isSyncing}
      aria-busy={isSyncing}
      aria-label={isSyncing ? 'Fetching workouts' : 'Fetch workouts from Hevy'}
      className={`inline-flex items-center justify-center px-4 py-2 min-h-[44px]
                  rounded-md font-medium transition-colors
                  ${
                    isSyncing
                      ? 'bg-blue-400 text-white cursor-wait'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isSyncing ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
          Syncing...
        </>
      ) : (
        <>
          <svg
            className="-ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Fetch Workouts
        </>
      )}
    </button>
  )
}
