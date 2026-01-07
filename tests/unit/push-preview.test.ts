/**
 * Unit Tests: Push Preview
 *
 * Tests for building push preview diffs comparing local state to Hevy state.
 */

import { describe, it, expect } from 'vitest'
import {
  buildPushPreview,
  buildSelectablePushPreview,
  updatePreviewAction,
  type HevyRoutineState,
} from '@/lib/push-preview'
import type { ExerciseConfig, GZCLPDay, ProgressionState } from '@/types/state'

// =============================================================================
// Test Fixtures
// =============================================================================

function createExercise(
  id: string,
  name: string,
  role: 'squat' | 'bench' | 'ohp' | 'deadlift' | 't3',
  hevyTemplateId: string
): ExerciseConfig {
  return {
    id,
    hevyTemplateId,
    name,
    role,
  }
}

function createProgression(
  currentWeight: number,
  stage: 0 | 1 | 2 = 0
): ProgressionState {
  return {
    exerciseId: '', // Not used in these tests
    currentWeight,
    stage,
    baseWeight: currentWeight,
    lastWorkoutId: null,
    lastWorkoutDate: null,
    amrapRecord: 0,
  }
}

function createHevyState(weights: Record<string, number>): HevyRoutineState {
  return {
    routineId: 'routine-123',
    weights: new Map(Object.entries(weights)),
  }
}

function createEmptyHevyState(): HevyRoutineState {
  return {
    routineId: null,
    weights: new Map(),
  }
}

// Standard test exercises
const exercises: Record<string, ExerciseConfig> = {
  'squat-id': createExercise('squat-id', 'Squat', 'squat', 'hevy-squat'),
  'bench-id': createExercise('bench-id', 'Bench Press', 'bench', 'hevy-bench'),
  'ohp-id': createExercise('ohp-id', 'OHP', 'ohp', 'hevy-ohp'),
  'deadlift-id': createExercise('deadlift-id', 'Deadlift', 'deadlift', 'hevy-deadlift'),
  't3-lat-id': createExercise('t3-lat-id', 'Lat Pulldown', 't3', 'hevy-lat'),
  't3-curl-id': createExercise('t3-curl-id', 'Bicep Curl', 't3', 'hevy-curl'),
}

// Standard T3 schedule (lat pulldown on A days, curls on B days)
const t3Schedule: Record<GZCLPDay, string[]> = {
  A1: ['t3-lat-id'],
  B1: ['t3-curl-id'],
  A2: ['t3-lat-id'],
  B2: ['t3-curl-id'],
}

// =============================================================================
// Tests
// =============================================================================

