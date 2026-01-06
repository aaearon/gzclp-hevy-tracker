/**
 * Weeks Calculator
 *
 * Calculates "weeks on program" from Hevy workout history by counting
 * workouts matching the assigned GZCLP routine IDs and back-calculating
 * the program start date.
 */

import type { Workout } from '@/types/hevy'
import type { RoutineAssignment } from '@/types/state'

// =============================================================================
// Types
// =============================================================================

export interface WeeksCalculationResult {
  /** Number of workouts matching any of the 4 routine IDs */
  matchingWorkoutCount: number
  /** Calculated weeks: floor(matchingWorkoutCount / 4) */
  calculatedWeeks: number
  /** Back-calculated createdAt: now - (weeks * 7 days) */
  calculatedCreatedAt: string
  /** Most recent workout date from matching workouts (ISO string) */
  mostRecentWorkoutDate: string | null
}

// =============================================================================
// Constants
// =============================================================================

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
const DEFAULT_WORKOUTS_PER_WEEK = 3

// =============================================================================
// Functions
// =============================================================================

/**
 * Get workouts matching any of the 4 assigned routine IDs.
 * Filters out null routine IDs from assignment.
 *
 * @param workouts - All workouts from Hevy API
 * @param routineIds - The 4 GZCLP routine assignments (A1/B1/A2/B2)
 * @returns Array of matching workouts
 */
export function getMatchingWorkouts(
  workouts: Workout[],
  routineIds: RoutineAssignment
): Workout[] {
  // Get non-null routine IDs
  const validRoutineIds = new Set(
    Object.values(routineIds).filter((id): id is string => id !== null)
  )

  if (validRoutineIds.size === 0) {
    return []
  }

  return workouts.filter((workout) => validRoutineIds.has(workout.routine_id))
}

/**
 * Count workouts matching any of the 4 assigned routine IDs.
 * Filters out null routine IDs from assignment.
 *
 * @param workouts - All workouts from Hevy API
 * @param routineIds - The 4 GZCLP routine assignments (A1/B1/A2/B2)
 * @returns Count of matching workouts
 */
export function countMatchingWorkouts(
  workouts: Workout[],
  routineIds: RoutineAssignment
): number {
  return getMatchingWorkouts(workouts, routineIds).length
}

/**
 * Find the most recent workout date from a list of workouts.
 *
 * @param workouts - Array of workouts
 * @returns ISO date string of most recent workout, or null if no workouts
 */
export function getMostRecentWorkoutDate(workouts: Workout[]): string | null {
  if (workouts.length === 0) {
    return null
  }

  let mostRecent: Date | null = null

  for (const workout of workouts) {
    // Use start_time as the workout date
    const date = new Date(workout.start_time)
    if (!mostRecent || date > mostRecent) {
      mostRecent = date
    }
  }

  return mostRecent?.toISOString() ?? null
}

export interface CalculateCreatedAtOptions {
  /** Current timestamp (injectable for testing) */
  now?: Date
  /** Number of workouts per week (default: 3) */
  workoutsPerWeek?: number
}

/**
 * Calculate program start date from workout history.
 * Uses formula: weeks = floor(matchingWorkouts / workoutsPerWeek)
 * Then: createdAt = now - (weeks * 7 * 24 * 60 * 60 * 1000)
 *
 * @param workouts - All workouts from Hevy API
 * @param routineIds - The 4 GZCLP routine assignments
 * @param options - Optional configuration (now timestamp, workoutsPerWeek)
 * @returns Calculation result with count, weeks, createdAt, and most recent workout date
 */
export function calculateCreatedAtFromWorkouts(
  workouts: Workout[],
  routineIds: RoutineAssignment,
  options?: CalculateCreatedAtOptions | Date
): WeeksCalculationResult {
  // Support legacy signature: (workouts, routineIds, now?: Date)
  const opts: CalculateCreatedAtOptions =
    options instanceof Date ? { now: options } : options ?? {}

  const currentTime = opts.now ?? new Date()
  const workoutsPerWeek = opts.workoutsPerWeek ?? DEFAULT_WORKOUTS_PER_WEEK
  const matchingWorkouts = getMatchingWorkouts(workouts, routineIds)
  const matchingWorkoutCount = matchingWorkouts.length
  const calculatedWeeks = Math.floor(matchingWorkoutCount / workoutsPerWeek)
  const createdAtMs = currentTime.getTime() - calculatedWeeks * MS_PER_WEEK
  const calculatedCreatedAt = new Date(createdAtMs).toISOString()
  const mostRecentWorkoutDate = getMostRecentWorkoutDate(matchingWorkouts)

  return {
    matchingWorkoutCount,
    calculatedWeeks,
    calculatedCreatedAt,
    mostRecentWorkoutDate,
  }
}
