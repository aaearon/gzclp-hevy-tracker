/**
 * useProgression Hook
 *
 * Manages workout synchronization, analysis, and progression change generation.
 */

import { useState, useCallback, useMemo } from 'react'
import { createHevyClient, HevyApiClientError } from '@/lib/hevy-client'
import {
  analyzeWorkout,
  sortWorkoutsChronologically,
  type WorkoutAnalysisResult,
} from '@/lib/workout-analysis'
import { createPendingChangesFromAnalysis } from '@/lib/progression'
import { deduplicateDiscrepancies } from '@/lib/discrepancy-utils'
import { useToast } from '@/contexts/ToastContext'
import type {
  ExerciseConfig,
  GZCLPDay,
  ProgressionState,
  PendingChange,
  UserSettings,
  Tier,
} from '@/types/state'

// =============================================================================
// Types
// =============================================================================

export interface UseProgressionProps {
  apiKey: string
  exercises: Record<string, ExerciseConfig>
  progression: Record<string, ProgressionState>
  settings: UserSettings
  lastSync: string | null
  /** Mapping of GZCLP days to Hevy routine IDs - used to filter relevant workouts */
  hevyRoutineIds: {
    A1: string | null
    B1: string | null
    A2: string | null
    B2: string | null
  }
}

export interface DiscrepancyInfo {
  exerciseId: string
  exerciseName: string
  /** Tier of the exercise (T1, T2, T3) for display clarity */
  tier: Tier
  storedWeight: number
  actualWeight: number
  workoutId: string
  workoutDate: string
}

export interface UseProgressionResult {
  // State
  isSyncing: boolean
  syncError: string | null
  lastSyncTime: string | null
  pendingChanges: PendingChange[]
  discrepancies: DiscrepancyInfo[]
  analysisResults: WorkoutAnalysisResult[]

  // Actions
  syncWorkouts: () => Promise<void>
  clearError: () => void
  clearPendingChanges: () => void
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Find the GZCLP day that matches a workout's routine ID.
 * Returns null if the routine ID doesn't match any imported routine.
 */
function findDayByRoutineId(
  routineId: string,
  hevyRoutineIds: UseProgressionProps['hevyRoutineIds']
): GZCLPDay | null {
  if (hevyRoutineIds.A1 === routineId) return 'A1'
  if (hevyRoutineIds.B1 === routineId) return 'B1'
  if (hevyRoutineIds.A2 === routineId) return 'A2'
  if (hevyRoutineIds.B2 === routineId) return 'B2'
  return null
}

export function useProgression(props: UseProgressionProps): UseProgressionResult {
  const { apiKey, exercises, progression, settings, lastSync, hevyRoutineIds } = props
  const { showToast } = useToast()

  // State
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(lastSync)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyInfo[]>([])
  const [analysisResults, setAnalysisResults] = useState<WorkoutAnalysisResult[]>([])

  // Create client
  const client = useMemo(() => {
    if (!apiKey) return null
    return createHevyClient(apiKey)
  }, [apiKey])

  /**
   * Sync workouts from Hevy and generate pending changes.
   */
  const syncWorkouts = useCallback(async () => {
    if (!client) {
      setSyncError('Not connected to Hevy API')
      return
    }

    setIsSyncing(true)
    setSyncError(null)

    try {
      // Fetch workouts from Hevy (first page for now)
      const response = await client.getWorkouts({ page: 1, pageSize: 10 })
      const workouts = response.workouts

      // Sort chronologically (oldest first) for proper processing
      const sortedWorkouts = sortWorkoutsChronologically(workouts)

      // Filter to only workouts from imported routines
      // This prevents false discrepancies from other routines in the user's Hevy account
      const relevantWorkouts = sortedWorkouts.filter((workout) => {
        const matchedDay = findDayByRoutineId(workout.routine_id, hevyRoutineIds)
        return matchedDay !== null
      })

      // Analyze each workout with its matched day for accurate tier derivation
      const allAnalysisResults: WorkoutAnalysisResult[] = []
      const allDiscrepancies: DiscrepancyInfo[] = []

      for (const workout of relevantWorkouts) {
        const matchedDay = findDayByRoutineId(workout.routine_id, hevyRoutineIds)
        const results = analyzeWorkout(workout, exercises, progression, matchedDay ?? undefined)
        allAnalysisResults.push(...results)

        // Collect discrepancies
        for (const result of results) {
          if (result.discrepancy) {
            allDiscrepancies.push({
              exerciseId: result.exerciseId,
              exerciseName: result.exerciseName,
              tier: result.tier,
              storedWeight: result.discrepancy.storedWeight,
              actualWeight: result.discrepancy.actualWeight,
              workoutId: result.workoutId,
              workoutDate: result.workoutDate,
            })
          }
        }
      }

      // Generate pending changes from analysis results
      const changes = createPendingChangesFromAnalysis(
        allAnalysisResults,
        exercises,
        progression,
        settings.weightUnit
      )

      // Update state
      setAnalysisResults(allAnalysisResults)
      setDiscrepancies(deduplicateDiscrepancies(allDiscrepancies))
      setPendingChanges(changes)
      setLastSyncTime(new Date().toISOString())

      // Show toast notification if new data was detected
      if (changes.length > 0) {
        showToast({
          type: 'success',
          message: `Synced ${String(changes.length)} workout update${changes.length > 1 ? 's' : ''}!`,
        })
      }
    } catch (error) {
      if (error instanceof HevyApiClientError) {
        setSyncError(error.message)
      } else if (error instanceof Error) {
        setSyncError(error.message)
      } else {
        setSyncError('Failed to sync workouts')
      }
    } finally {
      setIsSyncing(false)
    }
  }, [client, exercises, progression, settings.weightUnit, showToast, hevyRoutineIds])

  /**
   * Clear sync error.
   */
  const clearError = useCallback(() => {
    setSyncError(null)
  }, [])

  /**
   * Clear pending changes.
   */
  const clearPendingChanges = useCallback(() => {
    setPendingChanges([])
    setDiscrepancies([])
    setAnalysisResults([])
  }, [])

  return {
    isSyncing,
    syncError,
    lastSyncTime,
    pendingChanges,
    discrepancies,
    analysisResults,
    syncWorkouts,
    clearError,
    clearPendingChanges,
  }
}
