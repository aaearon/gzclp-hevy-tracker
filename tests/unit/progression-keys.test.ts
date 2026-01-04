/**
 * Unit Tests: Progression Keys
 *
 * Tests for the getProgressionKey function that generates composite keys
 * for T1/T2 progression tracking.
 * [US1] User Story 1 - Independent Progression Tracking
 */

import { describe, it, expect } from 'vitest'
import { getProgressionKey } from '@/lib/role-utils'

describe('getProgressionKey', () => {
  describe('main lifts with T1 tier', () => {
    it('returns "squat-T1" for squat role with T1 tier', () => {
      expect(getProgressionKey('uuid-123', 'squat', 'T1')).toBe('squat-T1')
    })

    it('returns "bench-T1" for bench role with T1 tier', () => {
      expect(getProgressionKey('uuid-456', 'bench', 'T1')).toBe('bench-T1')
    })

    it('returns "ohp-T1" for ohp role with T1 tier', () => {
      expect(getProgressionKey('uuid-789', 'ohp', 'T1')).toBe('ohp-T1')
    })

    it('returns "deadlift-T1" for deadlift role with T1 tier', () => {
      expect(getProgressionKey('uuid-000', 'deadlift', 'T1')).toBe('deadlift-T1')
    })
  })

  describe('main lifts with T2 tier', () => {
    it('returns "squat-T2" for squat role with T2 tier', () => {
      expect(getProgressionKey('uuid-123', 'squat', 'T2')).toBe('squat-T2')
    })

    it('returns "bench-T2" for bench role with T2 tier', () => {
      expect(getProgressionKey('uuid-456', 'bench', 'T2')).toBe('bench-T2')
    })

    it('returns "ohp-T2" for ohp role with T2 tier', () => {
      expect(getProgressionKey('uuid-789', 'ohp', 'T2')).toBe('ohp-T2')
    })

    it('returns "deadlift-T2" for deadlift role with T2 tier', () => {
      expect(getProgressionKey('uuid-000', 'deadlift', 'T2')).toBe('deadlift-T2')
    })
  })

  describe('T3 exercises', () => {
    it('returns exerciseId for t3 role', () => {
      expect(getProgressionKey('uuid-789', 't3', 'T3')).toBe('uuid-789')
    })

    it('returns exerciseId for undefined role', () => {
      expect(getProgressionKey('uuid-000', undefined, 'T3')).toBe('uuid-000')
    })

    it('returns exerciseId for warmup role', () => {
      expect(getProgressionKey('uuid-111', 'warmup', 'T3')).toBe('uuid-111')
    })

    it('returns exerciseId for cooldown role', () => {
      expect(getProgressionKey('uuid-222', 'cooldown', 'T3')).toBe('uuid-222')
    })
  })

  describe('edge cases', () => {
    it('returns exerciseId for main lift role with T3 tier', () => {
      // Edge case: main lift role but T3 context (shouldn't normally happen)
      expect(getProgressionKey('uuid-333', 'squat', 'T3')).toBe('uuid-333')
    })

    it('handles all four main lifts consistently', () => {
      const mainLifts = ['squat', 'bench', 'ohp', 'deadlift'] as const
      const tiers = ['T1', 'T2'] as const

      for (const role of mainLifts) {
        for (const tier of tiers) {
          const key = getProgressionKey('test-id', role, tier)
          expect(key).toBe(`${role}-${tier}`)
        }
      }
    })
  })
})
