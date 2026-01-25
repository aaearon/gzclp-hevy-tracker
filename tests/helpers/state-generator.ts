/**
 * State Generator Test Utility
 *
 * Factory functions for generating valid state objects for testing.
 * Supports both the monolithic GZCLPState and the new split storage types.
 */

import type {
  GZCLPState,
  ProgramConfig,
  UserSettings,
  ExerciseConfig,
  ProgressionState,
  PendingChange,
  ExerciseHistory,
  ProgressionHistoryEntry,
  GZCLPDay,
  WeightUnit,
  Stage,
  Tier,
  ExerciseRole,
  AcknowledgedDiscrepancy,
  ChangeType,
} from '@/types/state'
import { CURRENT_STATE_VERSION, INITIAL_T3_SCHEDULE } from '@/lib/constants'

// =============================================================================
// ID Generator
// =============================================================================

let idCounter = 0

/** Generate a unique ID for testing (deterministic if reset between tests) */
export function generateTestId(prefix = 'test'): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

/** Reset the ID counter (call in beforeEach) */
export function resetIdCounter(): void {
  idCounter = 0
}

// =============================================================================
// Partial Override Types
// =============================================================================

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// =============================================================================
// Program Config Generator
// =============================================================================

export interface ProgramConfigOptions {
  name?: string
  createdAt?: string
  workoutsPerWeek?: number
  currentDay?: GZCLPDay
  hevyRoutineIds?: Partial<Record<GZCLPDay, string | null>>
}

export function createProgramConfig(options: ProgramConfigOptions = {}): ProgramConfig {
  return {
    name: options.name ?? 'Test GZCLP Program',
    createdAt: options.createdAt ?? new Date().toISOString(),
    workoutsPerWeek: options.workoutsPerWeek ?? 3,
    currentDay: options.currentDay ?? 'A1',
    hevyRoutineIds: {
      A1: options.hevyRoutineIds?.A1 ?? null,
      B1: options.hevyRoutineIds?.B1 ?? null,
      A2: options.hevyRoutineIds?.A2 ?? null,
      B2: options.hevyRoutineIds?.B2 ?? null,
    },
  }
}

// =============================================================================
// User Settings Generator
// =============================================================================

export interface UserSettingsOptions {
  weightUnit?: WeightUnit
  increments?: { upper?: number; lower?: number }
  restTimers?: { t1?: number; t2?: number; t3?: number }
}

export function createUserSettings(options: UserSettingsOptions = {}): UserSettings {
  const unit = options.weightUnit ?? 'kg'
  const defaultIncrements = unit === 'kg' ? { upper: 2.5, lower: 5 } : { upper: 5, lower: 10 }

  return {
    weightUnit: unit,
    increments: {
      upper: options.increments?.upper ?? defaultIncrements.upper,
      lower: options.increments?.lower ?? defaultIncrements.lower,
    },
    restTimers: {
      t1: options.restTimers?.t1 ?? 240,
      t2: options.restTimers?.t2 ?? 150,
      t3: options.restTimers?.t3 ?? 75,
    },
  }
}

// =============================================================================
// Exercise Config Generator
// =============================================================================

export interface ExerciseConfigOptions {
  id?: string
  hevyTemplateId?: string
  name?: string
  role?: ExerciseRole
}

export function createExerciseConfig(options: ExerciseConfigOptions = {}): ExerciseConfig {
  const id = options.id ?? generateTestId('exercise')
  return {
    id,
    hevyTemplateId: options.hevyTemplateId ?? `template-${id}`,
    name: options.name ?? `Test Exercise ${id}`,
    role: options.role,
  }
}

/** Create a main lift exercise config */
export function createMainLiftConfig(
  role: 'squat' | 'bench' | 'ohp' | 'deadlift',
  options: Omit<ExerciseConfigOptions, 'role'> = {}
): ExerciseConfig {
  const names: Record<typeof role, string> = {
    squat: 'Squat',
    bench: 'Bench Press',
    ohp: 'Overhead Press',
    deadlift: 'Deadlift',
  }
  return createExerciseConfig({
    name: options.name ?? names[role],
    role,
    ...options,
  })
}

/** Create a T3 exercise config */
export function createT3Config(options: Omit<ExerciseConfigOptions, 'role'> = {}): ExerciseConfig {
  return createExerciseConfig({
    ...options,
    role: 't3',
  })
}

