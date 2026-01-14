/**
 * ConfigContext
 *
 * Provides config state and mutations: API key, settings, exercises, program config.
 * Part of the granular context split to reduce unnecessary re-renders.
 *
 * This context has no dependencies on other contexts.
 */

import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react'
import { useConfigStorage, type UseConfigStorageResult } from '@/hooks/useConfigStorage'
import { useProgramSettings } from '@/hooks/useProgramSettings'
import { generateId } from '@/utils/id'
import type {
  ExerciseConfig,
  GZCLPDay,
  ProgramConfig,
  UserSettings,
  WeightUnit,
  RoutineAssignment,
} from '@/types/state'

// =============================================================================
// Context Value Type
// =============================================================================

export interface ConfigContextValue {
  // Read-only state
  apiKey: string
  version: string
  settings: UserSettings
  exercises: Record<string, ExerciseConfig>
  program: ProgramConfig
  t3Schedule: Record<GZCLPDay, string[]>

  // Convenience accessors
  weightUnit: WeightUnit
  currentDay: GZCLPDay
  increments: { upper: number; lower: number }

  // API Key
  setApiKey: (apiKey: string) => void

  // Settings
  setWeightUnit: (unit: WeightUnit) => void

  // Exercises
  addExercise: (config: Omit<ExerciseConfig, 'id'>) => string
  updateExercise: (id: string, updates: Partial<ExerciseConfig>) => void
  removeExercise: (id: string) => void

  // Program
  setHevyRoutineId: (day: 'A1' | 'B1' | 'A2' | 'B2', routineId: string) => void
  setHevyRoutineIds: (ids: { A1?: string; B1?: string; A2?: string; B2?: string }) => void
  setRoutineIds: (assignment: RoutineAssignment) => void
  setCurrentDay: (day: GZCLPDay) => void
  setProgramCreatedAt: (createdAt: string) => void
  setWorkoutsPerWeek: (workoutsPerWeek: number) => void
  setT3Schedule: (schedule: Record<GZCLPDay, string[]>) => void

  // Internal: expose storage for useProgram facade
  _configStorage: UseConfigStorageResult
}

// =============================================================================
// Context Creation
// =============================================================================

const ConfigContext = createContext<ConfigContextValue | null>(null)

// =============================================================================
// Provider Props
// =============================================================================

export interface ConfigProviderProps {
  children: ReactNode
}

// =============================================================================
// Provider Component
// =============================================================================

export function ConfigProvider({ children }: ConfigProviderProps) {
  // Use the storage hook
  const configStorage = useConfigStorage()
  const { config } = configStorage

  // Exercise management - config-only operations
  // Progression cleanup is handled by ProgressionContext listening to exercise changes
  const addExercise = useCallback(
    (exerciseConfig: Omit<ExerciseConfig, 'id'>): string => {
      const id = generateId()
      const fullConfig: ExerciseConfig = { ...exerciseConfig, id }
      configStorage.addExercise(fullConfig)
      return id
    },
    [configStorage]
  )

  const updateExercise = useCallback(
    (id: string, updates: Partial<ExerciseConfig>) => {
      configStorage.updateExercise(id, updates)
    },
    [configStorage]
  )

  const removeExercise = useCallback(
    (id: string) => {
      configStorage.removeExercise(id)
    },
    [configStorage]
  )

  const {
    setApiKey,
    setWeightUnit,
    setHevyRoutineId,
    setHevyRoutineIds,
    setRoutineIds,
    setCurrentDay,
    setProgramCreatedAt,
    setWorkoutsPerWeek,
    setT3Schedule,
  } = useProgramSettings({ configStorage })

  // Memoize the context value
  const value = useMemo((): ConfigContextValue => ({
    // Read-only state
    apiKey: config.apiKey,
    version: config.version,
    settings: config.settings,
    exercises: config.exercises,
    program: config.program,
    t3Schedule: config.t3Schedule,

    // Convenience accessors
    weightUnit: config.settings.weightUnit,
    currentDay: config.program.currentDay,
    increments: config.settings.increments,

    // Mutations
    setApiKey,
    setWeightUnit,
    addExercise,
    updateExercise,
    removeExercise,
    setHevyRoutineId,
    setHevyRoutineIds,
    setRoutineIds,
    setCurrentDay,
    setProgramCreatedAt,
    setWorkoutsPerWeek,
    setT3Schedule,

    // Internal
    _configStorage: configStorage,
  }), [
    config,
    configStorage,
    setApiKey,
    setWeightUnit,
    addExercise,
    updateExercise,
    removeExercise,
    setHevyRoutineId,
    setHevyRoutineIds,
    setRoutineIds,
    setCurrentDay,
    setProgramCreatedAt,
    setWorkoutsPerWeek,
    setT3Schedule,
  ])

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  )
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Access the config context.
 * Must be used within a ConfigProvider.
 *
 * @throws Error if used outside of ConfigProvider
 */
export function useConfigContext(): ConfigContextValue {
  const context = useContext(ConfigContext)

  if (!context) {
    throw new Error('useConfigContext must be used within a ConfigProvider')
  }

  return context
}

/**
 * Access the config context without throwing.
 * Returns null if not within a provider.
 */
export function useConfigContextOptional(): ConfigContextValue | null {
  return useContext(ConfigContext)
}

// =============================================================================
// Selector Hooks
// =============================================================================

/**
 * Get just the API key.
 */
export function useApiKey(): string {
  const { apiKey } = useConfigContext()
  return apiKey
}

/**
 * Get just the exercises.
 */
export function useExercises(): Record<string, ExerciseConfig> {
  const { exercises } = useConfigContext()
  return exercises
}

/**
 * Get a specific exercise by ID.
 */
export function useExerciseById(exerciseId: string): ExerciseConfig | undefined {
  const { exercises } = useConfigContext()
  return exercises[exerciseId]
}

/**
 * Get T3 schedule for all days.
 */
export function useT3Schedule(): Record<GZCLPDay, string[]> {
  const { t3Schedule } = useConfigContext()
  return t3Schedule
}
