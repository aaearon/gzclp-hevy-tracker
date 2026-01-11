/**
 * useDataMaintenance Hook
 *
 * Handles one-time data maintenance tasks that should run at app startup:
 * - Auto-import progression history from Hevy (for users who set up before this feature)
 * - Auto-backfill AMRAP record dates (for migration/new feature)
 *
 * These tasks were previously in Dashboard useEffects but should run once
 * at app startup, not on every Dashboard mount.
 */

import { useEffect, useRef, useMemo } from 'react'
import { createHevyClient } from '@/lib/hevy-client'
import { importProgressionHistory, backfillAmrapRecords, applyAmrapBackfill } from '@/lib/history-importer'
import type { ExerciseConfig, ProgressionState, ExerciseHistory, GZCLPDay } from '@/types/state'

export interface UseDataMaintenanceProps {
  /** Hevy API key */
  apiKey: string | null
  /** Exercise configurations */
  exercises: Record<string, ExerciseConfig>
  /** Current progression state */
  progression: Record<string, ProgressionState>
  /** Progression history for charts */
  progressionHistory: Record<string, ExerciseHistory>
  /** Hevy routine IDs mapping */
  hevyRoutineIds: Record<GZCLPDay, string | null>
  /** Callback to set progression history */
  setProgressionHistory: (history: Record<string, ExerciseHistory>) => void
  /** Callback to batch update progression */
  updateProgressionBatch: (updates: Record<string, ProgressionState>) => void
}

/**
 * Runs one-time data maintenance tasks at app startup.
 * Safe to call multiple times - tasks only run once per app lifecycle.
 */
export function useDataMaintenance({
  apiKey,
  exercises,
  progression,
  progressionHistory,
  hevyRoutineIds,
  setProgressionHistory,
  updateProgressionBatch,
}: UseDataMaintenanceProps): void {
  // Create Hevy client when API key is available
  const hevyClient = useMemo(() => {
    if (!apiKey) return null
    return createHevyClient(apiKey)
  }, [apiKey])

  // Track if migrations have run to prevent re-execution
  const hasImportedHistory = useRef(false)
  const hasBackfilledAmrap = useRef(false)
  const hasFixedMissingProgression = useRef(false)

  // Auto-import progression history if empty (for users who set up before this feature)
  useEffect(() => {
    // Only run once, when history is empty and we have all required data
    if (hasImportedHistory.current) return
    if (!apiKey || !hevyClient) return
    if (Object.keys(exercises).length === 0) return
    if (Object.keys(progressionHistory).length > 0) return // Already has history

    const routineIdsConfigured = Object.values(hevyRoutineIds).some((id) => id !== null)
    if (!routineIdsConfigured) return

    hasImportedHistory.current = true

    // Import historical data in background
    void (async () => {
      try {
        const result = await importProgressionHistory(
          hevyClient,
          exercises,
          hevyRoutineIds
        )
        if (result.entryCount > 0) {
          setProgressionHistory(result.history)
        }
      } catch (error) {
        // Charts will just be empty - log for debugging
        console.warn('[useDataMaintenance] Failed to import progression history:', error)
      }
    })()
  }, [apiKey, hevyClient, exercises, progressionHistory, hevyRoutineIds, setProgressionHistory])

  // Auto-backfill AMRAP records if they're missing dates (for migration/new feature)
  useEffect(() => {
    // Only run once
    if (hasBackfilledAmrap.current) return
    if (!apiKey || !hevyClient) return
    if (Object.keys(exercises).length === 0) return
    if (Object.keys(progression).length === 0) return

    // Check if we need to backfill (has amrapRecord but no amrapRecordDate)
    const needsBackfill = Object.values(progression).some(
      (p) => p.amrapRecord > 0 && !p.amrapRecordDate
    )
    if (!needsBackfill) return

    const routineIdsConfigured = Object.values(hevyRoutineIds).some((id) => id !== null)
    if (!routineIdsConfigured) return

    hasBackfilledAmrap.current = true

    // Backfill AMRAP records in background
    void (async () => {
      try {
        const result = await backfillAmrapRecords(
          hevyClient,
          exercises,
          hevyRoutineIds
        )
        if (result.records.length > 0) {
          const updatedProgression = applyAmrapBackfill(progression, result.records)
          updateProgressionBatch(updatedProgression)
        }
      } catch (error) {
        // Tooltips will just show "unknown" - log for debugging
        console.warn('[useDataMaintenance] Failed to backfill AMRAP records:', error)
      }
    })()
  }, [apiKey, hevyClient, exercises, progression, hevyRoutineIds, updateProgressionBatch])

  // Fix missing T3 progression entries (bug fix for exercises without progression)
  useEffect(() => {
    if (hasFixedMissingProgression.current) return
    if (Object.keys(exercises).length === 0) return

    // Find T3 exercises that are missing progression entries
    const missingProgression: Record<string, ProgressionState> = {}
    for (const exercise of Object.values(exercises)) {
      if (exercise.role === 't3' && !progression[exercise.id]) {
        missingProgression[exercise.id] = {
          exerciseId: exercise.id,
          currentWeight: 0,
          stage: 0,
          baseWeight: 0,
          lastWorkoutId: null,
          lastWorkoutDate: null,
          amrapRecord: 0,
          amrapRecordDate: null,
          amrapRecordWorkoutId: null,
        }
      }
    }

    if (Object.keys(missingProgression).length === 0) return

    hasFixedMissingProgression.current = true
    console.warn(
      `[useDataMaintenance] Found ${Object.keys(missingProgression).length} T3 exercises missing progression, creating defaults`
    )

    // Create missing progression entries
    updateProgressionBatch({
      ...progression,
      ...missingProgression,
    })
  }, [exercises, progression, updateProgressionBatch])
}