// =============================================================================
// Progression State Generator
// =============================================================================

export interface ProgressionStateOptions {
  exerciseId?: string
  currentWeight?: number
  stage?: Stage
  baseWeight?: number
  amrapRecord?: number
  amrapRecordDate?: string | null
}

export function createProgressionState(options: ProgressionStateOptions = {}): ProgressionState {
  const exerciseId = options.exerciseId ?? generateTestId('exercise')
  return {
    exerciseId,
    currentWeight: options.currentWeight ?? 60,
    stage: options.stage ?? 0,
    baseWeight: options.baseWeight ?? options.currentWeight ?? 60,
    amrapRecord: options.amrapRecord ?? 0,
    amrapRecordDate: options.amrapRecordDate ?? null,
  }
}

// =============================================================================
// Pending Change Generator
// =============================================================================

export interface PendingChangeOptions {
  id?: string
  exerciseId?: string
  exerciseName?: string
  tier?: Tier
  type?: ChangeType
  progressionKey?: string
  currentWeight?: number
  currentStage?: Stage
  newWeight?: number
  newStage?: Stage
  newScheme?: string
  reason?: string
  workoutId?: string
  workoutDate?: string
  createdAt?: string
  setsCompleted?: number
  setsTarget?: number
  amrapReps?: number
  success?: boolean
  newPR?: boolean
}

export function createPendingChange(options: PendingChangeOptions = {}): PendingChange {
  const id = options.id ?? generateTestId('change')
  const exerciseId = options.exerciseId ?? generateTestId('exercise')

  return {
    id,
    exerciseId,
    exerciseName: options.exerciseName ?? 'Test Exercise',
    tier: options.tier ?? 'T1',
    type: options.type ?? 'progress',
    progressionKey: options.progressionKey ?? exerciseId,
    currentWeight: options.currentWeight ?? 60,
    currentStage: options.currentStage ?? 0,
    newWeight: options.newWeight ?? 62.5,
    newStage: options.newStage ?? 0,
    newScheme: options.newScheme ?? '5x3+',
    reason: options.reason ?? 'Test progression',
    workoutId: options.workoutId ?? generateTestId('workout'),
    workoutDate: options.workoutDate ?? new Date().toISOString(),
    createdAt: options.createdAt ?? new Date().toISOString(),
    setsCompleted: options.setsCompleted,
    setsTarget: options.setsTarget,
    amrapReps: options.amrapReps,
    success: options.success,
    newPR: options.newPR,
  }
}

// =============================================================================
// Progression History Generator
// =============================================================================

export interface HistoryEntryOptions {
  date?: string
  workoutId?: string
  weight?: number
  stage?: Stage
  tier?: Tier
  success?: boolean
  amrapReps?: number
  changeType?: ChangeType
}

export function createHistoryEntry(options: HistoryEntryOptions = {}): ProgressionHistoryEntry {
  return {
    date: options.date ?? new Date().toISOString(),
    workoutId: options.workoutId ?? generateTestId('workout'),
    weight: options.weight ?? 60,
    stage: options.stage ?? 0,
    tier: options.tier ?? 'T1',
    success: options.success ?? true,
    amrapReps: options.amrapReps,
    changeType: options.changeType ?? 'progress',
  }
}

export interface ExerciseHistoryOptions {
  progressionKey?: string
  exerciseName?: string
  tier?: Tier
  role?: ExerciseRole
  entries?: ProgressionHistoryEntry[]
  entryCount?: number
}

export function createExerciseHistory(options: ExerciseHistoryOptions = {}): ExerciseHistory {
  const entries = options.entries ?? []

  // Generate entries if entryCount specified
  if (options.entryCount && entries.length === 0) {
    for (let i = 0; i < options.entryCount; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (options.entryCount - i) * 2)
      entries.push(
        createHistoryEntry({
          date: date.toISOString(),
          weight: 60 + i * 2.5,
          tier: options.tier,
        })
      )
    }
  }

  return {
    progressionKey: options.progressionKey ?? generateTestId('progression'),
    exerciseName: options.exerciseName ?? 'Test Exercise',
    tier: options.tier ?? 'T1',
    role: options.role,
    entries,
  }
}

// =============================================================================
// Acknowledged Discrepancy Generator
// =============================================================================

