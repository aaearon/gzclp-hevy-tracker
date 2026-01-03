/**
 * Stage Detector Unit Tests
 *
 * Tests for detectStage and extractWeight functions.
 * TDD: These tests are written BEFORE the implementation.
 */

import { describe, it, expect } from 'vitest'
import { detectStage, extractWeight } from '@/lib/stage-detector'
import {
  createNormalSets,
  createNormalSet,
  createSet,
} from '../helpers/routine-mocks'

describe('detectStage', () => {
  describe('T1 detection', () => {
    it('detects 5x3 as Stage 0 with high confidence', () => {
      const sets = createNormalSets(5, 3, 60)
      const result = detectStage(sets, 'T1')

      expect(result).not.toBeNull()
      expect(result!.stage).toBe(0)
      expect(result!.confidence).toBe('high')
      expect(result!.setCount).toBe(5)
      expect(result!.repScheme).toBe('5x3+')
    })

    it('detects 6x2 as Stage 1 with high confidence', () => {
      const sets = createNormalSets(6, 2, 70)
      const result = detectStage(sets, 'T1')

      expect(result).not.toBeNull()
      expect(result!.stage).toBe(1)
      expect(result!.confidence).toBe('high')
      expect(result!.setCount).toBe(6)
      expect(result!.repScheme).toBe('6x2+')
    })

    it('detects 10x1 as Stage 2 with high confidence', () => {
      const sets = createNormalSets(10, 1, 80)
      const result = detectStage(sets, 'T1')

      expect(result).not.toBeNull()
      expect(result!.stage).toBe(2)
      expect(result!.confidence).toBe('high')
      expect(result!.setCount).toBe(10)
      expect(result!.repScheme).toBe('10x1+')
    })

    it('handles AMRAP with higher final reps (uses modal reps)', () => {
      // 4 sets of 3 reps + 1 AMRAP set of 8 reps
      const sets = [
        ...createNormalSets(4, 3, 60),
        createNormalSet(8, 60), // AMRAP set with more reps
      ]
      const result = detectStage(sets, 'T1')

      // Modal reps is 3 (4 sets of 3 vs 1 set of 8)
      expect(result).not.toBeNull()
      expect(result!.stage).toBe(0) // Still detected as 5x3+ (Stage 0)
    })

    it('returns null for unknown T1 pattern', () => {
      const sets = createNormalSets(4, 5, 60) // 4x5 is not a T1 pattern
      const result = detectStage(sets, 'T1')

      expect(result).toBeNull()
    })

    it('returns null for non-matching pattern even with matching set count', () => {
      // 5 sets but with 5 reps each (modal is 5, not 3)
      const sets = createNormalSets(5, 5, 60) // 5x5 is not a T1 pattern
      const result = detectStage(sets, 'T1')

      // 5 sets with 5 reps doesn't match any T1 pattern (5x3, 6x2, 10x1)
      expect(result).toBeNull()
    })
  })

  describe('T2 detection', () => {
    it('detects 3x10 as Stage 0 with high confidence', () => {
      const sets = createNormalSets(3, 10, 40)
      const result = detectStage(sets, 'T2')

      expect(result).not.toBeNull()
      expect(result!.stage).toBe(0)
      expect(result!.confidence).toBe('high')
      expect(result!.setCount).toBe(3)
      expect(result!.repScheme).toBe('3x10')
    })

    it('detects 3x8 as Stage 1 with high confidence', () => {
      const sets = createNormalSets(3, 8, 50)
      const result = detectStage(sets, 'T2')

      expect(result).not.toBeNull()
      expect(result!.stage).toBe(1)
      expect(result!.confidence).toBe('high')
      expect(result!.setCount).toBe(3)
      expect(result!.repScheme).toBe('3x8')
    })

    it('detects 3x6 as Stage 2 with high confidence', () => {
      const sets = createNormalSets(3, 6, 60)
      const result = detectStage(sets, 'T2')

      expect(result).not.toBeNull()
      expect(result!.stage).toBe(2)
      expect(result!.confidence).toBe('high')
      expect(result!.setCount).toBe(3)
      expect(result!.repScheme).toBe('3x6')
    })

    it('returns null for unknown T2 pattern', () => {
      const sets = createNormalSets(3, 12, 30) // 3x12 is not a T2 pattern
      const result = detectStage(sets, 'T2')

      expect(result).toBeNull()
    })

    it('returns null for wrong set count', () => {
      const sets = createNormalSets(4, 10, 40) // 4x10 is not a T2 pattern
      const result = detectStage(sets, 'T2')

      expect(result).toBeNull()
    })
  })

  describe('T3 detection', () => {
    it('always returns Stage 0 for T3', () => {
      const sets = createNormalSets(3, 15, 20)
      const result = detectStage(sets, 'T3')

      expect(result).not.toBeNull()
      expect(result!.stage).toBe(0)
      expect(result!.confidence).toBe('high')
    })

    it('returns Stage 0 regardless of set/rep scheme for T3', () => {
      const sets = createNormalSets(4, 12, 25) // Non-standard T3 scheme
      const result = detectStage(sets, 'T3')

      expect(result).not.toBeNull()
      expect(result!.stage).toBe(0)
    })
  })

  describe('warmup set filtering', () => {
    it('filters out warmup sets before detection', () => {
      const sets = [
        createSet('warmup', 5, 20), // Warmup set
        createSet('warmup', 3, 40), // Warmup set
        ...createNormalSets(5, 3, 60), // 5x3 normal sets
      ]
      const result = detectStage(sets, 'T1')

      expect(result).not.toBeNull()
      expect(result!.stage).toBe(0) // 5x3+ detected correctly
      expect(result!.setCount).toBe(5) // Only counts normal sets
    })

    it('filters out dropsets and failure sets', () => {
      const sets = [
        ...createNormalSets(3, 10, 50), // 3x10 normal sets
        createSet('dropset', 8, 40),
        createSet('failure', 5, 30),
      ]
      const result = detectStage(sets, 'T2')

      expect(result).not.toBeNull()
      expect(result!.stage).toBe(0) // 3x10 detected correctly
      expect(result!.setCount).toBe(3)
    })
  })

  describe('edge cases', () => {
    it('returns null for empty sets array', () => {
      const result = detectStage([], 'T1')
      expect(result).toBeNull()
    })

    it('handles sets with null reps', () => {
      const sets = [
        { ...createNormalSet(3, 60), reps: null },
        ...createNormalSets(4, 3, 60),
      ]
      const result = detectStage(sets, 'T1')

      expect(result).not.toBeNull()
      expect(result!.stage).toBe(0)
    })
  })
})

