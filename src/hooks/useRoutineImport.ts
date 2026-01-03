/**
 * useRoutineImport Hook
 *
 * Manages the state for the routine import workflow.
 */

import { useState, useCallback, useMemo } from 'react'
import type { Routine } from '@/types/hevy'
import type {
  GZCLPDay,
  GZCLPSlot,
  AvailableRoutine,
  RoutineAssignment,
  ImportedExercise,
  ImportResult,
  ImportWarning,
} from '@/types/state'
import { toAvailableRoutine, extractFromRoutines } from '@/lib/routine-importer'

export interface UseRoutineImportReturn {
  // Available routines (converted from API)
  availableRoutines: AvailableRoutine[]

  // Assignment state
  assignment: RoutineAssignment
  setAssignment: (day: GZCLPDay, routineId: string | null) => void
  resetAssignment: () => void

  // Extraction
  importResult: ImportResult | null
  extract: (fullRoutines: Routine[]) => void

  // User edits
  updateExercise: (index: number, updates: Partial<ImportedExercise>) => void

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
    // Clear import result when assignment changes
    setImportResult(null)
  }, [])

  // Reset all assignments
  const resetAssignment = useCallback(() => {
    setAssignmentState(EMPTY_ASSIGNMENT)
    setImportResult(null)
  }, [])

  // Extract exercises from assigned routines
  const extract = useCallback(
    (fullRoutines: Routine[]) => {
      const routineMap = new Map(fullRoutines.map((r) => [r.id, r]))
      const result = extractFromRoutines(routineMap, assignment)
      setImportResult(result)
    },
    [assignment]
  )

  // Update a single exercise in the result
  const updateExercise = useCallback(
    (index: number, updates: Partial<ImportedExercise>) => {
      setImportResult((prev) => {
        if (!prev) return prev
        const newExercises = [...prev.exercises]
        newExercises[index] = { ...newExercises[index], ...updates }
        return { ...prev, exercises: newExercises }
      })
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
    updateExercise,
    isAssignmentComplete,
    assignedCount,
  }
}
