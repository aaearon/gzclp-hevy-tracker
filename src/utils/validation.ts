/**
 * Validation Utilities
 *
 * Input validation for API keys, weights, and other user inputs.
 */

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
