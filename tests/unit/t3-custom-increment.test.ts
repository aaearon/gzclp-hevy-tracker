/**
 * Unit Tests: T3 Custom Increment Logic
 *
 * Tests for T3 custom increment feature:
 * - Custom increment overrides default 2.5kg/5kg increment
 * - calculateT3Progression uses custom increment when provided
 * - calculateProgression passes custom increment for T3 tier
 * - Default increment used when custom increment not provided
 */

import { describe, it, expect } from 'vitest'
import { calculateT3Progression, calculateProgression } from '@/lib/progression'
import type { ProgressionState } from '@/types/state'

describe('T3 Custom Increment', () => {
  const baseProgression: ProgressionState = {
    exerciseId: 'test-t3',
    currentWeight: 10,
    stage: 0,
    baseWeight: 10,
    amrapRecord: 0,
    amrapRecordDate: null,
    amrapRecordWorkoutId: null,
  }

  describe('calculateT3Progression with custom increment', () => {
    it('uses custom 5kg increment when provided', () => {
      // AMRAP set >= 25 triggers progression
      const reps = [15, 15, 25]
      const result = calculateT3Progression(baseProgression, reps, 'upper', 'kg', 5)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(15) // 10 + 5
      expect(result.success).toBe(true)
      expect(result.amrapReps).toBe(25)
    })

    it('uses custom 1kg increment when provided', () => {
      const reps = [15, 15, 25]
      const result = calculateT3Progression(baseProgression, reps, 'upper', 'kg', 1)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(11) // 10 + 1
      expect(result.success).toBe(true)
    })

    it('uses custom 0.5kg increment when provided', () => {
      const reps = [15, 15, 26]
      const result = calculateT3Progression(baseProgression, reps, 'upper', 'kg', 0.5)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(10.5) // 10 + 0.5
      expect(result.success).toBe(true)
    })

    it('uses custom 10kg increment when provided', () => {
      const reps = [15, 15, 30]
      const result = calculateT3Progression(baseProgression, reps, 'lower', 'kg', 10)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(20) // 10 + 10
      expect(result.success).toBe(true)
    })

    it('uses custom 2kg increment when provided', () => {
      const reps = [15, 15, 27]
      const result = calculateT3Progression(baseProgression, reps, 'upper', 'kg', 2)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(12) // 10 + 2
      expect(result.success).toBe(true)
    })

    it('uses default 2.5kg increment when no custom increment provided (upper body)', () => {
      const reps = [15, 15, 25]
      const result = calculateT3Progression(baseProgression, reps, 'upper', 'kg')

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(12.5) // 10 + 2.5 (default for upper body)
      expect(result.success).toBe(true)
    })

    it('uses default 5kg increment when no custom increment provided (lower body)', () => {
      const reps = [15, 15, 25]
      const result = calculateT3Progression(baseProgression, reps, 'lower', 'kg')

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(15) // 10 + 5 (default for lower body)
      expect(result.success).toBe(true)
    })

    it('uses default lbs increment when no custom increment provided (upper body)', () => {
      const reps = [15, 15, 26]
      const weightLbs = 22 // ~10kg
      const progressionInLbs = { ...baseProgression, currentWeight: weightLbs }
      const result = calculateT3Progression(progressionInLbs, reps, 'upper', 'lbs')

      // Default upper body lbs increment: 5 lbs (~2.27 kg)
      expect(result.type).toBe('progress')
      expect(result.newWeight).toBeCloseTo(24.27, 1) // 22 + ~2.27
      expect(result.success).toBe(true)
    })
  })

  describe('calculateT3Progression with custom increment (failure case)', () => {
    it('does not add custom increment when AMRAP set < 25', () => {
      const reps = [15, 15, 24] // AMRAP = 24, just under threshold
      const result = calculateT3Progression(baseProgression, reps, 'upper', 'kg', 5)

      expect(result.type).toBe('repeat')
      expect(result.newWeight).toBe(10) // No change
      expect(result.success).toBe(false)
      expect(result.amrapReps).toBe(24)
    })

    it('does not add default increment when AMRAP set < 25 (no custom)', () => {
      const reps = [15, 15, 20]
      const result = calculateT3Progression(baseProgression, reps, 'upper', 'kg')

      expect(result.type).toBe('repeat')
      expect(result.newWeight).toBe(10) // No change
      expect(result.success).toBe(false)
    })
  })

  describe('calculateProgression with T3 tier and custom increment', () => {
    it('passes custom increment through calculateProgression for T3 tier', () => {
      const reps = [15, 15, 25]
      const result = calculateProgression('T3', baseProgression, reps, 'upper', 'kg', 5)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(15) // 10 + 5
      expect(result.success).toBe(true)
    })

    it('passes custom 1kg increment through calculateProgression for T3 tier', () => {
      const reps = [15, 15, 26]
      const result = calculateProgression('T3', baseProgression, reps, 'upper', 'kg', 1)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(11) // 10 + 1
      expect(result.success).toBe(true)
    })

    it('uses default increment when custom not provided for T3 tier', () => {
      const reps = [15, 15, 25]
      const result = calculateProgression('T3', baseProgression, reps, 'upper', 'kg')

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(12.5) // 10 + 2.5 (default)
      expect(result.success).toBe(true)
    })

    it('ignores custom increment for T1 tier', () => {
      const t1Progression: ProgressionState = {
        ...baseProgression,
        currentWeight: 100,
        stage: 0,
      }
      const reps = [3, 3, 3, 3, 3] // 5x3+, all sets hit target
      const result = calculateProgression('T1', t1Progression, reps, 'upper', 'kg', 10)

      // T1 should use default 2.5kg increment, not custom 10kg
      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(102.5) // 100 + 2.5 (default upper body)
      expect(result.success).toBe(true)
    })

    it('ignores custom increment for T2 tier', () => {
      const t2Progression: ProgressionState = {
        ...baseProgression,
        currentWeight: 80,
        stage: 0,
      }
      const reps = [10, 10, 10] // 3x10, all sets hit target
      const result = calculateProgression('T2', t2Progression, reps, 'upper', 'kg', 10)

      // T2 should use default 2.5kg increment, not custom 10kg
      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(82.5) // 80 + 2.5 (default upper body)
      expect(result.success).toBe(true)
    })
  })

  describe('Custom increment with different starting weights', () => {
    it('applies custom increment correctly with fractional starting weight', () => {
      const fractionalProgression = { ...baseProgression, currentWeight: 7.5 }
      const reps = [15, 15, 25]
      const result = calculateT3Progression(fractionalProgression, reps, 'upper', 'kg', 2.5)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(10) // 7.5 + 2.5
      expect(result.success).toBe(true)
    })

    it('applies custom increment correctly with high starting weight', () => {
      const heavyProgression = { ...baseProgression, currentWeight: 50 }
      const reps = [15, 15, 28]
      const result = calculateT3Progression(heavyProgression, reps, 'upper', 'kg', 5)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(55) // 50 + 5
      expect(result.success).toBe(true)
    })

    it('applies custom increment correctly with low starting weight', () => {
      const lightProgression = { ...baseProgression, currentWeight: 2.5 }
      const reps = [15, 15, 26]
      const result = calculateT3Progression(lightProgression, reps, 'upper', 'kg', 0.5)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(3) // 2.5 + 0.5
      expect(result.success).toBe(true)
    })
  })

  describe('Custom increment with edge cases', () => {
    it('handles zero custom increment (no progression)', () => {
      const reps = [15, 15, 25]
      const result = calculateT3Progression(baseProgression, reps, 'upper', 'kg', 0)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(10) // 10 + 0 = 10
      expect(result.success).toBe(true)
    })

    it('handles very small custom increment (0.25kg)', () => {
      const reps = [15, 15, 27]
      const result = calculateT3Progression(baseProgression, reps, 'upper', 'kg', 0.25)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(10.25) // 10 + 0.25
      expect(result.success).toBe(true)
    })

    it('applies custom increment when AMRAP exactly 25', () => {
      const reps = [15, 15, 25] // Exactly 25 on AMRAP
      const result = calculateT3Progression(baseProgression, reps, 'upper', 'kg', 3)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(13) // 10 + 3
      expect(result.success).toBe(true)
    })

    it('applies custom increment when AMRAP > 25', () => {
      const reps = [15, 15, 35] // High AMRAP
      const result = calculateT3Progression(baseProgression, reps, 'upper', 'kg', 7.5)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(17.5) // 10 + 7.5
      expect(result.success).toBe(true)
    })
  })

  describe('Custom increment reason message', () => {
    it('includes increment value in reason message (custom)', () => {
      const reps = [15, 15, 28]
      const result = calculateT3Progression(baseProgression, reps, 'upper', 'kg', 5)

      expect(result.reason).toContain('28') // AMRAP reps
      expect(result.reason).toContain('5') // Increment amount
      expect(result.reason).toContain('kg') // Unit
      expect(result.reason).toContain('AMRAP')
    })

    it('includes increment value in reason message (default)', () => {
      const reps = [15, 15, 26]
      const result = calculateT3Progression(baseProgression, reps, 'upper', 'kg')

      expect(result.reason).toContain('26') // AMRAP reps
      expect(result.reason).toContain('2.5') // Default increment
      expect(result.reason).toContain('kg')
    })
  })

  describe('Custom increment with undefined/null progression values', () => {
    it('handles undefined customIncrementKg (uses default)', () => {
      const reps = [15, 15, 25]
      const result = calculateT3Progression(baseProgression, reps, 'upper', 'kg', undefined)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(12.5) // 10 + 2.5 (default)
      expect(result.success).toBe(true)
    })

    it('handles explicitly passing undefined through calculateProgression', () => {
      const reps = [15, 15, 25]
      const result = calculateProgression('T3', baseProgression, reps, 'upper', 'kg', undefined)

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(12.5) // 10 + 2.5 (default)
      expect(result.success).toBe(true)
    })
  })
})
