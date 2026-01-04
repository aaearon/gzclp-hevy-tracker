/**
 * Validation Utilities
 *
 * Input validation for API keys, weights, and other user inputs.
 */

import type { WeightUnit } from '@/types/state'

// =============================================================================
// Weight Input Validation Result
// =============================================================================

export interface WeightValidationResult {
  isValid: boolean
  error: string | null
}

/**
 * Validate Hevy API key format.
 * API keys are UUIDs in the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export function isValidApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false
  }

  const trimmed = apiKey.trim()

  // UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(trimmed)
}

/**
 * Validate weight is within reasonable range.
 * Minimum: 0 (bodyweight exercises)
 * Maximum: 1000kg / 2200lbs (reasonable upper bound)
 */
export function isValidWeight(weight: number, unit: 'kg' | 'lbs'): boolean {
  if (typeof weight !== 'number' || isNaN(weight)) {
    return false
  }

  if (weight < 0) {
    return false
  }

  const maxWeight = unit === 'kg' ? 1000 : 2200
  return weight <= maxWeight
}

/**
 * Validate weight is positive (for working sets, not bodyweight).
 */
export function isPositiveWeight(weight: number): boolean {
  return typeof weight === 'number' && !isNaN(weight) && weight > 0
}

/**
 * Validate reps are within reasonable range (0-100).
 */
export function isValidReps(reps: number): boolean {
  return typeof reps === 'number' && Number.isInteger(reps) && reps >= 0 && reps <= 100
}

/**
 * Sanitize a string input to prevent XSS.
 * Removes HTML tags and trims whitespace.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim()
}

// =============================================================================
// Weight Input Validation (Real-time)
// =============================================================================

/** Maximum weight limits by unit */
const MAX_WEIGHT = {
  kg: 500,
  lbs: 1100,
} as const

/**
 * Validate a weight input value for real-time form validation.
 *
 * Validation rules:
 * - Required (not empty)
 * - Must be numeric
 * - Must be > 0
 * - Must be <= max (500kg / 1100lbs)
 *
 * @param value - The string value from the input field
 * @param unit - The weight unit (kg or lbs)
 * @returns Validation result with isValid and error message
 */
export function validateWeight(value: string, unit: WeightUnit): WeightValidationResult {
  const trimmed = value.trim()

  // Empty check
  if (!trimmed) {
    return { isValid: false, error: 'Weight is required' }
  }

  // Numeric check
  const num = Number(trimmed)
  if (isNaN(num)) {
    return { isValid: false, error: 'Must be a number' }
  }

  // Positive check
  if (num <= 0) {
    return { isValid: false, error: 'Must be greater than 0' }
  }

  // Upper bound check
  const maxWeight = MAX_WEIGHT[unit]
  if (num > maxWeight) {
    return { isValid: false, error: 'Weight seems too high' }
  }

  return { isValid: true, error: null }
}
