/**
 * Unit Tests: Exercise Configuration
 *
 * Tests for exercise config creation, slot mapping, and GZCLP structure.
 * [US1] User Story 1 - Initial Program Setup
 */

import { describe, it, expect } from 'vitest'
import {
  TIERS,
  ALL_SLOTS,
  T1_SLOTS,
  T2_SLOTS,
  T3_SLOTS,
  GZCLP_DAYS,
  DAY_EXERCISES,
  DAY_CYCLE,
  getRepScheme,
  SLOT_DEFAULT_MUSCLE_GROUP,
  WEIGHT_INCREMENTS,
} from '@/lib/constants'
import type { GZCLPSlot, Tier } from '@/types/state'

describe('[US1] GZCLP Structure', () => {
  describe('Tiers', () => {
    it('should have exactly 3 tiers', () => {
      expect(TIERS).toEqual(['T1', 'T2', 'T3'])
    })
  })

  describe('Slots', () => {
    it('should have 4 T1 slots for main lifts', () => {
      expect(T1_SLOTS).toHaveLength(4)
      expect(T1_SLOTS).toContain('t1_squat')
      expect(T1_SLOTS).toContain('t1_bench')
      expect(T1_SLOTS).toContain('t1_ohp')
      expect(T1_SLOTS).toContain('t1_deadlift')
    })

    it('should have 4 T2 slots for secondary lifts', () => {
      expect(T2_SLOTS).toHaveLength(4)
      expect(T2_SLOTS).toContain('t2_squat')
      expect(T2_SLOTS).toContain('t2_bench')
      expect(T2_SLOTS).toContain('t2_ohp')
      expect(T2_SLOTS).toContain('t2_deadlift')
    })

    it('should have 3 T3 slots for accessories', () => {
      expect(T3_SLOTS).toHaveLength(3)
    })

    it('should have 11 total slots', () => {
      expect(ALL_SLOTS).toHaveLength(11)
    })
  })

  describe('Days', () => {
    it('should have 4 workout days', () => {
      expect(GZCLP_DAYS).toEqual(['A1', 'B1', 'A2', 'B2'])
    })

    it('should cycle through days correctly', () => {
      expect(DAY_CYCLE['A1']).toBe('B1')
      expect(DAY_CYCLE['B1']).toBe('A2')
      expect(DAY_CYCLE['A2']).toBe('B2')
      expect(DAY_CYCLE['B2']).toBe('A1')
    })
  })

  describe('Day Exercise Mapping', () => {
    it('should map A1 to squat T1 and bench T2', () => {
      expect(DAY_EXERCISES['A1']).toEqual({ t1: 't1_squat', t2: 't2_bench' })
    })

    it('should map B1 to OHP T1 and deadlift T2', () => {
      expect(DAY_EXERCISES['B1']).toEqual({ t1: 't1_ohp', t2: 't2_deadlift' })
    })

    it('should map A2 to bench T1 and squat T2', () => {
      expect(DAY_EXERCISES['A2']).toEqual({ t1: 't1_bench', t2: 't2_squat' })
    })

    it('should map B2 to deadlift T1 and OHP T2', () => {
      expect(DAY_EXERCISES['B2']).toEqual({ t1: 't1_deadlift', t2: 't2_ohp' })
    })
  })
})

describe('[US1] Rep Schemes', () => {
  describe('T1 Schemes', () => {
    it('should return 5x3+ for stage 0', () => {
      const scheme = getRepScheme('T1', 0)
      expect(scheme.sets).toBe(5)
      expect(scheme.reps).toBe(3)
      expect(scheme.amrap).toBe(true)
      expect(scheme.display).toBe('5x3+')
    })

    it('should return 6x2+ for stage 1', () => {
      const scheme = getRepScheme('T1', 1)
      expect(scheme.sets).toBe(6)
      expect(scheme.reps).toBe(2)
      expect(scheme.amrap).toBe(true)
      expect(scheme.display).toBe('6x2+')
    })

    it('should return 10x1+ for stage 2', () => {
      const scheme = getRepScheme('T1', 2)
      expect(scheme.sets).toBe(10)
      expect(scheme.reps).toBe(1)
      expect(scheme.amrap).toBe(true)
      expect(scheme.display).toBe('10x1+')
    })
  })

  describe('T2 Schemes', () => {
    it('should return 3x10 for stage 0', () => {
      const scheme = getRepScheme('T2', 0)
      expect(scheme.sets).toBe(3)
      expect(scheme.reps).toBe(10)
      expect(scheme.amrap).toBe(false)
      expect(scheme.display).toBe('3x10')
    })

    it('should return 3x8 for stage 1', () => {
      const scheme = getRepScheme('T2', 1)
      expect(scheme.sets).toBe(3)
      expect(scheme.reps).toBe(8)
      expect(scheme.amrap).toBe(false)
      expect(scheme.display).toBe('3x8')
    })

    it('should return 3x6 for stage 2', () => {
      const scheme = getRepScheme('T2', 2)
      expect(scheme.sets).toBe(3)
      expect(scheme.reps).toBe(6)
      expect(scheme.amrap).toBe(false)
      expect(scheme.display).toBe('3x6')
    })
  })

  describe('T3 Scheme', () => {
    it('should always return 3x15+ regardless of stage', () => {
      const scheme = getRepScheme('T3', 0)
      expect(scheme.sets).toBe(3)
      expect(scheme.reps).toBe(15)
      expect(scheme.amrap).toBe(true)
      expect(scheme.display).toBe('3x15+')
    })
  })
})

describe('[US1] Muscle Groups and Weight Increments', () => {
  describe('Default Muscle Groups', () => {
    it('should assign lower body to squat and deadlift slots', () => {
      expect(SLOT_DEFAULT_MUSCLE_GROUP['t1_squat']).toBe('lower')
      expect(SLOT_DEFAULT_MUSCLE_GROUP['t1_deadlift']).toBe('lower')
      expect(SLOT_DEFAULT_MUSCLE_GROUP['t2_squat']).toBe('lower')
      expect(SLOT_DEFAULT_MUSCLE_GROUP['t2_deadlift']).toBe('lower')
    })

    it('should assign upper body to bench and OHP slots', () => {
      expect(SLOT_DEFAULT_MUSCLE_GROUP['t1_bench']).toBe('upper')
      expect(SLOT_DEFAULT_MUSCLE_GROUP['t1_ohp']).toBe('upper')
      expect(SLOT_DEFAULT_MUSCLE_GROUP['t2_bench']).toBe('upper')
      expect(SLOT_DEFAULT_MUSCLE_GROUP['t2_ohp']).toBe('upper')
    })
  })

  describe('Weight Increments', () => {
    it('should use 2.5kg/5kg increments for kg unit', () => {
      expect(WEIGHT_INCREMENTS['kg'].upper).toBe(2.5)
      expect(WEIGHT_INCREMENTS['kg'].lower).toBe(5)
    })

    it('should use 5lb/10lb increments for lbs unit', () => {
      expect(WEIGHT_INCREMENTS['lbs'].upper).toBe(5)
      expect(WEIGHT_INCREMENTS['lbs'].lower).toBe(10)
    })
  })
})