describe('buildPushPreview', () => {
  describe('new routines (no Hevy state)', () => {
    it('should mark all exercises as changed when routine does not exist', () => {
      const progression: Record<string, ProgressionState> = {
        'squat-T1': createProgression(60),
        'bench-T2': createProgression(40),
        't3-lat-id': createProgression(30),
      }

      const hevyState: Record<GZCLPDay, HevyRoutineState> = {
        A1: createEmptyHevyState(),
        B1: createEmptyHevyState(),
        A2: createEmptyHevyState(),
        B2: createEmptyHevyState(),
      }

      const preview = buildPushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

      // Check A1 day
      const a1 = preview.days.find((d) => d.day === 'A1')!
      expect(a1.routineExists).toBe(false)
      expect(a1.exercises).toHaveLength(3) // T1, T2, T3

      // All should be marked as changed with null old weight
      for (const ex of a1.exercises) {
        expect(ex.oldWeight).toBeNull()
        expect(ex.isChanged).toBe(true)
      }
    })

    it('should count all exercises as changes when no routines exist', () => {
      const progression: Record<string, ProgressionState> = {
        'squat-T1': createProgression(60),
        'bench-T2': createProgression(40),
        't3-lat-id': createProgression(30),
      }

      const hevyState: Record<GZCLPDay, HevyRoutineState> = {
        A1: createEmptyHevyState(),
        B1: createEmptyHevyState(),
        A2: createEmptyHevyState(),
        B2: createEmptyHevyState(),
      }

      const preview = buildPushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

      expect(preview.hasAnyRoutines).toBe(false)
      expect(preview.totalChanges).toBeGreaterThan(0)
    })
  })

  describe('existing routines with changes', () => {
    it('should detect weight increases', () => {
      const progression: Record<string, ProgressionState> = {
        'squat-T1': createProgression(62.5), // increased from 60
        'bench-T2': createProgression(40),
        't3-lat-id': createProgression(30),
      }

      const hevyState: Record<GZCLPDay, HevyRoutineState> = {
        A1: createHevyState({
          'hevy-squat': 60,
          'hevy-bench': 40,
          'hevy-lat': 30,
        }),
        B1: createEmptyHevyState(),
        A2: createEmptyHevyState(),
        B2: createEmptyHevyState(),
      }

      const preview = buildPushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

      const a1 = preview.days.find((d) => d.day === 'A1')!
      expect(a1.routineExists).toBe(true)
      expect(a1.changeCount).toBe(1)

      const squatDiff = a1.exercises.find((e) => e.name === 'Squat')!
      expect(squatDiff.oldWeight).toBe(60)
      expect(squatDiff.newWeight).toBe(62.5)
      expect(squatDiff.isChanged).toBe(true)
    })

    it('should detect weight decreases (deload)', () => {
      const progression: Record<string, ProgressionState> = {
        'squat-T1': createProgression(50, 1), // deloaded from 60, stage 1
        'bench-T2': createProgression(40),
        't3-lat-id': createProgression(30),
      }

      const hevyState: Record<GZCLPDay, HevyRoutineState> = {
        A1: createHevyState({
          'hevy-squat': 60,
          'hevy-bench': 40,
          'hevy-lat': 30,
        }),
        B1: createEmptyHevyState(),
        A2: createEmptyHevyState(),
        B2: createEmptyHevyState(),
      }

      const preview = buildPushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

      const a1 = preview.days.find((d) => d.day === 'A1')!
      const squatDiff = a1.exercises.find((e) => e.name === 'Squat')!
      expect(squatDiff.oldWeight).toBe(60)
      expect(squatDiff.newWeight).toBe(50)
      expect(squatDiff.isChanged).toBe(true)
      expect(squatDiff.stage).toBe(1)
    })
  })

  describe('existing routines with no changes', () => {
    it('should detect when weights match', () => {
      const progression: Record<string, ProgressionState> = {
        'squat-T1': createProgression(60),
        'bench-T2': createProgression(40),
        't3-lat-id': createProgression(30),
      }

      const hevyState: Record<GZCLPDay, HevyRoutineState> = {
        A1: createHevyState({
          'hevy-squat': 60,
          'hevy-bench': 40,
          'hevy-lat': 30,
        }),
        B1: createEmptyHevyState(),
        A2: createEmptyHevyState(),
        B2: createEmptyHevyState(),
      }

      const preview = buildPushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

      const a1 = preview.days.find((d) => d.day === 'A1')!
      expect(a1.changeCount).toBe(0)

      for (const ex of a1.exercises) {
        expect(ex.isChanged).toBe(false)
      }
    })

    it('should handle floating point comparison correctly', () => {
      const progression: Record<string, ProgressionState> = {
        'squat-T1': createProgression(60.0000001), // tiny floating point difference
        'bench-T2': createProgression(40),
        't3-lat-id': createProgression(30),
      }

      const hevyState: Record<GZCLPDay, HevyRoutineState> = {
        A1: createHevyState({
          'hevy-squat': 60,
          'hevy-bench': 40,
          'hevy-lat': 30,
        }),
        B1: createEmptyHevyState(),
        A2: createEmptyHevyState(),
        B2: createEmptyHevyState(),
      }

      const preview = buildPushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

      const a1 = preview.days.find((d) => d.day === 'A1')!
      const squatDiff = a1.exercises.find((e) => e.name === 'Squat')!
      expect(squatDiff.isChanged).toBe(false) // Should ignore tiny differences
    })
  })

  describe('weight unit conversion', () => {
    it('should convert Hevy weights (kg) to lbs when user uses lbs', () => {
      const progression: Record<string, ProgressionState> = {
        'squat-T1': createProgression(130), // lbs (rounded)
        'bench-T2': createProgression(90), // lbs (rounded)
        't3-lat-id': createProgression(65), // lbs (rounded)
      }

      const hevyState: Record<GZCLPDay, HevyRoutineState> = {
        A1: createHevyState({
          'hevy-squat': 60, // kg = ~132 lbs, rounds to 130
          'hevy-bench': 40, // kg = ~88 lbs, rounds to 90
          'hevy-lat': 30, // kg = ~66 lbs, rounds to 65
        }),
        B1: createEmptyHevyState(),
        A2: createEmptyHevyState(),
        B2: createEmptyHevyState(),
      }

      const preview = buildPushPreview(hevyState, exercises, progression, t3Schedule, 'lbs')

      const a1 = preview.days.find((d) => d.day === 'A1')!
      const squatDiff = a1.exercises.find((e) => e.name === 'Squat')!

      // Old weight should be converted from kg to lbs (rounded to nearest 5 lbs)
      // 60kg * 2.20462 = 132.28 lbs, rounded to 130 lbs
      expect(squatDiff.oldWeight).toBe(130)
      expect(squatDiff.newWeight).toBe(130)
      expect(squatDiff.isChanged).toBe(false) // Same after rounding
    })

    it('should detect changes when lbs weights differ after conversion', () => {
      const progression: Record<string, ProgressionState> = {
        'squat-T1': createProgression(135), // lbs - different from converted 130
        'bench-T2': createProgression(90),
        't3-lat-id': createProgression(65),
      }

      const hevyState: Record<GZCLPDay, HevyRoutineState> = {
        A1: createHevyState({
          'hevy-squat': 60, // kg = ~132 lbs, rounds to 130
          'hevy-bench': 40,
          'hevy-lat': 30,
        }),
        B1: createEmptyHevyState(),
        A2: createEmptyHevyState(),
        B2: createEmptyHevyState(),
      }

      const preview = buildPushPreview(hevyState, exercises, progression, t3Schedule, 'lbs')

      const a1 = preview.days.find((d) => d.day === 'A1')!
      const squatDiff = a1.exercises.find((e) => e.name === 'Squat')!

      expect(squatDiff.oldWeight).toBe(130)
      expect(squatDiff.newWeight).toBe(135)
      expect(squatDiff.isChanged).toBe(true)
    })
  })

  describe('tier assignment', () => {
    it('should assign correct tiers to exercises on Day A1', () => {
      const progression: Record<string, ProgressionState> = {
        'squat-T1': createProgression(60),
        'bench-T2': createProgression(40),
        't3-lat-id': createProgression(30),
      }

      const hevyState: Record<GZCLPDay, HevyRoutineState> = {
        A1: createEmptyHevyState(),
        B1: createEmptyHevyState(),
        A2: createEmptyHevyState(),
        B2: createEmptyHevyState(),
      }

      const preview = buildPushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

      const a1 = preview.days.find((d) => d.day === 'A1')!
      expect(a1.exercises.find((e) => e.name === 'Squat')?.tier).toBe('T1')
      expect(a1.exercises.find((e) => e.name === 'Bench Press')?.tier).toBe('T2')
      expect(a1.exercises.find((e) => e.name === 'Lat Pulldown')?.tier).toBe('T3')
    })

    it('should assign correct tiers to exercises on Day B1', () => {
      const progression: Record<string, ProgressionState> = {
        'ohp-T1': createProgression(30),
        'deadlift-T2': createProgression(80),
        't3-curl-id': createProgression(15),
      }

      const hevyState: Record<GZCLPDay, HevyRoutineState> = {
        A1: createEmptyHevyState(),
        B1: createEmptyHevyState(),
        A2: createEmptyHevyState(),
        B2: createEmptyHevyState(),
      }

      const preview = buildPushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

      const b1 = preview.days.find((d) => d.day === 'B1')!
      expect(b1.exercises.find((e) => e.name === 'OHP')?.tier).toBe('T1')
      expect(b1.exercises.find((e) => e.name === 'Deadlift')?.tier).toBe('T2')
      expect(b1.exercises.find((e) => e.name === 'Bicep Curl')?.tier).toBe('T3')
    })
  })

  describe('stage tracking', () => {
    it('should include stage for T1/T2 exercises', () => {
      const progression: Record<string, ProgressionState> = {
        'squat-T1': createProgression(60, 1), // stage 1 (6x2)
        'bench-T2': createProgression(40, 2), // stage 2
        't3-lat-id': createProgression(30),
      }

      const hevyState: Record<GZCLPDay, HevyRoutineState> = {
        A1: createEmptyHevyState(),
        B1: createEmptyHevyState(),
        A2: createEmptyHevyState(),
        B2: createEmptyHevyState(),
      }

      const preview = buildPushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

      const a1 = preview.days.find((d) => d.day === 'A1')!
      expect(a1.exercises.find((e) => e.name === 'Squat')?.stage).toBe(1)
      expect(a1.exercises.find((e) => e.name === 'Bench Press')?.stage).toBe(2)
    })

    it('should have null stage for T3 exercises', () => {
      const progression: Record<string, ProgressionState> = {
        'squat-T1': createProgression(60),
        'bench-T2': createProgression(40),
        't3-lat-id': createProgression(30),
      }

      const hevyState: Record<GZCLPDay, HevyRoutineState> = {
        A1: createEmptyHevyState(),
        B1: createEmptyHevyState(),
        A2: createEmptyHevyState(),
        B2: createEmptyHevyState(),
      }

      const preview = buildPushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

      const a1 = preview.days.find((d) => d.day === 'A1')!
      expect(a1.exercises.find((e) => e.name === 'Lat Pulldown')?.stage).toBeNull()
    })
  })

  describe('total changes calculation', () => {
    it('should count total changes across all days', () => {
      const progression: Record<string, ProgressionState> = {
        // A1: squat changed, bench same
        'squat-T1': createProgression(62.5),
        'bench-T2': createProgression(40),
        't3-lat-id': createProgression(30),
        // B1: ohp changed
        'ohp-T1': createProgression(32.5),
        'deadlift-T2': createProgression(80),
        't3-curl-id': createProgression(15),
      }

      const hevyState: Record<GZCLPDay, HevyRoutineState> = {
        A1: createHevyState({
          'hevy-squat': 60, // changed
          'hevy-bench': 40,
          'hevy-lat': 30,
        }),
        B1: createHevyState({
          'hevy-ohp': 30, // changed
          'hevy-deadlift': 80,
          'hevy-curl': 15,
        }),
        A2: createEmptyHevyState(),
        B2: createEmptyHevyState(),
      }

      const preview = buildPushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

      // A1: 1 change, B1: 1 change, A2: all new (3), B2: all new (3)
      expect(preview.days.find((d) => d.day === 'A1')?.changeCount).toBe(1)
      expect(preview.days.find((d) => d.day === 'B1')?.changeCount).toBe(1)
      expect(preview.totalChanges).toBeGreaterThanOrEqual(2)
    })
  })

  describe('missing exercises', () => {
    it('should handle exercises not found in Hevy routine', () => {
      const progression: Record<string, ProgressionState> = {
        'squat-T1': createProgression(60),
        'bench-T2': createProgression(40),
        't3-lat-id': createProgression(30),
      }

      // Hevy routine exists but is missing the lat pulldown
      const hevyState: Record<GZCLPDay, HevyRoutineState> = {
        A1: createHevyState({
          'hevy-squat': 60,
          'hevy-bench': 40,
          // hevy-lat missing
        }),
        B1: createEmptyHevyState(),
        A2: createEmptyHevyState(),
        B2: createEmptyHevyState(),
      }

      const preview = buildPushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

      const a1 = preview.days.find((d) => d.day === 'A1')!
      const latDiff = a1.exercises.find((e) => e.name === 'Lat Pulldown')!

      expect(latDiff.oldWeight).toBeNull()
      expect(latDiff.newWeight).toBe(30)
      expect(latDiff.isChanged).toBe(true)
    })
  })
})

