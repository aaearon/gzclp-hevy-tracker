/**
 * WelcomeStep Component
 *
 * Combined first step of the setup wizard: app branding, API key input,
 * path selection, and unit selection (REQ-ONBOARD-002).
 */

import { useState } from 'react'
import { isValidApiKey } from '@/utils/validation'
import { UnitSelector } from './UnitSelector'
import type { WeightUnit, RoutineSourceMode } from '@/types/state'

export interface WelcomeStepProps {
  onComplete: (data: {
    apiKey: string
    path: RoutineSourceMode
    unit: WeightUnit
  }) => void
  onValidateKey: (apiKey: string) => Promise<boolean>
  isValidating: boolean
  validationError: string | null
  hasRoutines: boolean
  isLoadingRoutines: boolean
}

export function WelcomeStep({
  onComplete,
  onValidateKey,
  isValidating,
  validationError,
  hasRoutines,
  isLoadingRoutines,
}: WelcomeStepProps) {
  const [apiKey, setApiKey] = useState('')
  const [isValidated, setIsValidated] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<RoutineSourceMode | null>(null)
  const [unit, setUnit] = useState<WeightUnit>('kg')

  const handleValidateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    const trimmedKey = apiKey.trim()

    if (!isValidApiKey(trimmedKey)) {
      setLocalError('Invalid API key format. Please enter a valid UUID.')
      return
    }

    const success = await onValidateKey(trimmedKey)
    if (success) {
      setIsValidated(true)
    }
  }

  const handleContinue = () => {
    if (isValidated && selectedPath) {
      onComplete({ apiKey: apiKey.trim(), path: selectedPath, unit })
    }
  }

  const displayError = localError ?? validationError

  return (
    <div className="max-w-md mx-auto">
      {/* App Branding */}
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
        GZCLP Hevy Tracker
      </h1>
      <p className="text-gray-600 text-center mb-8">
        Track your GZCLP progress with automatic Hevy integration
      </p>

      {/* API Key Section */}
      <div className="mb-6">
        <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
          Hevy API Key
        </label>
        {!isValidated ? (
          <form onSubmit={(e) => { void handleValidateKey(e) }} className="space-y-2">
            <div className="flex gap-2">
              <input
                id="api-key"
                type="text"
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value) }}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                disabled={isValidating}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm
                           focus:ring-blue-500 focus:border-blue-500
                           disabled:bg-gray-100 disabled:cursor-not-allowed"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!apiKey.trim() || isValidating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium
                           hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                           disabled:bg-gray-400 disabled:cursor-not-allowed
                           min-h-[44px]"
              >
                {isValidating ? 'Validating...' : 'Validate'}
              </button>
            </div>
            {displayError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{displayError}</p>
              </div>
            )}
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <input
              id="api-key"
              type="text"
              value={apiKey}
              disabled
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm
                         bg-gray-100 cursor-not-allowed"
            />
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-md font-medium">
              Valid
            </span>
          </div>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Find your API key in{' '}
          <a
            href="https://hevy.com/settings?developer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Hevy Settings → Developer
          </a>
          . Hevy Pro subscription is required for API access.
        </p>
      </div>

      {/* Path Selection (shown after validation) */}
      {isValidated && (
        <>
          {isLoadingRoutines ? (
            <div className="mb-6 text-center py-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Loading routines...</p>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you like to start?
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => { setSelectedPath('create') }}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-colors min-h-[44px]
                              focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                selectedPath === 'create'
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                >
                  <div className="font-medium text-gray-900">Start New Program</div>
                  <div className="text-sm text-gray-500 mt-1">
                    I'm starting GZCLP from scratch
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { if (hasRoutines) setSelectedPath('import') }}
                  disabled={!hasRoutines}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-colors min-h-[44px]
                              focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                !hasRoutines
                                  ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                                  : selectedPath === 'import'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                              }`}
                >
                  <div className={`font-medium ${hasRoutines ? 'text-gray-900' : 'text-gray-400'}`}>
                    Import Existing Program
                  </div>
                  <div className={`text-sm mt-1 ${hasRoutines ? 'text-gray-500' : 'text-gray-400'}`}>
                    I've been doing GZCLP in Hevy
                  </div>
                  {!hasRoutines && (
                    <p className="text-sm text-amber-600 mt-2">
                      No routines found in your Hevy account.
                    </p>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Unit Selection */}
          <div className="mb-6">
            <UnitSelector value={unit} onChange={setUnit} />
          </div>

          {/* Continue Button */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedPath || isLoadingRoutines}
            className="w-full py-3 bg-blue-600 text-white rounded-md font-medium
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       disabled:bg-gray-400 disabled:cursor-not-allowed
                       min-h-[44px]"
          >
            Continue
          </button>
        </>
      )}
    </div>
  )
}
