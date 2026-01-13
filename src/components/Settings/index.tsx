/**
 * Settings Page Component
 *
 * Main settings page with tabbed navigation.
 *
 * Tab structure:
 * - Preferences: Theme selector, Weight unit
 * - Exercises: ExerciseManager component
 * - Data: Export, Import, Reset buttons
 * - About: Version, Last sync, GitHub link
 *
 * IMPORTANT: Uses CSS `hidden` attribute via TabPanel to preserve
 * ExerciseManager state across tab switches.
 */

import { useState } from 'react'
import { Link } from 'react-router'
import type { GZCLPState } from '@/types/state'
import { useProgram } from '@/hooks/useProgram'
import { useTheme, type ThemePreference } from '@/contexts/ThemeContext'
import { SettingsTabs, TabPanel, type SettingsTab } from './SettingsTabs'
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

        {/* Tabbed Content */}
        <SettingsTabs>
          {(activeTab: SettingsTab) => (
            <>
              {/* Preferences Tab */}
              <TabPanel id="preferences" activeTab={activeTab}>
                <div className="space-y-6">
                  {/* Appearance */}
                  <section>
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
                  <section>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Weight Unit</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                      <div className="flex items-center justify-between">
                        <label htmlFor="weight-unit" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Display weights in
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
                </div>
              </TabPanel>

              {/* Exercises Tab */}
              <TabPanel id="exercises" activeTab={activeTab}>
                <section>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Exercise Roles</h2>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <ExerciseManager />
                  </div>
                </section>
              </TabPanel>

              {/* Data Tab */}
              <TabPanel id="data" activeTab={activeTab}>
                <section>
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
              </TabPanel>

              {/* About Tab */}
              <TabPanel id="about" activeTab={activeTab}>
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
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href="https://github.com/aaearon/gzclp-hevy-tracker"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        Feedback, Issues &amp; Ideas
                      </a>
                    </div>
                  </div>
                </section>
              </TabPanel>
            </>
          )}
        </SettingsTabs>
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
export { SettingsTabs, TabPanel } from './SettingsTabs'
