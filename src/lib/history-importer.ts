/**
 * History Importer
 *
 * Imports historical workout data from Hevy to populate progression charts.
 * Called during Setup Wizard completion to backfill chart data.
 */

import type { HevyClient } from './hevy-client'
import type {
  ExerciseConfig,
  GZCLPDay,
  ExerciseHistory,
  ProgressionHistoryEntry,
  Tier,
} from '@/types/state'
import {
  matchWorkoutToExercises,
  extractWorkingWeight,
  sortWorkoutsChronologically,
} from './workout-analysis'
import { getTierForDay, isMainLiftRole, getProgressionKey } from './role-utils'

// =============================================================================
// Types
// =============================================================================

export interface HistoryImportResult {
  /** Imported progression history */
  history: Record<string, ExerciseHistory>
  /** Number of workouts processed */
  workoutCount: number
  /** Number of history entries created */
  entryCount: number
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Find which GZCLP day a workout belongs to based on routine ID.
 */
function findDayByRoutineId(
  routineId: string,
  hevyRoutineIds: Record<GZCLPDay, string | null>
): GZCLPDay | null {
  for (const [day, id] of Object.entries(hevyRoutineIds)) {
    if (id === routineId) {
      return day as GZCLPDay
    }
  }
  return null
}

/**
 * Derive tier from exercise role and day.
 */
function deriveTier(role: ExerciseConfig['role'], day?: GZCLPDay): Tier {
  if (!role) return 'T3'
  if (!isMainLiftRole(role)) return 'T3'
  if (!day) return 'T1'
  return getTierForDay(role, day) ?? 'T3'
}

// =============================================================================
// Main Import Function
// =============================================================================

/**
 * Import historical workout data from Hevy.
 * Fetches all workouts and builds progression history for charts.
 */
export async function importProgressionHistory(
  client: HevyClient,
  exercises: Record<string, ExerciseConfig>,
  hevyRoutineIds: Record<GZCLPDay, string | null>
): Promise<HistoryImportResult> {
  // Fetch all workouts from Hevy
  const allWorkouts = await client.getAllWorkouts()

  // Sort chronologically (oldest first)
  const sortedWorkouts = sortWorkoutsChronologically(allWorkouts)

  // Build history
  const history: Record<string, ExerciseHistory> = {}
  let workoutCount = 0
  let entryCount = 0

  // Track previous weights per progression key for deload detection
  const previousWeights: Record<string, number> = {}

  for (const workout of sortedWorkouts) {
    // Find which GZCLP day this workout belongs to
    const day = findDayByRoutineId(workout.routine_id, hevyRoutineIds)
    if (!day) continue // Skip non-GZCLP workouts

    workoutCount++

    // Match exercises in this workout
    const matches = matchWorkoutToExercises(workout, exercises)

    for (const match of matches) {
      const { exerciseId, exerciseConfig, workoutExercise } = match

      // Extract working weight
      const weight = extractWorkingWeight(workoutExercise.sets)
      if (weight <= 0) continue // Skip entries with no weight

      // Derive tier and get progression key
      const tier = deriveTier(exerciseConfig.role, day)
      const progressionKey = getProgressionKey(exerciseId, exerciseConfig.role, tier)

      // Detect deload (weight decreased from previous)
      const prevWeight = previousWeights[progressionKey]
      const isDeload = prevWeight !== undefined && weight < prevWeight
      previousWeights[progressionKey] = weight

      // Create history entry
      const entry: ProgressionHistoryEntry = {
        date: workout.start_time,
        workoutId: workout.id,
        weight,
        stage: 0, // Unknown historical stage
        tier,
        success: true, // Assume success for historical data
        changeType: isDeload ? 'deload' : 'progress',
      }

      // Add to history
      if (!history[progressionKey]) {
        history[progressionKey] = {
          progressionKey,
          exerciseName: exerciseConfig.name,
          tier,
          entries: [],
        }
        if (exerciseConfig.role) {
          history[progressionKey].role = exerciseConfig.role
        }
      }

      // Check for duplicate (same workoutId)
      const existing = history[progressionKey]
      if (!existing.entries.some((e) => e.workoutId === workout.id)) {
        existing.entries.push(entry)
        entryCount++
      }
    }
  }

  // Ensure entries are sorted chronologically (should already be, but ensure)
  for (const key of Object.keys(history)) {
    const exerciseHistory = history[key]
    if (exerciseHistory) {
      exerciseHistory.entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    }
  }

  return { history, workoutCount, entryCount }
}
