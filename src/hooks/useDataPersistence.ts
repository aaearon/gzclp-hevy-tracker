/**
 * useDataPersistence Hook
 *
 * Domain-specific hook for full state reset and import operations.
 * Coordinates all three storage domains for these operations.
 *
 * This hook receives all storage hooks via dependency injection for:
 * - Easier unit testing with mocked storage
 * - Avoiding duplicate localStorage subscriptions
 * - Clear dependency graph
 */

import { useCallback } from 'react'
import type { UseConfigStorageResult } from './useConfigStorage'
import type { UseProgressionStorageResult } from './useProgressionStorage'
import type { UseHistoryStorageResult } from './useHistoryStorage'
import type { GZCLPState } from '@/types/state'

/**
 * Parameters for useDataPersistence hook.
 */
export interface UseDataPersistenceParams {
  /** Config storage hook result */
  configStorage: UseConfigStorageResult
  /** Progression storage hook result */
  progressionStorage: UseProgressionStorageResult
  /** History storage hook result */
  historyStorage: UseHistoryStorageResult
}

/**
 * Result interface for useDataPersistence hook.
 */
export interface UseDataPersistenceResult {
  /** Reset all state (config, progression, history) */
  resetState: () => void

  /** Import full state from a GZCLPState object */
  importState: (state: GZCLPState) => void
}

/**
 * Hook for managing full state reset and import operations.
 *
 * @example
 * ```tsx
 * const configStorage = useConfigStorage()
 * const progressionStorage = useProgressionStorage()
 * const historyStorage = useHistoryStorage()
 *
 * const { resetState, importState } = useDataPersistence({
 *   configStorage,
 *   progressionStorage,
 *   historyStorage,
 * })
 *
 * // Reset all data
 * resetState()
 *
 * // Import from backup
 * importState(backupData)
 * ```
 */
export function useDataPersistence({
  configStorage,
  progressionStorage,
  historyStorage,
}: UseDataPersistenceParams): UseDataPersistenceResult {
  const resetState = useCallback(() => {
    configStorage.resetConfig()
    progressionStorage.resetProgression()
    historyStorage.resetHistory()
  }, [configStorage, progressionStorage, historyStorage])

  const importState = useCallback(
    (newState: GZCLPState) => {
      // Import into config storage
      configStorage.importConfig({
        version: newState.version,
        apiKey: newState.apiKey,
        program: newState.program,
        settings: newState.settings,
        exercises: newState.exercises,
        t3Schedule: newState.t3Schedule,
      })

      // Import into progression storage
      progressionStorage.importProgression({
        progression: newState.progression,
        pendingChanges: newState.pendingChanges,
        lastSync: newState.lastSync,
        totalWorkouts: newState.totalWorkouts,
        mostRecentWorkoutDate: newState.mostRecentWorkoutDate,
        acknowledgedDiscrepancies: newState.acknowledgedDiscrepancies,
      })

      // Import into history storage
      historyStorage.importHistory({
        progressionHistory: newState.progressionHistory,
      })
    },
    [configStorage, progressionStorage, historyStorage]
  )

  return {
    resetState,
    importState,
  }
}
