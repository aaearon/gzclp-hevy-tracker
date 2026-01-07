/**
 * Unit Tests: Discrepancy Acknowledgment Persistence
 *
 * Tests for the bug fix where clicking "Keep" on a discrepancy should
 * persist the acknowledgment so the discrepancy doesn't reappear on refresh.
 *
 * Bug: When user clicks "Keep", subsequent syncs showed the same discrepancy again.
 * Fix: Store acknowledged discrepancies in localStorage state.
 */

import { describe, it, expect } from 'vitest'
import type { AcknowledgedDiscrepancy, Tier } from '@/types/state'

interface DiscrepancyInfo {
  exerciseId: string
  exerciseName: string
  tier: Tier
  storedWeight: number
  actualWeight: number
  workoutId: string
  workoutDate: string
}

/**
 * Filter discrepancies against acknowledged list.
 * This mirrors the logic in Dashboard/index.tsx.
 */
function filterUnresolvedDiscrepancies(
  discrepancies: DiscrepancyInfo[],
  acknowledgedDiscrepancies: AcknowledgedDiscrepancy[]
): DiscrepancyInfo[] {
  return discrepancies.filter((d) => {
    const isAcknowledged = acknowledgedDiscrepancies.some(
      (ack) =>
        ack.exerciseId === d.exerciseId &&
        ack.acknowledgedWeight === d.actualWeight &&
        ack.tier === d.tier
    )
    return !isAcknowledged
  })
}

