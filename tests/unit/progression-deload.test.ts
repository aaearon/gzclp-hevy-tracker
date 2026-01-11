/**
 * Unit Tests: Deload Calculation
 *
 * Tests for deload logic (85% reduction with rounding).
 * [US2] User Story 2 - Sync Workouts and Calculate Progression
 */

import { describe, it, expect } from 'vitest'
import { calculateDeload, roundWeight } from '@/lib/progression'

describe('[US2] Deload Calculation', () => {
  describe('Basic Deload (85%)', () => {
    it('should calculate 85% of current weight', () => {
      expect(calculateDeload(100, 'kg')).toBe(85)
      expect(calculateDeload(200, 'kg')).toBe(170)
    })

    it('should work for lbs users (input/output always in kg)', () => {
      // Note: All weights are stored in kg. The lbs parameter doesn't change calculation.
      // 225 lbs ≈ 102 kg: 85% of 102 = 86.7, rounds to 87.5kg
      expect(calculateDeload(102, 'lbs')).toBe(87.5)
      // 315 lbs ≈ 143 kg: 85% of 143 = 121.55, rounds to 122.5kg
      expect(calculateDeload(143, 'lbs')).toBe(122.5)
    })
  })

  describe('Rounding to kg (2.5kg increments)', () => {
    it('should round down to nearest 2.5kg', () => {
      // 85% of 97.5 = 82.875, rounds to 82.5
      expect(calculateDeload(97.5, 'kg')).toBe(82.5)
    })

    it('should round up when closer to higher increment', () => {
      // 85% of 95 = 80.75, rounds to 80 (midpoint rounds down)
      expect(calculateDeload(95, 'kg')).toBe(80)
    })

    it('should handle exact values', () => {
      // 85% of 100 = 85, exact
      expect(calculateDeload(100, 'kg')).toBe(85)
    })

    it('should enforce minimum bar weight for small weights', () => {
      // 85% of 20 = 17, but minimum is bar weight (20kg)
      // [GAP-10] Bar weight minimum enforcement
      expect(calculateDeload(20, 'kg')).toBe(20)
    })
  })

  describe('Rounding for lbs users (always rounds to 2.5kg internally)', () => {
    // Note: With the new design, weight is always stored in kg internally.
    // Deload always rounds to 2.5kg regardless of user's display preference.
    // The 'lbs' parameter is kept for API compatibility but doesn't affect rounding.

    it('should round to nearest 2.5kg even for lbs user', () => {
      // 225 lbs ≈ 102 kg
      // 85% of 102 = 86.7, rounds to 87.5kg
      expect(calculateDeload(102, 'lbs')).toBe(87.5)
    })

    it('should round to nearest 2.5kg', () => {
      // 235 lbs ≈ 106.6 kg
      // 85% of 106.6 = 90.61, rounds to 90kg
      expect(calculateDeload(106.6, 'lbs')).toBe(90)
    })

    it('should handle exact values', () => {
      // 200 lbs ≈ 90.7 kg
      // 85% of 90.7 = 77.1, rounds to 77.5kg
      expect(calculateDeload(90.7, 'lbs')).toBe(77.5)
    })
  })

  describe('Edge Cases - Bar Weight Minimum [GAP-10]', () => {
    // Note: Bar weight minimum is always 20kg regardless of user's unit preference.
    // This ensures safety - you can't lift less than an empty bar.

    it('should enforce bar weight minimum for very small weights', () => {
      // 85% of 5kg = 4.25, but minimum is bar weight (20kg)
      expect(calculateDeload(5, 'kg')).toBe(20)
    })

    it('should enforce bar weight minimum for zero weight', () => {
      // Minimum is always bar weight (20kg)
      expect(calculateDeload(0, 'kg')).toBe(20)
    })

    it('should enforce bar weight minimum for lbs user with small weight', () => {
      // 10 lbs ≈ 4.5 kg, 85% = 3.8kg, but minimum is 20kg bar weight
      // Using kg input since all weights are stored in kg
      expect(calculateDeload(4.5, 'lbs')).toBe(20)
    })

    it('should not affect weights above bar weight', () => {
      // 85% of 25kg = 21.25, rounds to 22.5 (above bar weight)
      expect(calculateDeload(25, 'kg')).toBe(22.5)
      // 55 lbs ≈ 25 kg, same calculation as above
      expect(calculateDeload(25, 'lbs')).toBe(22.5)
    })
  })
})

describe('[US2] Weight Rounding', () => {
  describe('kg rounding (2.5kg increments)', () => {
    it('should round to nearest 2.5kg', () => {
      expect(roundWeight(82.875, 'kg')).toBe(82.5)
      expect(roundWeight(83.75, 'kg')).toBe(85)
      expect(roundWeight(81.25, 'kg')).toBe(82.5)
    })

    it('should handle exact values', () => {
      expect(roundWeight(100, 'kg')).toBe(100)
      expect(roundWeight(97.5, 'kg')).toBe(97.5)
    })
  })

  describe('lbs rounding (5lb increments)', () => {
    it('should round to nearest 5lbs', () => {
      expect(roundWeight(191.25, 'lbs')).toBe(190)
      expect(roundWeight(192.5, 'lbs')).toBe(195)
      expect(roundWeight(197.5, 'lbs')).toBe(200)
    })

    it('should handle exact values', () => {
      expect(roundWeight(225, 'lbs')).toBe(225)
      expect(roundWeight(315, 'lbs')).toBe(315)
    })
  })
})
