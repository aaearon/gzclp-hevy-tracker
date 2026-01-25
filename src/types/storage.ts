/**
 * Split Storage Types
 *
 * Type definitions for the split localStorage storage system.
 * The monolithic GZCLPState is split into three separate storage units
 * for better performance and organization:
 *
 * - ConfigState: User configuration (program, settings, exercises)
 * - ProgressionStore: Runtime progression data (weights, stages, pending changes)
 * - HistoryState: Historical data for charts (unbounded, largest data)
 */

import type {
  ProgramConfig,
  UserSettings,
  ExerciseConfig,
  ProgressionState,
  PendingChange,
  ExerciseHistory,
  GZCLPDay,
  AcknowledgedDiscrepancy,
} from './state'

// =============================================================================
// Config State (gzclp_config)
// =============================================================================

/**
 * Configuration state stored in localStorage.
 * Contains user preferences and exercise definitions.
 * Changes infrequently after initial setup.
 */
export interface ConfigState {
  /** State version for future compatibility */
  version: string
  /** Hevy API key */
  apiKey: string
  /** Program configuration (name, routine IDs, current day) */
  program: ProgramConfig
  /** User preferences (weight unit, increments, rest timers) */
  settings: UserSettings
  /** Exercise configurations keyed by exercise ID */
  exercises: Record<string, ExerciseConfig>
  /** T3 schedule mapping days to exercise IDs */
  t3Schedule: Record<GZCLPDay, string[]>
}

// =============================================================================
// Progression Store (gzclp_progression)
// =============================================================================

/**
 * Progression state stored in localStorage.
 * Contains runtime workout progression data.
 * Changes frequently during workouts.
 *
 * Note: totalWorkouts and mostRecentWorkoutDate were removed in Task 2 (Derive Stats from History).
 * - totalWorkouts: Now derived from Hevy API response during sync
 * - mostRecentWorkoutDate: Now derived from progressionHistory via getMostRecentWorkoutDate()
 */
export interface ProgressionStore {
  /** Current progression state for each exercise/progression key */
  progression: Record<string, ProgressionState>
  /** Pending changes awaiting user review */
  pendingChanges: PendingChange[]
  /** Last sync timestamp (ISO string) */
  lastSync: string | null
  /** Discrepancies the user has acknowledged */
  acknowledgedDiscrepancies: AcknowledgedDiscrepancy[]
  /** Whether local progression differs from Hevy and needs to be pushed */
  needsPush: boolean
}

// =============================================================================
// History State (gzclp_history)
// =============================================================================

/**
 * History state stored in localStorage.
 * Contains progression history for chart visualization.
 * Can grow unbounded over time - consider IndexedDB migration for future.
 */
export interface HistoryState {
  /** Progression history keyed by progression key */
  progressionHistory: Record<string, ExerciseHistory>
}

// =============================================================================
// Storage Error Types
// =============================================================================

/**
 * Categories of localStorage errors that can occur.
 */
export type StorageErrorType =
  | 'quota_exceeded'    // Browser threw QuotaExceededError
  | 'write_blocked'     // Prevented by storage quota threshold check
  | 'write_failed'      // Other write error (permission, etc.)
  | 'corruption'        // JSON.parse failed or schema validation failed
  | 'unavailable'       // localStorage disabled or inaccessible

/**
 * Represents a storage error with context for user notification and recovery.
 */
export interface StorageError {
  /** Error category */
  type: StorageErrorType
  /** localStorage key that caused the error */
  key: string
  /** Human-readable error message */
  message: string
  /** Raw corrupted data string (for corruption errors, allows download) */
  rawData?: string
  /** Original error object for debugging */
  originalError?: unknown
  /** ISO timestamp when error occurred */
  timestamp: string
}

/**
 * Result of a storage write operation.
 */
export interface StorageWriteResult {
  success: boolean
  error?: StorageError
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if an object is a valid ConfigState.
 */
export function isConfigState(obj: unknown): obj is ConfigState {
  if (!obj || typeof obj !== 'object') return false
  const state = obj as Partial<ConfigState>
  return (
    typeof state.version === 'string' &&
    typeof state.apiKey === 'string' &&
    typeof state.program === 'object' &&
    typeof state.settings === 'object' &&
    typeof state.exercises === 'object' &&
    typeof state.t3Schedule === 'object'
  )
}

/**
 * Check if an object is a valid ProgressionStore.
 * Note: totalWorkouts and mostRecentWorkoutDate are no longer stored (derived instead).
 */
export function isProgressionStore(obj: unknown): obj is ProgressionStore {
  if (!obj || typeof obj !== 'object') return false
  const store = obj as Partial<ProgressionStore>
  return (
    typeof store.progression === 'object' &&
    Array.isArray(store.pendingChanges) &&
    (store.lastSync === null || typeof store.lastSync === 'string') &&
    Array.isArray(store.acknowledgedDiscrepancies) &&
    // needsPush is optional for backwards compatibility (defaults to false)
    (store.needsPush === undefined || typeof store.needsPush === 'boolean')
  )
}

/**
 * Check if an object is a valid HistoryState.
 */
export function isHistoryState(obj: unknown): obj is HistoryState {
  if (!obj || typeof obj !== 'object') return false
  const state = obj as Partial<HistoryState>
  return typeof state.progressionHistory === 'object'
}