describe('Discrepancy Acknowledgment Persistence', () => {
  const createDiscrepancy = (
    exerciseId: string,
    name: string,
    tier: Tier,
    stored: number,
    actual: number
  ): DiscrepancyInfo => ({
    exerciseId,
    exerciseName: name,
    tier,
    storedWeight: stored,
    actualWeight: actual,
    workoutId: 'workout-1',
    workoutDate: '2024-01-15',
  })

  describe('filtering logic', () => {
    it('filters out acknowledged discrepancy with matching exerciseId, weight, and tier', () => {
      const discrepancies = [
        createDiscrepancy('lat-pulldown-123', 'Lat Pulldown', 'T3', 30, 25),
      ]

      const acknowledged: AcknowledgedDiscrepancy[] = [
        { exerciseId: 'lat-pulldown-123', acknowledgedWeight: 25, tier: 'T3' },
      ]

      const unresolved = filterUnresolvedDiscrepancies(discrepancies, acknowledged)
      expect(unresolved).toHaveLength(0)
    })

    it('does NOT filter discrepancy with different actualWeight', () => {
      const discrepancies = [
        createDiscrepancy('lat-pulldown-123', 'Lat Pulldown', 'T3', 30, 27), // Different weight
      ]

      const acknowledged: AcknowledgedDiscrepancy[] = [
        { exerciseId: 'lat-pulldown-123', acknowledgedWeight: 25, tier: 'T3' }, // Acknowledged 25kg
      ]

      const unresolved = filterUnresolvedDiscrepancies(discrepancies, acknowledged)
      expect(unresolved).toHaveLength(1)
      expect(unresolved[0]?.actualWeight).toBe(27)
    })

    it('does NOT filter discrepancy with different tier', () => {
      const discrepancies = [
        createDiscrepancy('squat-123', 'Squat', 'T2', 70, 65), // T2
      ]

      const acknowledged: AcknowledgedDiscrepancy[] = [
        { exerciseId: 'squat-123', acknowledgedWeight: 65, tier: 'T1' }, // Acknowledged T1
      ]

      const unresolved = filterUnresolvedDiscrepancies(discrepancies, acknowledged)
      expect(unresolved).toHaveLength(1)
    })

    it('does NOT filter discrepancy with different exerciseId', () => {
      const discrepancies = [
        createDiscrepancy('hammer-curl-456', 'Hammer Curl', 'T3', 14, 12),
      ]

      const acknowledged: AcknowledgedDiscrepancy[] = [
        { exerciseId: 'lat-pulldown-123', acknowledgedWeight: 12, tier: 'T3' }, // Different exercise
      ]

      const unresolved = filterUnresolvedDiscrepancies(discrepancies, acknowledged)
      expect(unresolved).toHaveLength(1)
    })

    it('filters multiple acknowledged discrepancies correctly', () => {
      const discrepancies = [
        createDiscrepancy('lat-pulldown-123', 'Lat Pulldown', 'T3', 30, 25),
        createDiscrepancy('hammer-curl-456', 'Hammer Curl', 'T3', 14, 12),
        createDiscrepancy('squat-789', 'Squat', 'T1', 100, 95),
      ]

      const acknowledged: AcknowledgedDiscrepancy[] = [
        { exerciseId: 'lat-pulldown-123', acknowledgedWeight: 25, tier: 'T3' },
        { exerciseId: 'squat-789', acknowledgedWeight: 95, tier: 'T1' },
      ]

      const unresolved = filterUnresolvedDiscrepancies(discrepancies, acknowledged)
      expect(unresolved).toHaveLength(1)
      expect(unresolved[0]?.exerciseId).toBe('hammer-curl-456')
    })

    it('handles empty acknowledged list', () => {
      const discrepancies = [
        createDiscrepancy('lat-pulldown-123', 'Lat Pulldown', 'T3', 30, 25),
      ]

      const unresolved = filterUnresolvedDiscrepancies(discrepancies, [])
      expect(unresolved).toHaveLength(1)
    })

    it('handles empty discrepancies list', () => {
      const acknowledged: AcknowledgedDiscrepancy[] = [
        { exerciseId: 'lat-pulldown-123', acknowledgedWeight: 25, tier: 'T3' },
      ]

      const unresolved = filterUnresolvedDiscrepancies([], acknowledged)
      expect(unresolved).toHaveLength(0)
    })
  })

  describe('user scenario: clicking Keep persists acknowledgment', () => {
    it('simulates: user sees discrepancy, clicks Keep, syncs again - discrepancy hidden', () => {
      // Initial state: no acknowledgments
      const acknowledgedDiscrepancies: AcknowledgedDiscrepancy[] = []

      // First sync detects discrepancy
      const firstSyncDiscrepancies = [
        createDiscrepancy('lat-pulldown-123', 'Lat Pulldown (Cable)', 'T3', 30, 25),
      ]

      // User sees discrepancy
      let unresolved = filterUnresolvedDiscrepancies(firstSyncDiscrepancies, acknowledgedDiscrepancies)
      expect(unresolved).toHaveLength(1)

      // User clicks "Keep 30kg" - this should acknowledge the 25kg Hevy weight
      acknowledgedDiscrepancies.push({
        exerciseId: 'lat-pulldown-123',
        acknowledgedWeight: 25, // The Hevy weight being acknowledged
        tier: 'T3',
      })

      // Second sync: same discrepancy detected from Hevy data
      const secondSyncDiscrepancies = [
        createDiscrepancy('lat-pulldown-123', 'Lat Pulldown (Cable)', 'T3', 30, 25),
      ]

      // Discrepancy should now be filtered out
      unresolved = filterUnresolvedDiscrepancies(secondSyncDiscrepancies, acknowledgedDiscrepancies)
      expect(unresolved).toHaveLength(0)
    })

    it('simulates: new workout with different weight still shows discrepancy', () => {
      // User previously acknowledged 25kg discrepancy
      const acknowledgedDiscrepancies: AcknowledgedDiscrepancy[] = [
        { exerciseId: 'lat-pulldown-123', acknowledgedWeight: 25, tier: 'T3' },
      ]

      // New workout: user did 22kg this time (different discrepancy)
      const newSyncDiscrepancies = [
        createDiscrepancy('lat-pulldown-123', 'Lat Pulldown (Cable)', 'T3', 30, 22),
      ]

      // Should show as new discrepancy since it's a different weight
      const unresolved = filterUnresolvedDiscrepancies(newSyncDiscrepancies, acknowledgedDiscrepancies)
      expect(unresolved).toHaveLength(1)
      expect(unresolved[0]?.actualWeight).toBe(22)
    })
  })
})
