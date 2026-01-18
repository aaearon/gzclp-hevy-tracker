/**
 * Unit Tests: T2 Progression Logic
 *
 * Tests for T2 (secondary lifts) progression rules:
 * - Stage 0: 3x10 - success adds weight, failure moves to stage 1
 * - Stage 1: 3x8 - success adds weight, failure moves to stage 2
 * - Stage 2: 3x6 - success adds weight, failure triggers deload
 *
 * [US2] User Story 2 - Sync Workouts and Calculate Progression
 */

import { describe, it, expect } from 'vitest'
import {
  calculateT2Progression,
  isT2Success,
} from '@/lib/progression'
import type { ProgressionState } from '@/types/state'

describe('[US2] T2 Progression Logic', () => {
  const baseProgression: ProgressionState = {
    exerciseId: 'test-exercise',
    currentWeight: 60,
    stage: 0,
    baseWeight: 60,
    amrapRecord: 0,
  }

  describe('Success Detection', () => {
    it('should detect success at stage 0 (3x10) when all sets hit 10 reps', () => {
      expect(isT2Success([10, 10, 10], 0)).toBe(true)
    })

    it('should detect success at stage 1 (3x8) when all sets hit 8 reps', () => {
      expect(isT2Success([8, 8, 8], 1)).toBe(true)
    })

    it('should detect success at stage 2 (3x6) when all sets hit 6 reps', () => {
      expect(isT2Success([6, 6, 6], 2)).toBe(true)
    })

    it('should allow exceeding target reps', () => {
      expect(isT2Success([12, 11, 10], 0)).toBe(true)
    })

    it('should detect failure when any set misses target', () => {
      expect(isT2Success([10, 9, 10], 0)).toBe(false) // Second set failed
    })

    it('should require exactly 3 sets', () => {
      expect(isT2Success([10, 10], 0)).toBe(false) // Only 2 sets
    })

    it('should use only first 3 sets for evaluation', () => {
      expect(isT2Success([10, 10, 10, 5], 0)).toBe(true) // Extra set ignored
    })
  })

  describe('Success Progression', () => {
    it('should add weight on success at stage 0', () => {
      const result = calculateT2Progression(
        { ...baseProgression, stage: 0 },
        [10, 10, 10],
        'upper',
        'kg'
      )

      expect(result.newWeight).toBe(62.5) // +2.5kg for upper body
      expect(result.newStage).toBe(0)
      expect(result.type).toBe('progress')
    })

    it('should add more weight for lower body', () => {
      const result = calculateT2Progression(
        { ...baseProgression, stage: 0 },
        [10, 10, 10],
        'lower',
        'kg'
      )

      expect(result.newWeight).toBe(65) // +5kg for lower body
    })

    it('should add weight correctly for lbs user (increment converted to kg)', () => {
      // User prefers lbs, stored as kg internally (135 lbs ≈ 61.2 kg)
      const weightKg = 61.2
      const result = calculateT2Progression(
        { ...baseProgression, stage: 0, currentWeight: weightKg },
        [10, 10, 10],
        'upper',
        'lbs'
      )

      // Upper body lbs increment: 5 lbs ≈ 2.27 kg
      // 61.2 + 2.27 ≈ 63.5 kg
      expect(result.newWeight).toBeCloseTo(63.5, 1)
    })
  })

  describe('Stage Transitions', () => {
    it('should move to stage 1 (3x8) on failure at stage 0', () => {
      const result = calculateT2Progression(
        { ...baseProgression, stage: 0 },
        [10, 9, 8], // Failed to hit 10 on all sets
        'upper',
        'kg'
      )

      expect(result.newWeight).toBe(60) // Weight unchanged
      expect(result.newStage).toBe(1)
      expect(result.type).toBe('stage_change')
      expect(result.newScheme).toBe('3x8')
    })

    it('should move to stage 2 (3x6) on failure at stage 1', () => {
      const result = calculateT2Progression(
        { ...baseProgression, stage: 1 },
        [8, 7, 6], // Failed to hit 8 on all sets
        'upper',
        'kg'
      )

      expect(result.newWeight).toBe(60)
      expect(result.newStage).toBe(2)
      expect(result.type).toBe('stage_change')
      expect(result.newScheme).toBe('3x6')
    })
  })

  describe('Deload on Stage 2 Failure', () => {
    it('should deload to 85% and reset to stage 0 on failure at stage 2', () => {
      const result = calculateT2Progression(
        { ...baseProgression, stage: 2 },
        [6, 5, 4], // Failed to hit 6 on all sets
        'upper',
        'kg'
      )

      expect(result.newWeight).toBe(50) // 85% of 60 = 51, rounds to 50 (nearest 2.5)
      expect(result.newStage).toBe(0)
      expect(result.type).toBe('deload')
      expect(result.newScheme).toBe('3x10')
    })

    it('should round deload weight to nearest 2.5kg', () => {
      const result = calculateT2Progression(
        { ...baseProgression, stage: 2, currentWeight: 67.5 },
        [6, 5, 4],
        'upper',
        'kg'
      )

      // 85% of 67.5 = 57.375, rounds to 57.5
      expect(result.newWeight).toBe(57.5)
    })
  })
})
