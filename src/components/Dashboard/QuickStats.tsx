/**
 * QuickStats Component
 *
 * Displays program statistics in a 3-column grid:
 * - Current Week
 * - Total Workouts
 * - Days Since Last Workout
 *
 * [REQ-DASH-003] Quick stats dashboard display
 */

import {
  calculateCurrentWeek,
  calculateTotalWorkouts,
  calculateDaysSinceLastWorkout,
} from '@/utils/stats'
import type { GZCLPState } from '@/types/state'

interface QuickStatsProps {
  state: GZCLPState
}

interface StatCardProps {
  label: string
  value: number | string
  warning?: boolean
}

function StatCard({ label, value, warning }: StatCardProps) {
  return (
    <div className={`rounded-lg bg-white dark:bg-gray-800 p-4 shadow ${warning ? 'border-l-4 border-amber-500' : ''}`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  )
}

export function QuickStats({ state }: QuickStatsProps) {
  const workouts = calculateTotalWorkouts(state.progression, state.totalWorkouts)
  const currentWeek = calculateCurrentWeek(workouts, state.program.workoutsPerWeek)
  const daysSince = calculateDaysSinceLastWorkout(state.progression, state.mostRecentWorkoutDate)

  return (
    <div className="mb-6 grid grid-cols-3 gap-4">
      <StatCard label="Current Week" value={currentWeek} />
      <StatCard label="Total Workouts" value={workouts} />
      <StatCard
        label="Days Since Last"
        value={daysSince ?? '-'}
        warning={daysSince !== null && daysSince > 7}
      />
    </div>
  )
}