export interface DiscrepancyOptions {
  exerciseId?: string
  acknowledgedWeight?: number
  tier?: Tier
}

export function createAcknowledgedDiscrepancy(
  options: DiscrepancyOptions = {}
): AcknowledgedDiscrepancy {
  return {
    exerciseId: options.exerciseId ?? generateTestId('exercise'),
    acknowledgedWeight: options.acknowledgedWeight ?? 60,
    tier: options.tier ?? 'T1',
  }
}

// =============================================================================
// Full State Generator (Monolithic)
// =============================================================================

export interface GZCLPStateOptions {
  version?: string
  apiKey?: string
  program?: DeepPartial<ProgramConfig>
  exercises?: Record<string, ExerciseConfig>
  progression?: Record<string, ProgressionState>
  pendingChanges?: PendingChange[]
  settings?: DeepPartial<UserSettings>
  lastSync?: string | null
  t3Schedule?: Record<GZCLPDay, string[]>
  progressionHistory?: Record<string, ExerciseHistory>
  acknowledgedDiscrepancies?: AcknowledgedDiscrepancy[]
}

export function createGZCLPState(options: GZCLPStateOptions = {}): GZCLPState {
  return {
    version: options.version ?? CURRENT_STATE_VERSION,
    apiKey: options.apiKey ?? '',
    program: createProgramConfig(options.program as ProgramConfigOptions),
    exercises: options.exercises ?? {},
    progression: options.progression ?? {},
    pendingChanges: options.pendingChanges ?? [],
    settings: createUserSettings(options.settings as UserSettingsOptions),
    lastSync: options.lastSync ?? null,
    t3Schedule: options.t3Schedule ?? { ...INITIAL_T3_SCHEDULE },
    progressionHistory: options.progressionHistory ?? {},
    acknowledgedDiscrepancies: options.acknowledgedDiscrepancies ?? [],
    needsPush: false,
  }
}

// =============================================================================
// Configured State Generator (with exercises and progression set up)
// =============================================================================

export interface ConfiguredStateOptions extends GZCLPStateOptions {
  withMainLifts?: boolean
  withT3Exercises?: number
  withHistory?: boolean
  withPendingChanges?: number
}

/**
 * Create a fully configured state with main lifts and T3 exercises.
 * Useful for testing scenarios that require a complete program setup.
 */
export function createConfiguredState(options: ConfiguredStateOptions = {}): GZCLPState {
  const exercises: Record<string, ExerciseConfig> = options.exercises ?? {}
  const progression: Record<string, ProgressionState> = options.progression ?? {}
  const progressionHistory: Record<string, ExerciseHistory> = options.progressionHistory ?? {}
  const t3Schedule: Record<GZCLPDay, string[]> = options.t3Schedule ?? {
    A1: [],
    B1: [],
    A2: [],
    B2: [],
  }

  // Add main lifts if requested
  if (options.withMainLifts !== false) {
    const mainLifts: Array<'squat' | 'bench' | 'ohp' | 'deadlift'> = [
      'squat',
      'bench',
      'ohp',
      'deadlift',
    ]

    for (const role of mainLifts) {
      const exercise = createMainLiftConfig(role)
      exercises[exercise.id] = exercise

      // Create T1 and T2 progression keys
      const t1Key = `${role}-T1`
      const t2Key = `${role}-T2`

      progression[t1Key] = createProgressionState({
        exerciseId: exercise.id,
        currentWeight: role === 'deadlift' ? 100 : role === 'squat' ? 80 : 60,
      })
      progression[t2Key] = createProgressionState({
        exerciseId: exercise.id,
        currentWeight: role === 'deadlift' ? 80 : role === 'squat' ? 60 : 40,
      })

      if (options.withHistory) {
        progressionHistory[t1Key] = createExerciseHistory({
          progressionKey: t1Key,
          exerciseName: exercise.name,
          tier: 'T1',
          role,
          entryCount: 5,
        })
        progressionHistory[t2Key] = createExerciseHistory({
          progressionKey: t2Key,
          exerciseName: exercise.name,
          tier: 'T2',
          role,
          entryCount: 5,
        })
      }
    }
  }

  // Add T3 exercises if requested
  const t3Count = options.withT3Exercises ?? 0
  if (t3Count > 0) {
    const t3Names = ['Lat Pulldown', 'Cable Row', 'Leg Curl', 'Bicep Curl', 'Tricep Extension']
    for (let i = 0; i < t3Count; i++) {
      const exercise = createT3Config({
        name: t3Names[i % t3Names.length],
      })
      exercises[exercise.id] = exercise
      progression[exercise.id] = createProgressionState({
        exerciseId: exercise.id,
        currentWeight: 20,
      })

      // Distribute T3s across days
      const day = (['A1', 'B1', 'A2', 'B2'] as const)[i % 4]
      t3Schedule[day].push(exercise.id)

      if (options.withHistory) {
        progressionHistory[exercise.id] = createExerciseHistory({
          progressionKey: exercise.id,
          exerciseName: exercise.name,
          tier: 'T3',
          role: 't3',
          entryCount: 3,
        })
      }
    }
  }

  // Add pending changes if requested
  const pendingChanges: PendingChange[] = options.pendingChanges ?? []
  if (options.withPendingChanges && pendingChanges.length === 0) {
    for (let i = 0; i < options.withPendingChanges; i++) {
      pendingChanges.push(
        createPendingChange({
          exerciseName: `Exercise ${i + 1}`,
          type: i % 2 === 0 ? 'progress' : 'stage_change',
        })
      )
    }
  }

  return createGZCLPState({
    ...options,
    apiKey: options.apiKey ?? 'test-api-key',
    exercises,
    progression,
    pendingChanges,
    progressionHistory,
    t3Schedule,
  })
}

