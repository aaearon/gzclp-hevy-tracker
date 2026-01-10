/**
 * Tests for usePendingChanges hook
 *
 * Verifies workout completion callback is called with correct date
 * when changes are applied.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePendingChanges } from '@/hooks/usePendingChanges'
import type { PendingChange, ProgressionState } from '@/types/state'

describe('usePendingChanges', () => {
  const mockProgression: Record<string, ProgressionState> = {
    'squat-T1': {
      exerciseId: 'squat-id',
      currentWeight: 100,
      baseWeight: 100,
      stage: 0,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
  }

  const createMockChange = (overrides?: Partial<PendingChange>): PendingChange => ({
    id: 'change-1',
    exerciseId: 'squat-id',
    exerciseName: 'Squat',
    tier: 'T1',
    type: 'weight_increase',
    progressionKey: 'squat-T1',
    currentWeight: 100,
    currentStage: 0,
    newWeight: 105,
    newStage: 0,
    newScheme: '5x3',
    reason: 'Completed all sets',
    workoutId: 'workout-1',
    workoutDate: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T12:00:00Z',
    ...overrides,
  })

  describe('onWorkoutComplete callback', () => {
    it('should call onWorkoutComplete with the most recent workout date when applying all changes', () => {
      const onWorkoutComplete = vi.fn()
      const onProgressionUpdate = vi.fn()
      const onDayAdvance = vi.fn()

      const changes = [
        createMockChange({ workoutDate: '2024-01-15T10:00:00Z' }),
        createMockChange({
          id: 'change-2',
          workoutDate: '2024-01-16T10:00:00Z',
        }),
      ]

      const { result } = renderHook(() =>
        usePendingChanges({
          initialChanges: changes,
          progression: mockProgression,
          onProgressionUpdate,
          currentDay: 'A1',
          onDayAdvance,
          onWorkoutComplete,
        })
      )

      act(() => {
        result.current.applyAllChanges()
      })

      expect(onWorkoutComplete).toHaveBeenCalledTimes(1)
      expect(onWorkoutComplete).toHaveBeenCalledWith('2024-01-16T10:00:00Z')
    })

    it('should not call onWorkoutComplete when there are no pending changes', () => {
      const onWorkoutComplete = vi.fn()
      const onProgressionUpdate = vi.fn()
      const onDayAdvance = vi.fn()

      const { result } = renderHook(() =>
        usePendingChanges({
          initialChanges: [],
          progression: mockProgression,
          onProgressionUpdate,
          currentDay: 'A1',
          onDayAdvance,
          onWorkoutComplete,
        })
      )

      act(() => {
        result.current.applyAllChanges()
      })

      expect(onWorkoutComplete).not.toHaveBeenCalled()
    })

    it('should still advance day even without onWorkoutComplete callback', () => {
      const onProgressionUpdate = vi.fn()
      const onDayAdvance = vi.fn()

      const changes = [createMockChange()]

      const { result } = renderHook(() =>
        usePendingChanges({
          initialChanges: changes,
          progression: mockProgression,
          onProgressionUpdate,
          currentDay: 'A1',
          onDayAdvance,
          // onWorkoutComplete is optional
        })
      )

      act(() => {
        result.current.applyAllChanges()
      })

      expect(onDayAdvance).toHaveBeenCalledWith('B1')
    })
  })
})
