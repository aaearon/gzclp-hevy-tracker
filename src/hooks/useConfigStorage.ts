/**
 * useConfigStorage Hook
 *
 * Manages config state in localStorage (program, settings, exercises, apiKey).
 * Part of the split storage system for optimized state management.
 */

import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS, CURRENT_STATE_VERSION, INITIAL_T3_SCHEDULE, WEIGHT_INCREMENTS } from '@/lib/constants'
import type { ConfigState } from '@/types/storage'
import type {
  ExerciseConfig,
  GZCLPDay,
  ProgramConfig,
  UserSettings,
  WeightUnit,
} from '@/types/state'

// =============================================================================
// Default Values
// =============================================================================

function createDefaultProgram(): ProgramConfig {
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

function createDefaultSettings(unit: WeightUnit = 'kg'): UserSettings {
  return {
    weightUnit: unit,
    increments: WEIGHT_INCREMENTS[unit],
    restTimers: {
      t1: 240,
      t2: 150,
      t3: 75,
    },
  }
}

function createDefaultConfigState(): ConfigState {
  return {
    version: CURRENT_STATE_VERSION,
    apiKey: '',
    program: createDefaultProgram(),
    settings: createDefaultSettings(),
    exercises: {},
    t3Schedule: { ...INITIAL_T3_SCHEDULE },
  }
}

// =============================================================================
// Hook Result Type
// =============================================================================

export interface UseConfigStorageResult {
  /** Current config state */
  config: ConfigState

  // API Key
  setApiKey: (apiKey: string) => void

  // Settings
  setWeightUnit: (unit: WeightUnit) => void
  setSettings: (settings: UserSettings) => void

  // Exercises
  setExercises: (exercises: Record<string, ExerciseConfig>) => void
  addExercise: (exercise: ExerciseConfig) => void
  updateExercise: (id: string, updates: Partial<ExerciseConfig>) => void
  removeExercise: (id: string) => void

  // Program
  setProgram: (program: ProgramConfig) => void
  setCurrentDay: (day: GZCLPDay) => void
  setHevyRoutineIds: (ids: Partial<Record<GZCLPDay, string | null>>) => void
  setProgramCreatedAt: (createdAt: string) => void
  setWorkoutsPerWeek: (workoutsPerWeek: number) => void

  // T3 Schedule
  setT3Schedule: (schedule: Record<GZCLPDay, string[]>) => void

  // Full state management
  resetConfig: () => void
  importConfig: (config: ConfigState) => void
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useConfigStorage(): UseConfigStorageResult {
  const [rawConfig, setRawConfig, removeConfig] = useLocalStorage<ConfigState>(
    STORAGE_KEYS.CONFIG,
    createDefaultConfigState()
  )

  // Ensure config has all required fields (handle partial stored state)
  const config = useMemo((): ConfigState => {
    const defaultConfig = createDefaultConfigState()
    return {
      ...defaultConfig,
      ...rawConfig,
      program: { ...defaultConfig.program, ...rawConfig.program },
      settings: { ...defaultConfig.settings, ...rawConfig.settings },
      t3Schedule: { ...defaultConfig.t3Schedule, ...rawConfig.t3Schedule },
    }
  }, [rawConfig])

  // API Key
  const setApiKey = useCallback(
    (apiKey: string) => {
      setRawConfig((prev) => ({ ...prev, apiKey }))
    },
    [setRawConfig]
  )

  // Settings
  const setWeightUnit = useCallback(
    (unit: WeightUnit) => {
      setRawConfig((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          weightUnit: unit,
          increments: WEIGHT_INCREMENTS[unit],
        },
      }))
    },
    [setRawConfig]
  )

  const setSettings = useCallback(
    (settings: UserSettings) => {
      setRawConfig((prev) => ({ ...prev, settings }))
    },
    [setRawConfig]
  )

  // Exercises
  const setExercises = useCallback(
    (exercises: Record<string, ExerciseConfig>) => {
      setRawConfig((prev) => ({ ...prev, exercises }))
    },
    [setRawConfig]
  )

  const addExercise = useCallback(
    (exercise: ExerciseConfig) => {
      setRawConfig((prev) => ({
        ...prev,
        exercises: { ...prev.exercises, [exercise.id]: exercise },
      }))
    },
    [setRawConfig]
  )

  const updateExercise = useCallback(
    (id: string, updates: Partial<ExerciseConfig>) => {
      setRawConfig((prev) => {
        const existing = prev.exercises[id]
        if (!existing) return prev
        return {
          ...prev,
          exercises: {
            ...prev.exercises,
            [id]: { ...existing, ...updates },
          },
        }
      })
    },
    [setRawConfig]
  )

  const removeExercise = useCallback(
    (id: string) => {
      setRawConfig((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: removed, ...remaining } = prev.exercises
        // Also remove from t3Schedule
        const newT3Schedule = { ...prev.t3Schedule }
        for (const day of Object.keys(newT3Schedule) as GZCLPDay[]) {
          newT3Schedule[day] = newT3Schedule[day].filter((exId) => exId !== id)
        }
        return {
          ...prev,
          exercises: remaining,
          t3Schedule: newT3Schedule,
        }
      })
    },
    [setRawConfig]
  )

  // Program
  const setProgram = useCallback(
    (program: ProgramConfig) => {
      setRawConfig((prev) => ({ ...prev, program }))
    },
    [setRawConfig]
  )

  const setCurrentDay = useCallback(
    (day: GZCLPDay) => {
      setRawConfig((prev) => ({
        ...prev,
        program: { ...prev.program, currentDay: day },
      }))
    },
    [setRawConfig]
  )

  const setHevyRoutineIds = useCallback(
    (ids: Partial<Record<GZCLPDay, string | null>>) => {
      setRawConfig((prev) => ({
        ...prev,
        program: {
          ...prev.program,
          hevyRoutineIds: { ...prev.program.hevyRoutineIds, ...ids },
        },
      }))
    },
    [setRawConfig]
  )

  const setProgramCreatedAt = useCallback(
    (createdAt: string) => {
      setRawConfig((prev) => ({
        ...prev,
        program: { ...prev.program, createdAt },
      }))
    },
    [setRawConfig]
  )

  const setWorkoutsPerWeek = useCallback(
    (workoutsPerWeek: number) => {
      setRawConfig((prev) => ({
        ...prev,
        program: { ...prev.program, workoutsPerWeek },
      }))
    },
    [setRawConfig]
  )

  // T3 Schedule
  const setT3Schedule = useCallback(
    (schedule: Record<GZCLPDay, string[]>) => {
      setRawConfig((prev) => ({ ...prev, t3Schedule: schedule }))
    },
    [setRawConfig]
  )

  // Full state management
  const resetConfig = useCallback(() => {
    removeConfig()
  }, [removeConfig])

  const importConfig = useCallback(
    (newConfig: ConfigState) => {
      setRawConfig(newConfig)
    },
    [setRawConfig]
  )

  return {
    config,
    setApiKey,
    setWeightUnit,
    setSettings,
    setExercises,
    addExercise,
    updateExercise,
    removeExercise,
    setProgram,
    setCurrentDay,
    setHevyRoutineIds,
    setProgramCreatedAt,
    setWorkoutsPerWeek,
    setT3Schedule,
    resetConfig,
    importConfig,
  }
}
