/**
 * useProgressionManager Hook Tests
 *
 * Tests for the domain-specific hook that manages progression state,
 * workout stats, sync metadata, and discrepancy handling.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProgressionManager } from '@/hooks/useProgressionManager'
import type { UseProgressionStorageResult } from '@/hooks/useProgressionStorage'
import type { ProgressionStore } from '@/types/storage'
import type { ProgressionState } from '@/types/state'

// Helper to create mock progression storage
function createMockProgressionStorage(
  overrides: Partial<UseProgressionStorageResult> = {}
): UseProgressionStorageResult {
  const defaultStore: ProgressionStore = {
    progression: {
      'exercise-1': {
        exerciseId: 'exercise-1',
        currentWeight: 100,
        stage: 0,
        baseWeight: 100,
        lastWorkoutId: null,
        lastWorkoutDate: null,
        amrapRecord: 0,
      },
    },
    pendingChanges: [],
    lastSync: null,
    totalWorkouts: 0,
    mostRecentWorkoutDate: null,
    acknowledgedDiscrepancies: [],
    needsPush: false,
  }

  return {
    store: defaultStore,
    setProgression: vi.fn(),
    updateProgression: vi.fn(),
    setProgressionByKey: vi.fn(),
    removeProgression: vi.fn(),
    setPendingChanges: vi.fn(),
    addPendingChange: vi.fn(),
    removePendingChange: vi.fn(),
    clearPendingChanges: vi.fn(),
    setLastSync: vi.fn(),
    setTotalWorkouts: vi.fn(),
    setMostRecentWorkoutDate: vi.fn(),
    setNeedsPush: vi.fn(),
    acknowledgeDiscrepancy: vi.fn(),
    clearAcknowledgedDiscrepancies: vi.fn(),
    resetProgression: vi.fn(),
    importProgression: vi.fn(),
    ...overrides,
  }
}

describe('useProgressionManager', () => {
  describe('setInitialWeight', () => {
    it('should update weight and baseWeight for existing exercise', () => {
      const mockStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useProgressionManager({ progressionStorage: mockStorage })
      )

      act(() => {
        result.current.setInitialWeight('exercise-1', 120, 1)
      })

      expect(mockStorage.setProgression).toHaveBeenCalledWith(
        expect.objectContaining({
          'exercise-1': expect.objectContaining({
            currentWeight: 120,
            baseWeight: 120,
            stage: 1,
          }),
        })
      )
    })

    it('should not update if exercise does not exist', () => {
      const mockStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useProgressionManager({ progressionStorage: mockStorage })
      )

      act(() => {
        result.current.setInitialWeight('non-existent', 100)
      })

      expect(mockStorage.setProgression).not.toHaveBeenCalled()
    })

    it('should default stage to 0', () => {
      const mockStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useProgressionManager({ progressionStorage: mockStorage })
      )

      act(() => {
        result.current.setInitialWeight('exercise-1', 150)
      })

      expect(mockStorage.setProgression).toHaveBeenCalledWith(
        expect.objectContaining({
          'exercise-1': expect.objectContaining({
            stage: 0,
          }),
        })
      )
    })
  })

  describe('setProgressionByKey', () => {
    it('should forward to storage hook', () => {
      const mockStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useProgressionManager({ progressionStorage: mockStorage })
      )

      act(() => {
        result.current.setProgressionByKey('squat-T1', 'exercise-1', 100, 2)
      })

      expect(mockStorage.setProgressionByKey).toHaveBeenCalledWith(
        'squat-T1',
        'exercise-1',
        100,
        2
      )
    })
  })

  describe('updateProgression', () => {
    it('should forward to storage hook', () => {
      const mockStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useProgressionManager({ progressionStorage: mockStorage })
      )

      act(() => {
        result.current.updateProgression('exercise-1', { currentWeight: 105 })
      })

      expect(mockStorage.updateProgression).toHaveBeenCalledWith('exercise-1', {
        currentWeight: 105,
      })
    })
  })

  describe('updateProgressionBatch', () => {
    it('should merge updates with existing progression', () => {
      const mockStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useProgressionManager({ progressionStorage: mockStorage })
      )

      const updates: Record<string, ProgressionState> = {
        'exercise-2': {
          exerciseId: 'exercise-2',
          currentWeight: 80,
          stage: 0,
          baseWeight: 80,
          lastWorkoutId: null,
          lastWorkoutDate: null,
          amrapRecord: 0,
        },
      }

      act(() => {
        result.current.updateProgressionBatch(updates)
      })

      expect(mockStorage.setProgression).toHaveBeenCalledWith(
        expect.objectContaining({
          'exercise-1': expect.any(Object), // existing
          'exercise-2': expect.any(Object), // new
        })
      )
    })
  })

  describe('setTotalWorkouts', () => {
    it('should forward to storage hook', () => {
      const mockStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useProgressionManager({ progressionStorage: mockStorage })
      )

      act(() => {
        result.current.setTotalWorkouts(10)
      })

      expect(mockStorage.setTotalWorkouts).toHaveBeenCalledWith(10)
    })
  })

  describe('setMostRecentWorkoutDate', () => {
    it('should forward to storage hook', () => {
      const mockStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useProgressionManager({ progressionStorage: mockStorage })
      )

      act(() => {
        result.current.setMostRecentWorkoutDate('2024-01-15T10:00:00Z')
      })

      expect(mockStorage.setMostRecentWorkoutDate).toHaveBeenCalledWith(
        '2024-01-15T10:00:00Z'
      )
    })
  })

  describe('setLastSync', () => {
    it('should forward to storage hook', () => {
      const mockStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useProgressionManager({ progressionStorage: mockStorage })
      )

      act(() => {
        result.current.setLastSync('2024-01-15T12:00:00Z')
      })

      expect(mockStorage.setLastSync).toHaveBeenCalledWith('2024-01-15T12:00:00Z')
    })
  })

  describe('setNeedsPush', () => {
    it('should forward to storage hook', () => {
      const mockStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useProgressionManager({ progressionStorage: mockStorage })
      )

      act(() => {
        result.current.setNeedsPush(true)
      })

      expect(mockStorage.setNeedsPush).toHaveBeenCalledWith(true)
    })
  })

  describe('acknowledgeDiscrepancy', () => {
    it('should forward to storage hook', () => {
      const mockStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useProgressionManager({ progressionStorage: mockStorage })
      )

      act(() => {
        result.current.acknowledgeDiscrepancy('exercise-1', 100, 'T1')
      })

      expect(mockStorage.acknowledgeDiscrepancy).toHaveBeenCalledWith(
        'exercise-1',
        100,
        'T1'
      )
    })
  })

  describe('clearAcknowledgedDiscrepancies', () => {
    it('should forward to storage hook', () => {
      const mockStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useProgressionManager({ progressionStorage: mockStorage })
      )

      act(() => {
        result.current.clearAcknowledgedDiscrepancies()
      })

      expect(mockStorage.clearAcknowledgedDiscrepancies).toHaveBeenCalled()
    })
  })
})
