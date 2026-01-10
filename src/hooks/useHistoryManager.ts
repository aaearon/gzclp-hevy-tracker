/**
 * useHistoryManager Hook
 *
 * Domain-specific hook for progression history operations.
 * Records workout history entries for chart visualization.
 *
 * This hook receives storage hooks and exercises via dependency injection for:
 * - Easier unit testing with mocked storage
 * - Avoiding duplicate localStorage subscriptions
 * - Clear dependency graph
 */

import { useCallback } from 'react'
import type { UseHistoryStorageResult } from './useHistoryStorage'
import type { ExerciseConfig, ExerciseHistory, PendingChange } from '@/types/state'

/**
 * Parameters for useHistoryManager hook.
 */
export interface UseHistoryManagerParams {
  /** History storage hook result */
  historyStorage: UseHistoryStorageResult
  /** Exercises from config (for name lookup in recordHistoryEntry) */
  exercises: Record<string, ExerciseConfig>
}

/**
 * Result interface for useHistoryManager hook.
 */
export interface UseHistoryManagerResult {
  /** Bulk set progression history (for import) */
  setProgressionHistory: (history: Record<string, ExerciseHistory>) => void

  /** Record a single history entry from a pending change */
  recordHistoryEntry: (change: PendingChange) => void
}

/**
 * Hook for managing progression history.
 *
 * @example
 * ```tsx
 * const historyStorage = useHistoryStorage()
 * const { exercises } = useConfigStorage().config
 *
 * const { setProgressionHistory, recordHistoryEntry } = useHistoryManager({
 *   historyStorage,
 *   exercises,
 * })
 *
 * // Record a change to history
 * recordHistoryEntry(pendingChange)
 *
 * // Bulk import history
 * setProgressionHistory(importedHistory)
 * ```
 */
export function useHistoryManager({
  historyStorage,
  exercises,
}: UseHistoryManagerParams): UseHistoryManagerResult {
  const setProgressionHistory = useCallback(
    (history: Record<string, ExerciseHistory>) => {
      historyStorage.setProgressionHistory(history)
    },
    [historyStorage]
  )

  const recordHistoryEntry = useCallback(
    (change: PendingChange) => {
      historyStorage.recordHistoryEntry(change, exercises)
    },
    [historyStorage, exercises]
  )

  return {
    setProgressionHistory,
    recordHistoryEntry,
  }
}
