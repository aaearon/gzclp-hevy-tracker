/**
 * useProgram Hook
 *
 * Manages the GZCLP program configuration using split localStorage storage.
 * Uses three separate storage hooks for config, progression, and history.
 */

import { useCallback, useMemo } from 'react'
import { useConfigStorage } from './useConfigStorage'
import { useProgressionStorage } from './useProgressionStorage'
import { useHistoryStorage } from './useHistoryStorage'
import { isSetupRequired } from '@/lib/state-factory'
import { generateId } from '@/utils/id'
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

  // Workout Stats
  setTotalWorkouts: (count: number) => void
  setMostRecentWorkoutDate: (date: string | null) => void

  // Sync
  setLastSync: (timestamp: string) => void

  // Progression History (for charts)
  setProgressionHistory: (history: Record<string, ExerciseHistory>) => void
  recordHistoryEntry: (change: PendingChange) => void

  // Discrepancy acknowledgment
  acknowledgeDiscrepancy: (exerciseId: string, acknowledgedWeight: number, tier: Tier) => void
  clearAcknowledgedDiscrepancies: () => void

  // Full state management
  resetState: () => void
  importState: (state: GZCLPState) => void
}

export function useProgram(): UseProgramResult {
  // Use split storage hooks
  const {
    config,
    setApiKey: setConfigApiKey,
    setWeightUnit: setConfigWeightUnit,
    addExercise: addConfigExercise,
    updateExercise: updateConfigExercise,
    removeExercise: removeConfigExercise,
    setCurrentDay: setConfigCurrentDay,
    setHevyRoutineIds: setConfigHevyRoutineIds,
    setProgramCreatedAt: setConfigProgramCreatedAt,
    setWorkoutsPerWeek: setConfigWorkoutsPerWeek,
    setT3Schedule: setConfigT3Schedule,
    resetConfig,
    importConfig,
  } = useConfigStorage()

  const {
    store: progressionStore,
    setProgression,
    updateProgression: updateProgressionStore,
    setProgressionByKey: setProgressionByKeyStore,
    removeProgression,
    setLastSync: setProgressionLastSync,
    setTotalWorkouts: setProgressionTotalWorkouts,
    setMostRecentWorkoutDate: setProgressionMostRecentDate,
    acknowledgeDiscrepancy: acknowledgeProgressionDiscrepancy,
    clearAcknowledgedDiscrepancies: clearProgressionDiscrepancies,
    resetProgression,
    importProgression,
  } = useProgressionStorage()

  const {
    history,
    setProgressionHistory: setHistoryProgressionHistory,
    recordHistoryEntry: recordHistoryEntryStorage,
    resetHistory,
    importHistory,
  } = useHistoryStorage()

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
      totalWorkouts: progressionStore.totalWorkouts,
      mostRecentWorkoutDate: progressionStore.mostRecentWorkoutDate,
      acknowledgedDiscrepancies: progressionStore.acknowledgedDiscrepancies,
      progressionHistory: history.progressionHistory,
    }
  }, [config, progressionStore, history])

  const setupRequired = useMemo(() => isSetupRequired(state), [state])

  // ==========================================================================
  // API Key
  // ==========================================================================

  const setApiKey = useCallback(
    (apiKey: string) => {
      setConfigApiKey(apiKey)
    },
    [setConfigApiKey]
  )

  // ==========================================================================
  // Settings
  // ==========================================================================

  const setWeightUnit = useCallback(
    (unit: WeightUnit) => {
      setConfigWeightUnit(unit)
    },
    [setConfigWeightUnit]
  )

  // ==========================================================================
  // Exercises
  // ==========================================================================

  const addExercise = useCallback(
    (exerciseConfig: Omit<ExerciseConfig, 'id'>): string => {
      const id = generateId()
      const fullConfig: ExerciseConfig = { ...exerciseConfig, id }

      // Add exercise to config storage
      addConfigExercise(fullConfig)

      // Add initial progression entry to progression storage
      setProgression({
        ...progressionStore.progression,
        [id]: {
          exerciseId: id,
          currentWeight: 0,
          stage: 0,
          baseWeight: 0,
          lastWorkoutId: null,
          lastWorkoutDate: null,
          amrapRecord: 0,
        },
      })

      return id
    },
    [addConfigExercise, setProgression, progressionStore.progression]
  )

  const updateExercise = useCallback(
    (id: string, updates: Partial<ExerciseConfig>) => {
      updateConfigExercise(id, updates)
    },
    [updateConfigExercise]
  )

  const removeExercise = useCallback(
    (id: string) => {
      // Remove from config
      removeConfigExercise(id)
      // Remove from progression
      removeProgression(id)
    },
    [removeConfigExercise, removeProgression]
  )

  // ==========================================================================
  // Progression
  // ==========================================================================

  const setInitialWeight = useCallback(
    (exerciseId: string, weight: number, stage: Stage = 0) => {
      const existing = progressionStore.progression[exerciseId]
      if (!existing) return

      setProgression({
        ...progressionStore.progression,
        [exerciseId]: {
          ...existing,
          currentWeight: weight,
          baseWeight: weight,
          stage,
        },
      })
    },
    [progressionStore.progression, setProgression]
  )

  const setProgressionByKey = useCallback(
    (key: string, exerciseId: string, weight: number, stage: Stage = 0) => {
      setProgressionByKeyStore(key, exerciseId, weight, stage)
    },
    [setProgressionByKeyStore]
  )

  const updateProgression = useCallback(
    (exerciseId: string, updates: Partial<ProgressionState>) => {
      updateProgressionStore(exerciseId, updates)
    },
    [updateProgressionStore]
  )

  const updateProgressionBatch = useCallback(
    (progressionUpdates: Record<string, ProgressionState>) => {
      setProgression({
        ...progressionStore.progression,
        ...progressionUpdates,
      })
    },
    [progressionStore.progression, setProgression]
  )

  // ==========================================================================
  // Program
  // ==========================================================================

  const setHevyRoutineId = useCallback(
    (day: 'A1' | 'B1' | 'A2' | 'B2', routineId: string) => {
      setConfigHevyRoutineIds({ [day]: routineId })
    },
    [setConfigHevyRoutineIds]
  )

  const setHevyRoutineIds = useCallback(
    (ids: { A1?: string; B1?: string; A2?: string; B2?: string }) => {
      setConfigHevyRoutineIds(ids)
    },
    [setConfigHevyRoutineIds]
  )

  const setRoutineIds = useCallback(
    (assignment: RoutineAssignment) => {
      setConfigHevyRoutineIds({
        A1: assignment.A1,
        B1: assignment.B1,
        A2: assignment.A2,
        B2: assignment.B2,
      })
    },
    [setConfigHevyRoutineIds]
  )

  const setCurrentDay = useCallback(
    (day: GZCLPDay) => {
      setConfigCurrentDay(day)
    },
    [setConfigCurrentDay]
  )

  const setProgramCreatedAt = useCallback(
    (createdAt: string) => {
      setConfigProgramCreatedAt(createdAt)
    },
    [setConfigProgramCreatedAt]
  )

  const setWorkoutsPerWeek = useCallback(
    (workoutsPerWeek: number) => {
      setConfigWorkoutsPerWeek(workoutsPerWeek)
    },
    [setConfigWorkoutsPerWeek]
  )

  const setT3Schedule = useCallback(
    (schedule: Record<GZCLPDay, string[]>) => {
      setConfigT3Schedule(schedule)
    },
    [setConfigT3Schedule]
  )

  // ==========================================================================
  // Workout Stats
  // ==========================================================================

  const setTotalWorkouts = useCallback(
    (count: number) => {
      setProgressionTotalWorkouts(count)
    },
    [setProgressionTotalWorkouts]
  )

  const setMostRecentWorkoutDate = useCallback(
    (date: string | null) => {
      setProgressionMostRecentDate(date)
    },
    [setProgressionMostRecentDate]
  )

  // ==========================================================================
  // Sync
  // ==========================================================================

  const setLastSync = useCallback(
    (timestamp: string) => {
      setProgressionLastSync(timestamp)
    },
    [setProgressionLastSync]
  )

  // ==========================================================================
  // Progression History
  // ==========================================================================

  const setProgressionHistory = useCallback(
    (historyData: Record<string, ExerciseHistory>) => {
      setHistoryProgressionHistory(historyData)
    },
    [setHistoryProgressionHistory]
  )

  const recordHistoryEntry = useCallback(
    (change: PendingChange) => {
      recordHistoryEntryStorage(change, config.exercises)
    },
    [recordHistoryEntryStorage, config.exercises]
  )

  // ==========================================================================
  // Discrepancy Acknowledgment
  // ==========================================================================

  const acknowledgeDiscrepancy = useCallback(
    (exerciseId: string, acknowledgedWeight: number, tier: Tier) => {
      acknowledgeProgressionDiscrepancy(exerciseId, acknowledgedWeight, tier)
    },
    [acknowledgeProgressionDiscrepancy]
  )

  const clearAcknowledgedDiscrepancies = useCallback(() => {
    clearProgressionDiscrepancies()
  }, [clearProgressionDiscrepancies])

  // ==========================================================================
  // Full State Management
  // ==========================================================================

  const resetState = useCallback(() => {
    resetConfig()
    resetProgression()
    resetHistory()
  }, [resetConfig, resetProgression, resetHistory])

  const importState = useCallback(
    (newState: GZCLPState) => {
      // Import into config storage
      importConfig({
        version: newState.version,
        apiKey: newState.apiKey,
        program: newState.program,
        settings: newState.settings,
        exercises: newState.exercises,
        t3Schedule: newState.t3Schedule,
      })

      // Import into progression storage
      importProgression({
        progression: newState.progression,
        pendingChanges: newState.pendingChanges,
        lastSync: newState.lastSync,
        totalWorkouts: newState.totalWorkouts,
        mostRecentWorkoutDate: newState.mostRecentWorkoutDate,
        acknowledgedDiscrepancies: newState.acknowledgedDiscrepancies,
      })

      // Import into history storage
      importHistory({
        progressionHistory: newState.progressionHistory,
      })
    },
    [importConfig, importProgression, importHistory]
  )

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
    setTotalWorkouts,
    setMostRecentWorkoutDate,
    setLastSync,
    setProgressionHistory,
    recordHistoryEntry,
    acknowledgeDiscrepancy,
    clearAcknowledgedDiscrepancies,
    resetState,
    importState,
  }
}
