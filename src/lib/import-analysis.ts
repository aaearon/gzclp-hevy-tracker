/**
 * Import Analysis
 *
 * Analyzes workout performance and calculates GZCLP progression suggestions
 * for the import wizard. Leverages existing progression logic.
 */

import type { Workout, WorkoutExercise } from '@/types/hevy'
import type { Stage, Tier, WeightUnit, MuscleGroupCategory, ProgressionState } from '@/types/state'
import type { ImportAnalysis, WorkoutPerformance, ProgressionSuggestion } from '@/types/import'
import { extractRepsFromSets, extractWorkingWeight } from './workout-analysis'
import { calculateProgression } from './progression'

/**
 * Format a workout date for display in progression reasons.
 * Returns format like "Jan 5" or "Jan 5, 2025" if different year.
 */
function formatWorkoutDateForReason(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    const now = new Date()
    const sameYear = date.getFullYear() === now.getFullYear()

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      ...(sameYear ? {} : { year: 'numeric' }),
    })
  } catch {
    return ''
  }
}

/**
 * Find the most recent workout containing a specific exercise for a given routine.
 *
 * @param workouts - Array of workouts to search through
 * @param routineId - The routine ID to filter by
 * @param exerciseTemplateId - The exercise template ID to find
 * @returns The matching workout and exercise, or null if not found
 */
export function findMostRecentWorkoutForExercise(
  workouts: Workout[],
  routineId: string,
  exerciseTemplateId: string
): { workout: Workout; exercise: WorkoutExercise } | null {
  // Filter workouts by routine ID and sort by start_time descending (most recent first)
  const filteredWorkouts = workouts
    .filter((workout) => workout.routine_id === routineId)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

  // Find first workout that contains the exercise template ID
  for (const workout of filteredWorkouts) {
    const exercise = workout.exercises.find(
      (ex) => ex.exercise_template_id === exerciseTemplateId
    )
    if (exercise) {
      return { workout, exercise }
    }
  }

  return null
}

/**
 * Extract performance data from a workout exercise.
 *
 * @param workoutExercise - The exercise from the workout
 * @param workout - The parent workout (for ID and date)
 * @returns WorkoutPerformance object with extracted data
 */
export function analyzeExercisePerformance(
  workoutExercise: WorkoutExercise,
  workout: Workout
): WorkoutPerformance {
  const reps = extractRepsFromSets(workoutExercise.sets)
  const weight = extractWorkingWeight(workoutExercise.sets)

  return {
    workoutId: workout.id,
    workoutDate: workout.start_time,
    weight,
    reps,
    totalSets: reps.length,
  }
}

/**
 * Calculate progression suggestion based on performance data.
 *
 * @param performance - The workout performance data
 * @param currentStage - The current/detected stage for the exercise
 * @param tier - The exercise tier (T1, T2, T3)
 * @param muscleGroup - The muscle group category (upper/lower)
 * @param unit - The weight unit (kg/lbs)
 * @returns ProgressionSuggestion with calculated next steps
 */
export function calculateImportProgression(
  performance: WorkoutPerformance,
  currentStage: Stage,
  tier: Tier,
  muscleGroup: MuscleGroupCategory,
  unit: WeightUnit
): ProgressionSuggestion {
  // Build a temporary ProgressionState from performance data
  const tempProgressionState: ProgressionState = {
    exerciseId: '', // Not needed for calculation
    currentWeight: performance.weight,
    stage: currentStage,
    baseWeight: performance.weight, // Use current as base for import
    lastWorkoutId: performance.workoutId,
    lastWorkoutDate: performance.workoutDate,
    amrapRecord: 0, // No prior record during import
    amrapRecordDate: null,
    amrapRecordWorkoutId: null,
  }

  // Calculate progression using existing logic
  const result = calculateProgression(
    tier,
    tempProgressionState,
    performance.reps,
    muscleGroup,
    unit
  )

  // Format the workout date for inclusion in reason
  const dateStr = formatWorkoutDateForReason(performance.workoutDate)
  const reasonWithDate = dateStr
    ? `${result.reason} (from ${dateStr})`
    : result.reason

  // Map ProgressionResult to ProgressionSuggestion
  const suggestion: ProgressionSuggestion = {
    type: result.type,
    suggestedWeight: result.newWeight,
    suggestedStage: result.newStage,
    newScheme: result.newScheme,
    reason: reasonWithDate,
    success: result.success,
  }

  // Only add amrapReps when defined (exactOptionalPropertyTypes)
  if (result.amrapReps !== undefined) {
    suggestion.amrapReps = result.amrapReps
  }

  return suggestion
}

/**
 * Main entry point: analyze exercise and get full import analysis.
 *
 * @param workouts - Array of all workouts to search
 * @param routineId - The routine ID to filter workouts by
 * @param exerciseTemplateId - The exercise template ID to analyze
 * @param detectedStage - The stage detected from the routine
 * @param tier - The exercise tier (T1, T2, T3)
 * @param muscleGroup - The muscle group category (upper/lower)
 * @param unit - The weight unit preference
 * @returns Complete ImportAnalysis with performance and suggestion
 */
export function analyzeExerciseForImport(
  workouts: Workout[],
  routineId: string,
  exerciseTemplateId: string,
  detectedStage: Stage,
  tier: Tier,
  muscleGroup: MuscleGroupCategory,
  unit: WeightUnit
): ImportAnalysis {
  // Find most recent workout with this exercise
  const found = findMostRecentWorkoutForExercise(workouts, routineId, exerciseTemplateId)

  // No workout data found
  if (!found) {
    return {
      hasWorkoutData: false,
      performance: null,
      suggestion: null,
      tier,
    }
  }

  // Analyze the exercise performance
  const performance = analyzeExercisePerformance(found.exercise, found.workout)

  // Calculate progression suggestion
  const suggestion = calculateImportProgression(
    performance,
    detectedStage,
    tier,
    muscleGroup,
    unit
  )

  return {
    hasWorkoutData: true,
    performance,
    suggestion,
    tier,
  }
}