// =============================================================================
// Split Storage Type Generators (for Phase 2)
// =============================================================================

// Re-export types from the actual storage module
export type { ConfigState, ProgressionStore, HistoryState } from '@/types/storage'

// Import for use in functions
import type { ConfigState, ProgressionStore, HistoryState } from '@/types/storage'

export function createConfigState(options: Partial<ConfigState> = {}): ConfigState {
  return {
    version: options.version ?? CURRENT_STATE_VERSION,
    apiKey: options.apiKey ?? '',
    program: options.program ?? createProgramConfig(),
    settings: options.settings ?? createUserSettings(),
    exercises: options.exercises ?? {},
    t3Schedule: options.t3Schedule ?? { ...INITIAL_T3_SCHEDULE },
  }
}

export function createProgressionStore(options: Partial<ProgressionStore> = {}): ProgressionStore {
  return {
    progression: options.progression ?? {},
    pendingChanges: options.pendingChanges ?? [],
    lastSync: options.lastSync ?? null,
    acknowledgedDiscrepancies: options.acknowledgedDiscrepancies ?? [],
    needsPush: options.needsPush ?? false,
  }
}

export function createHistoryState(options: Partial<HistoryState> = {}): HistoryState {
  return {
    progressionHistory: options.progressionHistory ?? {},
  }
}

/**
 * Create all three split states from a monolithic GZCLPState.
 * Useful for testing migration/split logic.
 */
export function splitState(state: GZCLPState): {
  config: ConfigState
  progression: ProgressionStore
  history: HistoryState
} {
  return {
    config: {
      version: state.version,
      apiKey: state.apiKey,
      program: state.program,
      settings: state.settings,
      exercises: state.exercises,
      t3Schedule: state.t3Schedule,
    },
    progression: {
      progression: state.progression,
      pendingChanges: state.pendingChanges,
      lastSync: state.lastSync,
      acknowledgedDiscrepancies: state.acknowledgedDiscrepancies,
      needsPush: state.needsPush,
    },
    history: {
      progressionHistory: state.progressionHistory,
    },
  }
}

/**
 * Merge split states back into a monolithic GZCLPState.
 * Useful for testing reconstruction logic.
 */
export function mergeStates(
  config: ConfigState,
  progression: ProgressionStore,
  history: HistoryState
): GZCLPState {
  return {
    version: config.version,
    apiKey: config.apiKey,
    program: config.program,
    settings: config.settings,
    exercises: config.exercises,
    t3Schedule: config.t3Schedule,
    progression: progression.progression,
    pendingChanges: progression.pendingChanges,
    lastSync: progression.lastSync,
    acknowledgedDiscrepancies: progression.acknowledgedDiscrepancies,
    needsPush: progression.needsPush,
    progressionHistory: history.progressionHistory,
  }
}
