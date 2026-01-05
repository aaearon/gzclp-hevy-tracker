/**
 * Stats Calculation Utilities
 *
 * Functions for calculating dashboard quick stats:
 * - Weeks on program
 * - Total workouts
 * - Days since last workout
 */

import type { ProgressionState } from '@/types/state'

/**
 * Calculate weeks on program from creation date.
 * @param createdAt ISO date string when program was created
 * @returns Number of complete weeks on program
 */
export function calculateWeeksOnProgram(createdAt: string): number {
  const created = new Date(createdAt).getTime()
  const now = Date.now()
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  return Math.floor((now - created) / msPerWeek)
}

/**
 * Calculate total unique workouts from progression data.
 * @param progression Record of exercise progression states
 * @returns Number of unique workout IDs found
 */
export function calculateTotalWorkouts(
  progression: Record<string, ProgressionState>
): number {
  const workoutIds = new Set<string>()
  for (const p of Object.values(progression)) {
    if (p.lastWorkoutId) {
      workoutIds.add(p.lastWorkoutId)
    }
  }
  return workoutIds.size
}

/**
 * Calculate days since the most recent workout.
 * @param progression Record of exercise progression states
 * @returns Number of days since last workout, or null if no workouts
 */
export function calculateDaysSinceLastWorkout(
  progression: Record<string, ProgressionState>
): number | null {
  let latestDate: Date | null = null

  for (const p of Object.values(progression)) {
    if (p.lastWorkoutDate) {
      const date = new Date(p.lastWorkoutDate)
      if (!latestDate || date > latestDate) {
        latestDate = date
      }
    }
  }

  if (!latestDate) return null

  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((Date.now() - latestDate.getTime()) / msPerDay)
}
