/**
 * State Factory
 *
 * Creates default state instances for initial setup.
 * Supports both the monolithic GZCLPState and split storage types.
 */

import type { GZCLPState, ProgramConfig, UserSettings, WeightUnit } from '@/types/state'
import type { ConfigState, ProgressionStore, HistoryState } from '@/types/storage'
import { CURRENT_STATE_VERSION, DEFAULT_REST_TIMERS, WEIGHT_INCREMENTS, INITIAL_T3_SCHEDULE } from './constants'

// =============================================================================
// Common Building Blocks
// =============================================================================

/**
 * Create default user settings with the specified unit.
 */
export function createDefaultSettings(unit: WeightUnit = 'kg'): UserSettings {
  return {
    weightUnit: unit,
    increments: WEIGHT_INCREMENTS[unit],
    restTimers: {
      t1: DEFAULT_REST_TIMERS.T1,
      t2: DEFAULT_REST_TIMERS.T2,
      t3: DEFAULT_REST_TIMERS.T3,
    },
  }
}

/**
 * Create default program configuration.
 */
export function createDefaultProgram(): ProgramConfig {
  return {
    name: 'My GZCLP Program',
    createdAt: new Date().toISOString(),
    workoutsPerWeek: 3,
    hevyRoutineIds: {
      A1: null,
      B1: null,
      A2: null,
      B2: null,
    },
    currentDay: 'A1',
  }
}

// =============================================================================
// Split Storage State Factories
// =============================================================================

/**
 * Create initial config state for split storage.
 */
export function createInitialConfigState(unit: WeightUnit = 'kg'): ConfigState {
  return {
    version: CURRENT_STATE_VERSION,
    apiKey: '',
    program: createDefaultProgram(),
    settings: createDefaultSettings(unit),
    exercises: {},
    t3Schedule: { ...INITIAL_T3_SCHEDULE },
  }
}

/**
 * Create initial progression store for split storage.
 */
export function createInitialProgressionStore(): ProgressionStore {
  return {
    progression: {},
    pendingChanges: [],
    lastSync: null,
    totalWorkouts: 0,
    mostRecentWorkoutDate: null,
    acknowledgedDiscrepancies: [],
    needsPush: false,
  }
}

/**
 * Create initial history state for split storage.
 */
export function createInitialHistoryState(): HistoryState {
  return {
    progressionHistory: {},
  }
}

// =============================================================================
// Monolithic State Factory (Legacy / Compatibility)
// =============================================================================

/**
 * Create a fresh, empty GZCLPState.
 * Used when no existing state is found or after data deletion.
 *
 * Note: This function is kept for compatibility with existing code.
 * New code should use the split storage state factories.
 */
export function createInitialState(unit: WeightUnit = 'kg'): GZCLPState {
  return {
    version: CURRENT_STATE_VERSION,
    apiKey: '',

    program: createDefaultProgram(),
    exercises: {},
    progression: {},
    pendingChanges: [],
    t3Schedule: { ...INITIAL_T3_SCHEDULE },

    settings: createDefaultSettings(unit),
    lastSync: null,

    totalWorkouts: 0,
    mostRecentWorkoutDate: null,
    progressionHistory: {},
    acknowledgedDiscrepancies: [],
    needsPush: false,
    processedWorkoutIds: [],
  }
}

// =============================================================================
// State Validation
// =============================================================================

/**
 * Check if the state represents a fresh/unconfigured program.
 * Returns true if no API key is set (setup not completed).
 */
export function isSetupRequired(state: GZCLPState): boolean {
  return !state.apiKey || Object.keys(state.exercises).length === 0
}

/**
 * Check if config state requires setup.
 */
export function isConfigSetupRequired(config: ConfigState): boolean {
  return !config.apiKey || Object.keys(config.exercises).length === 0
}
