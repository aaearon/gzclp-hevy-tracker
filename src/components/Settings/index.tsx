/**
 * Settings Page Component
 *
 * Main settings page with export, import, and data management options.
 */

import { useState } from 'react'
import type { GZCLPState } from '@/types/state'
import { useProgram } from '@/hooks/useProgram'
import { ExportButton } from './ExportButton'
import { ImportButton } from './ImportButton'
import { ImportConfirmDialog } from './ImportConfirmDialog'
import { DeleteDataButton } from './DeleteDataButton'
import { ExerciseManager } from './ExerciseManager'

interface SettingsProps {
  onBack?: () => void
}

export function Settings({ onBack }: SettingsProps) {
  const { state, setWeightUnit, resetState, importState } = useProgram()
  const [pendingImport, setPendingImport] = useState<GZCLPState | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleImportRequest = (importedState: GZCLPState) => {
    setImportError(null)
    setPendingImport(importedState)
  }

  const handleImportConfirm = () => {
    if (pendingImport) {
      importState(pendingImport)
      setPendingImport(null)
      setSuccessMessage('Data imported successfully!')
      setTimeout(() => { setSuccessMessage(null) }, 3000)
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
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
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {importError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{importError}</p>
          </div>
        )}

        {/* Exercise Roles */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Exercise Roles</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <ExerciseManager />
          </div>
        </section>

        {/* Unit Preference */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Preferences</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <label htmlFor="weight-unit" className="text-sm font-medium text-gray-700">
                Weight Unit
              </label>
              <select
                id="weight-unit"
                value={state.settings.weightUnit}
                onChange={handleUnitChange}
                className="min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="lbs">Pounds (lbs)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Data Management</h2>
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Export Data</h3>
              <p className="text-sm text-gray-500 mb-3">
                Download a backup of all your program data as a JSON file.
              </p>
              <ExportButton state={state} />
            </div>

            <hr className="border-gray-200" />

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Import Data</h3>
              <p className="text-sm text-gray-500 mb-3">
                Restore data from a previously exported backup file.
              </p>
              <ImportButton onImport={handleImportRequest} onError={handleImportError} />
            </div>

            <hr className="border-gray-200" />

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Reset Data</h3>
              <p className="text-sm text-gray-500 mb-3">
                Delete all data and start fresh. This cannot be undone.
              </p>
              <DeleteDataButton onDelete={handleDelete} />
            </div>
          </div>
        </section>

        {/* App Info */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">About</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">App Version</dt>
                <dd className="font-medium text-gray-900">{state.version}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Last Sync</dt>
                <dd className="font-medium text-gray-900">
                  {state.lastSync ? new Date(state.lastSync).toLocaleString() : 'Never'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Exercises Configured</dt>
                <dd className="font-medium text-gray-900">{Object.keys(state.exercises).length}</dd>
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
