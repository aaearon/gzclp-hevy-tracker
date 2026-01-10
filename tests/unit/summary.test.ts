/**
 * Summary Utility Tests
 *
 * Tests for the post-workout summary builder functions.
 */

import { describe, it, expect } from 'vitest'
import {
  buildSummaryFromChanges,
  hasNewWorkoutChanges,
  getMostRecentWorkoutDate,
} from '@/utils/summary'
import type { PendingChange } from '@/types/state'

describe('buildSummaryFromChanges', () => {
  const baseChange: PendingChange = {
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
    reason: 'Completed sets',
    workoutId: 'workout-1',
    workoutDate: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T12:00:00Z',
  }

  it('builds summary with correct dayName and completedAt', () => {
    const result = buildSummaryFromChanges(
      [baseChange],
      'Day A1',
      '2024-01-15T10:30:00Z'
    )

    expect(result.dayName).toBe('Day A1')
    expect(result.completedAt).toBe('2024-01-15T10:30:00Z')
  })

  it('builds exercise results from changes', () => {
    const change: PendingChange = {
      ...baseChange,
      setsCompleted: 5,
      setsTarget: 5,
      success: true,
      amrapReps: 7,
    }

    const result = buildSummaryFromChanges([change], 'Day A1', '2024-01-15T10:00:00Z')

    expect(result.exercises).toHaveLength(1)
    expect(result.exercises[0]).toEqual({
      name: 'Squat',
      tier: 'T1',
      weight: 100,
      setsCompleted: 5,
      setsTarget: 5,
      success: true,
      amrapReps: 7,
    })
  })

  it('does not include amrapReps when undefined', () => {
    const change: PendingChange = {
      ...baseChange,
      setsCompleted: 5,
      setsTarget: 5,
    }

    const result = buildSummaryFromChanges([change], 'Day A1', '2024-01-15T10:00:00Z')

    expect(result.exercises[0]).not.toHaveProperty('amrapReps')
  })

  it('detects progressions from weight increase', () => {
    const result = buildSummaryFromChanges([baseChange], 'Day A1', '2024-01-15T10:00:00Z')

    expect(result.progressions).toHaveLength(1)
    expect(result.progressions[0]).toEqual({
      exercise: 'Squat',
      oldWeight: 100,
      newWeight: 105,
    })
  })

  it('does not add to progressions when weight stays same', () => {
    const noWeightChange: PendingChange = {
      ...baseChange,
      newWeight: 100, // Same as currentWeight
    }

    const result = buildSummaryFromChanges([noWeightChange], 'Day A1', '2024-01-15T10:00:00Z')

    expect(result.progressions).toHaveLength(0)
  })

  it('detects stage changes', () => {
    const stageChange: PendingChange = {
      ...baseChange,
      type: 'stage_change',
      currentStage: 0,
      newStage: 1,
      newWeight: 100, // Weight stays same on stage change
    }

    const result = buildSummaryFromChanges([stageChange], 'Day A1', '2024-01-15T10:00:00Z')

    expect(result.stageChanges).toHaveLength(1)
    expect(result.stageChanges[0]).toEqual({
      exercise: 'Squat',
      oldStage: 0,
      newStage: 1,
    })
  })

  it('detects deloads', () => {
    const deloadChange: PendingChange = {
      ...baseChange,
      type: 'deload',
      currentStage: 2,
      newStage: 0,
      newWeight: 85,
    }

    const result = buildSummaryFromChanges([deloadChange], 'Day A1', '2024-01-15T10:00:00Z')

    expect(result.deloads).toHaveLength(1)
    expect(result.deloads[0]).toEqual({
      exercise: 'Squat',
      newWeight: 85,
    })
  })

  it('detects new PRs', () => {
    const prChange: PendingChange = {
      ...baseChange,
      newPR: true,
      amrapReps: 10,
    }

    const result = buildSummaryFromChanges([prChange], 'Day A1', '2024-01-15T10:00:00Z')

    expect(result.newPRs).toHaveLength(1)
    expect(result.newPRs[0]).toEqual({
      exercise: 'Squat',
      reps: 10,
      weight: 100,
    })
  })

  it('does not add PR without amrapReps defined', () => {
    const prWithoutReps: PendingChange = {
      ...baseChange,
      newPR: true,
      // amrapReps not set
    }

    const result = buildSummaryFromChanges([prWithoutReps], 'Day A1', '2024-01-15T10:00:00Z')

    expect(result.newPRs).toHaveLength(0)
  })

  it('handles multiple changes', () => {
    const changes: PendingChange[] = [
      { ...baseChange, exerciseName: 'Squat', tier: 'T1' },
      {
        ...baseChange,
        id: 'change-2',
        exerciseName: 'Bench Press',
        tier: 'T2',
        type: 'stage_change',
        currentStage: 0,
        newStage: 1,
        newWeight: 60,
      },
    ]

    const result = buildSummaryFromChanges(changes, 'Day A1', '2024-01-15T10:00:00Z')

    expect(result.exercises).toHaveLength(2)
    expect(result.progressions).toHaveLength(1) // Only squat progressed
    expect(result.stageChanges).toHaveLength(1) // Bench stage change
  })

  it('handles empty changes array', () => {
    const result = buildSummaryFromChanges([], 'Day A1', '2024-01-15T10:00:00Z')

    expect(result.exercises).toHaveLength(0)
    expect(result.newPRs).toHaveLength(0)
    expect(result.progressions).toHaveLength(0)
    expect(result.stageChanges).toHaveLength(0)
    expect(result.deloads).toHaveLength(0)
  })
})

