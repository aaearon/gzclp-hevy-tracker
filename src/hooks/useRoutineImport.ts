/**
 * useRoutineImport Hook
 *
 * Manages the state for the routine import workflow.
 */

import { useState, useCallback, useMemo } from 'react'
import type { Routine, Workout } from '@/types/hevy'
import type {
  GZCLPDay,
  AvailableRoutine,
  RoutineAssignment,
  ImportedExercise,
  ImportResult,
  MainLiftWeights,
  MainLiftRole,
} from '@/types/state'
import {
  toAvailableRoutine,
  extractFromRoutines,
  resolveWeightsFromWorkoutHistory,
  detectMainLiftWeightsFromHistory,
} from '@/lib/routine-importer'

export interface UseRoutineImportReturn {
  // Available routines (converted from API)
  availableRoutines: AvailableRoutine[]

  // Assignment state
  assignment: RoutineAssignment
  setAssignment: (day: GZCLPDay, routineId: string | null) => void
  resetAssignment: () => void

  // Extraction
  importResult: ImportResult | null
  extract: (fullRoutines: Routine[], fetchWorkouts: () => Promise<Workout[]>) => Promise<void>
  isExtracting: boolean

  // User edits (per-day)
  updateDayExercise: (day: GZCLPDay, position: 'T1' | 'T2', updates: Partial<ImportedExercise>) => void
  updateDayT3: (day: GZCLPDay, index: number, updates: Partial<ImportedExercise>) => void
  removeDayT3: (day: GZCLPDay, index: number) => void

  // Main lift weights (T1/T2 verification)
  mainLiftWeights: MainLiftWeights[]
  updateMainLiftWeights: (role: MainLiftRole, updates: { t1Weight: number; t2Weight: number }) => void

  // Helpers
  isAssignmentComplete: boolean
  assignedCount: number
}

const EMPTY_ASSIGNMENT: RoutineAssignment = {
  A1: null,
  B1: null,
  A2: null,
  B2: null,
}

export function useRoutineImport(routines: Routine[]): UseRoutineImportReturn {
  const [assignment, setAssignmentState] = useState<RoutineAssignment>(EMPTY_ASSIGNMENT)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [mainLiftWeights, setMainLiftWeights] = useState<MainLiftWeights[]>([])
  const [isExtracting, setIsExtracting] = useState(false)

  // Convert routines to AvailableRoutine summaries
  const availableRoutines = useMemo(() => {
    return routines.map(toAvailableRoutine)
  }, [routines])

  // Set a single day's assignment
  const setAssignment = useCallback((day: GZCLPDay, routineId: string | null) => {
    setAssignmentState((prev) => ({
      ...prev,
      [day]: routineId,
    }))
    // Clear import result and main lift weights when assignment changes
    setImportResult(null)
    setMainLiftWeights([])
  }, [])

  // Reset all assignments
  const resetAssignment = useCallback(() => {
    setAssignmentState(EMPTY_ASSIGNMENT)
    setImportResult(null)
    setMainLiftWeights([])
  }, [])

  // Extract exercises from assigned routines
  const extract = useCallback(
    async (fullRoutines: Routine[], fetchWorkouts: () => Promise<Workout[]>) => {
      setIsExtracting(true)
      try {
        const routineMap = new Map(fullRoutines.map((r) => [r.id, r]))

        // Step 1: Extract exercise structure from routine templates
        const baseResult = extractFromRoutines(routineMap, assignment)

        // Step 2: Fetch workout history and resolve weights
        const workouts = await fetchWorkouts()
        const resolvedResult = resolveWeightsFromWorkoutHistory(baseResult, assignment, workouts)
        setImportResult(resolvedResult)

        // Step 3: Detect main lift weights from workout history
        const detectedWeights = detectMainLiftWeightsFromHistory(routineMap, assignment, workouts)
        setMainLiftWeights(detectedWeights)
      } finally {
        setIsExtracting(false)
      }
    },
    [assignment]
  )

  // Update T1 or T2 exercise for a specific day
  const updateDayExercise = useCallback(
    (day: GZCLPDay, position: 'T1' | 'T2', updates: Partial<ImportedExercise>) => {
      setImportResult((prev) => {
        if (!prev) return prev
        const dayData = prev.byDay[day]
        const field = position === 'T1' ? 't1' : 't2'
        if (!dayData[field]) return prev
        return {
          ...prev,
          byDay: {
            ...prev.byDay,
            [day]: {
              ...dayData,
              [field]: { ...dayData[field], ...updates },
            },
          },
        }
      })
    },
    []
  )

  // Update a T3 exercise at a specific index for a specific day
  const updateDayT3 = useCallback(
    (day: GZCLPDay, index: number, updates: Partial<ImportedExercise>) => {
      setImportResult((prev) => {
        if (!prev) return prev
        const dayData = prev.byDay[day]
        const existing = dayData.t3s[index]
        if (!existing) return prev
        const newT3s = [...dayData.t3s]
        newT3s[index] = { ...existing, ...updates }
        return {
          ...prev,
          byDay: {
            ...prev.byDay,
            [day]: {
              ...dayData,
              t3s: newT3s,
            },
          },
        }
      })
    },
    []
  )

  // Remove a T3 exercise at a specific index for a specific day
  const removeDayT3 = useCallback((day: GZCLPDay, index: number) => {
    setImportResult((prev) => {
      if (!prev) return prev
      const dayData = prev.byDay[day]
      if (!dayData.t3s[index]) return prev
      const newT3s = dayData.t3s.filter((_, i) => i !== index)
      return {
        ...prev,
        byDay: {
          ...prev.byDay,
          [day]: {
            ...dayData,
            t3s: newT3s,
          },
        },
      }
    })
  }, [])

  // Update main lift weights (T1/T2 verification)
  const updateMainLiftWeights = useCallback(
    (role: MainLiftRole, updates: { t1Weight: number; t2Weight: number }) => {
      setMainLiftWeights((prev) =>
        prev.map((lift) => {
          if (lift.role !== role) return lift
          return {
            ...lift,
            t1: { ...lift.t1, weight: updates.t1Weight },
            t2: { ...lift.t2, weight: updates.t2Weight },
          }
        })
      )
    },
    []
  )

  // Computed helpers
  const assignedCount = useMemo(() => {
    return Object.values(assignment).filter((id) => id !== null).length
  }, [assignment])

  const isAssignmentComplete = assignedCount > 0

  return {
    availableRoutines,
    assignment,
    setAssignment,
    resetAssignment,
    importResult,
    extract,
    isExtracting,
    updateDayExercise,
    updateDayT3,
    removeDayT3,
    mainLiftWeights,
    updateMainLiftWeights,
    isAssignmentComplete,
    assignedCount,
  }
}
