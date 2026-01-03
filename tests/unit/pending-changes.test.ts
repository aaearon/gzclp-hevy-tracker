/**
 * Tests for Pending Change Application
 *
 * Tests for applying, rejecting, and modifying pending changes.
 * [US3] User Story 3 - Review and Confirm Progression Changes
 */

import { describe, it, expect } from 'vitest'
import {
  applyPendingChange,
  applyAllPendingChanges,
  modifyPendingChangeWeight,
} from '@/lib/apply-changes'
import type { PendingChange, ProgressionState } from '@/types/state'

describe('[US3] Pending Changes Application', () => {
  const mockProgression: Record<string, ProgressionState> = {
    'ex-squat': {
      exerciseId: 'ex-squat',
      currentWeight: 100,
      stage: 0,
      baseWeight: 100,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 5,
    },
    'ex-bench': {
      exerciseId: 'ex-bench',
      currentWeight: 60,
      stage: 0,
      baseWeight: 60,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
  }

  const mockProgressChange: PendingChange = {
    id: 'change-1',
    exerciseId: 'ex-squat',
    exerciseName: 'Squat',
    tier: 'T1',
    type: 'progress',
    currentWeight: 100,
    currentStage: 0,
    newWeight: 105,
    newStage: 0,
    newScheme: '5x3+',
    reason: 'Completed 5x3+ at 100kg. Adding 5kg.',
    workoutId: 'workout-1',
    workoutDate: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T12:00:00Z',
  }

  const mockStageChange: PendingChange = {
    id: 'change-2',
    exerciseId: 'ex-squat',
    exerciseName: 'Squat',
    tier: 'T1',
    type: 'stage_change',
    currentWeight: 100,
    currentStage: 0,
    newWeight: 100,
    newStage: 1,
    newScheme: '6x2+',
    reason: 'Failed to complete 5x3+ at 100kg. Moving to 6x2+.',
    workoutId: 'workout-2',
    workoutDate: '2024-01-16T10:00:00Z',
    createdAt: '2024-01-16T12:00:00Z',
  }

  const mockDeloadChange: PendingChange = {
    id: 'change-3',
    exerciseId: 'ex-squat',
    exerciseName: 'Squat',
    tier: 'T1',
    type: 'deload',
    currentWeight: 100,
    currentStage: 2,
    newWeight: 85,
    newStage: 0,
    newScheme: '5x3+',
    reason: 'Failed 10x1+ at 100kg. Deloading to 85kg and restarting at 5x3+.',
    workoutId: 'workout-3',
    workoutDate: '2024-01-17T10:00:00Z',
    createdAt: '2024-01-17T12:00:00Z',
  }

  describe('applyPendingChange', () => {
    it('should apply weight progression change', () => {
      const updated = applyPendingChange(mockProgression, mockProgressChange)

      expect(updated['ex-squat'].currentWeight).toBe(105)
      expect(updated['ex-squat'].stage).toBe(0)
      expect(updated['ex-squat'].lastWorkoutId).toBe('workout-1')
      expect(updated['ex-squat'].lastWorkoutDate).toBe('2024-01-15T10:00:00Z')
    })

    it('should apply stage change', () => {
      const updated = applyPendingChange(mockProgression, mockStageChange)

      expect(updated['ex-squat'].currentWeight).toBe(100)
      expect(updated['ex-squat'].stage).toBe(1)
    })

    it('should apply deload and reset stage to 0', () => {
      const progressionAtStage2 = {
        ...mockProgression,
        'ex-squat': {
          ...mockProgression['ex-squat'],
          stage: 2 as const,
        },
      }

      const updated = applyPendingChange(progressionAtStage2, mockDeloadChange)

      expect(updated['ex-squat'].currentWeight).toBe(85)
      expect(updated['ex-squat'].stage).toBe(0)
      expect(updated['ex-squat'].baseWeight).toBe(85) // baseWeight updated on deload
    })

    it('should not modify other exercises', () => {
      const updated = applyPendingChange(mockProgression, mockProgressChange)

      expect(updated['ex-bench'].currentWeight).toBe(60)
      expect(updated['ex-bench'].stage).toBe(0)
    })

    it('should return original progression if exercise not found', () => {
      const unknownChange: PendingChange = {
        ...mockProgressChange,
        exerciseId: 'unknown-exercise',
      }

      const updated = applyPendingChange(mockProgression, unknownChange)

      expect(updated).toEqual(mockProgression)
    })
  })

  describe('applyAllPendingChanges', () => {
    it('should apply multiple changes in order', () => {
      const changes: PendingChange[] = [
        mockProgressChange,
        {
          ...mockProgressChange,
          id: 'change-bench',
          exerciseId: 'ex-bench',
          exerciseName: 'Bench Press',
          currentWeight: 60,
          newWeight: 62.5,
        },
      ]

      const updated = applyAllPendingChanges(mockProgression, changes)

      expect(updated['ex-squat'].currentWeight).toBe(105)
      expect(updated['ex-bench'].currentWeight).toBe(62.5)
    })

    it('should handle empty changes array', () => {
      const updated = applyAllPendingChanges(mockProgression, [])

      expect(updated).toEqual(mockProgression)
    })

    it('should apply changes sequentially for same exercise', () => {
      // Simulate two workouts for the same exercise
      const change1: PendingChange = {
        ...mockProgressChange,
        newWeight: 105,
      }

      const change2: PendingChange = {
        ...mockProgressChange,
        id: 'change-1b',
        currentWeight: 105,
        newWeight: 110,
        workoutId: 'workout-2',
        workoutDate: '2024-01-16T10:00:00Z',
      }

      const updated = applyAllPendingChanges(mockProgression, [change1, change2])

      expect(updated['ex-squat'].currentWeight).toBe(110)
      expect(updated['ex-squat'].lastWorkoutId).toBe('workout-2')
    })
  })

  describe('modifyPendingChangeWeight', () => {
    it('should create a new change with modified weight', () => {
      const modified = modifyPendingChangeWeight(mockProgressChange, 102.5)

      expect(modified.id).toBe(mockProgressChange.id)
      expect(modified.newWeight).toBe(102.5)
      expect(modified.currentWeight).toBe(mockProgressChange.currentWeight)
    })

    it('should update reason to reflect manual modification', () => {
      const modified = modifyPendingChangeWeight(mockProgressChange, 102.5)

      expect(modified.reason).toContain('Modified')
      expect(modified.reason).toContain('102.5')
    })

    it('should preserve other properties', () => {
      const modified = modifyPendingChangeWeight(mockProgressChange, 102.5)

      expect(modified.exerciseId).toBe(mockProgressChange.exerciseId)
      expect(modified.exerciseName).toBe(mockProgressChange.exerciseName)
      expect(modified.tier).toBe(mockProgressChange.tier)
      expect(modified.type).toBe(mockProgressChange.type)
      expect(modified.workoutId).toBe(mockProgressChange.workoutId)
    })
  })
})