describe('hasNewWorkoutChanges', () => {
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
    reason: 'Completed',
    workoutId: 'workout-1',
    workoutDate: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T12:00:00Z',
  }

  it('returns false for empty changes', () => {
    const result = hasNewWorkoutChanges([], new Set())

    expect(result).toBe(false)
  })

  it('returns true when change is not in previousChangeIds', () => {
    const result = hasNewWorkoutChanges([mockChange], new Set())

    expect(result).toBe(true)
  })

  it('returns false when all changes are already seen', () => {
    const previousIds = new Set(['change-1'])
    const result = hasNewWorkoutChanges([mockChange], previousIds)

    expect(result).toBe(false)
  })

  it('returns true when at least one change is new', () => {
    const changes: PendingChange[] = [
      mockChange,
      { ...mockChange, id: 'change-2' },
    ]
    const previousIds = new Set(['change-1'])

    const result = hasNewWorkoutChanges(changes, previousIds)

    expect(result).toBe(true)
  })
})

describe('getMostRecentWorkoutDate', () => {
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
    reason: 'Completed',
    workoutId: 'workout-1',
    workoutDate: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T12:00:00Z',
  }

  it('returns current date for empty changes', () => {
    const before = new Date().getTime()
    const result = getMostRecentWorkoutDate([])
    const after = new Date().getTime()

    const resultTime = new Date(result).getTime()
    expect(resultTime).toBeGreaterThanOrEqual(before)
    expect(resultTime).toBeLessThanOrEqual(after)
  })

  it('returns workout date from single change', () => {
    const result = getMostRecentWorkoutDate([mockChange])

    expect(result).toBe('2024-01-15T10:00:00.000Z')
  })

  it('returns most recent date from multiple changes', () => {
    const changes: PendingChange[] = [
      { ...mockChange, workoutDate: '2024-01-10T10:00:00Z' },
      { ...mockChange, id: 'change-2', workoutDate: '2024-01-20T10:00:00Z' },
      { ...mockChange, id: 'change-3', workoutDate: '2024-01-15T10:00:00Z' },
    ]

    const result = getMostRecentWorkoutDate(changes)

    expect(result).toBe('2024-01-20T10:00:00.000Z')
  })
})
