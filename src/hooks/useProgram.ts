/**
 * useProgram Hook
 *
 * Manages the GZCLP program configuration using split localStorage storage.
 * Uses three separate storage hooks for config, progression, and history.
 */

import { useMemo } from 'react'
import { useConfigStorage } from './useConfigStorage'
import { useProgressionStorage } from './useProgressionStorage'
import { useHistoryStorage } from './useHistoryStorage'
import { useExerciseManagement } from './useExerciseManagement'
import { useProgramSettings } from './useProgramSettings'
import { useProgressionManager } from './useProgressionManager'
import { useHistoryManager } from './useHistoryManager'
import { useDataPersistence, type ImportResult } from './useDataPersistence'
import { isSetupRequired } from '@/lib/state-factory'
import type {
  GZCLPState,
  GZCLPDay,
  ExerciseConfig,
  ExerciseHistory,
  PendingChange,
  ProgressionState,
  WeightUnit,
  RoutineAssignment,
  Stage,
  Tier,
} from '@/types/state'

export interface UseProgramResult {
  state: GZCLPState
  isSetupRequired: boolean

  // API Key
  setApiKey: (apiKey: string) => void

  // Settings
  setWeightUnit: (unit: WeightUnit) => void

  // Exercises
  addExercise: (config: Omit<ExerciseConfig, 'id'>) => string
  updateExercise: (id: string, updates: Partial<ExerciseConfig>) => void
  removeExercise: (id: string) => void

  // Progression
  setInitialWeight: (exerciseId: string, weight: number, stage?: Stage) => void
  /** Set progression by an arbitrary key (for role-tier keys like "squat-T1") */
  setProgressionByKey: (
    key: string,
    exerciseId: string,
    weight: number,
    stage?: Stage
  ) => void
  updateProgression: (exerciseId: string, updates: Partial<ProgressionState>) => void
  updateProgressionBatch: (progressionUpdates: Record<string, ProgressionState>) => void

  // Program
  setHevyRoutineId: (day: 'A1' | 'B1' | 'A2' | 'B2', routineId: string) => void
  setHevyRoutineIds: (ids: { A1?: string; B1?: string; A2?: string; B2?: string }) => void
  setRoutineIds: (assignment: RoutineAssignment) => void
  setCurrentDay: (day: GZCLPDay) => void
  setProgramCreatedAt: (createdAt: string) => void
  setWorkoutsPerWeek: (workoutsPerWeek: number) => void
  setT3Schedule: (schedule: Record<GZCLPDay, string[]>) => void

  // Sync
  setLastSync: (timestamp: string) => void
  setNeedsPush: (needsPush: boolean) => void

  // Progression History (for charts)
  setProgressionHistory: (history: Record<string, ExerciseHistory>) => void
  recordHistoryEntry: (change: PendingChange) => void

  // Discrepancy acknowledgment
  acknowledgeDiscrepancy: (exerciseId: string, acknowledgedWeight: number, tier: Tier) => void
  clearAcknowledgedDiscrepancies: () => void

  // Pending changes (for persisting sync results)
  addPendingChange: (change: PendingChange) => void
  removePendingChange: (id: string) => void
  clearPendingChanges: () => void

  // Full state management
  resetState: () => void
  importState: (state: GZCLPState) => ImportResult
}

export function useProgram(): UseProgramResult {
  // Use split storage hooks
  const configStorage = useConfigStorage()
  const progressionStorage = useProgressionStorage()

  // Destructure for convenience (used in state composition)
  const { config } = configStorage
  const { store: progressionStore } = progressionStorage

  // Use domain-specific hooks
  const {
    addExercise,
    updateExercise,
    removeExercise,
  } = useExerciseManagement({ configStorage, progressionStorage })

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

  const {
    setInitialWeight,
    setProgressionByKey,
    updateProgression,
    updateProgressionBatch,
    setLastSync,
    setNeedsPush,
    acknowledgeDiscrepancy,
    clearAcknowledgedDiscrepancies,
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
  } = useProgressionManager({ progressionStorage })

  const historyStorage = useHistoryStorage()
  const { history } = historyStorage

  // History manager needs exercises from config
  const {
    setProgressionHistory,
    recordHistoryEntry,
  } = useHistoryManager({ historyStorage, exercises: config.exercises })

  // Data persistence for import/export/reset
  const {
    resetState,
    importState,
  } = useDataPersistence({ configStorage, progressionStorage, historyStorage })

  // Compose the full GZCLPState from split storage
  const state = useMemo((): GZCLPState => {
    return {
      version: config.version,
      apiKey: config.apiKey,
      program: config.program,
      exercises: config.exercises,
      settings: config.settings,
      t3Schedule: config.t3Schedule,
      progression: progressionStore.progression,
      pendingChanges: progressionStore.pendingChanges,
      lastSync: progressionStore.lastSync,
      // Note: totalWorkouts and mostRecentWorkoutDate removed (Task 2) - now derived
      acknowledgedDiscrepancies: progressionStore.acknowledgedDiscrepancies,
      needsPush: progressionStore.needsPush,
      progressionHistory: history.progressionHistory,
    }
  }, [config, progressionStore, history])

  const setupRequired = useMemo(() => isSetupRequired(state), [state])

  return {
    state,
    isSetupRequired: setupRequired,
    setApiKey,
    setWeightUnit,
    addExercise,
    updateExercise,
    removeExercise,
    setInitialWeight,
    setProgressionByKey,
    updateProgression,
    updateProgressionBatch,
    setHevyRoutineId,
    setHevyRoutineIds,
    setRoutineIds,
    setCurrentDay,
    setProgramCreatedAt,
    setWorkoutsPerWeek,
    setT3Schedule,
    setLastSync,
    setNeedsPush,
    setProgressionHistory,
    recordHistoryEntry,
    acknowledgeDiscrepancy,
    clearAcknowledgedDiscrepancies,
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
    resetState,
    importState,
  }
}
