/**
 * usePushDialog Hook
 *
 * Manages push confirmation dialog state and actions.
 * [Task 3.3] Extracted from Dashboard/index.tsx to reduce component size.
 */

import { useState, useCallback } from 'react'
import type { HevyClient } from '@/lib/hevy-client'
import {
  fetchCurrentHevyState,
  buildSelectablePushPreview,
  updatePreviewAction,
  type SelectablePushPreview,
  type SyncAction,
  type HevyRoutineState,
} from '@/lib/push-preview'
import { syncGZCLPRoutines } from '@/lib/routine-manager'
import type {
  ExerciseConfig,
  GZCLPDay,
  ProgressionState,
  UserSettings,
} from '@/types/state'

// =============================================================================
// Types
// =============================================================================

export interface UsePushDialogOptions {
  hevyClient: HevyClient | null
  exercises: Record<string, ExerciseConfig>
  progression: Record<string, ProgressionState>
  settings: UserSettings
  hevyRoutineIds: Record<GZCLPDay, string | null>
  t3Schedule: Record<GZCLPDay, string[]>
  onProgressionUpdate: (progression: Record<string, ProgressionState>) => void
  onRoutineIdsUpdate: (ids: Partial<Record<GZCLPDay, string>>) => void
}

export interface UsePushDialogReturn {
  // Dialog state
  isOpen: boolean
  isLoading: boolean
  previewError: string | null
  preview: SelectablePushPreview | null
  // Update state
  isUpdating: boolean
  updateError: string | null
  updateSuccess: boolean
  // Actions
  open: () => Promise<void>
  close: () => void
  confirm: () => Promise<void>
  changeAction: (key: string, action: SyncAction) => void
  dismissUpdateStatus: () => void
}

// =============================================================================
// Hook
// =============================================================================

export function usePushDialog(options: UsePushDialogOptions): UsePushDialogReturn {
  const {
    hevyClient,
    exercises,
    progression,
    settings,
    hevyRoutineIds,
    t3Schedule,
    onProgressionUpdate,
    onRoutineIdsUpdate,
  } = options

  // Dialog state
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [preview, setPreview] = useState<SelectablePushPreview | null>(null)
  const [hevyState, setHevyState] = useState<Record<GZCLPDay, HevyRoutineState> | null>(null)

  // Update state
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // Open dialog and fetch current Hevy state
  const open = useCallback(async () => {
    if (!hevyClient) {
      setUpdateError('Not connected to Hevy API')
      return
    }

    setIsOpen(true)
    setIsLoading(true)
    setPreviewError(null)
    setPreview(null)
    setHevyState(null)

    try {
      const fetchedHevyState = await fetchCurrentHevyState(hevyClient, hevyRoutineIds)
      setHevyState(fetchedHevyState)
      const builtPreview = buildSelectablePushPreview(
        fetchedHevyState,
        exercises,
        progression,
        t3Schedule,
        settings.weightUnit
      )
      setPreview(builtPreview)
    } catch (error) {
      if (error instanceof Error) {
        setPreviewError(error.message)
      } else {
        setPreviewError('Failed to fetch current routines from Hevy')
      }
    } finally {
      setIsLoading(false)
    }
  }, [hevyClient, hevyRoutineIds, exercises, progression, t3Schedule, settings.weightUnit])

  // Close dialog and reset state
  const close = useCallback(() => {
    setIsOpen(false)
    setPreview(null)
    setPreviewError(null)
    setHevyState(null)
  }, [])

  // Change action for an exercise
  const changeAction = useCallback((progressionKey: string, action: SyncAction) => {
    setPreview((prev) => {
      if (!prev) return null
      return updatePreviewAction(prev, progressionKey, action)
    })
  }, [])

  // Confirm and execute push
  const confirm = useCallback(async () => {
    if (!hevyClient || !preview || !hevyState) {
      setUpdateError('Missing data for sync')
      close()
      return
    }

    if (preview.pushCount === 0 && preview.pullCount === 0) {
      close()
      return
    }

    close()
    setIsUpdating(true)
    setUpdateError(null)
    setUpdateSuccess(false)

    try {
      const { routineIds, pullUpdates } = await syncGZCLPRoutines(
        hevyClient,
        exercises,
        progression,
        settings,
        preview,
        hevyState,
        hevyRoutineIds,
        t3Schedule
      )

      // Apply pull updates to progression
      if (pullUpdates.length > 0) {
        const updatedProgression = { ...progression }
        for (const { progressionKey, weight } of pullUpdates) {
          if (updatedProgression[progressionKey]) {
            updatedProgression[progressionKey] = {
              ...updatedProgression[progressionKey],
              currentWeight: weight,
              baseWeight: weight,
            }
          }
        }
        onProgressionUpdate(updatedProgression)
      }

      // Update routine IDs
      const updates: Partial<Record<GZCLPDay, string>> = {}
      if (routineIds.A1) updates.A1 = routineIds.A1
      if (routineIds.B1) updates.B1 = routineIds.B1
      if (routineIds.A2) updates.A2 = routineIds.A2
      if (routineIds.B2) updates.B2 = routineIds.B2
      onRoutineIdsUpdate(updates)

      setUpdateSuccess(true)
    } catch (error) {
      if (error instanceof Error) {
        setUpdateError(error.message)
      } else {
        setUpdateError('Failed to sync with Hevy')
      }
    } finally {
      setIsUpdating(false)
    }
  }, [
    hevyClient,
    preview,
    hevyState,
    exercises,
    progression,
    settings,
    hevyRoutineIds,
    t3Schedule,
    close,
    onProgressionUpdate,
    onRoutineIdsUpdate,
  ])

  // Dismiss update status
  const dismissUpdateStatus = useCallback(() => {
    setUpdateError(null)
    setUpdateSuccess(false)
  }, [])

  return {
    isOpen,
    isLoading,
    previewError,
    preview,
    isUpdating,
    updateError,
    updateSuccess,
    open,
    close,
    confirm,
    changeAction,
    dismissUpdateStatus,
  }
}