describe('extractWeight', () => {
  it('extracts max weight from normal sets', () => {
    const sets = [
      createNormalSet(3, 50),
      createNormalSet(3, 60),
      createNormalSet(3, 55),
    ]
    const weight = extractWeight(sets)

    expect(weight).toBe(60)
  })

  it('filters out warmup sets when extracting weight', () => {
    const sets = [
      createSet('warmup', 5, 20),
      createSet('warmup', 3, 40),
      ...createNormalSets(5, 3, 60),
    ]
    const weight = extractWeight(sets)

    expect(weight).toBe(60) // Max from normal sets only
  })

  it('returns 0 for empty sets array', () => {
    const weight = extractWeight([])
    expect(weight).toBe(0)
  })

  it('returns 0 when all weights are null', () => {
    const sets = [
      createSet('normal', 3, null),
      createSet('normal', 3, null),
    ]
    const weight = extractWeight(sets)

    expect(weight).toBe(0)
  })

  it('ignores null weights when finding max', () => {
    const sets = [
      createSet('normal', 3, null),
      createNormalSet(3, 60),
      createSet('normal', 3, null),
    ]
    const weight = extractWeight(sets)

    expect(weight).toBe(60)
  })

  it('handles mixed set types and returns max from normal only', () => {
    const sets = [
      createSet('warmup', 5, 100), // Higher weight but warmup
      createNormalSet(3, 60),
      createSet('dropset', 8, 80), // Higher weight but dropset
    ]
    const weight = extractWeight(sets)

    expect(weight).toBe(60) // Only from normal sets
  })
})
