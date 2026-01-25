/**
 * QuickStats Component
 *
 * Displays program statistics in a 3-column grid:
 * - Current Week (with day of training week)
 * - Total Workouts (with program start date)
 * - Days Since Last Workout (with contextual date info)
 *
 * [REQ-DASH-003] Quick stats dashboard display
 */

import { useMemo } from 'react'
import {
  calculateCurrentWeek,
  calculateDayOfWeek,
  calculateDaysSinceLastWorkout,
  getLastWorkoutDate,
  formatLastWorkoutDisplay,
  formatProgramStartDate,
  getMostRecentWorkoutDate,
} from '@/utils/stats'
import type { GZCLPState } from '@/types/state'

/**
 * Derive total unique workouts from progression history.
 * Counts distinct workout IDs across all exercise histories.
 */
function deriveTotalWorkouts(progressionHistory: GZCLPState['progressionHistory']): number {
  const workoutIds = new Set<string>()
  for (const history of Object.values(progressionHistory)) {
    for (const entry of history.entries) {
      workoutIds.add(entry.workoutId)
    }
  }
  return workoutIds.size
}

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
  // Derive stats from progression history (Task 2 simplification)
  const workouts = useMemo(
    () => deriveTotalWorkouts(state.progressionHistory),
    [state.progressionHistory]
  )
  const mostRecentDate = useMemo(
    () => getMostRecentWorkoutDate(state.progressionHistory),
    [state.progressionHistory]
  )

  const currentWeek = calculateCurrentWeek(workouts, state.program.workoutsPerWeek)
  const dayOfWeek = calculateDayOfWeek(workouts, state.program.workoutsPerWeek)
  const daysSince = calculateDaysSinceLastWorkout(state.progression, mostRecentDate)
  const lastWorkoutDate = getLastWorkoutDate(state.progression, mostRecentDate)
  const lastWorkoutDisplay = formatLastWorkoutDisplay(lastWorkoutDate, daysSince)
  const programStartDate = formatProgramStartDate(state.program.createdAt)

  return (
    <div className="mb-6 grid grid-cols-3 gap-4">
      <StatCard
        label="Current Week"
        value={currentWeek}
        subtitle={`${String(dayOfWeek.completed)} of ${String(dayOfWeek.total)} complete`}
      />
      <StatCard
        label="Total Workouts"
        value={workouts}
        subtitle={`Started ${programStartDate}`}
      />
      <StatCard
        label="Days Since Last Workout"
        value={lastWorkoutDisplay.value}
        subtitle={lastWorkoutDisplay.subtitle}
        warning={daysSince !== null && daysSince > 7}
      />
    </div>
  )
}
