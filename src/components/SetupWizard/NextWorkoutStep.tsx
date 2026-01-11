/**
 * NextWorkoutStep Component
 *
 * Allows user to select which GZCLP day (A1/B1/A2/B2) to do next.
 */

import type { GZCLPDay } from '@/types/state'
import { ROLE_DISPLAY } from '@/lib/constants'
import { getT1RoleForDay, getT2RoleForDay } from '@/lib/role-utils'

export interface NextWorkoutStepProps {
  selectedDay: GZCLPDay
  onDaySelect: (day: GZCLPDay) => void
  onNext: () => void
  onBack: () => void
}

const DAYS: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']

export function NextWorkoutStep({
  selectedDay,
  onDaySelect,
  onNext,
  onBack,
}: NextWorkoutStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Which Workout Is Next?</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          GZCLP uses a 4-day rotation: A1 → B1 → A2 → B2 → A1... Select which workout you&apos;ll
          do next.
        </p>
      </div>

      {/* Day Selection Grid */}
      <div className="grid grid-cols-2 gap-4">
        {DAYS.map((day) => {
          const t1Role = getT1RoleForDay(day)
          const t2Role = getT2RoleForDay(day)
          const t1Name = ROLE_DISPLAY[t1Role].label
          const t2Name = ROLE_DISPLAY[t2Role].label
          const isSelected = selectedDay === day

          return (
            <button
              key={day}
              type="button"
              onClick={() => { onDaySelect(day) }}
              aria-pressed={isSelected}
              className={`
                flex flex-col items-center justify-center p-4 rounded-lg border-2
                min-h-[44px] min-w-[44px] transition-colors
                ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:border-blue-300 dark:hover:border-blue-500'
                }
              `}
            >
              <span className="text-2xl font-bold">{day}</span>
              <div className="mt-2 text-xs text-center">
                <div className={isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}>
                  {t1Name} (T1)
                </div>
                <div className={isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}>
                  {t2Name} (T2)
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 min-h-[44px]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium
                     hover:bg-blue-700 min-h-[44px]"
        >
          Complete Setup
        </button>
      </div>
    </div>
  )
}
