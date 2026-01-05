/**
 * Unit Tests: T1 Progression Logic
 *
 * Tests for T1 (main lifts) progression rules:
 * - Stage 0: 5x3+ - success adds weight, failure moves to stage 1
 * - Stage 1: 6x2+ - success adds weight, failure moves to stage 2
 * - Stage 2: 10x1+ - success adds weight, failure triggers deload
 *
 * [US2] User Story 2 - Sync Workouts and Calculate Progression
 */

import { describe, it, expect } from 'vitest'
import {
  calculateT1Progression,
  isT1Success,
} from '@/lib/progression'
import type { ProgressionState } from '@/types/state'

describe('[US2] T1 Progression Logic', () => {
  const baseProgression: ProgressionState = {
    exerciseId: 'test-exercise',
    currentWeight: 100,
    stage: 0,
    baseWeight: 100,
    lastWorkoutId: null,
    lastWorkoutDate: null,
    amrapRecord: 0,
  }

  describe('Success Detection', () => {
    it('should detect success at stage 0 (5x3+) when all sets hit target', () => {
      // 5 sets of 3 or more reps
      const reps = [3, 3, 3, 3, 5] // Last set is AMRAP
      expect(isT1Success(reps, 0)).toBe(true)
    })

    it('should detect success at stage 1 (6x2+) when all sets hit target', () => {
      const reps = [2, 2, 2, 2, 2, 4]
      expect(isT1Success(reps, 1)).toBe(true)
    })

    it('should detect success at stage 2 (10x1+) when all sets hit target', () => {
      const reps = [1, 1, 1, 1, 1, 1, 1, 1, 1, 3]
      expect(isT1Success(reps, 2)).toBe(true)
    })

    it('should detect failure when any set misses target', () => {
      // At stage 0, need 3 reps per set
      const reps = [3, 3, 2, 3, 5] // Third set only got 2 reps
      expect(isT1Success(reps, 0)).toBe(false)
    })

    it('should handle fewer sets than prescribed as failure', () => {
      // Stage 0 requires 5 sets
      const reps = [3, 3, 3, 3] // Only 4 sets
      expect(isT1Success(reps, 0)).toBe(false)
    })

    it('should use only prescribed number of sets for evaluation', () => {
      // Extra sets beyond prescribed should be ignored
      const reps = [3, 3, 3, 3, 5, 3, 3] // 7 sets, only first 5 count
      expect(isT1Success(reps, 0)).toBe(true)
    })
  })

  describe('Success Progression', () => {
    it('should add weight on success at stage 0 (lower body)', () => {
      const result = calculateT1Progression(
        { ...baseProgression, stage: 0 },
        [3, 3, 3, 3, 5],
        'lower',
        'kg'
      )

      expect(result.newWeight).toBe(105) // +5kg for lower body
      expect(result.newStage).toBe(0) // Stage unchanged
      expect(result.type).toBe('progress')
    })

    it('should add weight on success at stage 0 (upper body)', () => {
      const result = calculateT1Progression(
        { ...baseProgression, stage: 0 },
        [3, 3, 3, 3, 5],
        'upper',
        'kg'
      )

      expect(result.newWeight).toBe(102.5) // +2.5kg for upper body
      expect(result.newStage).toBe(0)
      expect(result.type).toBe('progress')
    })

    it('should add weight in lbs correctly', () => {
      const result = calculateT1Progression(
        { ...baseProgression, stage: 0, currentWeight: 225 },
        [3, 3, 3, 3, 5],
        'lower',
        'lbs'
      )

      expect(result.newWeight).toBe(235) // +10lbs for lower body
    })
  })

  describe('Stage Transitions', () => {
    it('should move to stage 1 on failure at stage 0', () => {
      const result = calculateT1Progression(
        { ...baseProgression, stage: 0 },
        [3, 3, 2, 3, 3], // Failed set
        'lower',
        'kg'
      )

      expect(result.newWeight).toBe(100) // Weight unchanged
      expect(result.newStage).toBe(1) // Move to stage 1
      expect(result.type).toBe('stage_change')
    })

    it('should move to stage 2 on failure at stage 1', () => {
      const result = calculateT1Progression(
        { ...baseProgression, stage: 1 },
        [2, 2, 1, 2, 2, 2], // Failed set
        'lower',
        'kg'
      )

      expect(result.newWeight).toBe(100)
      expect(result.newStage).toBe(2)
      expect(result.type).toBe('stage_change')
    })
  })

  describe('Deload on Stage 2 Failure', () => {
    it('should deload to 85% and reset to stage 0 on failure at stage 2', () => {
      const result = calculateT1Progression(
        { ...baseProgression, stage: 2 },
        [1, 1, 1, 0, 1, 1, 1, 1, 1, 1], // Failed set at index 3
        'lower',
        'kg'
      )

      expect(result.newWeight).toBe(85) // 85% of 100kg
      expect(result.newStage).toBe(0) // Back to stage 0
      expect(result.type).toBe('deload')
    })

    it('should round deload weight to nearest 2.5kg', () => {
      const result = calculateT1Progression(
        { ...baseProgression, stage: 2, currentWeight: 97.5 },
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
        'lower',
        'kg'
      )

      // 85% of 97.5 = 82.875, rounds to 82.5
      expect(result.newWeight).toBe(82.5)
    })

    it('should round deload weight to nearest 5lbs', () => {
      const result = calculateT1Progression(
        { ...baseProgression, stage: 2, currentWeight: 225 },
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
        'lower',
        'lbs'
      )

      // 85% of 225 = 191.25, rounds to 190
      expect(result.newWeight).toBe(190)
    })

    it('should update baseWeight after deload', () => {
      const result = calculateT1Progression(
        { ...baseProgression, stage: 2 },
        [1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
        'lower',
        'kg'
      )

      expect(result.newBaseWeight).toBe(85) // New base is the deloaded weight
    })
  })

  describe('AMRAP Tracking', () => {
    it('should track AMRAP reps from last set', () => {
      const result = calculateT1Progression(
        { ...baseProgression, stage: 0, amrapRecord: 5 },
        [3, 3, 3, 3, 8], // 8 reps on AMRAP
        'lower',
        'kg'
      )

      expect(result.newAmrapRecord).toBe(8)
    })

    it('should keep existing record if new AMRAP is lower', () => {
      const result = calculateT1Progression(
        { ...baseProgression, stage: 0, amrapRecord: 10 },
        [3, 3, 3, 3, 5], // Only 5 on AMRAP
        'lower',
        'kg'
      )

      expect(result.newAmrapRecord).toBe(10)
    })
  })
})
