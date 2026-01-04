/**
 * Unit Tests: Weight Validation
 *
 * Tests for the validateWeight function for real-time input validation.
 * [US3] User Story 3 - Create Path Weight Setup (FR-024)
 */

import { describe, it, expect } from 'vitest'
import { validateWeight } from '@/utils/validation'

describe('validateWeight', () => {
  describe('empty value validation', () => {
    it('returns error for empty string', () => {
      expect(validateWeight('', 'kg')).toEqual({
        isValid: false,
        error: 'Weight is required',
      })
    })

    it('returns error for whitespace-only string', () => {
      expect(validateWeight('   ', 'kg')).toEqual({
        isValid: false,
        error: 'Weight is required',
      })
    })
  })

  describe('numeric validation', () => {
    it('returns error for non-numeric value', () => {
      expect(validateWeight('abc', 'kg')).toEqual({
        isValid: false,
        error: 'Must be a number',
      })
    })

    it('returns error for mixed alphanumeric', () => {
      expect(validateWeight('100kg', 'kg')).toEqual({
        isValid: false,
        error: 'Must be a number',
      })
    })

    it('returns error for special characters', () => {
      expect(validateWeight('100@', 'kg')).toEqual({
        isValid: false,
        error: 'Must be a number',
      })
    })
  })

  describe('positive value validation', () => {
    it('returns error for zero', () => {
      expect(validateWeight('0', 'kg')).toEqual({
        isValid: false,
        error: 'Must be greater than 0',
      })
    })

    it('returns error for negative value', () => {
      expect(validateWeight('-10', 'kg')).toEqual({
        isValid: false,
        error: 'Must be greater than 0',
      })
    })
  })

  describe('upper bound validation', () => {
    it('returns error for weight exceeding 500kg', () => {
      expect(validateWeight('501', 'kg')).toEqual({
        isValid: false,
        error: 'Weight seems too high',
      })
    })

    it('returns error for weight exceeding 1100lbs', () => {
      expect(validateWeight('1101', 'lbs')).toEqual({
        isValid: false,
        error: 'Weight seems too high',
      })
    })

    it('accepts weight at 500kg boundary', () => {
      expect(validateWeight('500', 'kg')).toEqual({
        isValid: true,
        error: null,
      })
    })

    it('accepts weight at 1100lbs boundary', () => {
      expect(validateWeight('1100', 'lbs')).toEqual({
        isValid: true,
        error: null,
      })
    })
  })

  describe('valid inputs', () => {
    it('accepts positive integer in kg', () => {
      expect(validateWeight('100', 'kg')).toEqual({
        isValid: true,
        error: null,
      })
    })

    it('accepts positive integer in lbs', () => {
      expect(validateWeight('225', 'lbs')).toEqual({
        isValid: true,
        error: null,
      })
    })

    it('accepts decimal values', () => {
      expect(validateWeight('2.5', 'kg')).toEqual({
        isValid: true,
        error: null,
      })
    })

    it('trims whitespace before validation', () => {
      expect(validateWeight('  100  ', 'kg')).toEqual({
        isValid: true,
        error: null,
      })
    })

    it('accepts small positive values', () => {
      expect(validateWeight('0.5', 'kg')).toEqual({
        isValid: true,
        error: null,
      })
    })
  })
})
