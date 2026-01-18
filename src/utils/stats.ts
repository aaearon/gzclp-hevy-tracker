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
 * Calculate how many workouts have been completed in the current training week.
 * @param totalWorkouts Total number of completed workouts
 * @param workoutsPerWeek Number of workouts per week (default 3)
 * @returns Object with completed count and total workouts per week
 */
export function calculateDayOfWeek(
  totalWorkouts: number,
  workoutsPerWeek = 3
): { completed: number; total: number } {
  const completedInWeek = totalWorkouts % workoutsPerWeek
  return {
    completed: completedInWeek,
    total: workoutsPerWeek,
  }
}

/**
 * Calculate total unique workouts.
 * Uses storedTotal from state (from Hevy API), falling back to 0.
 *
 * @param _progression Unused (kept for backwards compatibility)
 * @param storedTotal Optional stored total from state (from Hevy API)
 * @returns Number of unique workouts
 */
export function calculateTotalWorkouts(
  _progression: Record<string, ProgressionState>,
  storedTotal?: number
): number {
  return storedTotal ?? 0
}

/**
 * Get the most recent workout date.
 * Uses storedDate from state (from Hevy API).
 *
 * @param _progression Unused (kept for backwards compatibility)
 * @param storedDate Optional stored date from state (from Hevy API)
 * @returns Date object of last workout, or null if no workouts
 */
export function getLastWorkoutDate(
  _progression: Record<string, ProgressionState>,
  storedDate?: string | null
): Date | null {
  if (storedDate) {
    return new Date(storedDate)
  }
  return null
}

/**
 * Calculate days since the most recent workout.
 * Uses storedDate from state (from Hevy API).
 *
 * Uses calendar day comparison to avoid ±1 day errors from:
 * - Timezone changes (user traveling)
 * - DST transitions (23 or 25 hour days)
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

  // Use UTC calendar days to avoid timezone/DST issues
  const today = new Date()
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const lastWorkoutUTC = Date.UTC(
    latestDate.getFullYear(),
    latestDate.getMonth(),
    latestDate.getDate()
  )

  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((todayUTC - lastWorkoutUTC) / msPerDay)
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

/**
 * Format the program start date for display.
 * @param createdAt ISO date string when program was created
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatProgramStartDate(createdAt: string | null): string {
  if (!createdAt) {
    return 'Not started'
  }

  const date = new Date(createdAt)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
