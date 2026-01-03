/**
 * Unit Tests: Role Utilities
 *
 * Tests for tier derivation and role-based grouping logic.
 */

import { describe, it, expect } from 'vitest'
import {
  getTierForDay,
  getExercisesForDay,
  isMainLiftRole,
  getT1RoleForDay,
  getT2RoleForDay,
} from '@/lib/role-utils'
import type { ExerciseConfig, ExerciseRole, GZCLPDay } from '@/types/state'
import { MAIN_LIFT_ROLES, MULTI_ASSIGN_ROLES } from '@/types/state'

describe('isMainLiftRole', () => {
  it('should return true for main lift roles', () => {
    expect(isMainLiftRole('squat')).toBe(true)
    expect(isMainLiftRole('bench')).toBe(true)
    expect(isMainLiftRole('ohp')).toBe(true)
    expect(isMainLiftRole('deadlift')).toBe(true)
  })

  it('should return false for non-main lift roles', () => {
    expect(isMainLiftRole('t3')).toBe(false)
    expect(isMainLiftRole('warmup')).toBe(false)
    expect(isMainLiftRole('cooldown')).toBe(false)
  })
})

describe('getTierForDay', () => {
  describe('warmup and cooldown', () => {
    it('should return null for warmup on any day', () => {
      const days: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']
      for (const day of days) {
        expect(getTierForDay('warmup', day)).toBeNull()
      }
    })

    it('should return null for cooldown on any day', () => {
      const days: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']
      for (const day of days) {
        expect(getTierForDay('cooldown', day)).toBeNull()
      }
    })
  })

  describe('t3 accessory', () => {
    it('should always return T3', () => {
      const days: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']
      for (const day of days) {
        expect(getTierForDay('t3', day)).toBe('T3')
      }
    })
  })

  describe('main lifts - T1/T2 rotation', () => {
    it('should return correct tier for squat', () => {
      expect(getTierForDay('squat', 'A1')).toBe('T1')
      expect(getTierForDay('squat', 'A2')).toBe('T2')
      expect(getTierForDay('squat', 'B1')).toBeNull()
      expect(getTierForDay('squat', 'B2')).toBeNull()
    })

    it('should return correct tier for bench', () => {
      expect(getTierForDay('bench', 'A1')).toBe('T2')
      expect(getTierForDay('bench', 'A2')).toBe('T1')
      expect(getTierForDay('bench', 'B1')).toBeNull()
      expect(getTierForDay('bench', 'B2')).toBeNull()
    })

    it('should return correct tier for ohp', () => {
      expect(getTierForDay('ohp', 'B1')).toBe('T1')
      expect(getTierForDay('ohp', 'B2')).toBe('T2')
      expect(getTierForDay('ohp', 'A1')).toBeNull()
      expect(getTierForDay('ohp', 'A2')).toBeNull()
    })

    it('should return correct tier for deadlift', () => {
      expect(getTierForDay('deadlift', 'B1')).toBe('T2')
      expect(getTierForDay('deadlift', 'B2')).toBe('T1')
      expect(getTierForDay('deadlift', 'A1')).toBeNull()
      expect(getTierForDay('deadlift', 'A2')).toBeNull()
    })
  })
})

describe('getT1RoleForDay', () => {
  it('should return correct T1 role for each day', () => {
    expect(getT1RoleForDay('A1')).toBe('squat')
    expect(getT1RoleForDay('B1')).toBe('ohp')
    expect(getT1RoleForDay('A2')).toBe('bench')
    expect(getT1RoleForDay('B2')).toBe('deadlift')
  })
})

describe('getT2RoleForDay', () => {
  it('should return correct T2 role for each day', () => {
    expect(getT2RoleForDay('A1')).toBe('bench')
    expect(getT2RoleForDay('B1')).toBe('deadlift')
    expect(getT2RoleForDay('A2')).toBe('squat')
    expect(getT2RoleForDay('B2')).toBe('ohp')
  })
})

describe('getExercisesForDay', () => {
  const createExercise = (
    id: string,
    name: string,
    role: ExerciseRole
  ): ExerciseConfig => ({
    id,
    hevyTemplateId: `hevy-${id}`,
    name,
    role,
  })

  const testExercises: Record<string, ExerciseConfig> = {
    squat: createExercise('squat', 'Back Squat', 'squat'),
    bench: createExercise('bench', 'Bench Press', 'bench'),
    ohp: createExercise('ohp', 'Overhead Press', 'ohp'),
    deadlift: createExercise('deadlift', 'Deadlift', 'deadlift'),
    curls: createExercise('curls', 'Bicep Curls', 't3'),
    rows: createExercise('rows', 'Cable Rows', 't3'),
    stretch: createExercise('stretch', 'Dynamic Stretching', 'warmup'),
    foam: createExercise('foam', 'Foam Rolling', 'cooldown'),
  }

  describe('day A1', () => {
    it('should return squat as T1 and bench as T2', () => {
      const result = getExercisesForDay(testExercises, 'A1')
      expect(result.t1?.id).toBe('squat')
      expect(result.t2?.id).toBe('bench')
    })

    it('should return T3 exercises', () => {
      const result = getExercisesForDay(testExercises, 'A1')
      expect(result.t3.map(e => e.id)).toEqual(['curls', 'rows'])
    })

    it('should return warmup and cooldown exercises', () => {
      const result = getExercisesForDay(testExercises, 'A1')
      expect(result.warmup.map(e => e.id)).toEqual(['stretch'])
      expect(result.cooldown.map(e => e.id)).toEqual(['foam'])
    })
  })

  describe('day B1', () => {
    it('should return ohp as T1 and deadlift as T2', () => {
      const result = getExercisesForDay(testExercises, 'B1')
      expect(result.t1?.id).toBe('ohp')
      expect(result.t2?.id).toBe('deadlift')
    })
  })

  describe('day A2', () => {
    it('should return bench as T1 and squat as T2', () => {
      const result = getExercisesForDay(testExercises, 'A2')
      expect(result.t1?.id).toBe('bench')
      expect(result.t2?.id).toBe('squat')
    })
  })

  describe('day B2', () => {
    it('should return deadlift as T1 and ohp as T2', () => {
      const result = getExercisesForDay(testExercises, 'B2')
      expect(result.t1?.id).toBe('deadlift')
      expect(result.t2?.id).toBe('ohp')
    })
  })

  describe('missing exercises', () => {
    it('should return null for missing main lifts', () => {
      const partial: Record<string, ExerciseConfig> = {
        curls: createExercise('curls', 'Bicep Curls', 't3'),
      }
      const result = getExercisesForDay(partial, 'A1')
      expect(result.t1).toBeNull()
      expect(result.t2).toBeNull()
    })

    it('should return empty arrays for missing warmup/cooldown/t3', () => {
      const mainOnly: Record<string, ExerciseConfig> = {
        squat: createExercise('squat', 'Back Squat', 'squat'),
      }
      const result = getExercisesForDay(mainOnly, 'A1')
      expect(result.warmup).toEqual([])
      expect(result.cooldown).toEqual([])
      expect(result.t3).toEqual([])
    })
  })
})

describe('role constants', () => {
  it('should have 4 main lift roles', () => {
    expect(MAIN_LIFT_ROLES).toHaveLength(4)
    expect(MAIN_LIFT_ROLES).toEqual(['squat', 'bench', 'ohp', 'deadlift'])
  })

  it('should have 3 multi-assign roles', () => {
    expect(MULTI_ASSIGN_ROLES).toHaveLength(3)
    expect(MULTI_ASSIGN_ROLES).toEqual(['t3', 'warmup', 'cooldown'])
  })
})
