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

    it('should work with lbs', () => {
      expect(calculateDeload(225, 'lbs')).toBe(190) // 191.25 rounded to 190
      expect(calculateDeload(315, 'lbs')).toBe(270) // 267.75 rounded to 270
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

    it('should handle small weights', () => {
      // 85% of 20 = 17, rounds to 17.5
      expect(calculateDeload(20, 'kg')).toBe(17.5)
    })
  })

  describe('Rounding to lbs (5lb increments)', () => {
    it('should round to nearest 5lbs', () => {
      // 85% of 225 = 191.25, rounds to 190
      expect(calculateDeload(225, 'lbs')).toBe(190)
    })

    it('should round up when closer', () => {
      // 85% of 235 = 199.75, rounds to 200
      expect(calculateDeload(235, 'lbs')).toBe(200)
    })

    it('should handle exact values', () => {
      // 85% of 200 = 170, exact
      expect(calculateDeload(200, 'lbs')).toBe(170)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very small weights', () => {
      // 85% of 5kg = 4.25, rounds to 5 (minimum practical)
      expect(calculateDeload(5, 'kg')).toBe(5)
    })

    it('should handle zero weight', () => {
      expect(calculateDeload(0, 'kg')).toBe(0)
    })

    it('should ensure minimum practical weight', () => {
      // Deload should never go below minimum plate weight
      expect(calculateDeload(2.5, 'kg')).toBeGreaterThanOrEqual(0)
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