// =============================================================================
// Selectable Push Preview Tests
// =============================================================================

describe('buildSelectablePushPreview', () => {
  it('should default changed exercises to push action', () => {
    const progression: Record<string, ProgressionState> = {
      'squat-T1': createProgression(62.5), // changed from 60
      'bench-T2': createProgression(40),
      't3-lat-id': createProgression(30),
    }

    const hevyState: Record<GZCLPDay, HevyRoutineState> = {
      A1: createHevyState({
        'hevy-squat': 60,
        'hevy-bench': 40,
        'hevy-lat': 30,
      }),
      B1: createEmptyHevyState(),
      A2: createEmptyHevyState(),
      B2: createEmptyHevyState(),
    }

    const preview = buildSelectablePushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

    const a1 = preview.days.find((d) => d.day === 'A1')!
    const squatDiff = a1.exercises.find((e) => e.name === 'Squat')!

    expect(squatDiff.action).toBe('push')
    expect(squatDiff.isChanged).toBe(true)
  })

  it('should default unchanged exercises to skip action', () => {
    const progression: Record<string, ProgressionState> = {
      'squat-T1': createProgression(60), // same as Hevy
      'bench-T2': createProgression(40),
      't3-lat-id': createProgression(30),
    }

    const hevyState: Record<GZCLPDay, HevyRoutineState> = {
      A1: createHevyState({
        'hevy-squat': 60,
        'hevy-bench': 40,
        'hevy-lat': 30,
      }),
      B1: createEmptyHevyState(),
      A2: createEmptyHevyState(),
      B2: createEmptyHevyState(),
    }

    const preview = buildSelectablePushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

    const a1 = preview.days.find((d) => d.day === 'A1')!
    const squatDiff = a1.exercises.find((e) => e.name === 'Squat')!

    expect(squatDiff.action).toBe('skip')
    expect(squatDiff.isChanged).toBe(false)
  })

  it('should include progressionKey in each diff', () => {
    const progression: Record<string, ProgressionState> = {
      'squat-T1': createProgression(60),
      'bench-T2': createProgression(40),
      't3-lat-id': createProgression(30),
    }

    const hevyState: Record<GZCLPDay, HevyRoutineState> = {
      A1: createEmptyHevyState(),
      B1: createEmptyHevyState(),
      A2: createEmptyHevyState(),
      B2: createEmptyHevyState(),
    }

    const preview = buildSelectablePushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

    const a1 = preview.days.find((d) => d.day === 'A1')!

    // Each exercise should have a progressionKey
    for (const ex of a1.exercises) {
      expect(ex.progressionKey).toBeDefined()
      expect(typeof ex.progressionKey).toBe('string')
    }
  })

  it('should calculate correct push/pull/skip counts', () => {
    const progression: Record<string, ProgressionState> = {
      'squat-T1': createProgression(62.5), // changed
      'bench-T2': createProgression(40), // same
      't3-lat-id': createProgression(30), // same
    }

    const hevyState: Record<GZCLPDay, HevyRoutineState> = {
      A1: createHevyState({
        'hevy-squat': 60,
        'hevy-bench': 40,
        'hevy-lat': 30,
      }),
      B1: createEmptyHevyState(),
      A2: createEmptyHevyState(),
      B2: createEmptyHevyState(),
    }

    const preview = buildSelectablePushPreview(hevyState, exercises, progression, t3Schedule, 'kg')

    // Should have 1 push (squat changed) and 2 skips in A1
    // B1, A2, B2 are all new so all would be pushes
    expect(preview.pushCount).toBeGreaterThan(0)
    expect(preview.pullCount).toBe(0) // No pulls by default
  })
})

