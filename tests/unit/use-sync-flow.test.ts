/**
 * useSyncFlow Hook Tests
 *
 * Tests for the useSyncFlow hook that orchestrates workout synchronization.
 * [Task 3.2] Extracted from Dashboard/index.tsx
 *
 * TDD: Tests written before implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSyncFlow } from '@/hooks/useSyncFlow'
import type { ExerciseConfig, ProgressionState, UserSettings, GZCLPDay } from '@/types/state'

// Mock the useProgression hook
vi.mock('@/hooks/useProgression', () => ({
  useProgression: vi.fn(() => ({
    isSyncing: false,
    syncError: null,
    pendingChanges: [],
    discrepancies: [],
    syncWorkouts: vi.fn().mockResolvedValue(undefined),
    clearError: vi.fn(),
  })),
}))

// Import mock after setup
import { useProgression } from '@/hooks/useProgression'

const mockUseProgression = vi.mocked(useProgression)

describe('useSyncFlow', () => {
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

  const defaultOptions = {
    apiKey: 'test-api-key',
    exercises: mockExercises,
    progression: mockProgression,
    settings: mockSettings,
    lastSync: null,
    hevyRoutineIds: mockHevyRoutineIds,
    isOnline: true,
    onLastSyncUpdate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProgression.mockReturnValue({
      isSyncing: false,
      syncError: null,
      lastSyncTime: null,
      pendingChanges: [],
      discrepancies: [],
      analysisResults: [],
      syncWorkouts: vi.fn().mockResolvedValue(undefined),
      clearError: vi.fn(),
      clearPendingChanges: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('auto-sync on mount', () => {
    it('triggers sync on mount when conditions are met', async () => {
      const mockSyncWorkouts = vi.fn().mockResolvedValue(undefined)
      mockUseProgression.mockReturnValue({
        isSyncing: false,
        syncError: null,
        lastSyncTime: null,
        pendingChanges: [],
        discrepancies: [],
        analysisResults: [],
        syncWorkouts: mockSyncWorkouts,
        clearError: vi.fn(),
        clearPendingChanges: vi.fn(),
      })

      renderHook(() => useSyncFlow(defaultOptions))

      await waitFor(() => {
        expect(mockSyncWorkouts).toHaveBeenCalledTimes(1)
      })
    })

    it('does not auto-sync when offline', async () => {
      const mockSyncWorkouts = vi.fn().mockResolvedValue(undefined)
      mockUseProgression.mockReturnValue({
        isSyncing: false,
        syncError: null,
        lastSyncTime: null,
        pendingChanges: [],
        discrepancies: [],
        analysisResults: [],
        syncWorkouts: mockSyncWorkouts,
        clearError: vi.fn(),
        clearPendingChanges: vi.fn(),
      })

      renderHook(() => useSyncFlow({ ...defaultOptions, isOnline: false }))

      // Wait a bit to ensure no sync was triggered
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(mockSyncWorkouts).not.toHaveBeenCalled()
    })

    it('does not auto-sync when already syncing', async () => {
      const mockSyncWorkouts = vi.fn().mockResolvedValue(undefined)
      mockUseProgression.mockReturnValue({
        isSyncing: true,
        syncError: null,
        lastSyncTime: null,
        pendingChanges: [],
        discrepancies: [],
        analysisResults: [],
        syncWorkouts: mockSyncWorkouts,
        clearError: vi.fn(),
        clearPendingChanges: vi.fn(),
      })

      renderHook(() => useSyncFlow(defaultOptions))

      // Wait a bit to ensure no sync was triggered
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(mockSyncWorkouts).not.toHaveBeenCalled()
    })

    it('does not auto-sync when no API key', async () => {
      const mockSyncWorkouts = vi.fn().mockResolvedValue(undefined)
      mockUseProgression.mockReturnValue({
        isSyncing: false,
        syncError: null,
        lastSyncTime: null,
        pendingChanges: [],
        discrepancies: [],
        analysisResults: [],
        syncWorkouts: mockSyncWorkouts,
        clearError: vi.fn(),
        clearPendingChanges: vi.fn(),
      })

      renderHook(() => useSyncFlow({ ...defaultOptions, apiKey: '' }))

      // Wait a bit to ensure no sync was triggered
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(mockSyncWorkouts).not.toHaveBeenCalled()
    })

    it('only auto-syncs once even if re-rendered', async () => {
      const mockSyncWorkouts = vi.fn().mockResolvedValue(undefined)
      mockUseProgression.mockReturnValue({
        isSyncing: false,
        syncError: null,
        lastSyncTime: null,
        pendingChanges: [],
        discrepancies: [],
        analysisResults: [],
        syncWorkouts: mockSyncWorkouts,
        clearError: vi.fn(),
        clearPendingChanges: vi.fn(),
      })

      const { rerender } = renderHook(() => useSyncFlow(defaultOptions))

      await waitFor(() => {
        expect(mockSyncWorkouts).toHaveBeenCalledTimes(1)
      })

      // Re-render multiple times
      rerender()
      rerender()
      rerender()

      // Should still only be called once
      expect(mockSyncWorkouts).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleSync', () => {
    it('calls syncWorkouts and updates lastSync', async () => {
      const mockSyncWorkouts = vi.fn().mockResolvedValue(undefined)
      const mockOnLastSyncUpdate = vi.fn()
      mockUseProgression.mockReturnValue({
        isSyncing: false,
        syncError: null,
        lastSyncTime: null,
        pendingChanges: [],
        discrepancies: [],
        analysisResults: [],
        syncWorkouts: mockSyncWorkouts,
        clearError: vi.fn(),
        clearPendingChanges: vi.fn(),
      })

      const { result } = renderHook(() =>
        useSyncFlow({ ...defaultOptions, onLastSyncUpdate: mockOnLastSyncUpdate })
      )

      // Wait for auto-sync to complete
      await waitFor(() => {
        expect(mockSyncWorkouts).toHaveBeenCalled()
      })

      // Reset mock to track manual sync
      mockSyncWorkouts.mockClear()
      mockOnLastSyncUpdate.mockClear()

      // Manual sync
      await act(async () => {
        await result.current.handleSync()
      })

      expect(mockSyncWorkouts).toHaveBeenCalledTimes(1)
      expect(mockOnLastSyncUpdate).toHaveBeenCalledWith(expect.any(String))

      // Verify ISO timestamp format
      const timestamp = mockOnLastSyncUpdate.mock.calls[0][0]
      expect(new Date(timestamp).toISOString()).toBe(timestamp)
    })
  })

  describe('error state management', () => {
    it('exposes syncError from useProgression', () => {
      mockUseProgression.mockReturnValue({
        isSyncing: false,
        syncError: 'Network error',
        lastSyncTime: null,
        pendingChanges: [],
        discrepancies: [],
        analysisResults: [],
        syncWorkouts: vi.fn(),
        clearError: vi.fn(),
        clearPendingChanges: vi.fn(),
      })

      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      expect(result.current.syncError).toBe('Network error')
    })

    it('clearError calls through to useProgression', () => {
      const mockClearError = vi.fn()
      mockUseProgression.mockReturnValue({
        isSyncing: false,
        syncError: 'Some error',
        lastSyncTime: null,
        pendingChanges: [],
        discrepancies: [],
        analysisResults: [],
        syncWorkouts: vi.fn(),
        clearError: mockClearError,
        clearPendingChanges: vi.fn(),
      })

      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      act(() => {
        result.current.clearError()
      })

      expect(mockClearError).toHaveBeenCalledTimes(1)
    })
  })

  describe('state passthrough', () => {
    it('exposes isSyncing state', () => {
      mockUseProgression.mockReturnValue({
        isSyncing: true,
        syncError: null,
        lastSyncTime: null,
        pendingChanges: [],
        discrepancies: [],
        analysisResults: [],
        syncWorkouts: vi.fn(),
        clearError: vi.fn(),
        clearPendingChanges: vi.fn(),
      })

      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      expect(result.current.isSyncing).toBe(true)
    })

    it('exposes pendingChanges from sync', () => {
      const mockPendingChanges = [
        {
          id: 'change-1',
          exerciseId: 'ex-1',
          exerciseName: 'Squat',
          tier: 'T1' as const,
          type: 'progress' as const,
          progressionKey: 'squat-T1',
          currentWeight: 100,
          currentStage: 0 as const,
          newWeight: 105,
          newStage: 0 as const,
          newScheme: '5x3+',
          reason: 'Completed all reps',
          workoutId: 'workout-1',
          workoutDate: '2025-01-01',
          createdAt: '2025-01-01T12:00:00Z',
        },
      ]

      mockUseProgression.mockReturnValue({
        isSyncing: false,
        syncError: null,
        lastSyncTime: null,
        pendingChanges: mockPendingChanges,
        discrepancies: [],
        analysisResults: [],
        syncWorkouts: vi.fn(),
        clearError: vi.fn(),
        clearPendingChanges: vi.fn(),
      })

      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      expect(result.current.syncPendingChanges).toEqual(mockPendingChanges)
    })

    it('exposes discrepancies from sync', () => {
      const mockDiscrepancies = [
        {
          exerciseId: 'ex-1',
          exerciseName: 'Squat',
          tier: 'T1' as const,
          storedWeight: 100,
          actualWeight: 95,
          workoutId: 'workout-1',
          workoutDate: '2025-01-01',
        },
      ]

      mockUseProgression.mockReturnValue({
        isSyncing: false,
        syncError: null,
        lastSyncTime: null,
        pendingChanges: [],
        discrepancies: mockDiscrepancies,
        analysisResults: [],
        syncWorkouts: vi.fn(),
        clearError: vi.fn(),
        clearPendingChanges: vi.fn(),
      })

      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      expect(result.current.discrepancies).toEqual(mockDiscrepancies)
    })
  })
})
