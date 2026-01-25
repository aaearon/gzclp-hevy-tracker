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
 * Result of an import operation.
 */
export interface ImportResult {
  /** Whether the import succeeded */
  success: boolean
  /** Error message if import failed */
  error?: string
}

/**
 * Result interface for useDataPersistence hook.
 */
export interface UseDataPersistenceResult {
  /** Reset all state (config, progression, history) */
  resetState: () => void

  /** Import full state from a GZCLPState object with atomic rollback on failure */
  importState: (state: GZCLPState) => ImportResult
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
    (newState: GZCLPState): ImportResult => {
      // Snapshot current state for rollback capability
      // Note: we don't snapshot history because if history import fails,
      // the original history is still in storage (unchanged)
      const previousConfig = { ...configStorage.config }
      const previousProgression = { ...progressionStorage.store }

      try {
        // Step 1: Import into config storage
        configStorage.importConfig({
          version: newState.version,
          apiKey: newState.apiKey,
          program: newState.program,
          settings: newState.settings,
          exercises: newState.exercises,
          t3Schedule: newState.t3Schedule,
        })

        try {
          // Step 2: Import into progression storage
          // Note: totalWorkouts and mostRecentWorkoutDate removed (Task 2) - now derived
          progressionStorage.importProgression({
            progression: newState.progression,
            pendingChanges: newState.pendingChanges,
            lastSync: newState.lastSync,
            acknowledgedDiscrepancies: newState.acknowledgedDiscrepancies,
            needsPush: newState.needsPush,
          })

          try {
            // Step 3: Import into history storage
            historyStorage.importHistory({
              progressionHistory: newState.progressionHistory,
            })

            // All imports succeeded
            return { success: true }
          } catch (historyError) {
            // History import failed, rollback config and progression
            configStorage.importConfig(previousConfig)
            progressionStorage.importProgression(previousProgression)
            return {
              success: false,
              error: historyError instanceof Error ? historyError.message : 'History import failed',
            }
          }
        } catch (progressionError) {
          // Progression import failed, rollback config
          configStorage.importConfig(previousConfig)
          return {
            success: false,
            error: progressionError instanceof Error ? progressionError.message : 'Progression import failed',
          }
        }
      } catch (configError) {
        // Config import failed, no rollback needed
        return {
          success: false,
          error: configError instanceof Error ? configError.message : 'Config import failed',
        }
      }
    },
    [configStorage, progressionStorage, historyStorage]
  )

  return {
    resetState,
    importState,
  }
}
