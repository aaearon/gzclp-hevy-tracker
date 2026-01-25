/**
 * Unit Tests: T3 Progression Logic
 *
 * Tests for T3 (accessory) progression rules:
 * - 3x15+ sets (AMRAP on final set)
 * - Success: AMRAP (last) set >= 25 reps -> add weight
 * - Failure: AMRAP set < 25 reps -> repeat same weight
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
    amrapRecord: 0,
  }

  describe('Success Detection (AMRAP-based)', () => {
    it('should detect success when AMRAP set >= 25', () => {
      expect(isT3Success([15, 15, 25])).toBe(true) // AMRAP = 25
      expect(isT3Success([10, 10, 30])).toBe(true) // AMRAP = 30
      expect(isT3Success([8, 8, 26])).toBe(true) // AMRAP = 26
    })

    it('should detect failure when AMRAP set < 25', () => {
      expect(isT3Success([15, 15, 24])).toBe(false) // AMRAP = 24
      expect(isT3Success([20, 20, 20])).toBe(false) // AMRAP = 20 (60 total but AMRAP fails)
      expect(isT3Success([15, 10, 5])).toBe(false) // AMRAP = 5 (30 total but AMRAP fails)
    })

    it('should handle exactly 25 reps on AMRAP as success', () => {
      expect(isT3Success([15, 15, 25])).toBe(true) // Exactly 25 on AMRAP
    })

    it('should check only the last set regardless of earlier sets', () => {
      // High earlier sets don't matter - only AMRAP counts
      expect(isT3Success([30, 30, 10])).toBe(false) // 70 total but AMRAP = 10
      expect(isT3Success([5, 5, 25])).toBe(true) // Only 35 total but AMRAP = 25
    })

    it('should handle more than 3 sets (use last as AMRAP)', () => {
      expect(isT3Success([15, 15, 15, 25])).toBe(true) // AMRAP (4th set) = 25
      expect(isT3Success([15, 15, 25, 10])).toBe(false) // AMRAP (4th set) = 10
    })

    it('should handle fewer than 3 sets', () => {
      expect(isT3Success([15, 25])).toBe(true) // AMRAP (2nd set) = 25
      expect(isT3Success([30])).toBe(true) // Single set AMRAP = 30
      expect(isT3Success([20])).toBe(false) // Single set AMRAP = 20
    })
  })

  describe('Success Progression', () => {
    it('should add weight when AMRAP set >= 25 (upper body)', () => {
      const result = calculateT3Progression(
        baseProgression,
        [15, 15, 27], // AMRAP = 27
        'upper',
        'kg'
      )

      expect(result.newWeight).toBe(22.5) // +2.5kg for upper
      expect(result.newStage).toBe(0) // T3 always stays at stage 0
      expect(result.type).toBe('progress')
      expect(result.success).toBe(true)
    })

    it('should add weight for lower body exercises', () => {
      const result = calculateT3Progression(
        baseProgression,
        [15, 15, 25], // AMRAP = 25
        'lower',
        'kg'
      )

      expect(result.newWeight).toBe(25) // +5kg for lower
    })

    it('should add weight correctly for lbs user (increment converted to kg)', () => {
      // User prefers lbs, stored as kg internally (25 lbs ≈ 11.3 kg)
      const weightKg = 11.3
      const result = calculateT3Progression(
        { ...baseProgression, currentWeight: weightKg },
        [15, 15, 26],
        'upper',
        'lbs'
      )

      // Upper body lbs increment: 5 lbs ≈ 2.27 kg
      // 11.3 + 2.27 ≈ 13.6 kg
      expect(result.newWeight).toBeCloseTo(13.6, 1)
    })

    it('should include AMRAP reps in reason message', () => {
      const result = calculateT3Progression(
        baseProgression,
        [15, 15, 28],
        'upper',
        'kg'
      )

      expect(result.reason).toContain('28')
      expect(result.reason).toContain('AMRAP')
    })
  })

  describe('Repeat on Failure', () => {
    it('should repeat same weight when AMRAP set < 25', () => {
      const result = calculateT3Progression(
        baseProgression,
        [15, 15, 24], // AMRAP = 24, just under threshold
        'upper',
        'kg'
      )

      expect(result.newWeight).toBe(20) // Weight unchanged
      expect(result.newStage).toBe(0)
      expect(result.type).toBe('repeat')
      expect(result.success).toBe(false)
    })

    it('should repeat even with high total reps if AMRAP is low', () => {
      const result = calculateT3Progression(
        baseProgression,
        [30, 30, 15], // 75 total but AMRAP = 15
        'upper',
        'kg'
      )

      expect(result.type).toBe('repeat')
      expect(result.newWeight).toBe(20)
    })

    it('should provide helpful reason for repeat', () => {
      const result = calculateT3Progression(
        baseProgression,
        [15, 15, 20], // AMRAP = 20
        'upper',
        'kg'
      )

      expect(result.reason).toContain('20')
      expect(result.reason).toContain('25')
      expect(result.reason).toContain('AMRAP')
    })
  })

  describe('No Deload for T3', () => {
    it('should never deload T3 exercises', () => {
      // Even with very low AMRAP, T3 just repeats
      const result = calculateT3Progression(
        baseProgression,
        [5, 5, 5], // AMRAP = 5, very low
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
      expect(isT3Success([])).toBe(false)
    })

    it('should handle zero reps on AMRAP set', () => {
      const result = calculateT3Progression(
        baseProgression,
        [15, 15, 0], // AMRAP = 0 (failed set)
        'upper',
        'kg'
      )

      expect(result.type).toBe('repeat')
    })

    it('should track AMRAP reps in result', () => {
      const result = calculateT3Progression(
        baseProgression,
        [15, 15, 28],
        'upper',
        'kg'
      )

      expect(result.amrapReps).toBe(28)
    })
  })
})
