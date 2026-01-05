/**
 * Unit Tests: Stats Utilities
 *
 * Tests for dashboard quick stats calculations.
 * [REQ-DASH-003] Quick stats dashboard display
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateWeeksOnProgram,
  calculateTotalWorkouts,
  calculateDaysSinceLastWorkout,
} from '@/utils/stats'
import type { ProgressionState } from '@/types/state'

describe('calculateWeeksOnProgram', () => {
  beforeEach(() => {
    // Mock current date to 2024-03-15
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-03-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return 0 for program created today', () => {
    const result = calculateWeeksOnProgram('2024-03-15T10:00:00Z')
    expect(result).toBe(0)
  })

  it('should return 1 for program created exactly 7 days ago', () => {
    const result = calculateWeeksOnProgram('2024-03-08T12:00:00Z')
    expect(result).toBe(1)
  })

  it('should return 2 for program created 14 days ago', () => {
    const result = calculateWeeksOnProgram('2024-03-01T12:00:00Z')
    expect(result).toBe(2)
  })

  it('should floor partial weeks', () => {
    // 10 days ago = 1 full week + 3 days
    const result = calculateWeeksOnProgram('2024-03-05T12:00:00Z')
    expect(result).toBe(1)
  })

  it('should handle program created in the past year', () => {
    // About 52 weeks ago
    const result = calculateWeeksOnProgram('2023-03-15T12:00:00Z')
    expect(result).toBe(52)
  })
})

describe('calculateTotalWorkouts', () => {
  it('should return 0 for empty progression', () => {
    const result = calculateTotalWorkouts({})
    expect(result).toBe(0)
  })

  it('should return 0 when no exercises have workoutIds', () => {
    const progression: Record<string, ProgressionState> = {
      'ex1': {
        exerciseId: 'ex1',
        currentWeight: 60,
        stage: 0,
        baseWeight: 60,
        lastWorkoutId: null,
        lastWorkoutDate: null,
        amrapRecord: 0,
      },
    }
    const result = calculateTotalWorkouts(progression)
    expect(result).toBe(0)
  })

  it('should count unique workout IDs', () => {
    const progression: Record<string, ProgressionState> = {
      'ex1': {
        exerciseId: 'ex1',
        currentWeight: 60,
        stage: 0,
        baseWeight: 60,
        lastWorkoutId: 'workout-1',
        lastWorkoutDate: '2024-03-15',
        amrapRecord: 5,
      },
      'ex2': {
        exerciseId: 'ex2',
        currentWeight: 40,
        stage: 0,
        baseWeight: 40,
        lastWorkoutId: 'workout-2',
        lastWorkoutDate: '2024-03-14',
        amrapRecord: 6,
      },
    }
    const result = calculateTotalWorkouts(progression)
    expect(result).toBe(2)
  })

  it('should not double-count same workout ID across exercises', () => {
    const progression: Record<string, ProgressionState> = {
      'squat-T1': {
        exerciseId: 'squat',
        currentWeight: 100,
        stage: 0,
        baseWeight: 100,
        lastWorkoutId: 'workout-1',
        lastWorkoutDate: '2024-03-15',
        amrapRecord: 5,
      },
      'squat-T2': {
        exerciseId: 'squat',
        currentWeight: 80,
        stage: 0,
        baseWeight: 80,
        lastWorkoutId: 'workout-1', // Same workout
        lastWorkoutDate: '2024-03-15',
        amrapRecord: 10,
      },
      'bench-T1': {
        exerciseId: 'bench',
        currentWeight: 60,
        stage: 0,
        baseWeight: 60,
        lastWorkoutId: 'workout-2',
        lastWorkoutDate: '2024-03-14',
        amrapRecord: 5,
      },
    }
    const result = calculateTotalWorkouts(progression)
    expect(result).toBe(2) // Only 2 unique workouts
  })
})

describe('calculateDaysSinceLastWorkout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-03-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return null for empty progression', () => {
    const result = calculateDaysSinceLastWorkout({})
    expect(result).toBeNull()
  })

  it('should return null when no exercises have workout dates', () => {
    const progression: Record<string, ProgressionState> = {
      'ex1': {
        exerciseId: 'ex1',
        currentWeight: 60,
        stage: 0,
        baseWeight: 60,
        lastWorkoutId: null,
        lastWorkoutDate: null,
        amrapRecord: 0,
      },
    }
    const result = calculateDaysSinceLastWorkout(progression)
    expect(result).toBeNull()
  })

  it('should return 0 for workout done today', () => {
    const progression: Record<string, ProgressionState> = {
      'ex1': {
        exerciseId: 'ex1',
        currentWeight: 60,
        stage: 0,
        baseWeight: 60,
        lastWorkoutId: 'workout-1',
        lastWorkoutDate: '2024-03-15T10:00:00Z',
        amrapRecord: 5,
      },
    }
    const result = calculateDaysSinceLastWorkout(progression)
    expect(result).toBe(0)
  })

  it('should return 1 for workout done yesterday', () => {
    const progression: Record<string, ProgressionState> = {
      'ex1': {
        exerciseId: 'ex1',
        currentWeight: 60,
        stage: 0,
        baseWeight: 60,
        lastWorkoutId: 'workout-1',
        lastWorkoutDate: '2024-03-14T12:00:00Z',
        amrapRecord: 5,
      },
    }
    const result = calculateDaysSinceLastWorkout(progression)
    expect(result).toBe(1)
  })

  it('should return 7 for workout done a week ago', () => {
    const progression: Record<string, ProgressionState> = {
      'ex1': {
        exerciseId: 'ex1',
        currentWeight: 60,
        stage: 0,
        baseWeight: 60,
        lastWorkoutId: 'workout-1',
        lastWorkoutDate: '2024-03-08T12:00:00Z',
        amrapRecord: 5,
      },
    }
    const result = calculateDaysSinceLastWorkout(progression)
    expect(result).toBe(7)
  })

  it('should find the most recent workout date across all exercises', () => {
    const progression: Record<string, ProgressionState> = {
      'ex1': {
        exerciseId: 'ex1',
        currentWeight: 60,
        stage: 0,
        baseWeight: 60,
        lastWorkoutId: 'workout-1',
        lastWorkoutDate: '2024-03-10T12:00:00Z', // 5 days ago
        amrapRecord: 5,
      },
      'ex2': {
        exerciseId: 'ex2',
        currentWeight: 40,
        stage: 0,
        baseWeight: 40,
        lastWorkoutId: 'workout-2',
        lastWorkoutDate: '2024-03-14T12:00:00Z', // 1 day ago (most recent)
        amrapRecord: 6,
      },
      'ex3': {
        exerciseId: 'ex3',
        currentWeight: 30,
        stage: 0,
        baseWeight: 30,
        lastWorkoutId: 'workout-3',
        lastWorkoutDate: '2024-03-01T12:00:00Z', // 14 days ago
        amrapRecord: 10,
      },
    }
    const result = calculateDaysSinceLastWorkout(progression)
    expect(result).toBe(1) // Most recent is 1 day ago
  })

  it('should handle mixed null and valid dates', () => {
    const progression: Record<string, ProgressionState> = {
      'ex1': {
        exerciseId: 'ex1',
        currentWeight: 60,
        stage: 0,
        baseWeight: 60,
        lastWorkoutId: null,
        lastWorkoutDate: null,
        amrapRecord: 0,
      },
      'ex2': {
        exerciseId: 'ex2',
        currentWeight: 40,
        stage: 0,
        baseWeight: 40,
        lastWorkoutId: 'workout-2',
        lastWorkoutDate: '2024-03-12T12:00:00Z', // 3 days ago
        amrapRecord: 6,
      },
    }
    const result = calculateDaysSinceLastWorkout(progression)
    expect(result).toBe(3)
  })
})
