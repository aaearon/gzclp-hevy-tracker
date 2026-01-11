/**
 * ImportExplanationBanner Component
 *
 * Collapsible banner that explains how the import process works to users.
 * Displays information about data sources, progression calculation, and
 * optional routine mapping summary.
 *
 * @see docs/009-intelligent-import-progression.md
 */

import { useState } from 'react'

export interface ImportExplanationBannerProps {
  /** Summary of which routines mapped to which workout dates (optional) */
  routineSummary?: {
    day: string // 'A1', 'B1', 'A2', 'B2'
    workoutDate: string | null // ISO date or null if no workout
  }[]
}

/**
 * Formats an ISO date string to a user-friendly locale date string.
 * Returns "No workout data" for null values.
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No workout data'
  return new Date(dateStr).toLocaleDateString()
}

export function ImportExplanationBanner({ routineSummary }: ImportExplanationBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
      {/* Header with toggle */}
      <button
        type="button"
        onClick={() => {
          setIsExpanded(!isExpanded)
        }}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={isExpanded}
        aria-controls="import-explanation-content"
      >
        <div className="flex items-center gap-2">
          {/* Info Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5 text-blue-500 dark:text-blue-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium text-blue-800 dark:text-blue-300">How Import Works</span>
        </div>
        {/* Chevron Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-5 w-5 text-blue-500 dark:text-blue-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div id="import-explanation-content" className="px-4 pb-4 text-sm text-blue-700 dark:text-blue-400">
          <p className="mb-3">
            We pulled data from your most recent workout for each routine:
          </p>
          <ul className="mb-3 list-inside list-disc space-y-1">
            <li>Weights and reps from what you actually lifted</li>
            <li>Analyzed success/failure based on GZCLP rules</li>
            <li>Calculated your next target weights</li>
          </ul>
          <p className="mb-3">Review the suggestions below and adjust if needed.</p>

          {/* Routine Summary (if provided) */}
          {routineSummary && routineSummary.length > 0 && (
            <div className="mt-4 border-t border-blue-200 dark:border-blue-800 pt-3">
              <p className="mb-2 font-medium text-blue-800 dark:text-blue-300">Routine mapping:</p>
              <ul className="list-inside list-disc space-y-1">
                {routineSummary.map((routine) => (
                  <li key={routine.day}>
                    <span className="font-medium">{routine.day}:</span>{' '}
                    {formatDate(routine.workoutDate)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
