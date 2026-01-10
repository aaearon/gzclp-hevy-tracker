/**
 * useHistoryManager Hook Tests
 *
 * Tests for the domain-specific hook that manages progression history.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHistoryManager } from '@/hooks/useHistoryManager'
import type { UseHistoryStorageResult } from '@/hooks/useHistoryStorage'
import type { HistoryState } from '@/types/storage'
import type { ExerciseConfig, PendingChange, ExerciseHistory } from '@/types/state'

// Helper to create mock history storage
function createMockHistoryStorage(
  overrides: Partial<UseHistoryStorageResult> = {}
): UseHistoryStorageResult {
  const defaultHistory: HistoryState = {
    progressionHistory: {},
  }

  return {
    history: defaultHistory,
    setProgressionHistory: vi.fn(),
    recordHistoryEntry: vi.fn(),
    resetHistory: vi.fn(),
    importHistory: vi.fn(),
    ...overrides,
  }
}

// Mock exercises
const mockExercises: Record<string, ExerciseConfig> = {
  'exercise-1': {
    id: 'exercise-1',
    hevyTemplateId: 'hevy-1',
    name: 'Back Squat',
    role: 'squat',
  },
  'exercise-2': {
    id: 'exercise-2',
    hevyTemplateId: 'hevy-2',
    name: 'Bench Press',
    role: 'bench',
  },
}

describe('useHistoryManager', () => {
  describe('setProgressionHistory', () => {
    it('should forward to historyStorage', () => {
      const mockStorage = createMockHistoryStorage()

      const { result } = renderHook(() =>
        useHistoryManager({
          historyStorage: mockStorage,
          exercises: mockExercises,
        })
      )

      const newHistory: Record<string, ExerciseHistory> = {
        'squat-T1': {
          exerciseName: 'Back Squat',
          entries: [],
        },
      }

      act(() => {
        result.current.setProgressionHistory(newHistory)
      })

      expect(mockStorage.setProgressionHistory).toHaveBeenCalledWith(newHistory)
    })
  })

  describe('recordHistoryEntry', () => {
    it('should forward change with exercises to historyStorage', () => {
      const mockStorage = createMockHistoryStorage()

      const { result } = renderHook(() =>
        useHistoryManager({
          historyStorage: mockStorage,
          exercises: mockExercises,
        })
      )

      const change: PendingChange = {
        id: 'change-1',
        exerciseId: 'exercise-1',
        progressionKey: 'squat-T1',
        previousWeight: 100,
        newWeight: 105,
        reason: 'progression',
        timestamp: '2024-01-15T10:00:00Z',
        workoutId: 'workout-1',
        workoutDate: '2024-01-15',
      }

      act(() => {
        result.current.recordHistoryEntry(change)
      })

      expect(mockStorage.recordHistoryEntry).toHaveBeenCalledWith(
        change,
        mockExercises
      )
    })
  })
})
