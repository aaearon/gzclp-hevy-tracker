/**
 * Unit Tests: Discrepancy Deduplication Utility
 *
 * When syncing multiple workouts, the same exercise+tier combination may
 * appear multiple times. This utility deduplicates, keeping only the most
 * recent discrepancy per exercise+tier.
 *
 * @see docs/007-discrepancy-ui-fix.md
 */

import { describe, it, expect } from 'vitest'
import { deduplicateDiscrepancies, deduplicatePendingChanges } from '@/lib/discrepancy-utils'
import type { PendingChange, Tier } from '@/types/state'

// Match the DiscrepancyInfo interface
interface DiscrepancyInfo {
  exerciseId: string
  exerciseName: string
  tier: Tier
  storedWeight: number
  actualWeight: number
  workoutId: string
  workoutDate: string
}

describe('deduplicateDiscrepancies', () => {
  const createDiscrepancy = (
    exerciseId: string,
    name: string,
    tier: Tier,
    stored: number,
    actual: number,
    workoutId: string,
    workoutDate: string
  ): DiscrepancyInfo => ({
    exerciseId,
    exerciseName: name,
    tier,
    storedWeight: stored,
    actualWeight: actual,
    workoutId,
    workoutDate,
  })

  it('returns empty array when given empty array', () => {
    expect(deduplicateDiscrepancies([])).toEqual([])
  })

  it('returns single item unchanged', () => {
    const discrepancy = createDiscrepancy(
      'ex-squat',
      'Squat',
      'T1',
      100,
      105,
      'workout-1',
      '2024-01-15T10:00:00Z'
    )
    expect(deduplicateDiscrepancies([discrepancy])).toEqual([discrepancy])
  })

  it('deduplicates by exerciseId+tier, keeping most recent by workoutDate', () => {
    const older = createDiscrepancy(
      'ex-squat',
      'Squat',
      'T1',
      100,
      105,
      'workout-1',
      '2024-01-10T10:00:00Z'
    )
    const newer = createDiscrepancy(
      'ex-squat',
      'Squat',
      'T1',
      100,
      110,
      'workout-2',
      '2024-01-15T10:00:00Z'
    )

    // Order should not matter - always keep the most recent
    expect(deduplicateDiscrepancies([older, newer])).toEqual([newer])
    expect(deduplicateDiscrepancies([newer, older])).toEqual([newer])
  })

  it('handles same exercise with different tiers separately', () => {
    const squatT1 = createDiscrepancy(
      'ex-squat',
      'Squat',
      'T1',
      100,
      105,
      'workout-1',
      '2024-01-15T10:00:00Z'
    )
    const squatT2 = createDiscrepancy(
      'ex-squat',
      'Squat',
      'T2',
      70,
      75,
      'workout-2',
      '2024-01-16T10:00:00Z'
    )

    const result = deduplicateDiscrepancies([squatT1, squatT2])

    // Both should be kept since they have different tiers
    expect(result).toHaveLength(2)
    expect(result).toContainEqual(squatT1)
    expect(result).toContainEqual(squatT2)
  })

  it('handles multiple exercises correctly', () => {
    const squat = createDiscrepancy(
      'ex-squat',
      'Squat',
      'T1',
      100,
      105,
      'workout-1',
      '2024-01-15T10:00:00Z'
    )
    const bench = createDiscrepancy(
      'ex-bench',
      'Bench Press',
      'T1',
      60,
      65,
      'workout-1',
      '2024-01-15T10:00:00Z'
    )
    const deadlift = createDiscrepancy(
      'ex-deadlift',
      'Deadlift',
      'T1',
      120,
      125,
      'workout-1',
      '2024-01-15T10:00:00Z'
    )

    const result = deduplicateDiscrepancies([squat, bench, deadlift])

    expect(result).toHaveLength(3)
    expect(result).toContainEqual(squat)
    expect(result).toContainEqual(bench)
    expect(result).toContainEqual(deadlift)
  })

  it('handles ISO date strings correctly', () => {
    const olderISO = createDiscrepancy(
      'ex-squat',
      'Squat',
      'T1',
      100,
      105,
      'workout-1',
      '2024-01-10T08:30:00.000Z'
    )
    const newerISO = createDiscrepancy(
      'ex-squat',
      'Squat',
      'T1',
      100,
      110,
      'workout-2',
      '2024-01-15T14:45:30.123Z'
    )

    expect(deduplicateDiscrepancies([olderISO, newerISO])).toEqual([newerISO])
  })

  it('deduplicates multiple entries for same exercise+tier keeping most recent', () => {
    const day1 = createDiscrepancy(
      'ex-squat',
      'Squat',
      'T1',
      100,
      105,
      'workout-1',
      '2024-01-08T10:00:00Z'
    )
    const day2 = createDiscrepancy(
      'ex-squat',
      'Squat',
      'T1',
      100,
      107,
      'workout-2',
      '2024-01-10T10:00:00Z'
    )
    const day3 = createDiscrepancy(
      'ex-squat',
      'Squat',
      'T1',
      100,
      110,
      'workout-3',
      '2024-01-15T10:00:00Z'
    )

    const result = deduplicateDiscrepancies([day1, day2, day3])

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(day3) // Most recent
  })

  it('preserves order of unique entries by recency', () => {
    const squatOld = createDiscrepancy(
      'ex-squat',
      'Squat',
      'T1',
      100,
      105,
      'workout-1',
      '2024-01-10T10:00:00Z'
    )
    const benchNew = createDiscrepancy(
      'ex-bench',
      'Bench Press',
      'T1',
      60,
      65,
      'workout-2',
      '2024-01-15T10:00:00Z'
    )
    const squatNew = createDiscrepancy(
      'ex-squat',
      'Squat',
      'T1',
      100,
      110,
      'workout-3',
      '2024-01-12T10:00:00Z'
    )

    const result = deduplicateDiscrepancies([squatOld, benchNew, squatNew])

    // Should have 2 entries: most recent squat and bench
    expect(result).toHaveLength(2)
    expect(result.find((d) => d.exerciseId === 'ex-squat')).toEqual(squatNew)
    expect(result.find((d) => d.exerciseId === 'ex-bench')).toEqual(benchNew)
  })
})

