/**
 * QuickStats Component
 *
 * Displays program statistics in a 3-column grid:
 * - Current Week
 * - Total Workouts
 * - Days Since Last Workout (with contextual date info)
 *
 * [REQ-DASH-003] Quick stats dashboard display
 */

import {
  calculateCurrentWeek,
  calculateTotalWorkouts,
  calculateDaysSinceLastWorkout,
  getLastWorkoutDate,
  formatLastWorkoutDisplay,
} from '@/utils/stats'
import type { GZCLPState } from '@/types/state'

interface QuickStatsProps {
  state: GZCLPState
}

interface StatCardProps {
  label: string
  value: number | string
  subtitle?: string
  warning?: boolean
}

function StatCard({ label, value, subtitle, warning }: StatCardProps) {
  return (
    <div className={`rounded-lg bg-white dark:bg-gray-800 p-4 shadow ${warning ? 'border-l-4 border-amber-500' : ''}`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
      )}
    </div>
  )
}

export function QuickStats({ state }: QuickStatsProps) {
  const workouts = calculateTotalWorkouts(state.progression, state.totalWorkouts)
  const currentWeek = calculateCurrentWeek(workouts, state.program.workoutsPerWeek)
  const daysSince = calculateDaysSinceLastWorkout(state.progression, state.mostRecentWorkoutDate)
  const lastWorkoutDate = getLastWorkoutDate(state.progression, state.mostRecentWorkoutDate)
  const lastWorkoutDisplay = formatLastWorkoutDisplay(lastWorkoutDate, daysSince)

  return (
    <div className="mb-6 grid grid-cols-3 gap-4">
      <StatCard label="Current Week" value={currentWeek} />
      <StatCard label="Total Workouts" value={workouts} />
      <StatCard
        label="Days Since Last"
        value={lastWorkoutDisplay.value}
        subtitle={lastWorkoutDisplay.subtitle}
        warning={daysSince !== null && daysSince > 7}
      />
    </div>
  )
}
