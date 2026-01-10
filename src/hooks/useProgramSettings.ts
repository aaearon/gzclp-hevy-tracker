/**
 * useProgramSettings Hook
 *
 * Domain-specific hook for program configuration settings.
 * All operations are config-only (no cross-domain coordination).
 *
 * This hook receives the config storage hook via dependency injection for:
 * - Easier unit testing with mocked storage
 * - Avoiding duplicate localStorage subscriptions
 * - Clear dependency graph
 */

import { useCallback } from 'react'
import type { UseConfigStorageResult } from './useConfigStorage'
import type { GZCLPDay, WeightUnit, RoutineAssignment } from '@/types/state'

/**
 * Parameters for useProgramSettings hook.
 */
export interface UseProgramSettingsParams {
  /** Config storage hook result */
  configStorage: UseConfigStorageResult
}

/**
 * Result interface for useProgramSettings hook.
 */
export interface UseProgramSettingsResult {
  /** Set the Hevy API key */
  setApiKey: (apiKey: string) => void

  /** Set the weight unit (kg or lbs) */
  setWeightUnit: (unit: WeightUnit) => void

  /** Set a single routine ID for a specific day */
  setHevyRoutineId: (day: 'A1' | 'B1' | 'A2' | 'B2', routineId: string) => void

  /** Set multiple routine IDs at once */
  setHevyRoutineIds: (ids: { A1?: string; B1?: string; A2?: string; B2?: string }) => void

  /** Set routine IDs from a RoutineAssignment object */
  setRoutineIds: (assignment: RoutineAssignment) => void

  /** Set the current GZCLP day */
  setCurrentDay: (day: GZCLPDay) => void

  /** Set the program creation date */
  setProgramCreatedAt: (createdAt: string) => void

  /** Set the number of workouts per week */
  setWorkoutsPerWeek: (workoutsPerWeek: number) => void

  /** Set the T3 exercise schedule for each day */
  setT3Schedule: (schedule: Record<GZCLPDay, string[]>) => void
}

/**
 * Hook for managing program configuration settings.
 *
 * @example
 * ```tsx
 * const configStorage = useConfigStorage()
 *
 * const {
 *   setApiKey,
 *   setWeightUnit,
 *   setCurrentDay,
 *   setT3Schedule,
 * } = useProgramSettings({ configStorage })
 *
 * // Set API key
 * setApiKey('my-hevy-api-key')
 *
 * // Set weight unit
 * setWeightUnit('lbs')
 *
 * // Advance to next day
 * setCurrentDay('B1')
 * ```
 */
export function useProgramSettings({
  configStorage,
}: UseProgramSettingsParams): UseProgramSettingsResult {
  const setApiKey = useCallback(
    (apiKey: string) => {
      configStorage.setApiKey(apiKey)
    },
    [configStorage]
  )

  const setWeightUnit = useCallback(
    (unit: WeightUnit) => {
      configStorage.setWeightUnit(unit)
    },
    [configStorage]
  )

  const setHevyRoutineId = useCallback(
    (day: 'A1' | 'B1' | 'A2' | 'B2', routineId: string) => {
      configStorage.setHevyRoutineIds({ [day]: routineId })
    },
    [configStorage]
  )

  const setHevyRoutineIds = useCallback(
    (ids: { A1?: string; B1?: string; A2?: string; B2?: string }) => {
      configStorage.setHevyRoutineIds(ids)
    },
    [configStorage]
  )

  const setRoutineIds = useCallback(
    (assignment: RoutineAssignment) => {
      configStorage.setHevyRoutineIds(assignment)
    },
    [configStorage]
  )

  const setCurrentDay = useCallback(
    (day: GZCLPDay) => {
      configStorage.setCurrentDay(day)
    },
    [configStorage]
  )

  const setProgramCreatedAt = useCallback(
    (createdAt: string) => {
      configStorage.setProgramCreatedAt(createdAt)
    },
    [configStorage]
  )

  const setWorkoutsPerWeek = useCallback(
    (workoutsPerWeek: number) => {
      configStorage.setWorkoutsPerWeek(workoutsPerWeek)
    },
    [configStorage]
  )

  const setT3Schedule = useCallback(
    (schedule: Record<GZCLPDay, string[]>) => {
      configStorage.setT3Schedule(schedule)
    },
    [configStorage]
  )

  return {
    setApiKey,
    setWeightUnit,
    setHevyRoutineId,
    setHevyRoutineIds,
    setRoutineIds,
    setCurrentDay,
    setProgramCreatedAt,
    setWorkoutsPerWeek,
    setT3Schedule,
  }
}
