/**
 * Formatting Utilities
 *
 * Weight rounding and display formatting functions.
 */

import type { WeightUnit } from '@/types/state'
import { WEIGHT_ROUNDING } from '@/lib/constants'

/**
 * Round a weight to the nearest increment based on unit.
 * - kg: rounds to nearest 2.5kg
 * - lbs: rounds to nearest 5lb
 */
export function roundWeight(weight: number, unit: WeightUnit): number {
  const increment = WEIGHT_ROUNDING[unit]
  return Math.round(weight / increment) * increment
}

/**
 * Format a weight for display with unit suffix.
 */
export function formatWeight(weight: number, unit: WeightUnit): string {
  // Remove unnecessary decimals for clean display
  const formatted = weight % 1 === 0 ? weight.toString() : weight.toFixed(1)
  return `${formatted} ${unit}`
}

// =============================================================================
// Unit Conversion Constants
// =============================================================================

const KG_TO_LBS = 2.20462
const LBS_TO_KG = 1 / KG_TO_LBS // ~0.453592

// =============================================================================
// Core Conversion Functions
// =============================================================================

/**
 * Convert weight between units.
 * 1 kg = 2.20462 lbs
 *
 * Note: Rounds to the appropriate increment for the target unit.
 */
export function convertWeight(weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
  if (fromUnit === toUnit) {
    return weight
  }

  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return roundWeight(weight * KG_TO_LBS, 'lbs')
  }

  // lbs to kg
  return roundWeight(weight * LBS_TO_KG, 'kg')
}

/**
 * Convert weight to kg without rounding.
 * Used for internal storage where precision matters.
 *
 * @param weight - Weight value in the specified unit
 * @param fromUnit - The unit of the input weight
 * @returns Weight in kg (unrounded for precision)
 */
export function toKg(weight: number, fromUnit: WeightUnit): number {
  if (fromUnit === 'kg') {
    return weight
  }
  // lbs to kg (no rounding - preserve precision for storage)
  return weight * LBS_TO_KG
}

/**
 * Convert kg to user's display unit without rounding.
 * Used when exact conversion is needed before separate rounding step.
 *
 * @param weightKg - Weight in kg
 * @param toUnit - Target display unit
 * @returns Weight in target unit (unrounded)
 */
export function fromKg(weightKg: number, toUnit: WeightUnit): number {
  if (toUnit === 'kg') {
    return weightKg
  }
  return weightKg * KG_TO_LBS
}

// =============================================================================
// Display Functions
// =============================================================================

/**
 * Convert kg weight to user's preferred unit and format for display.
 *
 * This is the primary function for displaying weights stored in kg.
 * It handles the conversion from internal storage (kg) to user display unit.
 *
 * @param weightKg - Weight in kg (internal storage format)
 * @param userUnit - User's preferred display unit
 * @returns Formatted string like "100 kg" or "225 lbs"
 */
export function displayWeight(weightKg: number, userUnit: WeightUnit): string {
  if (userUnit === 'kg') {
    return formatWeight(weightKg, 'kg')
  }

  // Convert kg to lbs and round to nearest 5 lbs
  const weightLbs = roundWeight(weightKg * KG_TO_LBS, 'lbs')
  return formatWeight(weightLbs, 'lbs')
}

/**
 * Get the numeric display value (converted and rounded) without formatting.
 * Useful when you need the number separately from the unit string.
 *
 * @param weightKg - Weight in kg (internal storage format)
 * @param userUnit - User's preferred display unit
 * @returns Numeric weight value in user's unit
 */
export function getDisplayValue(weightKg: number, userUnit: WeightUnit): number {
  if (userUnit === 'kg') {
    return weightKg
  }
  return roundWeight(weightKg * KG_TO_LBS, 'lbs')
}