/**
 * Tests for deduplicatePendingChanges
 *
 * When sync runs multiple times before changes are applied, it may generate
 * duplicate pending changes with different IDs for the same exercise+tier.
 * This function deduplicates by progressionKey, keeping the most recent.
 */
describe('deduplicatePendingChanges', () => {
  const createPendingChange = (
    id: string,
    progressionKey: string,
    exerciseName: string,
    workoutId: string,
    workoutDate: string
  ): PendingChange => ({
    id,
    exerciseId: progressionKey.split('-')[0] ?? progressionKey,
    exerciseName,
    tier: 'T1',
    type: 'progress',
    progressionKey,
    currentWeight: 100,
    currentStage: 0,
    newWeight: 105,
    newStage: 0,
    newScheme: '5x3+',
    reason: 'Test reason',
    workoutId,
    workoutDate,
    createdAt: workoutDate,
    success: true,
  })

  it('returns empty array when given empty array', () => {
    expect(deduplicatePendingChanges([])).toEqual([])
  })

  it('returns single item unchanged', () => {
    const change = createPendingChange(
      'change-1',
      'squat-T1',
      'T1 Squat',
      'workout-1',
      '2024-01-15T10:00:00Z'
    )
    expect(deduplicatePendingChanges([change])).toEqual([change])
  })

  it('deduplicates by progressionKey, keeping most recent by workoutDate', () => {
    const older = createPendingChange(
      'change-1',
      'squat-T1',
      'T1 Squat',
      'workout-1',
      '2024-01-10T10:00:00Z'
    )
    const newer = createPendingChange(
      'change-2',
      'squat-T1',
      'T1 Squat',
      'workout-2',
      '2024-01-15T10:00:00Z'
    )

    // Order should not matter - always keep the most recent
    expect(deduplicatePendingChanges([older, newer])).toEqual([newer])
    expect(deduplicatePendingChanges([newer, older])).toEqual([newer])
  })

  it('handles same exercise with different tiers (different progressionKeys) separately', () => {
    const squatT1 = createPendingChange(
      'change-1',
      'squat-T1',
      'T1 Squat',
      'workout-1',
      '2024-01-15T10:00:00Z'
    )
    const squatT2 = createPendingChange(
      'change-2',
      'squat-T2',
      'T2 Squat',
      'workout-2',
      '2024-01-16T10:00:00Z'
    )

    const result = deduplicatePendingChanges([squatT1, squatT2])

    // Both should be kept since they have different progressionKeys
    expect(result).toHaveLength(2)
    expect(result).toContainEqual(squatT1)
    expect(result).toContainEqual(squatT2)
  })

  it('handles duplicates from multiple syncs (different IDs, same progressionKey)', () => {
    // Simulates what happens when sync runs multiple times before changes are applied
    const firstSync = createPendingChange(
      'abc123', // First sync generates ID abc123
      'bench-T1',
      'T1 Bench Press',
      'workout-a2',
      '2024-01-15T10:00:00Z'
    )
    const secondSync = createPendingChange(
      'def456', // Second sync generates different ID def456
      'bench-T1',
      'T1 Bench Press',
      'workout-a2', // Same workout
      '2024-01-15T10:00:00Z' // Same date
    )

    // Should deduplicate to just one
    const result = deduplicatePendingChanges([firstSync, secondSync])
    expect(result).toHaveLength(1)
    expect(result[0]?.progressionKey).toBe('bench-T1')
  })

  it('handles multiple exercises correctly', () => {
    const squat = createPendingChange(
      'change-1',
      'squat-T1',
      'T1 Squat',
      'workout-1',
      '2024-01-15T10:00:00Z'
    )
    const bench = createPendingChange(
      'change-2',
      'bench-T1',
      'T1 Bench Press',
      'workout-1',
      '2024-01-15T10:00:00Z'
    )
    const ohp = createPendingChange(
      'change-3',
      'ohp-T2',
      'T2 OHP',
      'workout-1',
      '2024-01-15T10:00:00Z'
    )

    const result = deduplicatePendingChanges([squat, bench, ohp])

    expect(result).toHaveLength(3)
    expect(result).toContainEqual(squat)
    expect(result).toContainEqual(bench)
    expect(result).toContainEqual(ohp)
  })

  it('deduplicates multiple entries for same progressionKey keeping most recent', () => {
    const firstSync = createPendingChange(
      'change-1',
      'squat-T1',
      'T1 Squat',
      'workout-1',
      '2024-01-08T10:00:00Z'
    )
    const secondSync = createPendingChange(
      'change-2',
      'squat-T1',
      'T1 Squat',
      'workout-2',
      '2024-01-10T10:00:00Z'
    )
    const thirdSync = createPendingChange(
      'change-3',
      'squat-T1',
      'T1 Squat',
      'workout-3',
      '2024-01-15T10:00:00Z'
    )

    const result = deduplicatePendingChanges([firstSync, secondSync, thirdSync])

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(thirdSync) // Most recent
  })

  it('handles T3 exercises with exerciseId-based progressionKey', () => {
    const latPulldown = createPendingChange(
      'change-1',
      'ex-lat-pulldown', // T3 uses exerciseId as progressionKey
      'Lat Pulldown',
      'workout-1',
      '2024-01-15T10:00:00Z'
    )
    const facePull = createPendingChange(
      'change-2',
      'ex-face-pull',
      'Face Pull',
      'workout-1',
      '2024-01-15T10:00:00Z'
    )

    const result = deduplicatePendingChanges([latPulldown, facePull])

    expect(result).toHaveLength(2)
    expect(result).toContainEqual(latPulldown)
    expect(result).toContainEqual(facePull)
  })
})
