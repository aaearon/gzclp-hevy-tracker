/**
 * Warmup Calculator Tests
 *
 * Tests for the shared warmup set calculation utility.
 */

import { describe, it, expect } from 'vitest'
import { calculateWarmupSets } from '@/lib/warmup'

describe('calculateWarmupSets', () => {
  describe('light lifts (≤40kg)', () => {
    it('generates warmup sets with duplicate filtering', () => {
      // 40kg is threshold - bar=20, 50%=20, 75%=30
      // Since bar and 50% both = 20kg, duplicate is skipped
      const sets = calculateWarmupSets(40)

      expect(sets).toHaveLength(2)
      expect(sets[0]).toEqual({ weight: 20, reps: 10 }) // Bar only (0%)
      expect(sets[1]).toEqual({ weight: 30, reps: 3 })  // 75% = 30kg
    })

    it('skips duplicate weights when rounding', () => {
      // 30kg working weight: all percentages result in bar weight or close
      const sets = calculateWarmupSets(30)

      expect(sets.length).toBeGreaterThan(0)
      expect(sets[0]).toEqual({ weight: 20, reps: 10 })
    })
  })

  describe('heavy lifts (>40kg)', () => {
    it('generates 50%, 70%, 85% warmup sets', () => {
      const sets = calculateWarmupSets(100)

      expect(sets).toHaveLength(3)
      expect(sets[0]).toEqual({ weight: 50, reps: 5 })  // 50%
      expect(sets[1]).toEqual({ weight: 70, reps: 3 })  // 70%
      expect(sets[2]).toEqual({ weight: 85, reps: 2 })  // 85%
    })

    it('rounds to nearest 2.5kg', () => {
      const sets = calculateWarmupSets(60)

      expect(sets[0]).toEqual({ weight: 30, reps: 5 })   // 50% = 30kg
      expect(sets[1]).toEqual({ weight: 42.5, reps: 3 }) // 70% = 42kg -> 42.5kg
      expect(sets[2]).toEqual({ weight: 50, reps: 2 })   // 85% = 51kg -> 50kg
    })

    it('enforces minimum bar weight', () => {
      const sets = calculateWarmupSets(45)

      // 50% of 45 = 22.5, rounds to 22.5
      // But minimum is bar weight (20kg)
      expect(sets[0].weight).toBeGreaterThanOrEqual(20)
    })
  })

  describe('edge cases', () => {
    it('handles very light weights', () => {
      const sets = calculateWarmupSets(20)

      // All percentages result in bar weight or less
      expect(sets.length).toBeGreaterThan(0)
      sets.forEach((set) => {
        expect(set.weight).toBeGreaterThanOrEqual(20)
      })
    })

    it('returns consistent results for same input', () => {
      const sets1 = calculateWarmupSets(80)
      const sets2 = calculateWarmupSets(80)

      expect(sets1).toEqual(sets2)
    })
  })
})
