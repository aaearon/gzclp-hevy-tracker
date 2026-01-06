/**
 * State Factory
 *
 * Creates default GZCLPState instances for initial setup.
 */

import type { GZCLPState, ProgramConfig, UserSettings } from '@/types/state'
import { CURRENT_STATE_VERSION, DEFAULT_REST_TIMERS, WEIGHT_INCREMENTS, INITIAL_T3_SCHEDULE } from './constants'

/**
 * Create default user settings with the specified unit.
 */
export function createDefaultSettings(unit: 'kg' | 'lbs' = 'kg'): UserSettings {
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

/**
 * Create a fresh, empty GZCLPState.
 * Used when no existing state is found or after data deletion.
 */
export function createInitialState(unit: 'kg' | 'lbs' = 'kg'): GZCLPState {
  return {
    version: CURRENT_STATE_VERSION,
    apiKey: '',

    program: createDefaultProgram(),
    exercises: {},
    progression: {},
    pendingChanges: [],
    t3Schedule: INITIAL_T3_SCHEDULE,

    settings: createDefaultSettings(unit),
    lastSync: null,

    totalWorkouts: 0,
    mostRecentWorkoutDate: null,
  }
}

/**
 * Check if the state represents a fresh/unconfigured program.
 * Returns true if no API key is set (setup not completed).
 */
export function isSetupRequired(state: GZCLPState): boolean {
  return !state.apiKey || Object.keys(state.exercises).length === 0
}
