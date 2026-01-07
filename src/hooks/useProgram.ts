/**
 * useProgram Hook
 *
 * Manages the GZCLP program configuration stored in localStorage.
 */

import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { createInitialState, isSetupRequired } from '@/lib/state-factory'
import { migrateState, needsMigration } from '@/lib/migrations'
import { STORAGE_KEY } from '@/lib/constants'
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
  AcknowledgedDiscrepancy,
  Tier,
} from '@/types/state'
import { recordProgressionHistory } from '@/lib/history-recorder'

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
  const [rawState, setRawState, removeState] = useLocalStorage<GZCLPState>(
    STORAGE_KEY,
    createInitialState()
  )

  // Apply migrations if needed
  const state = useMemo((): GZCLPState => {
    if (needsMigration(rawState)) {
      const migrated = migrateState(rawState)
      // Note: We don't save here to avoid infinite loops
      // The next write will persist the migrated state
      return migrated
    }
    return rawState
  }, [rawState])

  const setupRequired = useMemo(() => isSetupRequired(state), [state])

  /**
   * Set the Hevy API key.
   */
  const setApiKey = useCallback(
    (apiKey: string) => {
      setRawState((prev) => ({
        ...prev,
        apiKey,
      }))
    },
    [setRawState]
  )

  /**
   * Set the weight unit preference.
   */
  const setWeightUnit = useCallback(
    (unit: WeightUnit) => {
      setRawState((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          weightUnit: unit,
          increments:
            unit === 'kg' ? { upper: 2.5, lower: 5 } : { upper: 5, lower: 10 },
        },
      }))
    },
    [setRawState]
  )

  /**
   * Add a new exercise configuration.
   */
  const addExercise = useCallback(
    (config: Omit<ExerciseConfig, 'id'>): string => {
      const id = generateId()
      const exerciseConfig: ExerciseConfig = { ...config, id }

      setRawState((prev) => ({
        ...prev,
        exercises: {
          ...prev.exercises,
          [id]: exerciseConfig,
        },
        progression: {
          ...prev.progression,
          [id]: {
            exerciseId: id,
            currentWeight: 0,
            stage: 0,
            baseWeight: 0,
            lastWorkoutId: null,
            lastWorkoutDate: null,
            amrapRecord: 0,
          },
        },
      }))

      return id
    },
    [setRawState]
  )

  /**
   * Update an existing exercise configuration.
   */
  const updateExercise = useCallback(
    (id: string, updates: Partial<ExerciseConfig>) => {
      setRawState((prev) => {
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
    [setRawState]
  )

  /**
   * Remove an exercise configuration.
   */
  const removeExercise = useCallback(
    (id: string) => {
      setRawState((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: removedExercise, ...remainingExercises } = prev.exercises
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: removedProgression, ...remainingProgression } = prev.progression

        return {
          ...prev,
          exercises: remainingExercises,
          progression: remainingProgression,
          pendingChanges: prev.pendingChanges.filter((c) => c.exerciseId !== id),
        }
      })
    },
    [setRawState]
  )

  /**
   * Set the initial weight for an exercise, optionally with a stage.
   */
  const setInitialWeight = useCallback(
    (exerciseId: string, weight: number, stage: Stage = 0) => {
      setRawState((prev) => {
        const existing = prev.progression[exerciseId]
        if (!existing) return prev

        return {
          ...prev,
          progression: {
            ...prev.progression,
            [exerciseId]: {
              ...existing,
              currentWeight: weight,
              baseWeight: weight,
              stage,
            },
          },
        }
      })
    },
    [setRawState]
  )

  /**
   * Set progression by an arbitrary key (for role-tier keys like "squat-T1").
   * Creates a new progression entry if it doesn't exist.
   */
  const setProgressionByKey = useCallback(
    (key: string, exerciseId: string, weight: number, stage: Stage = 0) => {
      setRawState((prev) => ({
        ...prev,
        progression: {
          ...prev.progression,
          [key]: {
            exerciseId,
            currentWeight: weight,
            baseWeight: weight,
            stage,
            lastWorkoutId: null,
            lastWorkoutDate: null,
            amrapRecord: 0,
          },
        },
      }))
    },
    [setRawState]
  )

  /**
   * Update progression state for an exercise.
   */
  const updateProgression = useCallback(
    (exerciseId: string, updates: Partial<ProgressionState>) => {
      setRawState((prev) => {
        const existing = prev.progression[exerciseId]
        if (!existing) return prev

        return {
          ...prev,
          progression: {
            ...prev.progression,
            [exerciseId]: { ...existing, ...updates },
          },
        }
      })
    },
    [setRawState]
  )

  /**
   * Update multiple progression states at once.
   */
  const updateProgressionBatch = useCallback(
    (progressionUpdates: Record<string, ProgressionState>) => {
      setRawState((prev) => ({
        ...prev,
        progression: {
          ...prev.progression,
          ...progressionUpdates,
        },
      }))
    },
    [setRawState]
  )

  /**
   * Set the Hevy routine ID for a specific day.
   */
  const setHevyRoutineId = useCallback(
    (day: 'A1' | 'B1' | 'A2' | 'B2', routineId: string) => {
      setRawState((prev) => ({
        ...prev,
        program: {
          ...prev.program,
          hevyRoutineIds: {
            ...prev.program.hevyRoutineIds,
            [day]: routineId,
          },
        },
      }))
    },
    [setRawState]
  )

  /**
   * Set multiple Hevy routine IDs at once.
   */
  const setHevyRoutineIds = useCallback(
    (ids: { A1?: string; B1?: string; A2?: string; B2?: string }) => {
      setRawState((prev) => ({
        ...prev,
        program: {
          ...prev.program,
          hevyRoutineIds: {
            ...prev.program.hevyRoutineIds,
            ...(ids.A1 !== undefined && { A1: ids.A1 }),
            ...(ids.B1 !== undefined && { B1: ids.B1 }),
            ...(ids.A2 !== undefined && { A2: ids.A2 }),
            ...(ids.B2 !== undefined && { B2: ids.B2 }),
          },
        },
      }))
    },
    [setRawState]
  )

  /**
   * Set routine IDs from import assignment.
   */
  const setRoutineIds = useCallback(
    (assignment: RoutineAssignment) => {
      setRawState((prev) => ({
        ...prev,
        program: {
          ...prev.program,
          hevyRoutineIds: {
            A1: assignment.A1,
            B1: assignment.B1,
            A2: assignment.A2,
            B2: assignment.B2,
          },
        },
      }))
    },
    [setRawState]
  )

  /**
   * Set the current day in the GZCLP rotation.
   */
  const setCurrentDay = useCallback(
    (day: GZCLPDay) => {
      setRawState((prev) => ({
        ...prev,
        program: {
          ...prev.program,
          currentDay: day,
        },
      }))
    },
    [setRawState]
  )

  /**
   * Set the program creation date (for weeks calculation).
   */
  const setProgramCreatedAt = useCallback(
    (createdAt: string) => {
      setRawState((prev) => ({
        ...prev,
        program: {
          ...prev.program,
          createdAt,
        },
      }))
    },
    [setRawState]
  )

  /**
   * Set the number of workouts per week.
   */
  const setWorkoutsPerWeek = useCallback(
    (workoutsPerWeek: number) => {
      setRawState((prev) => ({
        ...prev,
        program: {
          ...prev.program,
          workoutsPerWeek,
        },
      }))
    },
    [setRawState]
  )

  /**
   * Set the T3 schedule mapping days to exercise IDs.
   */
  const setT3Schedule = useCallback(
    (schedule: Record<GZCLPDay, string[]>) => {
      setRawState((prev) => ({
        ...prev,
        t3Schedule: schedule,
      }))
    },
    [setRawState]
  )

  /**
   * Set the total workout count.
   */
  const setTotalWorkouts = useCallback(
    (count: number) => {
      setRawState((prev) => ({
        ...prev,
        totalWorkouts: count,
      }))
    },
    [setRawState]
  )

  /**
   * Set the most recent workout date.
   */
  const setMostRecentWorkoutDate = useCallback(
    (date: string | null) => {
      setRawState((prev) => ({
        ...prev,
        mostRecentWorkoutDate: date,
      }))
    },
    [setRawState]
  )

  /**
   * Set the last sync timestamp.
   */
  const setLastSync = useCallback(
    (timestamp: string) => {
      setRawState((prev) => ({
        ...prev,
        lastSync: timestamp,
      }))
    },
    [setRawState]
  )

  /**
   * Set the entire progression history (for bulk updates).
   */
  const setProgressionHistory = useCallback(
    (history: Record<string, ExerciseHistory>) => {
      setRawState((prev) => ({
        ...prev,
        progressionHistory: history,
      }))
    },
    [setRawState]
  )

  /**
   * Record a single pending change to progression history.
   * Used when applying changes to track history for charts.
   */
  const recordHistoryEntry = useCallback(
    (change: PendingChange) => {
      setRawState((prev) => ({
        ...prev,
        progressionHistory: recordProgressionHistory(
          prev.progressionHistory,
          change,
          prev.exercises
        ),
      }))
    },
    [setRawState]
  )

  /**
   * Acknowledge a discrepancy (user clicked "Keep").
   * Prevents the same discrepancy from being shown again on future syncs.
   */
  const acknowledgeDiscrepancy = useCallback(
    (exerciseId: string, acknowledgedWeight: number, tier: Tier) => {
      setRawState((prev) => {
        // Ensure acknowledgedDiscrepancies exists (for pre-migration states)
        const existing = prev.acknowledgedDiscrepancies ?? []

        // Check if already acknowledged
        const alreadyAcknowledged = existing.some(
          (d) =>
            d.exerciseId === exerciseId &&
            d.acknowledgedWeight === acknowledgedWeight &&
            d.tier === tier
        )
        if (alreadyAcknowledged) {
          return prev
        }

        const newAcknowledgment: AcknowledgedDiscrepancy = {
          exerciseId,
          acknowledgedWeight,
          tier,
        }

        return {
          ...prev,
          acknowledgedDiscrepancies: [...existing, newAcknowledgment],
        }
      })
    },
    [setRawState]
  )

  /**
   * Clear all acknowledged discrepancies.
   * Useful when user wants to review all discrepancies fresh.
   */
  const clearAcknowledgedDiscrepancies = useCallback(() => {
    setRawState((prev) => ({
      ...prev,
      acknowledgedDiscrepancies: [],
    }))
  }, [setRawState])

  /**
   * Reset state to initial values.
   */
  const resetState = useCallback(() => {
    removeState()
  }, [removeState])

  /**
   * Import a complete state object.
   */
  const importState = useCallback(
    (newState: GZCLPState) => {
      const migrated = migrateState(newState)
      setRawState(migrated)
    },
    [setRawState]
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