describe('updatePreviewAction', () => {
  it('should update action for matching progressionKey', () => {
    const progression: Record<string, ProgressionState> = {
      'squat-T1': createProgression(62.5),
      'bench-T2': createProgression(40),
      't3-lat-id': createProgression(30),
    }

    const hevyState: Record<GZCLPDay, HevyRoutineState> = {
      A1: createHevyState({
        'hevy-squat': 60,
        'hevy-bench': 40,
        'hevy-lat': 30,
      }),
      B1: createEmptyHevyState(),
      A2: createEmptyHevyState(),
      B2: createEmptyHevyState(),
    }

    const preview = buildSelectablePushPreview(hevyState, exercises, progression, t3Schedule, 'kg')
    const a1 = preview.days.find((d) => d.day === 'A1')!
    const squatDiff = a1.exercises.find((e) => e.name === 'Squat')!

    // Initially should be push
    expect(squatDiff.action).toBe('push')

    // Update to pull
    const updated = updatePreviewAction(preview, squatDiff.progressionKey, 'pull')
    const updatedA1 = updated.days.find((d) => d.day === 'A1')!
    const updatedSquat = updatedA1.exercises.find((e) => e.name === 'Squat')!

    expect(updatedSquat.action).toBe('pull')
  })

  it('should update counts when action changes', () => {
    const progression: Record<string, ProgressionState> = {
      'squat-T1': createProgression(62.5),
      'bench-T2': createProgression(40),
      't3-lat-id': createProgression(30),
    }

    const hevyState: Record<GZCLPDay, HevyRoutineState> = {
      A1: createHevyState({
        'hevy-squat': 60,
        'hevy-bench': 40,
        'hevy-lat': 30,
      }),
      B1: createEmptyHevyState(),
      A2: createEmptyHevyState(),
      B2: createEmptyHevyState(),
    }

    const preview = buildSelectablePushPreview(hevyState, exercises, progression, t3Schedule, 'kg')
    const initialPushCount = preview.pushCount
    const initialPullCount = preview.pullCount

    const a1 = preview.days.find((d) => d.day === 'A1')!
    const squatDiff = a1.exercises.find((e) => e.name === 'Squat')!

    // Change from push to pull
    const updated = updatePreviewAction(preview, squatDiff.progressionKey, 'pull')

    expect(updated.pushCount).toBe(initialPushCount - 1)
    expect(updated.pullCount).toBe(initialPullCount + 1)
  })

  it('should not affect other exercises', () => {
    const progression: Record<string, ProgressionState> = {
      'squat-T1': createProgression(62.5),
      'bench-T2': createProgression(42.5), // also changed
      't3-lat-id': createProgression(30),
    }

    const hevyState: Record<GZCLPDay, HevyRoutineState> = {
      A1: createHevyState({
        'hevy-squat': 60,
        'hevy-bench': 40,
        'hevy-lat': 30,
      }),
      B1: createEmptyHevyState(),
      A2: createEmptyHevyState(),
      B2: createEmptyHevyState(),
    }

    const preview = buildSelectablePushPreview(hevyState, exercises, progression, t3Schedule, 'kg')
    const a1 = preview.days.find((d) => d.day === 'A1')!
    const squatDiff = a1.exercises.find((e) => e.name === 'Squat')!
    const benchDiff = a1.exercises.find((e) => e.name === 'Bench Press')!

    // Both should be push initially
    expect(squatDiff.action).toBe('push')
    expect(benchDiff.action).toBe('push')

    // Change squat to skip
    const updated = updatePreviewAction(preview, squatDiff.progressionKey, 'skip')
    const updatedA1 = updated.days.find((d) => d.day === 'A1')!
    const updatedSquat = updatedA1.exercises.find((e) => e.name === 'Squat')!
    const updatedBench = updatedA1.exercises.find((e) => e.name === 'Bench Press')!

    expect(updatedSquat.action).toBe('skip')
    expect(updatedBench.action).toBe('push') // Should still be push
  })
})
