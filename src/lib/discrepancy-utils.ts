/**
 * Discrepancy Utilities
 *
 * Utilities for processing weight discrepancy data.
 *
 * @see docs/007-discrepancy-ui-fix.md
 */

import type { Tier } from '@/types/state'

export interface DiscrepancyInfo {
  exerciseId: string
  exerciseName: string
  tier: Tier
  storedWeight: number
  actualWeight: number
  workoutId: string
  workoutDate: string
}

/**
 * Deduplicate discrepancies by exerciseId+tier, keeping only the most recent.
 *
 * When syncing multiple workouts, the same exercise+tier combination may
 * generate multiple discrepancy entries. This function keeps only the most
 * recent one per unique exerciseId+tier combination.
 *
 * @param discrepancies - Array of discrepancies to deduplicate
 * @returns Deduplicated array with most recent entry per exerciseId+tier
 */
export function deduplicateDiscrepancies(
  discrepancies: DiscrepancyInfo[]
): DiscrepancyInfo[] {
  if (discrepancies.length === 0) {
    return []
  }

  // Group by exerciseId+tier key
  const byKey = new Map<string, DiscrepancyInfo>()

  for (const discrepancy of discrepancies) {
    const key = `${discrepancy.exerciseId}-${discrepancy.tier}`
    const existing = byKey.get(key)

    if (!existing) {
      byKey.set(key, discrepancy)
    } else {
      // Keep the most recent by workoutDate
      const existingDate = new Date(existing.workoutDate).getTime()
      const currentDate = new Date(discrepancy.workoutDate).getTime()

      if (currentDate > existingDate) {
        byKey.set(key, discrepancy)
      }
    }
  }

  return Array.from(byKey.values())
}
