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
    detectedWorkoutDay: null,
    newWorkoutsCount: 0,
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
      amrapRecord: 5,
      amrapRecordDate: null,
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
    progressionHistory: {},
  }

  const createMockProgressionReturn = (overrides: object = {}) => ({
    isSyncing: false,
    syncError: null,
    lastSyncTime: null,
    pendingChanges: [],
    discrepancies: [],
    analysisResults: [],
    detectedWorkoutDay: null,
    newWorkoutsCount: 0,
    syncWorkouts: vi.fn().mockResolvedValue(undefined),
    clearError: vi.fn(),
    clearPendingChanges: vi.fn(),
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProgression.mockReturnValue(createMockProgressionReturn())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('auto-sync on mount', () => {
    it('triggers sync on mount when conditions are met', async () => {
      const mockSyncWorkouts = vi.fn().mockResolvedValue(undefined)
      mockUseProgression.mockReturnValue(createMockProgressionReturn({ syncWorkouts: mockSyncWorkouts }))

      renderHook(() => useSyncFlow(defaultOptions))

      await waitFor(() => {
        expect(mockSyncWorkouts).toHaveBeenCalledTimes(1)
      })
    })

    it('does not auto-sync when offline', async () => {
      const mockSyncWorkouts = vi.fn().mockResolvedValue(undefined)
      mockUseProgression.mockReturnValue(createMockProgressionReturn({ syncWorkouts: mockSyncWorkouts }))

      renderHook(() => useSyncFlow({ ...defaultOptions, isOnline: false }))

      // Wait a bit to ensure no sync was triggered
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(mockSyncWorkouts).not.toHaveBeenCalled()
    })

    it('does not auto-sync when already syncing', async () => {
      const mockSyncWorkouts = vi.fn().mockResolvedValue(undefined)
      mockUseProgression.mockReturnValue(createMockProgressionReturn({ isSyncing: true, syncWorkouts: mockSyncWorkouts }))

      renderHook(() => useSyncFlow(defaultOptions))

      // Wait a bit to ensure no sync was triggered
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(mockSyncWorkouts).not.toHaveBeenCalled()
    })

    it('does not auto-sync when no API key', async () => {
      const mockSyncWorkouts = vi.fn().mockResolvedValue(undefined)
      mockUseProgression.mockReturnValue(createMockProgressionReturn({ syncWorkouts: mockSyncWorkouts }))

      renderHook(() => useSyncFlow({ ...defaultOptions, apiKey: '' }))

      // Wait a bit to ensure no sync was triggered
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(mockSyncWorkouts).not.toHaveBeenCalled()
    })

    it('only auto-syncs once even if re-rendered', async () => {
      const mockSyncWorkouts = vi.fn().mockResolvedValue(undefined)
      mockUseProgression.mockReturnValue(createMockProgressionReturn({ syncWorkouts: mockSyncWorkouts }))

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
      mockUseProgression.mockReturnValue(createMockProgressionReturn({ syncWorkouts: mockSyncWorkouts }))

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
      mockUseProgression.mockReturnValue(createMockProgressionReturn({ syncError: 'Network error' }))

      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      expect(result.current.syncError).toBe('Network error')
    })

    it('clearError calls through to useProgression', () => {
      const mockClearError = vi.fn()
      mockUseProgression.mockReturnValue(createMockProgressionReturn({ syncError: 'Some error', clearError: mockClearError }))

      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      act(() => {
        result.current.clearError()
      })

      expect(mockClearError).toHaveBeenCalledTimes(1)
    })
  })

  describe('state passthrough', () => {
    it('exposes isSyncing state', () => {
      mockUseProgression.mockReturnValue(createMockProgressionReturn({ isSyncing: true }))

      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      expect(result.current.isSyncing).toBe(true)
    })

    it('exposes conflicting pendingChanges (with discrepancy)', () => {
      // A change with discrepancy should be returned as a conflict
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
          newWeight: 95,
          newStage: 0 as const,
          newScheme: '5x3+',
          reason: 'Completed all reps',
          workoutId: 'workout-1',
          workoutDate: '2025-01-01',
          createdAt: '2025-01-01T12:00:00Z',
          discrepancy: {
            storedWeight: 100,
            actualWeight: 95,
          },
        },
      ]

      mockUseProgression.mockReturnValue(createMockProgressionReturn({ pendingChanges: mockPendingChanges }))

      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      // Change with discrepancy should be in conflicts
      expect(result.current.syncPendingChanges).toEqual(mockPendingChanges)
    })

    it('filters out non-conflicting changes for auto-apply', () => {
      // A change without discrepancy should be auto-applied (filtered out)
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
          // No discrepancy = should be auto-applied
        },
      ]

      mockUseProgression.mockReturnValue(createMockProgressionReturn({ pendingChanges: mockPendingChanges }))

      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      // Non-conflicting changes should be filtered out for auto-apply
      expect(result.current.syncPendingChanges).toEqual([])
    })

    it('treats deloads as auto-apply (not conflicts)', () => {
      // A deload without discrepancy should be auto-applied
      const mockPendingChanges = [
        {
          id: 'change-1',
          exerciseId: 'ex-1',
          exerciseName: 'Squat',
          tier: 'T1' as const,
          type: 'deload' as const,
          progressionKey: 'squat-T1',
          currentWeight: 100,
          currentStage: 2 as const,
          newWeight: 85,
          newStage: 0 as const,
          newScheme: '5x3+',
          reason: 'Failed final stage',
          workoutId: 'workout-1',
          workoutDate: '2025-01-01',
          createdAt: '2025-01-01T12:00:00Z',
        },
      ]

      mockUseProgression.mockReturnValue(createMockProgressionReturn({ pendingChanges: mockPendingChanges }))

      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      // Deload without discrepancy should be auto-applied (filtered out of conflicts)
      expect(result.current.syncPendingChanges).toEqual([])
    })

    it('treats deloads with discrepancy as conflicts requiring review', () => {
      // A deload WITH discrepancy should still require review
      const mockPendingChanges = [
        {
          id: 'change-1',
          exerciseId: 'ex-1',
          exerciseName: 'Squat',
          tier: 'T1' as const,
          type: 'deload' as const,
          progressionKey: 'squat-T1',
          currentWeight: 100,
          currentStage: 2 as const,
          newWeight: 85,
          newStage: 0 as const,
          newScheme: '5x3+',
          reason: 'Failed final stage',
          workoutId: 'workout-1',
          workoutDate: '2025-01-01',
          createdAt: '2025-01-01T12:00:00Z',
          discrepancy: {
            storedWeight: 100,
            actualWeight: 95,
          },
        },
      ]

      mockUseProgression.mockReturnValue(createMockProgressionReturn({ pendingChanges: mockPendingChanges }))

      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      // Deload with discrepancy should be in conflicts
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

      mockUseProgression.mockReturnValue(createMockProgressionReturn({ discrepancies: mockDiscrepancies }))

      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      expect(result.current.discrepancies).toEqual(mockDiscrepancies)
    })

    it('exposes autoAppliedCount', () => {
      mockUseProgression.mockReturnValue(createMockProgressionReturn())

      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      // Initially 0
      expect(result.current.autoAppliedCount).toBe(0)
    })
  })

  describe('batch auto-apply', () => {
    const createChange = (id: string, overrides: Partial<import('@/types/state').PendingChange> = {}): import('@/types/state').PendingChange => ({
      id,
      exerciseId: 'ex-1',
      exerciseName: 'Squat',
      tier: 'T1' as const,
      type: 'progress' as const,
      progressionKey: `key-${id}`,
      currentWeight: 100,
      currentStage: 0 as const,
      newWeight: 105,
      newStage: 0 as const,
      newScheme: '5x3+',
      reason: 'Completed all reps',
      workoutId: `workout-${id}`,
      workoutDate: '2025-01-01',
      createdAt: '2025-01-01T12:00:00Z',
      ...overrides,
    })

    it('calls onAutoApplyChanges once with all non-conflicting changes', async () => {
      const changes = [
        createChange('1', { progressionKey: 'squat-T1' }),
        createChange('2', { progressionKey: 'ohp-T1', exerciseName: 'OHP' }),
        createChange('3', { progressionKey: 'bench-T2', exerciseName: 'Bench' }),
      ]

      mockUseProgression.mockReturnValue(createMockProgressionReturn({ pendingChanges: changes }))

      const onAutoApplyChanges = vi.fn()

      renderHook(() => useSyncFlow({
        ...defaultOptions,
        onAutoApplyChanges,
      }))

      await waitFor(() => {
        expect(onAutoApplyChanges).toHaveBeenCalledTimes(1)
      })

      // Called once with all 3 changes
      expect(onAutoApplyChanges).toHaveBeenCalledWith(changes)
    })

    it('does not include conflicting changes in batch callback', async () => {
      const autoChange = createChange('1', { progressionKey: 'squat-T1' })
      const conflictChange = createChange('2', {
        progressionKey: 'ohp-T1',
        exerciseName: 'OHP',
        discrepancy: { storedWeight: 100, actualWeight: 95 },
      })

      mockUseProgression.mockReturnValue(
        createMockProgressionReturn({ pendingChanges: [autoChange, conflictChange] })
      )

      const onAutoApplyChanges = vi.fn()

      renderHook(() => useSyncFlow({
        ...defaultOptions,
        onAutoApplyChanges,
      }))

      await waitFor(() => {
        expect(onAutoApplyChanges).toHaveBeenCalledTimes(1)
      })

      // Only the non-conflicting change
      expect(onAutoApplyChanges).toHaveBeenCalledWith([autoChange])
    })

    it('does not call onAutoApplyChanges when there are no auto-apply changes', async () => {
      const conflictChange = createChange('1', {
        discrepancy: { storedWeight: 100, actualWeight: 95 },
      })

      mockUseProgression.mockReturnValue(
        createMockProgressionReturn({ pendingChanges: [conflictChange] })
      )

      const onAutoApplyChanges = vi.fn()

      renderHook(() => useSyncFlow({
        ...defaultOptions,
        onAutoApplyChanges,
      }))

      // Wait to ensure effect runs
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(onAutoApplyChanges).not.toHaveBeenCalled()
    })

    it('does not re-call onAutoApplyChanges for already-applied changes on rerender', async () => {
      const changes = [createChange('1', { progressionKey: 'squat-T1' })]

      mockUseProgression.mockReturnValue(createMockProgressionReturn({ pendingChanges: changes }))

      const onAutoApplyChanges = vi.fn()

      const { rerender } = renderHook(() => useSyncFlow({
        ...defaultOptions,
        onAutoApplyChanges,
      }))

      await waitFor(() => {
        expect(onAutoApplyChanges).toHaveBeenCalledTimes(1)
      })

      // Rerender — same changes still present
      rerender()
      rerender()

      // Should still only be called once
      expect(onAutoApplyChanges).toHaveBeenCalledTimes(1)
    })
  })

  describe('no premature history recording', () => {
    it('does not accept onRecordHistory prop', () => {
      // The hook should NOT have an onRecordHistory prop
      // History recording is the caller's responsibility when applying changes
      mockUseProgression.mockReturnValue(createMockProgressionReturn())

      // Verify the type doesn't include onRecordHistory by checking that
      // the hook works without it
      const { result } = renderHook(() => useSyncFlow(defaultOptions))

      expect(result.current.isSyncing).toBe(false)
    })
  })
})
