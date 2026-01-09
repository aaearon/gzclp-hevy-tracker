/**
 * Routine Notes Generator
 *
 * Generates descriptive notes for Hevy routine updates.
 * Notes include timestamp and list of weight changes.
 */

import type { WeightUnit } from '@/types/state'

// =============================================================================
// Types
// =============================================================================

/**
 * Information about a single exercise update.
 */
export interface RoutineUpdateInfo {
  exerciseName: string
  oldWeight: number | null // null if exercise is new
  newWeight: number
}

// =============================================================================
// Formatting
// =============================================================================

/**
 * Format a single weight change as a string.
 *
 * @example
 * formatWeightChange('Squat', 60, 62.5, 'kg') // "Squat: 60kg → 62.5kg"
 * formatWeightChange('Deadlift', null, 100, 'kg') // "Deadlift: (new) → 100kg"
 */
export function formatWeightChange(
  exerciseName: string,
  oldWeight: number | null,
  newWeight: number,
  unit: WeightUnit
): string {
  const oldStr = oldWeight !== null ? `${String(oldWeight)}${unit}` : '(new)'
  const newStr = `${String(newWeight)}${unit}`
  return `${exerciseName}: ${oldStr} → ${newStr}`
}

/**
 * Format the current date as YYYY-MM-DD.
 */
function formatDate(): string {
  const now = new Date()
  const year = String(now.getUTCFullYear())
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// =============================================================================
// Notes Generation
// =============================================================================

/**
 * Generate routine notes describing what was updated.
 *
 * @param updates - List of exercise updates to include
 * @param unit - Weight unit for display
 * @returns Formatted notes string, or empty string if no updates
 *
 * @example
 * ```
 * Updated: 2026-01-09
 *
 * Changes:
 * - Squat: 60kg → 62.5kg
 * - Bench Press: 45kg → 47.5kg
 * ```
 */
export function generateRoutineNotes(
  updates: RoutineUpdateInfo[],
  unit: WeightUnit
): string {
  if (updates.length === 0) {
    return ''
  }

  const lines: string[] = []

  // Header with timestamp
  lines.push(`Updated: ${formatDate()}`)
  lines.push('')
  lines.push('Changes:')

  // List each change
  for (const update of updates) {
    const change = formatWeightChange(
      update.exerciseName,
      update.oldWeight,
      update.newWeight,
      unit
    )
    lines.push(`- ${change}`)
  }

  return lines.join('\n')
}
