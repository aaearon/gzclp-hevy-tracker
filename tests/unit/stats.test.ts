/**
 * Unit Tests: Stats Utilities
 *
 * Tests for dashboard quick stats calculations.
 * [REQ-DASH-003] Quick stats dashboard display
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateWeeksOnProgram,
  calculateCurrentWeek,
  calculateDayOfWeek,
  calculateTotalWorkouts,
  calculateDaysSinceLastWorkout,
} from '@/utils/stats'
import type { ProgressionState } from '@/types/state'

describe('calculateWeeksOnProgram', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-03-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    ['today', '2024-03-15T10:00:00Z', 0],
    ['7 days ago', '2024-03-08T12:00:00Z', 1],
    ['14 days ago', '2024-03-01T12:00:00Z', 2],
    ['10 days ago (floors partial)', '2024-03-05T12:00:00Z', 1],
    ['52 weeks ago', '2023-03-15T12:00:00Z', 52],
  ])('calculates weeks for program created %s', (_, createdAt, expected) => {
    expect(calculateWeeksOnProgram(createdAt)).toBe(expected)
  })
})

describe('calculateCurrentWeek', () => {
  it.each([
    [0, 3, 1],  // 0 workouts at 3/week = week 1
    [1, 3, 1],  // 1 workout at 3/week = week 1
    [2, 3, 1],  // 2 workouts at 3/week = week 1
    [3, 3, 2],  // 3 workouts at 3/week = week 2
    [5, 3, 2],  // 5 workouts at 3/week = week 2
    [6, 3, 3],  // 6 workouts at 3/week = week 3
    [0, 4, 1],  // 0 workouts at 4/week = week 1
    [4, 4, 2],  // 4 workouts at 4/week = week 2
    [8, 4, 3],  // 8 workouts at 4/week = week 3
  ])('returns correct week for %d workouts at %d/week', (workouts, perWeek, expected) => {
    expect(calculateCurrentWeek(workouts, perWeek)).toBe(expected)
  })
})

describe('calculateDayOfWeek', () => {
  it.each([
    [0, 3, 0],  // 0 workouts at 3/week = 0 complete this week
    [1, 3, 1],  // 1 workout at 3/week = 1 complete this week
    [2, 3, 2],  // 2 workouts at 3/week = 2 complete this week
    [3, 3, 0],  // 3 workouts at 3/week = new week, 0 complete
    [5, 3, 2],  // 5 workouts at 3/week = 2 complete this week
    [6, 3, 0],  // 6 workouts at 3/week = new week, 0 complete
    [0, 4, 0],  // 0 workouts at 4/week = 0 complete this week
    [4, 4, 0],  // 4 workouts at 4/week = new week, 0 complete
    [7, 4, 3],  // 7 workouts at 4/week = 3 complete this week
  ])('returns %d completed for %d workouts at %d/week', (workouts, perWeek, expected) => {
    const result = calculateDayOfWeek(workouts, perWeek)
    expect(result.completed).toBe(expected)
    expect(result.total).toBe(perWeek)
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

  describe('stored total value', () => {
    it('should use stored total when provided and > 0', () => {
      const progression: Record<string, ProgressionState> = {}
      const result = calculateTotalWorkouts(progression, 15)
      expect(result).toBe(15)
    })

    it('should fall back to progression when stored total is 0', () => {
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
      }
      const result = calculateTotalWorkouts(progression, 0)
      expect(result).toBe(1) // Falls back to counting progression
    })

    it('should fall back to progression when stored total is undefined', () => {
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

  describe('stored date value', () => {
    it('should use stored date when provided', () => {
      const progression: Record<string, ProgressionState> = {}
      const result = calculateDaysSinceLastWorkout(progression, '2024-03-14T12:00:00Z')
      expect(result).toBe(1) // 1 day before 2024-03-15
    })

    it('should fall back to progression when stored date is null', () => {
      const progression: Record<string, ProgressionState> = {
        'ex1': {
          exerciseId: 'ex1',
          currentWeight: 60,
          stage: 0,
          baseWeight: 60,
          lastWorkoutId: 'workout-1',
          lastWorkoutDate: '2024-03-13T12:00:00Z', // 2 days ago
          amrapRecord: 5,
        },
      }
      const result = calculateDaysSinceLastWorkout(progression, null)
      expect(result).toBe(2)
    })

    it('should fall back to progression when stored date is undefined', () => {
      const progression: Record<string, ProgressionState> = {
        'ex1': {
          exerciseId: 'ex1',
          currentWeight: 60,
          stage: 0,
          baseWeight: 60,
          lastWorkoutId: 'workout-1',
          lastWorkoutDate: '2024-03-12T12:00:00Z', // 3 days ago
          amrapRecord: 5,
        },
      }
      const result = calculateDaysSinceLastWorkout(progression)
      expect(result).toBe(3)
    })

    it('should return null when stored date is null and progression is empty', () => {
      const result = calculateDaysSinceLastWorkout({}, null)
      expect(result).toBeNull()
    })
  })
})
