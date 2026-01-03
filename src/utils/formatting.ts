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

/**
 * Convert weight between units.
 * 1 kg = 2.20462 lbs
 */
export function convertWeight(weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
  if (fromUnit === toUnit) {
    return weight
  }

  const KG_TO_LBS = 2.20462

  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return roundWeight(weight * KG_TO_LBS, 'lbs')
  }

  // lbs to kg
  return roundWeight(weight / KG_TO_LBS, 'kg')
}
