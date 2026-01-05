/**
 * Unit Tests: Exercise Configuration
 *
 * Tests for exercise config creation, role mapping, and GZCLP structure.
 * [US1] User Story 1 - Initial Program Setup
 *
 * Updated for role-based system (Feature 004).
 */

import { describe, it, expect } from 'vitest'
import {
  TIERS,
  GZCLP_DAYS,
  DAY_CYCLE,
  getRepScheme,
  WEIGHT_INCREMENTS,
  EXERCISE_ROLES,
  ROLE_DISPLAY,
} from '@/lib/constants'

describe('[US1] GZCLP Structure', () => {
  describe('Tiers', () => {
    it('should have exactly 3 tiers', () => {
      expect(TIERS).toEqual(['T1', 'T2', 'T3'])
    })
  })

  describe('Exercise Roles', () => {
    it('should have 5 exercise roles (warmup/cooldown removed in Task 2.1b)', () => {
      expect(EXERCISE_ROLES).toHaveLength(5)
    })

    it('should include all main lifts', () => {
      expect(EXERCISE_ROLES).toContain('squat')
      expect(EXERCISE_ROLES).toContain('bench')
      expect(EXERCISE_ROLES).toContain('deadlift')
      expect(EXERCISE_ROLES).toContain('ohp')
    })

    it('should include t3 accessory role', () => {
      expect(EXERCISE_ROLES).toContain('t3')
    })

    it('should NOT include warmup and cooldown roles (removed in Task 2.1b)', () => {
      expect(EXERCISE_ROLES).not.toContain('warmup')
      expect(EXERCISE_ROLES).not.toContain('cooldown')
    })
  })

  describe('Role Display Names', () => {
    it('should have display info for all 5 roles', () => {
      expect(ROLE_DISPLAY.squat).toBeDefined()
      expect(ROLE_DISPLAY.bench).toBeDefined()
      expect(ROLE_DISPLAY.deadlift).toBeDefined()
      expect(ROLE_DISPLAY.ohp).toBeDefined()
      expect(ROLE_DISPLAY.t3).toBeDefined()
      // warmup and cooldown removed in Task 2.1b
    })

    it('should have label and description for each role', () => {
      expect(ROLE_DISPLAY.squat.label).toBe('Squat')
      expect(ROLE_DISPLAY.squat.description).toBeDefined()
      expect(ROLE_DISPLAY.t3.label).toBe('T3 Accessory')
    })
  })

  describe('Days', () => {
    it('should have 4 workout days', () => {
      expect(GZCLP_DAYS).toEqual(['A1', 'B1', 'A2', 'B2'])
    })

    it('should cycle through days correctly', () => {
      expect(DAY_CYCLE.A1).toBe('B1')
      expect(DAY_CYCLE.B1).toBe('A2')
      expect(DAY_CYCLE.A2).toBe('B2')
      expect(DAY_CYCLE.B2).toBe('A1')
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

describe('[US1] Weight Increments', () => {
  describe('Weight Increments', () => {
    it('should use 2.5kg/5kg increments for kg unit', () => {
      expect(WEIGHT_INCREMENTS.kg.upper).toBe(2.5)
      expect(WEIGHT_INCREMENTS.kg.lower).toBe(5)
    })

    it('should use 5lb/10lb increments for lbs unit', () => {
      expect(WEIGHT_INCREMENTS.lbs.upper).toBe(5)
      expect(WEIGHT_INCREMENTS.lbs.lower).toBe(10)
    })
  })
})
