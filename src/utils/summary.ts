/**
 * Post-Workout Summary Builder
 *
 * Utility to build WorkoutSummaryData from PendingChange[].
 *
 * [GAP-02] REQ-POST-002
 */

import type { PendingChange, WorkoutSummaryData } from '@/types/state'

/**
 * Build a WorkoutSummaryData object from pending changes.
 *
 * @param changes - Array of pending changes from workout analysis
 * @param dayName - The GZCLP day name (e.g., "Day A1")
 * @param completedAt - ISO date string of workout completion
 * @returns WorkoutSummaryData for display in PostWorkoutSummary panel
 */
export function buildSummaryFromChanges(
  changes: PendingChange[],
  dayName: string,
  completedAt: string
): WorkoutSummaryData {
  const exercises: WorkoutSummaryData['exercises'] = []
  const newPRs: WorkoutSummaryData['newPRs'] = []
  const progressions: WorkoutSummaryData['progressions'] = []
  const stageChanges: WorkoutSummaryData['stageChanges'] = []
  const deloads: WorkoutSummaryData['deloads'] = []

  for (const change of changes) {
    // Build exercise result
    const exerciseResult: WorkoutSummaryData['exercises'][0] = {
      name: change.exerciseName,
      tier: change.tier,
      weight: change.currentWeight,
      setsCompleted: change.setsCompleted ?? 0,
      setsTarget: change.setsTarget ?? 0,
      success: change.success ?? change.type === 'progress',
    }
    // Add amrapReps only when defined
    if (change.amrapReps !== undefined) {
      exerciseResult.amrapReps = change.amrapReps
    }
    exercises.push(exerciseResult)

    // Categorize by change type
    if (change.newPR && change.amrapReps !== undefined) {
      newPRs.push({
        exercise: change.exerciseName,
        reps: change.amrapReps,
        weight: change.currentWeight,
      })
    }

    // Weight progression (positive weight change)
    const weightChange = change.newWeight - change.currentWeight
    if (change.type === 'progress' && weightChange > 0) {
      progressions.push({
        exercise: change.exerciseName,
        oldWeight: change.currentWeight,
        newWeight: change.newWeight,
      })
    }

    // Stage change
    if (change.type === 'stage_change') {
      stageChanges.push({
        exercise: change.exerciseName,
        oldStage: change.currentStage,
        newStage: change.newStage,
      })
    }

    // Deload
    if (change.type === 'deload') {
      deloads.push({
        exercise: change.exerciseName,
        newWeight: change.newWeight,
      })
    }
  }

  return {
    dayName,
    completedAt,
    exercises,
    newPRs,
    progressions,
    stageChanges,
    deloads,
  }
}

/**
 * Check if a set of pending changes represents a new workout completion
 * that should trigger the summary panel.
 *
 * @param changes - Array of pending changes
 * @param previousChangeIds - Set of IDs from previously seen changes
 * @returns True if there are new changes that should trigger summary
 */
export function hasNewWorkoutChanges(
  changes: PendingChange[],
  previousChangeIds: Set<string>
): boolean {
  if (changes.length === 0) return false
  // Check if any change is new (not previously seen)
  return changes.some((change) => !previousChangeIds.has(change.id))
}

/**
 * Get the most recent workout date from pending changes.
 *
 * @param changes - Array of pending changes
 * @returns ISO date string of the most recent workout, or current date if none
 */
export function getMostRecentWorkoutDate(changes: PendingChange[]): string {
  if (changes.length === 0) {
    return new Date().toISOString()
  }

  // Find the most recent workout date
  const dates = changes.map((c) => new Date(c.workoutDate).getTime())
  const mostRecent = Math.max(...dates)
  return new Date(mostRecent).toISOString()
}
