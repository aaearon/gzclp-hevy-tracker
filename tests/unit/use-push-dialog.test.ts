/**
 * usePushDialog Hook Tests
 *
 * Tests for the usePushDialog hook that manages push dialog state and actions.
 * [Task 3.3] Extracted from Dashboard/index.tsx
 *
 * TDD: Tests written before implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePushDialog } from '@/hooks/usePushDialog'
import type {
  ExerciseConfig,
  ProgressionState,
  UserSettings,
  GZCLPDay,
} from '@/types/state'
import type { HevyClient } from '@/lib/hevy-client'

// Mock push-preview module
vi.mock('@/lib/push-preview', () => ({
  fetchCurrentHevyState: vi.fn(),
  buildSelectablePushPreview: vi.fn(),
  updatePreviewAction: vi.fn(),
}))

// Mock routine-manager module
vi.mock('@/lib/routine-manager', () => ({
  syncGZCLPRoutines: vi.fn(),
}))

import { fetchCurrentHevyState, buildSelectablePushPreview, updatePreviewAction } from '@/lib/push-preview'
import { syncGZCLPRoutines } from '@/lib/routine-manager'

const mockFetchCurrentHevyState = vi.mocked(fetchCurrentHevyState)
const mockBuildSelectablePushPreview = vi.mocked(buildSelectablePushPreview)
const mockUpdatePreviewAction = vi.mocked(updatePreviewAction)
const mockSyncGZCLPRoutines = vi.mocked(syncGZCLPRoutines)

describe('usePushDialog', () => {
  const mockExercises: Record<string, ExerciseConfig> = {
    'ex-1': { id: 'ex-1', hevyTemplateId: 'hevy-1', name: 'Squat', role: 'squat' },
  }

  const mockProgression: Record<string, ProgressionState> = {
    'squat-T1': {
      exerciseId: 'ex-1',
      currentWeight: 100,
      stage: 0,
      baseWeight: 100,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 5,
    },
  }

  const mockSettings: UserSettings = {
    weightUnit: 'kg',
    increments: { upper: 2.5, lower: 5 },
    restTimers: { t1: 180, t2: 120, t3: 60 },
  }

  const mockHevyRoutineIds: Record<GZCLPDay, string | null> = {
    A1: 'routine-a1',
    B1: 'routine-b1',
    A2: 'routine-a2',
    B2: 'routine-b2',
  }

  const mockT3Schedule: Record<GZCLPDay, string[]> = {
    A1: [],
    B1: [],
    A2: [],
    B2: [],
  }

  const mockHevyClient = {
    getRoutine: vi.fn(),
    getWorkouts: vi.fn(),
    updateRoutine: vi.fn(),
    createRoutine: vi.fn(),
  } as unknown as HevyClient

  const mockHevyState = {
    A1: { routineId: 'routine-a1', weights: new Map() },
    B1: { routineId: 'routine-b1', weights: new Map() },
    A2: { routineId: 'routine-a2', weights: new Map() },
    B2: { routineId: 'routine-b2', weights: new Map() },
  }

  const mockPreview = {
    days: [],
    totalChanges: 2,
    hasAnyRoutines: true,
    pushCount: 2,
    pullCount: 0,
    skipCount: 0,
  }

  const defaultOptions = {
    hevyClient: mockHevyClient,
    exercises: mockExercises,
    progression: mockProgression,
    settings: mockSettings,
    hevyRoutineIds: mockHevyRoutineIds,
    t3Schedule: mockT3Schedule,
    onProgressionUpdate: vi.fn(),
    onRoutineIdsUpdate: vi.fn(),
    onNeedsPushUpdate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchCurrentHevyState.mockResolvedValue(mockHevyState)
    mockBuildSelectablePushPreview.mockReturnValue(mockPreview)
    mockSyncGZCLPRoutines.mockResolvedValue({
      routineIds: { A1: 'routine-a1', B1: 'routine-b1', A2: 'routine-a2', B2: 'routine-b2' },
      pullUpdates: [],
    })
  })

  describe('initial state', () => {
    it('starts with dialog closed', () => {
      const { result } = renderHook(() => usePushDialog(defaultOptions))

      expect(result.current.isOpen).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.preview).toBeNull()
    })

    it('has no errors initially', () => {
      const { result } = renderHook(() => usePushDialog(defaultOptions))

      expect(result.current.previewError).toBeNull()
      expect(result.current.updateError).toBeNull()
    })
  })

  describe('open', () => {
    it('fetches current Hevy state and builds preview', async () => {
      const { result } = renderHook(() => usePushDialog(defaultOptions))

      await act(async () => {
        await result.current.open()
      })

      expect(mockFetchCurrentHevyState).toHaveBeenCalledWith(mockHevyClient, mockHevyRoutineIds)
      expect(mockBuildSelectablePushPreview).toHaveBeenCalledWith(
        mockHevyState,
        mockExercises,
        mockProgression,
        mockT3Schedule,
        'kg'
      )
      expect(result.current.preview).toEqual(mockPreview)
      expect(result.current.isOpen).toBe(true)
    })

    it('sets loading state during fetch', async () => {
      let resolvePromise: () => void
      const slowPromise = new Promise<typeof mockHevyState>((resolve) => {
        resolvePromise = () => resolve(mockHevyState)
      })
      mockFetchCurrentHevyState.mockReturnValueOnce(slowPromise)

      const { result } = renderHook(() => usePushDialog(defaultOptions))

      // Start opening - don't await yet
      let openPromise: Promise<void>
      act(() => {
        openPromise = result.current.open()
      })

      // Check loading state
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isOpen).toBe(true)

      // Resolve and wait
      await act(async () => {
        resolvePromise!()
        await openPromise!
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('sets error when fetch fails', async () => {
      mockFetchCurrentHevyState.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => usePushDialog(defaultOptions))

      await act(async () => {
        await result.current.open()
      })

      expect(result.current.previewError).toBe('Network error')
      expect(result.current.preview).toBeNull()
    })

    it('sets generic error for non-Error exceptions', async () => {
      mockFetchCurrentHevyState.mockRejectedValueOnce('Unknown error')

      const { result } = renderHook(() => usePushDialog(defaultOptions))

      await act(async () => {
        await result.current.open()
      })

      expect(result.current.previewError).toBe('Failed to fetch current routines from Hevy')
    })

    it('sets error when no Hevy client', async () => {
      const { result } = renderHook(() =>
        usePushDialog({ ...defaultOptions, hevyClient: null })
      )

      await act(async () => {
        await result.current.open()
      })

      expect(result.current.updateError).toBe('Not connected to Hevy API')
      expect(result.current.isOpen).toBe(false)
    })
  })

  describe('close', () => {
    it('resets all dialog state', async () => {
      const { result } = renderHook(() => usePushDialog(defaultOptions))

      // Open first
      await act(async () => {
        await result.current.open()
      })

      expect(result.current.isOpen).toBe(true)
      expect(result.current.preview).not.toBeNull()

      // Now close
      act(() => {
        result.current.close()
      })

      expect(result.current.isOpen).toBe(false)
      expect(result.current.preview).toBeNull()
      expect(result.current.previewError).toBeNull()
    })
  })

  describe('changeAction', () => {
    it('updates preview with new action', async () => {
      const updatedPreview = { ...mockPreview, pushCount: 1, skipCount: 1 }
      mockUpdatePreviewAction.mockReturnValueOnce(updatedPreview)

      const { result } = renderHook(() => usePushDialog(defaultOptions))

      await act(async () => {
        await result.current.open()
      })

      act(() => {
        result.current.changeAction('squat-T1', 'skip')
      })

      expect(mockUpdatePreviewAction).toHaveBeenCalledWith(mockPreview, 'squat-T1', 'skip')
      expect(result.current.preview).toEqual(updatedPreview)
    })

    it('does nothing if preview is null', () => {
      const { result } = renderHook(() => usePushDialog(defaultOptions))

      act(() => {
        result.current.changeAction('squat-T1', 'skip')
      })

      expect(mockUpdatePreviewAction).not.toHaveBeenCalled()
    })
  })

  describe('confirm', () => {
    it('executes sync and updates progression for pull changes', async () => {
      const pullUpdates = [{ progressionKey: 'squat-T1', weight: 105 }]
      mockSyncGZCLPRoutines.mockResolvedValueOnce({
        routineIds: { A1: 'routine-a1', B1: null, A2: null, B2: null },
        pullUpdates,
      })

      const onProgressionUpdate = vi.fn()
      const onRoutineIdsUpdate = vi.fn()

      const { result } = renderHook(() =>
        usePushDialog({
          ...defaultOptions,
          onProgressionUpdate,
          onRoutineIdsUpdate,
        })
      )

      await act(async () => {
        await result.current.open()
      })

      await act(async () => {
        await result.current.confirm()
      })

      expect(mockSyncGZCLPRoutines).toHaveBeenCalled()
      expect(onProgressionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          'squat-T1': expect.objectContaining({
            currentWeight: 105,
            baseWeight: 105,
          }),
        })
      )
      expect(onRoutineIdsUpdate).toHaveBeenCalled()
    })

    it('sets updateSuccess on successful sync', async () => {
      const { result } = renderHook(() => usePushDialog(defaultOptions))

      await act(async () => {
        await result.current.open()
      })

      await act(async () => {
        await result.current.confirm()
      })

      expect(result.current.updateSuccess).toBe(true)
      expect(result.current.isOpen).toBe(false)
    })

    it('sets error on sync failure', async () => {
      mockSyncGZCLPRoutines.mockRejectedValueOnce(new Error('Sync failed'))

      const { result } = renderHook(() => usePushDialog(defaultOptions))

      await act(async () => {
        await result.current.open()
      })

      await act(async () => {
        await result.current.confirm()
      })

      expect(result.current.updateError).toBe('Sync failed')
      expect(result.current.updateSuccess).toBe(false)
    })

    it('closes dialog and returns early if no changes', async () => {
      const emptyPreview = { ...mockPreview, pushCount: 0, pullCount: 0 }
      mockBuildSelectablePushPreview.mockReturnValueOnce(emptyPreview)

      const { result } = renderHook(() => usePushDialog(defaultOptions))

      await act(async () => {
        await result.current.open()
      })

      await act(async () => {
        await result.current.confirm()
      })

      expect(mockSyncGZCLPRoutines).not.toHaveBeenCalled()
      expect(result.current.isOpen).toBe(false)
    })

    it('does nothing if no preview or hevyState', async () => {
      const { result } = renderHook(() => usePushDialog(defaultOptions))

      // Try to confirm without opening
      await act(async () => {
        await result.current.confirm()
      })

      expect(mockSyncGZCLPRoutines).not.toHaveBeenCalled()
    })
  })

  describe('dismissUpdateStatus', () => {
    it('clears updateError and updateSuccess', async () => {
      mockSyncGZCLPRoutines.mockRejectedValueOnce(new Error('Sync failed'))

      const { result } = renderHook(() => usePushDialog(defaultOptions))

      await act(async () => {
        await result.current.open()
      })

      await act(async () => {
        await result.current.confirm()
      })

      expect(result.current.updateError).toBe('Sync failed')

      act(() => {
        result.current.dismissUpdateStatus()
      })

      expect(result.current.updateError).toBeNull()
      expect(result.current.updateSuccess).toBe(false)
    })
  })
})
