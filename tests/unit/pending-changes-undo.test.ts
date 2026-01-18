/**
 * Pending Changes Undo Tests
 *
 * Tests for the undo reject functionality in usePendingChanges hook.
 * [Task 4.2] Undo for reject actions
 *
 * TDD: Tests written before implementation.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePendingChanges } from '@/hooks/usePendingChanges'
import type { PendingChange, ProgressionState, GZCLPDay } from '@/types/state'

describe('usePendingChanges - Undo Functionality', () => {
  const mockProgression: Record<string, ProgressionState> = {
    'squat-T1': {
      exerciseId: 'ex-1',
      currentWeight: 100,
      stage: 0,
      baseWeight: 100,
      amrapRecord: 5,
    },
  }

  const mockChange: PendingChange = {
    id: 'change-1',
    exerciseId: 'ex-1',
    exerciseName: 'Squat',
    tier: 'T1',
    type: 'progress',
    progressionKey: 'squat-T1',
    currentWeight: 100,
    currentStage: 0,
    newWeight: 105,
    newStage: 0,
    newScheme: '5x3+',
    reason: 'Completed all reps',
    workoutId: 'workout-1',
    workoutDate: '2025-01-01',
    createdAt: '2025-01-01T12:00:00Z',
  }

  const defaultOptions = {
    initialChanges: [mockChange],
    progression: mockProgression,
    onProgressionUpdate: vi.fn(),
    currentDay: 'A1' as GZCLPDay,
    onDayAdvance: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('recentlyRejected state', () => {
    it('starts with no recently rejected change', () => {
      const { result } = renderHook(() => usePendingChanges(defaultOptions))

      expect(result.current.recentlyRejected).toBeNull()
    })

    it('stores rejected change for 5 seconds', () => {
      const { result } = renderHook(() => usePendingChanges(defaultOptions))

      act(() => {
        result.current.rejectChange('change-1')
      })

      expect(result.current.recentlyRejected).toEqual(mockChange)
      expect(result.current.pendingChanges).toHaveLength(0)
    })

    it('clears recentlyRejected after 5 seconds', () => {
      const { result } = renderHook(() => usePendingChanges(defaultOptions))

      act(() => {
        result.current.rejectChange('change-1')
      })

      expect(result.current.recentlyRejected).toEqual(mockChange)

      // Fast forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.recentlyRejected).toBeNull()
    })

    it('replaces previous rejected change when rejecting another', () => {
      const secondChange: PendingChange = {
        ...mockChange,
        id: 'change-2',
        exerciseName: 'Bench Press',
        progressionKey: 'bench-T1',
      }

      const { result } = renderHook(() =>
        usePendingChanges({
          ...defaultOptions,
          initialChanges: [mockChange, secondChange],
        })
      )

      act(() => {
        result.current.rejectChange('change-1')
      })

      expect(result.current.recentlyRejected?.id).toBe('change-1')

      act(() => {
        result.current.rejectChange('change-2')
      })

      expect(result.current.recentlyRejected?.id).toBe('change-2')
    })
  })

  describe('undoReject', () => {
    it('restores the rejected change to pending changes', () => {
      const { result } = renderHook(() => usePendingChanges(defaultOptions))

      act(() => {
        result.current.rejectChange('change-1')
      })

      expect(result.current.pendingChanges).toHaveLength(0)

      act(() => {
        result.current.undoReject()
      })

      expect(result.current.pendingChanges).toHaveLength(1)
      expect(result.current.pendingChanges[0]).toEqual(mockChange)
    })

    it('clears recentlyRejected after undo', () => {
      const { result } = renderHook(() => usePendingChanges(defaultOptions))

      act(() => {
        result.current.rejectChange('change-1')
      })

      expect(result.current.recentlyRejected).not.toBeNull()

      act(() => {
        result.current.undoReject()
      })

      expect(result.current.recentlyRejected).toBeNull()
    })

    it('cancels the 5-second timeout after undo', () => {
      const { result } = renderHook(() => usePendingChanges(defaultOptions))

      act(() => {
        result.current.rejectChange('change-1')
      })

      act(() => {
        result.current.undoReject()
      })

      // Fast forward past the 5 seconds
      act(() => {
        vi.advanceTimersByTime(6000)
      })

      // Should still be null (no stale state)
      expect(result.current.recentlyRejected).toBeNull()
      // And the change should still be in pending
      expect(result.current.pendingChanges).toHaveLength(1)
    })

    it('does nothing if no recently rejected change', () => {
      const { result } = renderHook(() => usePendingChanges(defaultOptions))

      act(() => {
        result.current.undoReject()
      })

      expect(result.current.pendingChanges).toHaveLength(1) // Original change still there
    })
  })

  describe('cleanup', () => {
    it('clears timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      const { result, unmount } = renderHook(() => usePendingChanges(defaultOptions))

      act(() => {
        result.current.rejectChange('change-1')
      })

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })
})
