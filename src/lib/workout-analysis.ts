/**
 * Workout Analysis
 *
 * Analyzes Hevy workout data and matches it to configured exercises.
 */

import type { Workout, WorkoutSet, WorkoutExercise } from '@/types/hevy'
import type { ExerciseConfig, GZCLPDay, ProgressionState, Tier } from '@/types/state'
import { getTierForDay, isMainLiftRole, getProgressionKey } from './role-utils'

// =============================================================================
// Types
// =============================================================================

export interface WeightDiscrepancy {
  storedWeight: number
  actualWeight: number
}

export interface WorkoutAnalysisResult {
  exerciseId: string
  exerciseName: string
  tier: 'T1' | 'T2' | 'T3'
  reps: number[]
  weight: number
  workoutId: string
  workoutDate: string
  discrepancy?: WeightDiscrepancy | undefined
  /** The GZCLP day this result came from */
  day?: GZCLPDay | undefined
}

export interface ExerciseMatch {
  exerciseId: string
  exerciseConfig: ExerciseConfig
  workoutExercise: WorkoutExercise
}

// =============================================================================
// Matching
// =============================================================================

/**
 * Match workout exercises to configured exercises.
 * Returns only exercises that are both in the workout and in the configuration.
 */
export function matchWorkoutToExercises(
  workout: Workout,
  exercises: Record<string, ExerciseConfig>
): ExerciseMatch[] {
  const matches: ExerciseMatch[] = []

  // Create a lookup map of hevy template ID to exercise config
  const templateToExercise = new Map<string, ExerciseConfig>()
  for (const exercise of Object.values(exercises)) {
    templateToExercise.set(exercise.hevyTemplateId, exercise)
  }

  // Match workout exercises
  for (const workoutExercise of workout.exercises) {
    const exerciseConfig = templateToExercise.get(workoutExercise.exercise_template_id)
    if (exerciseConfig) {
      matches.push({
        exerciseId: exerciseConfig.id,
        exerciseConfig,
        workoutExercise,
      })
    }
  }

  return matches
}

// =============================================================================
// Set Processing
// =============================================================================

/**
 * Extract reps from workout sets.
 * - Only includes 'normal' and 'dropset' types (excludes warmup)
 * - Treats null reps as 0 (failed set)
 */
export function extractRepsFromSets(sets: WorkoutSet[]): number[] {
  return sets
    .filter((set) => set.type === 'normal' || set.type === 'dropset')
    .map((set) => set.reps ?? 0)
}

/**
 * Get the working weight from sets.
 * Returns the weight used for the first normal set.
 */
export function extractWorkingWeight(sets: WorkoutSet[]): number {
  const normalSets = sets.filter((set) => set.type === 'normal')
  if (normalSets.length === 0) return 0
  return normalSets[0]?.weight_kg ?? 0
}

// =============================================================================
// Analysis
// =============================================================================

/**
 * Derive tier from exercise role and optional day.
 *
 * Returns null for main lifts when day is unknown to prevent incorrect
 * tier assignment that could corrupt progression state.
 */
function deriveTier(role: ExerciseConfig['role'], day?: GZCLPDay): Tier | null {
  if (!role) return 'T3'
  if (!isMainLiftRole(role)) return 'T3'
  // SAFETY: Don't guess tier for main lifts without day context
  // This prevents incorrect T1/T2 assignment that could trigger wrong stage changes
  if (!day) return null
  return getTierForDay(role, day) ?? 'T3'
}

/**
 * Analyze a workout and extract progression-relevant data for each configured exercise.
 */
export function analyzeWorkout(
  workout: Workout,
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  day?: GZCLPDay
): WorkoutAnalysisResult[] {
  const matches = matchWorkoutToExercises(workout, exercises)
  const results: WorkoutAnalysisResult[] = []

  for (const match of matches) {
    const { exerciseId, exerciseConfig, workoutExercise } = match

    // Skip non-GZCLP exercises (no role)
    if (!exerciseConfig.role) {
      continue
    }

    // Derive tier from role + day
    const tier = deriveTier(exerciseConfig.role, day)

    // Skip main lifts without day context (prevents incorrect tier assignment)
    if (tier === null) {
      continue
    }

    const reps = extractRepsFromSets(workoutExercise.sets)
    const weight = extractWorkingWeight(workoutExercise.sets)

    // Get the progression key (role-tier for main lifts, exerciseId for T3)
    const progressionKey = getProgressionKey(exerciseId, exerciseConfig.role, tier)
    const storedProgression = progression[progressionKey]

    // Check for weight discrepancy
    let discrepancy: WorkoutAnalysisResult['discrepancy']
    if (storedProgression && storedProgression.currentWeight !== weight) {
      discrepancy = {
        storedWeight: storedProgression.currentWeight,
        actualWeight: weight,
      }
    }

    results.push({
      exerciseId,
      exerciseName: exerciseConfig.name,
      tier,
      reps,
      weight,
      workoutId: workout.id,
      workoutDate: workout.start_time,
      discrepancy,
      day,
    })
  }

  return results
}

// =============================================================================
// Sync State
// =============================================================================

export interface SyncState {
  lastProcessedWorkoutId: string | null
  lastProcessedDate: string | null
}

/**
 * Filter workouts to only include those after the last processed workout.
 * Workouts should be provided in chronological order (oldest first).
 */
export function filterNewWorkouts(
  workouts: Workout[],
  lastProcessedWorkoutId: string | null
): Workout[] {
  if (!lastProcessedWorkoutId) {
    return workouts
  }

  const lastIndex = workouts.findIndex((w) => w.id === lastProcessedWorkoutId)
  if (lastIndex === -1) {
    // Last processed workout not found, return all
    return workouts
  }

  // Return workouts after the last processed one
  return workouts.slice(lastIndex + 1)
}

/**
 * Sort workouts by start time (oldest first for chronological processing).
 */
export function sortWorkoutsChronologically(workouts: Workout[]): Workout[] {
  return [...workouts].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
}
