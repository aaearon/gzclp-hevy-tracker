/**
 * RoutineSourceStep Component
 *
 * Allows user to choose between creating new routines or importing existing ones.
 * Disables import option when no routines are available.
 */

import type { RoutineSourceMode } from '@/types/state'

export interface RoutineSourceStepProps {
  hasRoutines: boolean
  isLoading: boolean
  onSelect: (mode: RoutineSourceMode) => void
}

export function RoutineSourceStep({
  hasRoutines,
  isLoading,
  onSelect,
}: RoutineSourceStepProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-4" />
          <p className="text-gray-500">Loading routines...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          How would you like to set up your GZCLP program?
        </h2>
        <p className="text-gray-600">
          You can create new routines from scratch or import existing ones from Hevy.
        </p>
      </div>

      <div className="space-y-4">
        {/* Create New Option */}
        <button
          type="button"
          onClick={() => onSelect('create')}
          className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500
                     hover:bg-blue-50 transition-colors text-left min-h-[44px]
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Create New Routines"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Create New Routines</h3>
              <p className="text-sm text-gray-500 mt-1">
                Start fresh by selecting exercises and setting up weights from scratch.
              </p>
            </div>
          </div>
        </button>

        {/* Use Existing Option */}
        <button
          type="button"
          onClick={() => hasRoutines && onSelect('import')}
          disabled={!hasRoutines}
          className={`w-full p-4 border-2 rounded-lg text-left min-h-[44px]
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${
                        hasRoutines
                          ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                      }`}
          aria-label="Use Existing Routines"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center
                            ${hasRoutines ? 'bg-green-100' : 'bg-gray-100'}`}
              >
                <svg
                  className={`w-5 h-5 ${hasRoutines ? 'text-green-600' : 'text-gray-400'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className={`font-medium ${hasRoutines ? 'text-gray-900' : 'text-gray-400'}`}>
                Use Existing Routines
              </h3>
              <p className={`text-sm mt-1 ${hasRoutines ? 'text-gray-500' : 'text-gray-400'}`}>
                Import exercises and weights from your existing Hevy routines.
              </p>
              {!hasRoutines && (
                <p className="text-sm text-amber-600 mt-2">
                  No routines found in your Hevy account.
                </p>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
