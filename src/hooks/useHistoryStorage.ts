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
import { STORAGE_KEYS } from '@/lib/constants'
import { recordProgressionHistory } from '@/lib/history-recorder'
import type { HistoryState } from '@/types/storage'
import type {
  ExerciseHistory,
  PendingChange,
  ExerciseConfig,
} from '@/types/state'

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
    createDefaultHistoryState()
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
      setRawHistory((prev) => ({ ...prev, progressionHistory }))
    },
    [setRawHistory]
  )

  const recordHistoryEntry = useCallback(
    (change: PendingChange, exercises: Record<string, ExerciseConfig>) => {
      setRawHistory((prev) => ({
        ...prev,
        progressionHistory: recordProgressionHistory(
          prev.progressionHistory,
          change,
          exercises
        ),
      }))
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
      setRawHistory(newHistory)
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
