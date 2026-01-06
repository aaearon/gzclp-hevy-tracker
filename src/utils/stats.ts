/**
 * Stats Calculation Utilities
 *
 * Functions for calculating dashboard quick stats:
 * - Current week
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
 * Calculate current week number (1-indexed).
 * Week 1 = 0-2 workouts, Week 2 = 3-5 workouts, etc. (assuming 3/week)
 * @param totalWorkouts Total number of completed workouts
 * @param workoutsPerWeek Number of workouts per week (default 3)
 * @returns Current week number (1, 2, 3, ...)
 */
export function calculateCurrentWeek(totalWorkouts: number, workoutsPerWeek = 3): number {
  return Math.floor(totalWorkouts / workoutsPerWeek) + 1
}

/**
 * Calculate total unique workouts from progression data.
 * Uses storedTotal if provided and > 0, otherwise falls back to counting
 * unique workout IDs from progression.
 *
 * @param progression Record of exercise progression states
 * @param storedTotal Optional stored total from state (from Hevy API)
 * @returns Number of unique workouts
 */
export function calculateTotalWorkouts(
  progression: Record<string, ProgressionState>,
  storedTotal?: number
): number {
  // Use stored total if available and > 0
  if (storedTotal !== undefined && storedTotal > 0) {
    return storedTotal
  }

  // Fall back to counting unique workout IDs from progression
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
 * Uses storedDate if provided, otherwise falls back to progression data.
 *
 * @param progression Record of exercise progression states
 * @param storedDate Optional stored date from state (from Hevy API)
 * @returns Number of days since last workout, or null if no workouts
 */
export function calculateDaysSinceLastWorkout(
  progression: Record<string, ProgressionState>,
  storedDate?: string | null
): number | null {
  let latestDate: Date | null = null

  // Try stored date first
  if (storedDate) {
    latestDate = new Date(storedDate)
  } else {
    // Fall back to progression data
    for (const p of Object.values(progression)) {
      if (p.lastWorkoutDate) {
        const date = new Date(p.lastWorkoutDate)
        if (!latestDate || date > latestDate) {
          latestDate = date
        }
      }
    }
  }

  if (!latestDate) return null

  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((Date.now() - latestDate.getTime()) / msPerDay)
}
