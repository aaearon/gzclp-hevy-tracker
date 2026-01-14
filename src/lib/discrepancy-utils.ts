/**
 * Discrepancy Utilities
 *
 * Utilities for processing weight discrepancy and pending change data.
 *
 * @see docs/007-discrepancy-ui-fix.md
 */

import type { PendingChange, Tier } from '@/types/state'

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

/**
 * Deduplicate pending changes by progressionKey, keeping only the most recent.
 *
 * When syncing generates multiple changes for the same exercise+tier combination
 * (e.g., from multiple sync calls before applying changes), this function keeps
 * only the most recent one per unique progressionKey.
 *
 * @param changes - Array of pending changes to deduplicate
 * @returns Deduplicated array with most recent entry per progressionKey
 */
export function deduplicatePendingChanges(
  changes: PendingChange[]
): PendingChange[] {
  if (changes.length === 0) {
    return []
  }

  // Group by progressionKey
  const byKey = new Map<string, PendingChange>()

  for (const change of changes) {
    const key = change.progressionKey
    const existing = byKey.get(key)

    if (!existing) {
      byKey.set(key, change)
    } else {
      // Keep the most recent by workoutDate
      const existingDate = new Date(existing.workoutDate).getTime()
      const currentDate = new Date(change.workoutDate).getTime()

      if (currentDate > existingDate) {
        byKey.set(key, change)
      }
    }
  }

  return Array.from(byKey.values())
}
