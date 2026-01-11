/**
 * Settings Page Component
 *
 * Main settings page with export, import, and data management options.
 */

import { useState } from 'react'
import { Link } from 'react-router'
import type { GZCLPState } from '@/types/state'
import { useProgram } from '@/hooks/useProgram'
import { useTheme, type ThemePreference } from '@/contexts/ThemeContext'
import { ExportButton } from './ExportButton'
import { ImportButton } from './ImportButton'
import { ImportConfirmDialog } from './ImportConfirmDialog'
import { DeleteDataButton } from './DeleteDataButton'
import { ExerciseManager } from './ExerciseManager'

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '\u2600' },
  { value: 'dark', label: 'Dark', icon: '\uD83C\uDF19' },
  { value: 'system', label: 'System', icon: '\uD83D\uDCBB' },
]

export function Settings() {
  const { state, setWeightUnit, resetState, importState } = useProgram()
  const { preference, setPreference } = useTheme()
  const [pendingImport, setPendingImport] = useState<GZCLPState | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleImportRequest = (importedState: GZCLPState) => {
    setImportError(null)
    setPendingImport(importedState)
  }

  const handleImportConfirm = () => {
    if (pendingImport) {
      const result = importState(pendingImport)
      setPendingImport(null)
      if (result.success) {
        setSuccessMessage('Data imported successfully!')
        setTimeout(() => { setSuccessMessage(null) }, 3000)
      } else {
        setImportError(result.error ?? 'Import failed')
        setTimeout(() => { setImportError(null) }, 5000)
      }
    }
  }

  const handleImportCancel = () => {
    setPendingImport(null)
  }

  const handleImportError = (error: string) => {
    setImportError(error)
    setTimeout(() => { setImportError(null) }, 5000)
  }

  const handleDelete = () => {
    resetState()
    setSuccessMessage('All data has been reset.')
    setTimeout(() => { setSuccessMessage(null) }, 3000)
  }

  const handleUnitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setWeightUnit(event.target.value as 'kg' | 'lbs')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-300">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {importError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-300">{importError}</p>
          </div>
        )}

        {/* Exercise Roles */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Exercise Roles</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <ExerciseManager />
          </div>
        </section>

        {/* Appearance */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Theme
              </label>
              <div className="flex gap-2">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setPreference(option.value); }}
                    className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${preference === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    aria-pressed={preference === option.value}
                  >
                    <span className="mr-1.5">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Unit Preference */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Preferences</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <label htmlFor="weight-unit" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Weight Unit
              </label>
              <select
                id="weight-unit"
                value={state.settings.weightUnit}
                onChange={handleUnitChange}
                className="min-h-[44px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="lbs">Pounds (lbs)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Data Management</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Export Data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Download a backup of all your program data as a JSON file.
              </p>
              <ExportButton state={state} />
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Import Data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Restore data from a previously exported backup file.
              </p>
              <ImportButton onImport={handleImportRequest} onError={handleImportError} />
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reset Data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Delete all data and start fresh. This cannot be undone.
              </p>
              <DeleteDataButton onDelete={handleDelete} />
            </div>
          </div>
        </section>

        {/* App Info */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">About</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">App Version</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{state.version}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Last Sync</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {state.lastSync ? new Date(state.lastSync).toLocaleString() : 'Never'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Exercises Configured</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{Object.keys(state.exercises).length}</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      {/* Import Confirmation Dialog */}
      {pendingImport && (
        <ImportConfirmDialog
          isOpen={true}
          onConfirm={handleImportConfirm}
          onCancel={handleImportCancel}
          importData={pendingImport}
        />
      )}
    </div>
  )
}

export { ExportButton } from './ExportButton'
export { ImportButton } from './ImportButton'
export { ImportConfirmDialog } from './ImportConfirmDialog'
export { DeleteDataButton } from './DeleteDataButton'
export { ExerciseManager } from './ExerciseManager'
