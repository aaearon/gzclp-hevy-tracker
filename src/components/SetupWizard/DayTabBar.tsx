/**
 * DayTabBar Component
 *
 * Tab navigation for selecting between GZCLP days (A1, B1, A2, B2).
 * Shows active state and validation checkmarks.
 *
 * @see docs/006-per-day-t3-and-import-ux.md - Phase 5
 */

import type { GZCLPDay } from '@/types/state'

const DAYS: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']

export interface DayTabBarProps {
  /** Currently active day */
  activeDay: GZCLPDay
  /** Days that have been validated (show checkmark) */
  validatedDays: GZCLPDay[]
  /** Callback when a day tab is clicked */
  onDayChange: (day: GZCLPDay) => void
  /** Optional additional CSS classes */
  className?: string
}

export function DayTabBar({
  activeDay,
  validatedDays,
  onDayChange,
  className = '',
}: DayTabBarProps) {
  return (
    <div role="tablist" className={`flex gap-2 ${className}`}>
      {DAYS.map((day) => {
        const isActive = activeDay === day
        const isValidated = validatedDays.includes(day)

        return (
          <button
            key={day}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-label={`Day ${day}`}
            onClick={() => { onDayChange(day) }}
            className={`relative flex-1 px-4 py-2 rounded-lg font-medium
                       min-h-[44px] transition-colors
                       ${isActive
                         ? 'bg-blue-600 text-white'
                         : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
                       }`}
          >
            {day}
            {isValidated && (
              <svg
                className="absolute top-1 right-1 w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}
