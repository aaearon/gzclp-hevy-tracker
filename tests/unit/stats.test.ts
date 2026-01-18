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
  it('should return 0 for empty progression and no stored total', () => {
    const result = calculateTotalWorkouts({})
    expect(result).toBe(0)
  })

  it('should return stored total when provided', () => {
    const result = calculateTotalWorkouts({}, 15)
    expect(result).toBe(15)
  })

  it('should return 0 when stored total is 0', () => {
    const result = calculateTotalWorkouts({}, 0)
    expect(result).toBe(0)
  })

  it('should return 0 when stored total is undefined', () => {
    const result = calculateTotalWorkouts({})
    expect(result).toBe(0)
  })

  it('should ignore progression data (uses stored total only)', () => {
    // The progression parameter is kept for backwards compatibility but not used
    const result = calculateTotalWorkouts({}, 42)
    expect(result).toBe(42)
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

  it('should return null for empty progression and no stored date', () => {
    const result = calculateDaysSinceLastWorkout({})
    expect(result).toBeNull()
  })

  it('should return null when stored date is null', () => {
    const result = calculateDaysSinceLastWorkout({}, null)
    expect(result).toBeNull()
  })

  it('should return 0 for workout done today', () => {
    const result = calculateDaysSinceLastWorkout({}, '2024-03-15T10:00:00Z')
    expect(result).toBe(0)
  })

  it('should return 1 for workout done yesterday', () => {
    const result = calculateDaysSinceLastWorkout({}, '2024-03-14T12:00:00Z')
    expect(result).toBe(1)
  })

  it('should return 7 for workout done a week ago', () => {
    const result = calculateDaysSinceLastWorkout({}, '2024-03-08T12:00:00Z')
    expect(result).toBe(7)
  })

  describe('stored date value', () => {
    it('should use stored date when provided', () => {
      const result = calculateDaysSinceLastWorkout({}, '2024-03-14T12:00:00Z')
      expect(result).toBe(1) // 1 day before 2024-03-15
    })

    it('should return null when stored date is null', () => {
      const result = calculateDaysSinceLastWorkout({}, null)
      expect(result).toBeNull()
    })

    it('should return null when stored date is undefined', () => {
      const result = calculateDaysSinceLastWorkout({})
      expect(result).toBeNull()
    })
  })
})
