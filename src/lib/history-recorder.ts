/**
 * History Recorder
 *
 * Records progression history from pending changes for chart visualization.
 */

import type {
  PendingChange,
  ExerciseConfig,
  ExerciseHistory,
  ProgressionHistoryEntry,
} from '@/types/state'

/**
 * Creates a history entry from a pending change.
 */
export function createHistoryEntryFromChange(change: PendingChange): ProgressionHistoryEntry {
  const entry: ProgressionHistoryEntry = {
    date: change.workoutDate,
    workoutId: change.workoutId,
    weight: change.currentWeight,
    stage: change.currentStage,
    tier: change.tier,
    success: change.success ?? false,
    changeType: change.type,
  }
  if (change.amrapReps !== undefined) {
    entry.amrapReps = change.amrapReps
  }
  return entry
}

/**
 * Records a pending change to progression history.
 * Creates new history entry or appends to existing.
 * Deduplicates by workoutId and maintains chronological order.
 */
export function recordProgressionHistory(
  currentHistory: Record<string, ExerciseHistory>,
  change: PendingChange,
  exercises: Record<string, ExerciseConfig>
): Record<string, ExerciseHistory> {
  const { progressionKey, exerciseId, exerciseName, tier } = change

  // Find exercise config to get role
  const exercise = Object.values(exercises).find((e) => e.id === exerciseId)

  // Create history entry from change
  const entry = createHistoryEntryFromChange(change)

  // Get or create history for this progressionKey
  const existing = currentHistory[progressionKey]

  // Check for duplicate (same workoutId)
  if (existing?.entries.some((e) => e.workoutId === change.workoutId)) {
    return currentHistory
  }

  // Build the updated history
  let updatedHistory: ExerciseHistory
  if (existing) {
    updatedHistory = {
      ...existing,
      entries: [...existing.entries, entry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    }
  } else {
    updatedHistory = {
      progressionKey,
      exerciseName: exercise?.name ?? exerciseName,
      tier,
      entries: [entry],
    }
    if (exercise?.role) {
      updatedHistory.role = exercise.role
    }
  }

  return {
    ...currentHistory,
    [progressionKey]: updatedHistory,
  }
}

/**
 * Records multiple pending changes to progression history.
 * Convenience function for batch recording.
 */
export function recordMultipleChanges(
  currentHistory: Record<string, ExerciseHistory>,
  changes: PendingChange[],
  exercises: Record<string, ExerciseConfig>
): Record<string, ExerciseHistory> {
  return changes.reduce(
    (history, change) => recordProgressionHistory(history, change, exercises),
    currentHistory
  )
}
