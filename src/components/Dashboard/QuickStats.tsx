/**
 * QuickStats Component
 *
 * Displays program statistics in a 3-column grid:
 * - Weeks on Program
 * - Total Workouts
 * - Days Since Last Workout
 *
 * [REQ-DASH-003] Quick stats dashboard display
 */

import {
  calculateWeeksOnProgram,
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
    <div className={`rounded-lg bg-white p-4 shadow ${warning ? 'border-l-4 border-amber-500' : ''}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

export function QuickStats({ state }: QuickStatsProps) {
  const weeks = calculateWeeksOnProgram(state.program.createdAt)
  const workouts = calculateTotalWorkouts(state.progression)
  const daysSince = calculateDaysSinceLastWorkout(state.progression)

  return (
    <div className="mb-6 grid grid-cols-3 gap-4">
      <StatCard label="Weeks on Program" value={weeks} />
      <StatCard label="Total Workouts" value={workouts} />
      <StatCard
        label="Days Since Last"
        value={daysSince ?? '-'}
        warning={daysSince !== null && daysSince > 7}
      />
    </div>
  )
}
