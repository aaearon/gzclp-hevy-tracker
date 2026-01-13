/**
 * usePushDialog Hook
 *
 * Manages push confirmation dialog state and actions.
 * [Task 3.3] Extracted from Dashboard/index.tsx to reduce component size.
 * Includes multi-tab mutex to prevent concurrent pushes.
 */

import { useState, useCallback, useEffect } from 'react'

// =============================================================================
// Multi-Tab Mutex for Push Operations
// =============================================================================

const PUSH_LOCK_KEY = 'gzclp_push_lock'
const LOCK_TIMEOUT_MS = 60000 // 60 seconds max lock duration

interface PushLock {
  timestamp: number
  tabId: string
}

/** Generate a unique ID for this browser tab */
function getTabId(): string {
  let tabId = sessionStorage.getItem('gzclp_tab_id')
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    sessionStorage.setItem('gzclp_tab_id', tabId)
  }
  return tabId
}

/** Try to acquire the push lock */
function acquirePushLock(): boolean {
  try {
    const existing = localStorage.getItem(PUSH_LOCK_KEY)
    if (existing) {
      const lock = JSON.parse(existing) as PushLock
      // Check if lock is still valid (not expired)
      if (Date.now() - lock.timestamp < LOCK_TIMEOUT_MS) {
        // Lock is held by another tab
        if (lock.tabId !== getTabId()) {
          return false
        }
        // We already hold the lock
        return true
      }
      // Lock expired, we can take it
    }
    // Acquire the lock
    const newLock: PushLock = {
      timestamp: Date.now(),
      tabId: getTabId(),
    }
    localStorage.setItem(PUSH_LOCK_KEY, JSON.stringify(newLock))
    return true
  } catch {
    // If localStorage fails, allow the operation (single-tab fallback)
    return true
  }
}

/** Release the push lock if we own it */
function releasePushLock(): void {
  try {
    const existing = localStorage.getItem(PUSH_LOCK_KEY)
    if (existing) {
      const lock = JSON.parse(existing) as PushLock
      if (lock.tabId === getTabId()) {
        localStorage.removeItem(PUSH_LOCK_KEY)
      }
    }
  } catch {
    // Ignore errors
  }
}

/** Check if push is locked by another tab */
function isPushLockedByOtherTab(): boolean {
  try {
    const existing = localStorage.getItem(PUSH_LOCK_KEY)
    if (!existing) return false
    const lock = JSON.parse(existing) as PushLock
    return lock.tabId !== getTabId() && Date.now() - lock.timestamp < LOCK_TIMEOUT_MS
  } catch {
    return false
  }
}
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
  onNeedsPushUpdate: (needsPush: boolean) => void
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
  /** True if another tab is currently pushing */
  isLockedByOtherTab: boolean
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
    onNeedsPushUpdate,
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
  const [isLockedByOtherTab, setIsLockedByOtherTab] = useState(false)

  // Check for lock from other tabs periodically and on visibility change
  useEffect(() => {
    const checkLock = () => {
      setIsLockedByOtherTab(isPushLockedByOtherTab())
    }

    // Check immediately
    checkLock()

    // Check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkLock()
      }
    }

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PUSH_LOCK_KEY) {
        checkLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorageChange)
      // Release lock if we hold it when component unmounts
      releasePushLock()
    }
  }, [])

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

      // If there's nothing to sync, clear the needsPush flag
      if (builtPreview.pushCount === 0 && builtPreview.pullCount === 0) {
        onNeedsPushUpdate(false)
      }
    } catch (error) {
      if (error instanceof Error) {
        setPreviewError(error.message)
      } else {
        setPreviewError('Failed to fetch current routines from Hevy')
      }
    } finally {
      setIsLoading(false)
    }
  }, [hevyClient, hevyRoutineIds, exercises, progression, t3Schedule, settings.weightUnit, onNeedsPushUpdate])

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
    // Prevent double-click - check if already updating
    if (isUpdating) {
      return
    }

    if (!hevyClient || !preview || !hevyState) {
      setUpdateError('Missing data for sync')
      close()
      return
    }

    if (preview.pushCount === 0 && preview.pullCount === 0) {
      // Nothing to push or pull - clear the needsPush flag since we're in sync
      onNeedsPushUpdate(false)
      close()
      return
    }

    // Try to acquire the multi-tab lock
    if (!acquirePushLock()) {
      setUpdateError('Another tab is currently syncing. Please wait.')
      setIsLockedByOtherTab(true)
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

      // Clear the needs push flag since we just pushed successfully
      onNeedsPushUpdate(false)

      setUpdateSuccess(true)
    } catch (error) {
      if (error instanceof Error) {
        setUpdateError(error.message)
      } else {
        setUpdateError('Failed to sync with Hevy')
      }
    } finally {
      setIsUpdating(false)
      releasePushLock()
      setIsLockedByOtherTab(isPushLockedByOtherTab())
    }
  }, [
    isUpdating,
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
    onNeedsPushUpdate,
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
    isLockedByOtherTab,
    open,
    close,
    confirm,
    changeAction,
    dismissUpdateStatus,
  }
}
