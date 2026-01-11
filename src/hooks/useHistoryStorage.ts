/**
 * useHistoryStorage Hook
 *
 * Manages history state in localStorage (progressionHistory).
 * Part of the split storage system for optimized state management.
 *
 * Note: This storage can grow unbounded over time. Consider migrating
 * to IndexedDB for large datasets in the future.
 */

import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS, MAX_HISTORY_ENTRIES_PER_EXERCISE } from '@/lib/constants'
import { recordProgressionHistory } from '@/lib/history-recorder'
import type { HistoryState } from '@/types/storage'
import { isHistoryState } from '@/types/storage'
import type {
  ExerciseHistory,
  PendingChange,
  ExerciseConfig,
} from '@/types/state'

// =============================================================================
// History Pruning
// =============================================================================

/**
 * Prune history entries to stay within the limit per exercise.
 * Removes oldest entries when limit exceeded.
 */
function pruneHistory(
  history: Record<string, ExerciseHistory>
): Record<string, ExerciseHistory> {
  const pruned: Record<string, ExerciseHistory> = {}
  let totalPruned = 0

  for (const [key, exerciseHistory] of Object.entries(history)) {
    if (exerciseHistory.entries.length > MAX_HISTORY_ENTRIES_PER_EXERCISE) {
      const excessCount = exerciseHistory.entries.length - MAX_HISTORY_ENTRIES_PER_EXERCISE
      totalPruned += excessCount
      pruned[key] = {
        ...exerciseHistory,
        entries: exerciseHistory.entries.slice(excessCount),
      }
    } else {
      pruned[key] = exerciseHistory
    }
  }

  if (totalPruned > 0) {
    console.info(`Pruned ${String(totalPruned)} old history entries to stay within storage limits`)
  }

  return pruned
}

// =============================================================================
// Default Values
// =============================================================================

function createDefaultHistoryState(): HistoryState {
  return {
    progressionHistory: {},
  }
}

// =============================================================================
// Hook Result Type
// =============================================================================

export interface UseHistoryStorageResult {
  /** Current history state */
  history: HistoryState

  // History Management
  setProgressionHistory: (history: Record<string, ExerciseHistory>) => void
  recordHistoryEntry: (
    change: PendingChange,
    exercises: Record<string, ExerciseConfig>
  ) => void
  clearHistoryForKey: (progressionKey: string) => void

  // Full state management
  resetHistory: () => void
  importHistory: (history: HistoryState) => void
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useHistoryStorage(): UseHistoryStorageResult {
  const [rawHistory, setRawHistory, removeHistory] = useLocalStorage<HistoryState>(
    STORAGE_KEYS.HISTORY,
    createDefaultHistoryState(),
    { validator: isHistoryState }
  )

  // Ensure history has all required fields
  const history = useMemo((): HistoryState => {
    const defaultHistory = createDefaultHistoryState()
    return {
      ...defaultHistory,
      ...rawHistory,
    }
  }, [rawHistory])

  // History Management
  const setProgressionHistory = useCallback(
    (progressionHistory: Record<string, ExerciseHistory>) => {
      // Prune before storing to prevent unbounded growth
      const prunedHistory = pruneHistory(progressionHistory)
      setRawHistory((prev) => ({ ...prev, progressionHistory: prunedHistory }))
    },
    [setRawHistory]
  )

  const recordHistoryEntry = useCallback(
    (change: PendingChange, exercises: Record<string, ExerciseConfig>) => {
      setRawHistory((prev) => {
        const newHistory = recordProgressionHistory(
          prev.progressionHistory,
          change,
          exercises
        )
        // Prune after recording to prevent unbounded growth
        const prunedHistory = pruneHistory(newHistory)
        return {
          ...prev,
          progressionHistory: prunedHistory,
        }
      })
    },
    [setRawHistory]
  )

  const clearHistoryForKey = useCallback(
    (progressionKey: string) => {
      setRawHistory((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [progressionKey]: removed, ...remaining } = prev.progressionHistory
        return {
          ...prev,
          progressionHistory: remaining,
        }
      })
    },
    [setRawHistory]
  )

  // Full state management
  const resetHistory = useCallback(() => {
    removeHistory()
  }, [removeHistory])

  const importHistory = useCallback(
    (newHistory: HistoryState) => {
      // Prune imported history to prevent oversized imports
      const prunedHistory = pruneHistory(newHistory.progressionHistory)
      setRawHistory({ ...newHistory, progressionHistory: prunedHistory })
    },
    [setRawHistory]
  )

  return {
    history,
    setProgressionHistory,
    recordHistoryEntry,
    clearHistoryForKey,
    resetHistory,
    importHistory,
  }
}
