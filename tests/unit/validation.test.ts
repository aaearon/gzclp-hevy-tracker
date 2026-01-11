/**
 * Unit Tests: Validation Utilities
 *
 * Tests for API key validation, weight validation, and input sanitization.
 * [US1] User Story 1 - Initial Program Setup
 */

import { describe, it, expect } from 'vitest'
import {
  isValidApiKey,
  isValidWeight,
  isPositiveWeight,
  isValidReps,
  sanitizeInput,
} from '@/utils/validation'

describe('[US1] API Key Validation', () => {
  it('should accept valid UUID v4 format', () => {
    expect(isValidApiKey('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isValidApiKey('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
  })

  it('should accept uppercase UUIDs', () => {
    expect(isValidApiKey('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
  })

  it('should trim whitespace from API keys', () => {
    expect(isValidApiKey('  550e8400-e29b-41d4-a716-446655440000  ')).toBe(true)
  })

  it('should reject empty strings', () => {
    expect(isValidApiKey('')).toBe(false)
    expect(isValidApiKey('   ')).toBe(false)
  })

  it('should reject malformed UUIDs', () => {
    expect(isValidApiKey('not-a-uuid')).toBe(false)
    expect(isValidApiKey('550e8400-e29b-41d4-a716')).toBe(false) // Too short
    expect(isValidApiKey('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false) // Too long
    expect(isValidApiKey('550e8400e29b41d4a716446655440000')).toBe(false) // No dashes
  })

  it('should reject non-string inputs', () => {
    // @ts-expect-error Testing invalid input type
    expect(isValidApiKey(null)).toBe(false)
    // @ts-expect-error Testing invalid input type
    expect(isValidApiKey(undefined)).toBe(false)
    // @ts-expect-error Testing invalid input type
    expect(isValidApiKey(123)).toBe(false)
  })
})

describe('[US1] Weight Validation', () => {
  describe('isValidWeight', () => {
    it('should accept zero weight (bodyweight exercises)', () => {
      expect(isValidWeight(0, 'kg')).toBe(true)
      expect(isValidWeight(0, 'lbs')).toBe(true)
    })

    it('should accept positive weights within range', () => {
      expect(isValidWeight(100, 'kg')).toBe(true)
      expect(isValidWeight(225, 'lbs')).toBe(true)
      expect(isValidWeight(2.5, 'kg')).toBe(true)
    })

    it('should reject negative weights', () => {
      expect(isValidWeight(-1, 'kg')).toBe(false)
      expect(isValidWeight(-100, 'lbs')).toBe(false)
    })

    it('should reject weights above maximum', () => {
      expect(isValidWeight(501, 'kg')).toBe(false)
      expect(isValidWeight(1101, 'lbs')).toBe(false)
    })

    it('should accept weights at maximum boundary', () => {
      expect(isValidWeight(500, 'kg')).toBe(true)
      expect(isValidWeight(1100, 'lbs')).toBe(true)
    })

    it('should reject NaN and non-number inputs', () => {
      expect(isValidWeight(NaN, 'kg')).toBe(false)
      // @ts-expect-error Testing invalid input type
      expect(isValidWeight('100', 'kg')).toBe(false)
    })
  })

  describe('isPositiveWeight', () => {
    it('should accept positive weights', () => {
      expect(isPositiveWeight(2.5)).toBe(true)
      expect(isPositiveWeight(100)).toBe(true)
    })

    it('should reject zero', () => {
      expect(isPositiveWeight(0)).toBe(false)
    })

    it('should reject negative weights', () => {
      expect(isPositiveWeight(-1)).toBe(false)
    })
  })
})

describe('[US1] Reps Validation', () => {
  it('should accept valid rep counts', () => {
    expect(isValidReps(0)).toBe(true) // Failed set
    expect(isValidReps(1)).toBe(true)
    expect(isValidReps(10)).toBe(true)
    expect(isValidReps(100)).toBe(true)
  })

  it('should reject negative reps', () => {
    expect(isValidReps(-1)).toBe(false)
  })

  it('should reject reps over 100', () => {
    expect(isValidReps(101)).toBe(false)
  })

  it('should reject non-integer values', () => {
    expect(isValidReps(5.5)).toBe(false)
  })
})

describe('[US1] Input Sanitization', () => {
  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('should remove HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")')
    expect(sanitizeInput('<b>bold</b>')).toBe('bold')
  })

  it('should handle empty and non-string inputs', () => {
    expect(sanitizeInput('')).toBe('')
    // @ts-expect-error Testing invalid input type
    expect(sanitizeInput(null)).toBe('')
    // @ts-expect-error Testing invalid input type
    expect(sanitizeInput(123)).toBe('')
  })
})
