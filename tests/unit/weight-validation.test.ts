/**
 * Unit Tests: Weight Validation
 *
 * Tests for the validateWeight function for real-time input validation.
 * [US3] User Story 3 - Create Path Weight Setup (FR-024)
 */

import { describe, it, expect } from 'vitest'
import { validateWeight } from '@/utils/validation'

describe('validateWeight', () => {
  describe('invalid inputs', () => {
    it.each([
      ['', 'kg', 'Weight is required'],
      ['   ', 'kg', 'Weight is required'],
      ['abc', 'kg', 'Must be a number'],
      ['100kg', 'kg', 'Must be a number'],
      ['0', 'kg', 'Must be greater than 0'],
      ['-10', 'kg', 'Must be greater than 0'],
      ['501', 'kg', 'Weight seems too high'],
      ['1101', 'lbs', 'Weight seems too high'],
    ])('rejects "%s" (%s) with error "%s"', (value, unit, expectedError) => {
      expect(validateWeight(value, unit as 'kg' | 'lbs')).toEqual({
        isValid: false,
        error: expectedError,
      })
    })
  })

  describe('valid inputs', () => {
    it.each([
      ['100', 'kg'],
      ['225', 'lbs'],
      ['2.5', 'kg'],
      ['0.5', 'kg'],
      ['  100  ', 'kg'],  // trims whitespace
      ['500', 'kg'],      // boundary
      ['1100', 'lbs'],    // boundary
    ])('accepts "%s" (%s)', (value, unit) => {
      expect(validateWeight(value, unit as 'kg' | 'lbs')).toEqual({
        isValid: true,
        error: null,
      })
    })
  })
})
