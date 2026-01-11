/**
 * SetupComplete Component
 *
 * Final confirmation screen after setup completion.
 */

export interface SetupCompleteProps {
  onContinue: () => void
  exerciseCount: number
}

export function SetupComplete({ onContinue, exerciseCount }: SetupCompleteProps) {
  return (
    <div className="max-w-md mx-auto text-center py-8">
      <div className="mb-6">
        <svg
          className="w-16 h-16 text-green-500 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Setup Complete!</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Your GZCLP program is ready. You&apos;ve configured {exerciseCount} exercise
        {exerciseCount === 1 ? '' : 's'} and can now start tracking your progress.
      </p>

      <div className="space-y-4">
        <button
          type="button"
          onClick={onContinue}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-md font-medium
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     dark:focus:ring-offset-gray-900
                     min-h-[44px]"
        >
          Go to Dashboard
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-left">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">Next Steps</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <li className="flex items-start">
            <span className="text-blue-600 dark:text-blue-400 mr-2">1.</span>
            <span>Complete your workout in Hevy as usual</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 dark:text-blue-400 mr-2">2.</span>
            <span>Come back here and sync your workouts</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 dark:text-blue-400 mr-2">3.</span>
            <span>Review and confirm progression recommendations</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 dark:text-blue-400 mr-2">4.</span>
            <span>Update your Hevy routines with new weights</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
