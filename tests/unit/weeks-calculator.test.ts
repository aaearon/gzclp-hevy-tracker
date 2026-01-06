/**
 * Weeks Calculator Tests
 *
 * Tests for calculating "weeks on program" from Hevy workout history.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  countMatchingWorkouts,
  calculateCreatedAtFromWorkouts,
  getMatchingWorkouts,
  getMostRecentWorkoutDate,
} from '@/lib/weeks-calculator'
import {
  createMockWorkout,
  createMockWorkoutsForRoutine,
  createMockProgramWorkouts,
} from '../helpers/workout-mocks'
import {
  createFullAssignment,
  createPartialAssignment,
  createEmptyAssignment,
} from '../helpers/routine-mocks'

// =============================================================================
// countMatchingWorkouts Tests
// =============================================================================

describe('countMatchingWorkouts', () => {
  const routineIds = createFullAssignment({
    A1: 'routine-a1',
    B1: 'routine-b1',
    A2: 'routine-a2',
    B2: 'routine-b2',
  })

  it('returns 0 for empty workouts or no matches', () => {
    expect(countMatchingWorkouts([], routineIds)).toBe(0)

    const nonMatching = [
      createMockWorkout('unrelated-1'),
      createMockWorkout('unrelated-2'),
    ]
    expect(countMatchingWorkouts(nonMatching, routineIds)).toBe(0)
  })

  it('counts workouts matching any assigned routine', () => {
    const workouts = [
      createMockWorkout('routine-a1'),
      createMockWorkout('routine-b1'),
      createMockWorkout('routine-a2'),
      createMockWorkout('routine-b2'),
      createMockWorkout('unrelated'),
    ]
    expect(countMatchingWorkouts(workouts, routineIds)).toBe(4)
  })

  it('handles partial assignments (null routine IDs)', () => {
    const partial = createPartialAssignment({ A1: 'routine-a1', B1: 'routine-b1' })
    const workouts = [
      createMockWorkout('routine-a1'),
      createMockWorkout('routine-b1'),
      createMockWorkout('routine-a2'), // Won't match - null in assignment
    ]
    expect(countMatchingWorkouts(workouts, partial)).toBe(2)
  })

  it('handles empty assignment', () => {
    const empty = createEmptyAssignment()
    const workouts = createMockWorkoutsForRoutine(5, 'some-routine')
    expect(countMatchingWorkouts(workouts, empty)).toBe(0)
  })
})

// =============================================================================
// calculateCreatedAtFromWorkouts Tests
// =============================================================================

describe('calculateCreatedAtFromWorkouts', () => {
  const routineIds = createFullAssignment({
    A1: 'routine-a1',
    B1: 'routine-b1',
    A2: 'routine-a2',
    B2: 'routine-b2',
  })

  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-03-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    [0, 0],   // 0 workouts = 0 weeks
    [1, 0],   // 1 workout = 0 weeks
    [2, 0],   // 2 workouts = 0 weeks
    [3, 1],   // 3 workouts = 1 week
    [5, 1],   // 5 workouts = 1 week (floors)
    [6, 2],   // 6 workouts = 2 weeks
    [12, 4],  // 12 workouts = 4 weeks
    [36, 12], // 36 workouts = 12 weeks (full program)
  ])('calculates %d workouts as %d weeks', (workoutCount, expectedWeeks) => {
    const workouts = createMockWorkoutsForRoutine(workoutCount, 'routine-a1')
    const result = calculateCreatedAtFromWorkouts(workouts, routineIds)
    expect(result.matchingWorkoutCount).toBe(workoutCount)
    expect(result.calculatedWeeks).toBe(expectedWeeks)
  })

  it('calculates correct createdAt timestamp based on weeks', () => {
    const workouts = createMockWorkoutsForRoutine(6, 'routine-a1') // 2 weeks
    const result = calculateCreatedAtFromWorkouts(workouts, routineIds)

    expect(result.calculatedWeeks).toBe(2)
    const expectedCreatedAt = new Date(Date.now() - 2 * MS_PER_WEEK).toISOString()
    expect(result.calculatedCreatedAt).toBe(expectedCreatedAt)
  })

  it('accepts injectable now parameter for testing', () => {
    const customNow = new Date('2025-01-01T00:00:00Z')
    const workouts = createMockWorkoutsForRoutine(6, 'routine-a1')
    const result = calculateCreatedAtFromWorkouts(workouts, routineIds, customNow)

    expect(result.calculatedWeeks).toBe(2)
    const expectedCreatedAt = new Date(customNow.getTime() - 2 * MS_PER_WEEK).toISOString()
    expect(result.calculatedCreatedAt).toBe(expectedCreatedAt)
  })

  it('should ignore non-matching workouts in calculation', () => {
    // 6 matching workouts = 2 weeks
    const workouts = [
      ...createMockWorkoutsForRoutine(2, 'routine-a1'),
      ...createMockWorkoutsForRoutine(2, 'routine-b1'),
      ...createMockWorkoutsForRoutine(2, 'routine-a2'),
      // Add 10 non-matching workouts
      ...createMockWorkoutsForRoutine(10, 'unrelated-routine'),
    ]

    const result = calculateCreatedAtFromWorkouts(workouts, routineIds)

    expect(result.matchingWorkoutCount).toBe(6) // Only the 6 matching
    expect(result.calculatedWeeks).toBe(2)
  })

  describe('workoutsPerWeek configuration', () => {
    it.each([
      [8, 4, 2],  // 8 workouts at 4/week = 2 weeks
      [6, 2, 3],  // 6 workouts at 2/week = 3 weeks
      [9, 3, 3],  // 9 workouts at default 3/week = 3 weeks
    ])('calculates %d workouts at %d/week as %d weeks', (count, perWeek, weeks) => {
      const workouts = createMockWorkoutsForRoutine(count, 'routine-a1')
      const result = calculateCreatedAtFromWorkouts(workouts, routineIds, { workoutsPerWeek: perWeek })
      expect(result.calculatedWeeks).toBe(weeks)
    })
  })

  describe('mostRecentWorkoutDate', () => {
    it('returns null for empty workouts', () => {
      const result = calculateCreatedAtFromWorkouts([], routineIds)
      expect(result.mostRecentWorkoutDate).toBeNull()
    })

    it('returns most recent matching workout date', () => {
      const workouts = [
        createMockWorkout('routine-a1', { date: '2024-03-05T10:00:00.000Z' }),
        createMockWorkout('unrelated-routine', { date: '2024-03-15T10:00:00.000Z' }), // Non-matching
        createMockWorkout('routine-b1', { date: '2024-03-12T15:00:00.000Z' }), // Most recent matching
        createMockWorkout('routine-a2', { date: '2024-03-08T09:00:00.000Z' }),
      ]

      const result = calculateCreatedAtFromWorkouts(workouts, routineIds)
      expect(result.mostRecentWorkoutDate).toBe('2024-03-12T15:00:00.000Z')
    })
  })
})

// =============================================================================
// getMatchingWorkouts Tests
// =============================================================================

describe('getMatchingWorkouts', () => {
  const routineIds = createFullAssignment({
    A1: 'routine-a1',
    B1: 'routine-b1',
    A2: 'routine-a2',
    B2: 'routine-b2',
  })

  it('should return empty array for no workouts', () => {
    const result = getMatchingWorkouts([], routineIds)
    expect(result).toEqual([])
  })

  it('should return only matching workouts', () => {
    const matching = createMockWorkout('routine-a1', { id: 'matching' })
    const nonMatching = createMockWorkout('unrelated', { id: 'non-matching' })

    const result = getMatchingWorkouts([matching, nonMatching], routineIds)

    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('matching')
  })
})

// =============================================================================
// getMostRecentWorkoutDate Tests
// =============================================================================

describe('getMostRecentWorkoutDate', () => {
  it('should return null for empty array', () => {
    expect(getMostRecentWorkoutDate([])).toBeNull()
  })

  it('should return the date for single workout', () => {
    const workouts = [
      createMockWorkout('routine-a1', { date: '2024-03-10T14:00:00.000Z' }),
    ]
    expect(getMostRecentWorkoutDate(workouts)).toBe('2024-03-10T14:00:00.000Z')
  })

  it('should return the most recent date from multiple workouts', () => {
    const workouts = [
      createMockWorkout('routine-a1', { date: '2024-03-05T10:00:00.000Z' }),
      createMockWorkout('routine-b1', { date: '2024-03-12T15:00:00.000Z' }), // Most recent
      createMockWorkout('routine-a2', { date: '2024-03-08T09:00:00.000Z' }),
    ]
    expect(getMostRecentWorkoutDate(workouts)).toBe('2024-03-12T15:00:00.000Z')
  })
})
