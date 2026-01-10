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
 * Get the most recent workout date.
 * Uses storedDate if provided, otherwise falls back to progression data.
 *
 * @param progression Record of exercise progression states
 * @param storedDate Optional stored date from state (from Hevy API)
 * @returns Date object of last workout, or null if no workouts
 */
export function getLastWorkoutDate(
  progression: Record<string, ProgressionState>,
  storedDate?: string | null
): Date | null {
  // Try stored date first
  if (storedDate) {
    return new Date(storedDate)
  }

  // Fall back to progression data
  let latestDate: Date | null = null
  for (const p of Object.values(progression)) {
    if (p.lastWorkoutDate) {
      const date = new Date(p.lastWorkoutDate)
      if (!latestDate || date > latestDate) {
        latestDate = date
      }
    }
  }

  return latestDate
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
  const latestDate = getLastWorkoutDate(progression, storedDate)

  if (!latestDate) return null

  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((Date.now() - latestDate.getTime()) / msPerDay)
}

/**
 * Format last workout info for display.
 * Returns contextual subtitle based on how recent the workout was.
 *
 * @param lastWorkoutDate Date of last workout
 * @param daysSince Number of days since last workout
 * @returns Object with display value and contextual subtitle
 */
export function formatLastWorkoutDisplay(
  lastWorkoutDate: Date | null,
  daysSince: number | null
): { value: string; subtitle: string } {
  if (lastWorkoutDate === null || daysSince === null) {
    return { value: '-', subtitle: 'No workouts yet' }
  }

  // Today: show time
  if (daysSince === 0) {
    const timeStr = lastWorkoutDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    return { value: 'Today', subtitle: `at ${timeStr}` }
  }

  // Yesterday
  if (daysSince === 1) {
    return { value: '1', subtitle: 'Yesterday' }
  }

  // 2-6 days: show weekday name
  if (daysSince <= 6) {
    const weekday = lastWorkoutDate.toLocaleDateString('en-US', { weekday: 'long' })
    return { value: String(daysSince), subtitle: weekday }
  }

  // 7+ days: show short date
  const dateStr = lastWorkoutDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  return { value: String(daysSince), subtitle: dateStr }
}
