/**
 * WelcomeStep Component
 *
 * Combined first step of the setup wizard: app branding, API key input,
 * path selection, and unit selection (REQ-ONBOARD-002).
 */

import { useState, useRef } from 'react'
import { isValidApiKey } from '@/utils/validation'
import { validateImportFile } from '@/lib/data-import'
import { UnitSelector } from './UnitSelector'
import type { WeightUnit, RoutineSourceMode, GZCLPState } from '@/types/state'

export interface WelcomeStepProps {
  onComplete: (data: {
    apiKey: string
    path: RoutineSourceMode
    unit: WeightUnit
    workoutsPerWeek: number
    /** Restored state when path is 'restore' */
    restoredState?: GZCLPState
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
  const [showApiKey, setShowApiKey] = useState(false)
  const [isValidated, setIsValidated] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<RoutineSourceMode | null>(null)
  const [unit, setUnit] = useState<WeightUnit>('kg')
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(3)

  // Restore from backup state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [restoredState, setRestoredState] = useState<GZCLPState | null>(null)
  const [restoredExportedAt, setRestoredExportedAt] = useState<string | null>(null)
  const [isLoadingRestore, setIsLoadingRestore] = useState(false)
  const [restoreError, setRestoreError] = useState<string | null>(null)

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

  const handleRestoreClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void processRestoreFile(event)
  }

  const processRestoreFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoadingRestore(true)
    setRestoreError(null)

    try {
      const result = await validateImportFile(file)

      if (result.isValid && result.data) {
        setRestoredState(result.data)
        setRestoredExportedAt(result.exportedAt ?? null)
        setSelectedPath('restore')
        // Apply unit from restored state
        setUnit(result.data.settings.weightUnit)
        // Apply workouts per week from restored state
        if (result.data.program.workoutsPerWeek) {
          setWorkoutsPerWeek(result.data.program.workoutsPerWeek)
        }
      } else if (result.error) {
        setRestoreError(result.error)
      }
    } catch (error) {
      setRestoreError(error instanceof Error ? error.message : 'Failed to import file')
    } finally {
      setIsLoadingRestore(false)
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleContinue = () => {
    if (isValidated && selectedPath) {
      if (selectedPath === 'restore' && restoredState) {
        onComplete({
          apiKey: apiKey.trim(),
          path: selectedPath,
          unit,
          workoutsPerWeek,
          restoredState,
        })
      } else {
        onComplete({ apiKey: apiKey.trim(), path: selectedPath, unit, workoutsPerWeek })
      }
    }
  }

  const displayError = localError ?? validationError

  return (
    <div className="max-w-md mx-auto">
      {/* App Branding */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
        GZCLP Hevy Tracker
      </h1>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-2">
        Track your GZCLP progress with automatic Hevy integration
      </p>
      <p className="text-center mb-8">
        <a
          href="https://github.com/aaearon/gzclp-hevy-tracker"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          Feedback &amp; Issues
        </a>
      </p>

      {/* API Key Section */}
      <div className="mb-6">
        <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Hevy API Key
        </label>
        {!isValidated ? (
          <form onSubmit={(e) => { void handleValidateKey(e) }} className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value) }}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  disabled={isValidating}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                             focus:ring-blue-500 focus:border-blue-500
                             disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => { setShowApiKey(!showApiKey) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700
                             dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={!apiKey.trim() || isValidating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium
                           hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                           dark:focus:ring-offset-gray-900
                           disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                           min-h-[44px]"
              >
                {isValidating ? 'Validating...' : 'Validate'}
              </button>
            </div>
            {displayError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>
              </div>
            )}
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="api-key"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                disabled
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                           bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => { setShowApiKey(!showApiKey) }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700
                           dark:text-gray-400 dark:hover:text-gray-200"
                aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              >
                {showApiKey ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
            <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md font-medium">
              Valid
            </span>
          </div>
        )}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Find your API key in{' '}
          <a
            href="https://hevy.com/settings?developer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
          >
            Hevy Settings → Developer
          </a>
          . Hevy Pro subscription is required for API access.
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic">
          You can start fresh, import from Hevy, or restore a backup after validation.
        </p>
      </div>

      {/* Path Selection (shown after validation) */}
      {isValidated && (
        <>
          {isLoadingRoutines ? (
            <div className="mb-6 text-center py-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading routines...</p>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                How would you like to start?
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => { setSelectedPath('create') }}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-colors min-h-[44px]
                              focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                selectedPath === 'create'
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">Start New Program</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                                  ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
                                  : selectedPath === 'import'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              }`}
                >
                  <div className={`font-medium ${hasRoutines ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                    Import Existing Program
                  </div>
                  <div className={`text-sm mt-1 ${hasRoutines ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    I've been doing GZCLP in Hevy
                  </div>
                  {!hasRoutines && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                      No routines found in your Hevy account.
                    </p>
                  )}
                </button>

                {/* Restore from Backup */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={handleRestoreClick}
                  disabled={isLoadingRestore}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-colors min-h-[44px]
                              focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                selectedPath === 'restore'
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {isLoadingRestore ? 'Loading backup...' : 'Restore from Backup'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    I have a previously exported backup file
                  </div>
                  {selectedPath === 'restore' && restoredState && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      Backup loaded: {restoredExportedAt
                        ? new Date(restoredExportedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : restoredState.program.name}
                    </p>
                  )}
                  {restoreError && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      {restoreError}
                    </p>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Unit Selection - disabled when restoring from backup */}
          <div className="mb-6">
            <UnitSelector
              value={unit}
              onChange={setUnit}
              disabled={selectedPath === 'restore'}
            />
            {selectedPath === 'restore' && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Using unit from backup file
              </p>
            )}
          </div>

          {/* Workouts Per Week - disabled when restoring from backup */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workouts per week
            </label>
            <div className="flex gap-2">
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => { if (selectedPath !== 'restore') setWorkoutsPerWeek(num) }}
                  disabled={selectedPath === 'restore'}
                  className={`flex-1 py-2 px-4 border-2 rounded-lg font-medium transition-colors
                              focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                                selectedPath === 'restore'
                                  ? 'cursor-not-allowed opacity-60'
                                  : ''
                              } ${
                                workoutsPerWeek === num
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                              }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {selectedPath === 'restore' ? 'Using value from backup file' : 'Used to calculate weeks on program'}
            </p>
          </div>

          {/* Continue Button */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedPath || isLoadingRoutines}
            className="w-full py-3 bg-blue-600 text-white rounded-md font-medium
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       dark:focus:ring-offset-gray-900
                       disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                       min-h-[44px]"
          >
            Continue
          </button>
        </>
      )}
    </div>
  )
}
