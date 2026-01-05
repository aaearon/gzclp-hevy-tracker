/**
 * Unit Tests: T3 Progression Logic
 *
 * Tests for T3 (accessory) progression rules:
 * - 3x15+ sets (AMRAP on each set)
 * - Success: Total reps across all sets >= 25 -> add weight
 * - Failure: Total reps < 25 -> repeat same weight
 *
 * [US2] User Story 2 - Sync Workouts and Calculate Progression
 */

import { describe, it, expect } from 'vitest'
import {
  calculateT3Progression,
  isT3Success,
} from '@/lib/progression'
import type { ProgressionState } from '@/types/state'

describe('[US2] T3 Progression Logic', () => {
  const baseProgression: ProgressionState = {
    exerciseId: 'test-exercise',
    currentWeight: 20,
    stage: 0, // T3 only has stage 0
    baseWeight: 20,
    lastWorkoutId: null,
    lastWorkoutDate: null,
    amrapRecord: 0,
  }

  describe('Success Detection', () => {
    it('should detect success when total reps >= 25', () => {
      expect(isT3Success([15, 10, 5])).toBe(true) // 30 total
      expect(isT3Success([10, 10, 5])).toBe(true) // 25 total
      expect(isT3Success([8, 8, 9])).toBe(true) // 25 total
    })

    it('should detect failure when total reps < 25', () => {
      expect(isT3Success([10, 8, 6])).toBe(false) // 24 total
      expect(isT3Success([8, 8, 8])).toBe(false) // 24 total
      expect(isT3Success([5, 5, 5])).toBe(false) // 15 total
    })

    it('should handle exactly 25 reps as success', () => {
      expect(isT3Success([9, 8, 8])).toBe(true) // Exactly 25
    })

    it('should handle more than 3 sets (sum all)', () => {
      expect(isT3Success([8, 8, 8, 5])).toBe(true) // 29 total
    })

    it('should handle fewer than 3 sets', () => {
      expect(isT3Success([15, 10])).toBe(true) // 25 total with only 2 sets
      expect(isT3Success([10, 10])).toBe(false) // 20 total
    })
  })

  describe('Success Progression', () => {
    it('should add weight when total reps >= 25 (upper body)', () => {
      const result = calculateT3Progression(
        baseProgression,
        [15, 12, 10], // 37 total
        'upper',
        'kg'
      )

      expect(result.newWeight).toBe(22.5) // +2.5kg for upper
      expect(result.newStage).toBe(0) // T3 always stays at stage 0
      expect(result.type).toBe('progress')
    })

    it('should add weight for lower body exercises', () => {
      const result = calculateT3Progression(
        baseProgression,
        [15, 10, 8], // 33 total
        'lower',
        'kg'
      )

      expect(result.newWeight).toBe(25) // +5kg for lower
    })

    it('should add weight in lbs correctly', () => {
      const result = calculateT3Progression(
        { ...baseProgression, currentWeight: 25 },
        [15, 10, 5],
        'upper',
        'lbs'
      )

      expect(result.newWeight).toBe(30) // +5lbs for upper
    })
  })

  describe('Repeat on Failure', () => {
    it('should repeat same weight when total reps < 25', () => {
      const result = calculateT3Progression(
        baseProgression,
        [10, 8, 6], // 24 total, just under threshold
        'upper',
        'kg'
      )

      expect(result.newWeight).toBe(20) // Weight unchanged
      expect(result.newStage).toBe(0)
      expect(result.type).toBe('repeat')
    })

    it('should provide helpful reason for repeat', () => {
      const result = calculateT3Progression(
        baseProgression,
        [8, 8, 8], // 24 total
        'upper',
        'kg'
      )

      expect(result.reason).toContain('24')
      expect(result.reason).toContain('25')
    })
  })

  describe('No Deload for T3', () => {
    it('should never deload T3 exercises', () => {
      // Even with very low reps, T3 just repeats
      const result = calculateT3Progression(
        baseProgression,
        [5, 5, 5], // 15 total, very low
        'upper',
        'kg'
      )

      expect(result.type).toBe('repeat')
      expect(result.newWeight).toBe(20) // No deload
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty rep array', () => {
      const result = calculateT3Progression(
        baseProgression,
        [],
        'upper',
        'kg'
      )

      expect(result.type).toBe('repeat')
    })

    it('should handle zero reps in sets', () => {
      const result = calculateT3Progression(
        baseProgression,
        [15, 0, 10], // 25 total despite zero set
        'upper',
        'kg'
      )

      expect(result.type).toBe('progress')
    })
  })
})
