/**
 * GranularityToggle Component
 *
 * Toggle between workout-by-workout and week-by-week chart views.
 */

import type { ChartGranularity } from '@/types/state'

interface GranularityToggleProps {
  value: ChartGranularity
  onChange: (granularity: ChartGranularity) => void
}

export function GranularityToggle({ value, onChange }: GranularityToggleProps) {
  return (
    <div className="flex rounded-lg bg-gray-100 p-1">
      <button
        onClick={() => { onChange('workout') }}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          value === 'workout'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-pressed={value === 'workout'}
      >
        By Workout
      </button>
      <button
        onClick={() => { onChange('week') }}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          value === 'week'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-pressed={value === 'week'}
      >
        By Week
      </button>
    </div>
  )
}
