/**
 * Unit Tests: Program Builder
 *
 * Tests for pure functions that build GZCLPState from wizard inputs.
 * Uses TDD approach - tests written before implementation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  GZCLPState,
  GZCLPDay,
  ImportResult,
  DayImportData,
  ImportedExercise,
  ExerciseHistory,
  MainLiftRole,
} from '@/types/state'
import { isSetupRequired } from '@/lib/state-factory'

// Mock generateId to return predictable UUIDs
vi.mock('@/utils/id', () => ({
  generateId: vi.fn(),
}))

// Import after mock setup
import { generateId } from '@/utils/id'
import {
  buildImportProgramState,
  buildCreateProgramState,
  type ImportPathParams,
  type CreatePathParams,
} from '@/lib/program-builder'

describe('buildImportProgramState', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Setup mock to return sequential UUIDs
    let callCount = 0
    vi.mocked(generateId).mockImplementation(() => `uuid-${++callCount}`)
  })

  /**
   * Helper to create a minimal ImportedExercise
   */
  function createImportedExercise(
    name: string,
    templateId: string,
    options: Partial<ImportedExercise> = {}
  ): ImportedExercise {
    return {
      templateId,
      name,
      detectedWeight: 60,
      detectedStage: 0,
      stageConfidence: 'high',
      originalSetCount: 5,
      originalRepScheme: '5x3+',
      ...options,
    }
  }

  /**
   * Helper to create a minimal valid ImportResult
   */
  function createMinimalImportResult(): ImportResult {
    return {
      byDay: {
        A1: {
          day: 'A1',
          t1: createImportedExercise('Back Squat', 'squat-template'),
          t2: createImportedExercise('Bench Press', 'bench-template'),
          t3s: [],
        },
        B1: {
          day: 'B1',
          t1: createImportedExercise('Overhead Press', 'ohp-template'),
          t2: createImportedExercise('Deadlift', 'deadlift-template'),
          t3s: [],
        },
        A2: {
          day: 'A2',
          t1: createImportedExercise('Bench Press', 'bench-template'),
          t2: createImportedExercise('Back Squat', 'squat-template'),
          t3s: [],
        },
        B2: {
          day: 'B2',
          t1: createImportedExercise('Deadlift', 'deadlift-template'),
          t2: createImportedExercise('Overhead Press', 'ohp-template'),
          t3s: [],
        },
      },
      warnings: [],
      routineIds: { A1: 'r1', B1: 'r2', A2: 'r3', B2: 'r4' },
    }
  }

  /**
   * Helper to create minimal ImportPathParams
   */
  function createImportParams(
    overrides: Partial<ImportPathParams> = {}
  ): ImportPathParams {
    return {
      importResult: createMinimalImportResult(),
      selectedDay: 'A1',
      apiKey: 'test-api-key',
      unit: 'kg',
      workoutsPerWeek: 3,
      workoutStats: {
        createdAt: '2026-01-01T00:00:00.000Z',
        totalWorkouts: 10,
        mostRecentWorkoutDate: '2026-01-09T00:00:00.000Z',
      },
      progressionHistory: {},
      ...overrides,
    }
  }

  it('should build valid GZCLPState from ImportResult', () => {
    const params = createImportParams()
    const state = buildImportProgramState(params)

    // Should have required top-level fields
    expect(state.version).toBeDefined()
    expect(state.apiKey).toBe('test-api-key')
    expect(state.program).toBeDefined()
    expect(state.exercises).toBeDefined()
    expect(state.progression).toBeDefined()
    expect(state.settings).toBeDefined()
    expect(state.t3Schedule).toBeDefined()
    expect(state.progressionHistory).toBeDefined()
  })

  it('should set apiKey and exercises so isSetupRequired returns false', () => {
    const params = createImportParams()
    const state = buildImportProgramState(params)

    // This is the critical success criterion
    expect(isSetupRequired(state)).toBe(false)
    expect(state.apiKey).toBe('test-api-key')
    expect(Object.keys(state.exercises).length).toBeGreaterThan(0)
  })

  it('should deduplicate exercises across days (same templateId)', () => {
    // Squat appears on A1 (T1) and A2 (T2) with same templateId
    // Should result in ONE exercise entry, not two
    const params = createImportParams()
    const state = buildImportProgramState(params)

    // Count exercises with squat role
    const squatExercises = Object.values(state.exercises).filter(
      (e) => e.role === 'squat'
    )
    expect(squatExercises).toHaveLength(1)

    // The deduplicated exercise should have the correct role
    expect(squatExercises[0].hevyTemplateId).toBe('squat-template')
  })

  it('should generate correct progression keys for main lifts (role-tier format)', () => {
    const params = createImportParams()
    const state = buildImportProgramState(params)

    // Main lifts should have keys like "squat-T1", "squat-T2", etc.
    expect(state.progression['squat-T1']).toBeDefined()
    expect(state.progression['squat-T2']).toBeDefined()
    expect(state.progression['bench-T1']).toBeDefined()
    expect(state.progression['bench-T2']).toBeDefined()
    expect(state.progression['ohp-T1']).toBeDefined()
    expect(state.progression['ohp-T2']).toBeDefined()
    expect(state.progression['deadlift-T1']).toBeDefined()
    expect(state.progression['deadlift-T2']).toBeDefined()
  })

  it('should use exerciseId as progression key for T3 exercises', () => {
    const params = createImportParams({
      importResult: {
        ...createMinimalImportResult(),
        byDay: {
          ...createMinimalImportResult().byDay,
          A1: {
            ...createMinimalImportResult().byDay.A1,
            t3s: [
              createImportedExercise('Lat Pulldown', 't3-lat-template', {
                role: 't3',
              }),
            ],
          },
        },
      },
    })

    const state = buildImportProgramState(params)

    // Find the T3 exercise
    const t3Exercise = Object.values(state.exercises).find(
      (e) => e.role === 't3'
    )
    expect(t3Exercise).toBeDefined()

    // T3 progression key should be the exerciseId itself
    expect(state.progression[t3Exercise!.id]).toBeDefined()
  })

  it('should include progression history in state', () => {
    const mockHistory: Record<string, ExerciseHistory> = {
      'squat-T1': {
        progressionKey: 'squat-T1',
        exerciseName: 'Back Squat',
        tier: 'T1',
        role: 'squat',
        entries: [
          {
            date: '2026-01-08T00:00:00.000Z',
            workoutId: 'w1',
            weight: 60,
            stage: 0,
            tier: 'T1',
            success: true,
            changeType: 'progress',
          },
        ],
      },
    }

    const params = createImportParams({
      progressionHistory: mockHistory,
    })

    const state = buildImportProgramState(params)

    expect(state.progressionHistory).toBe(mockHistory)
  })

  it('should set workout stats from params', () => {
    const params = createImportParams({
      workoutStats: {
        createdAt: '2026-01-01T12:00:00.000Z',
        totalWorkouts: 25,
        mostRecentWorkoutDate: '2026-01-09T18:30:00.000Z',
      },
    })

    const state = buildImportProgramState(params)

    expect(state.program.createdAt).toBe('2026-01-01T12:00:00.000Z')
    expect(state.totalWorkouts).toBe(25)
    expect(state.mostRecentWorkoutDate).toBe('2026-01-09T18:30:00.000Z')
  })

  it('should set currentDay from selectedDay', () => {
    const params = createImportParams({ selectedDay: 'B2' })
    const state = buildImportProgramState(params)

    expect(state.program.currentDay).toBe('B2')
  })

  it('should set routine IDs from import result', () => {
    const params = createImportParams()
    const state = buildImportProgramState(params)

    expect(state.program.hevyRoutineIds).toEqual({
      A1: 'r1',
      B1: 'r2',
      A2: 'r3',
      B2: 'r4',
    })
  })

  it('should build t3Schedule from import byDay structure', () => {
    // Setup: T3s on specific days
    const importResult = createMinimalImportResult()
    importResult.byDay.A1.t3s = [
      createImportedExercise('Lat Pulldown', 't3-lat', { role: 't3' }),
    ]
    importResult.byDay.B1.t3s = [
      createImportedExercise('Bicep Curls', 't3-curl', { role: 't3' }),
    ]
    importResult.byDay.A2.t3s = [
      createImportedExercise('Lat Pulldown', 't3-lat', { role: 't3' }), // Same as A1
    ]

    const params = createImportParams({ importResult })
    const state = buildImportProgramState(params)

    // Lat Pulldown on A1 and A2 should use same exerciseId (deduplicated)
    const latExercise = Object.values(state.exercises).find(
      (e) => e.name === 'Lat Pulldown'
    )
    expect(latExercise).toBeDefined()

    // t3Schedule should have correct IDs per day
    expect(state.t3Schedule.A1).toContain(latExercise!.id)
    expect(state.t3Schedule.A2).toContain(latExercise!.id)
    expect(state.t3Schedule.B1.length).toBe(1) // Curls
    expect(state.t3Schedule.B2).toEqual([]) // Empty
  })

  it('should set weight unit in settings', () => {
    const params = createImportParams({ unit: 'lbs' })
    const state = buildImportProgramState(params)

    expect(state.settings.weightUnit).toBe('lbs')
  })

  it('should set workoutsPerWeek in program config', () => {
    const params = createImportParams({ workoutsPerWeek: 4 })
    const state = buildImportProgramState(params)

    expect(state.program.workoutsPerWeek).toBe(4)
  })

  it('should use userWeight/userStage if provided, falling back to suggestion then detected', () => {
    const importResult = createMinimalImportResult()
    // Override T1 squat with user overrides
    importResult.byDay.A1.t1 = createImportedExercise('Back Squat', 'squat-template', {
      detectedWeight: 60,
      detectedStage: 0,
      userWeight: 70, // User override
      userStage: 1,
      analysis: {
        performance: {
          workoutId: 'w1',
          workoutDate: '2026-01-08T00:00:00.000Z',
          targetReps: 15,
          actualReps: 17,
          success: true,
          amrapReps: 5,
        },
        suggestion: {
          suggestedWeight: 65,
          suggestedStage: 0,
          amrapReps: 5,
        },
      },
    })

    const params = createImportParams({ importResult })
    const state = buildImportProgramState(params)

    expect(state.progression['squat-T1'].currentWeight).toBe(70)
    expect(state.progression['squat-T1'].stage).toBe(1)
  })

  it('should set lastWorkoutId/Date from analysis to prevent false discrepancies', () => {
    const importResult = createMinimalImportResult()
    importResult.byDay.A1.t1 = createImportedExercise('Back Squat', 'squat-template', {
      analysis: {
        performance: {
          workoutId: 'workout-123',
          workoutDate: '2026-01-08T00:00:00.000Z',
          targetReps: 15,
          actualReps: 17,
          success: true,
        },
        suggestion: {
          suggestedWeight: 60,
          suggestedStage: 0,
        },
      },
    })

    const params = createImportParams({ importResult })
    const state = buildImportProgramState(params)

    expect(state.progression['squat-T1'].lastWorkoutId).toBe('workout-123')
    expect(state.progression['squat-T1'].lastWorkoutDate).toBe('2026-01-08T00:00:00.000Z')
  })

  it('should handle same exercise used as both main lift and T3 (edge case)', () => {
    // Edge case: User imports "Barbell Row" as T2 deadlift AND as a T3 on different day
    const importResult = createMinimalImportResult()
    // Add the same exercise as T3 on day A1
    importResult.byDay.A1.t3s = [
      createImportedExercise('Deadlift', 'deadlift-template', {
        role: 't3',
        detectedWeight: 50,
      }),
    ]

    const params = createImportParams({ importResult })
    const state = buildImportProgramState(params)

    // Should have the exercise (deduplicated)
    const deadliftExercises = Object.values(state.exercises).filter(
      (e) => e.hevyTemplateId === 'deadlift-template'
    )
    expect(deadliftExercises).toHaveLength(1)

    const exerciseId = deadliftExercises[0].id

    // Main lift progressions should exist
    expect(state.progression['deadlift-T1']).toBeDefined()
    expect(state.progression['deadlift-T2']).toBeDefined()

    // T3 progression (using exerciseId as key) should ALSO exist
    expect(state.progression[exerciseId]).toBeDefined()
    expect(state.progression[exerciseId].currentWeight).toBe(50)
  })

  it('should handle T3 added after main lift was already processed (processing order bug)', () => {
    // Critical edge case: Squat is processed on A1 as T1, then same exercise used as T3 on B2
    // B2 is processed AFTER A1, so the exercise already exists when T3 is encountered
    const importResult = createMinimalImportResult()
    // Add squat as T3 on day B2 (processed after A1 where squat is T1)
    importResult.byDay.B2.t3s = [
      createImportedExercise('Back Squat', 'squat-template', {
        role: 't3',
        detectedWeight: 40, // Different weight for T3
      }),
    ]

    const params = createImportParams({ importResult })
    const state = buildImportProgramState(params)

    // Should have the exercise (deduplicated)
    const squatExercises = Object.values(state.exercises).filter(
      (e) => e.hevyTemplateId === 'squat-template'
    )
    expect(squatExercises).toHaveLength(1)

    const exerciseId = squatExercises[0].id

    // Main lift progressions should exist
    expect(state.progression['squat-T1']).toBeDefined()
    expect(state.progression['squat-T2']).toBeDefined()

    // T3 progression (using exerciseId as key) should ALSO exist
    // This is the bug Gemini identified - this would be undefined before fix
    expect(state.progression[exerciseId]).toBeDefined()
    expect(state.progression[exerciseId].currentWeight).toBe(40)
  })
})

describe('buildCreateProgramState', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    let callCount = 0
    vi.mocked(generateId).mockImplementation(() => `uuid-${++callCount}`)
  })

  /**
   * Helper to create minimal CreatePathParams
   */
  function createCreateParams(
    overrides: Partial<CreatePathParams> = {}
  ): CreatePathParams {
    return {
      assignments: {
        mainLifts: {
          squat: 'squat-template',
          bench: 'bench-template',
          ohp: 'ohp-template',
          deadlift: 'deadlift-template',
        },
        t3Exercises: { A1: [], B1: [], A2: [], B2: [] },
      },
      weights: {
        squat: 60,
        bench: 40,
        ohp: 30,
        deadlift: 80,
      },
      exerciseTemplates: [
        { id: 'squat-template', title: 'Back Squat' },
        { id: 'bench-template', title: 'Bench Press' },
        { id: 'ohp-template', title: 'Overhead Press' },
        { id: 'deadlift-template', title: 'Deadlift' },
        { id: 't3-lat-template', title: 'Lat Pulldown' },
        { id: 't3-curl-template', title: 'Bicep Curls' },
      ],
      selectedDay: 'A1',
      apiKey: 'test-api-key',
      unit: 'kg',
      workoutsPerWeek: 3,
      ...overrides,
    }
  }

  it('should build valid GZCLPState from assignments', () => {
    const params = createCreateParams()
    const state = buildCreateProgramState(params)

    expect(state.version).toBeDefined()
    expect(state.apiKey).toBe('test-api-key')
    expect(state.program).toBeDefined()
    expect(state.exercises).toBeDefined()
    expect(state.progression).toBeDefined()
    expect(state.settings).toBeDefined()
    expect(state.t3Schedule).toBeDefined()
  })

  it('should set apiKey and exercises so isSetupRequired returns false', () => {
    const params = createCreateParams()
    const state = buildCreateProgramState(params)

    expect(isSetupRequired(state)).toBe(false)
    expect(state.apiKey).toBe('test-api-key')
    expect(Object.keys(state.exercises).length).toBeGreaterThan(0)
  })

  it('should create exercises for all assigned main lifts', () => {
    const params = createCreateParams()
    const state = buildCreateProgramState(params)

    // Should have 4 main lift exercises
    const mainLifts = Object.values(state.exercises).filter(
      (e) => e.role && ['squat', 'bench', 'ohp', 'deadlift'].includes(e.role)
    )
    expect(mainLifts).toHaveLength(4)

    // Check each role exists
    expect(mainLifts.find((e) => e.role === 'squat')).toBeDefined()
    expect(mainLifts.find((e) => e.role === 'bench')).toBeDefined()
    expect(mainLifts.find((e) => e.role === 'ohp')).toBeDefined()
    expect(mainLifts.find((e) => e.role === 'deadlift')).toBeDefined()
  })

  it('should set initial weights in progression for both T1 and T2', () => {
    const params = createCreateParams()
    const state = buildCreateProgramState(params)

    // Main lifts should have both T1 and T2 progression entries with initial weight
    expect(state.progression['squat-T1'].currentWeight).toBe(60)
    expect(state.progression['squat-T2'].currentWeight).toBe(60)
    expect(state.progression['bench-T1'].currentWeight).toBe(40)
    expect(state.progression['bench-T2'].currentWeight).toBe(40)
    expect(state.progression['ohp-T1'].currentWeight).toBe(30)
    expect(state.progression['ohp-T2'].currentWeight).toBe(30)
    expect(state.progression['deadlift-T1'].currentWeight).toBe(80)
    expect(state.progression['deadlift-T2'].currentWeight).toBe(80)
  })

  it('should build t3Schedule correctly with deduplication', () => {
    const params = createCreateParams({
      assignments: {
        mainLifts: {
          squat: 'squat-template',
          bench: 'bench-template',
          ohp: 'ohp-template',
          deadlift: 'deadlift-template',
        },
        t3Exercises: {
          A1: ['t3-lat-template'],
          B1: ['t3-curl-template'],
          A2: ['t3-lat-template'], // Same T3 on multiple days
          B2: [],
        },
      },
      weights: {
        squat: 60,
        bench: 40,
        ohp: 30,
        deadlift: 80,
        't3_t3-lat-template': 20,
        't3_t3-curl-template': 15,
      },
    })

    const state = buildCreateProgramState(params)

    // Lat Pulldown should be deduplicated (one exercise, used on multiple days)
    const latExercises = Object.values(state.exercises).filter(
      (e) => e.name === 'Lat Pulldown'
    )
    expect(latExercises).toHaveLength(1)

    const latId = latExercises[0].id
    expect(state.t3Schedule.A1).toContain(latId)
    expect(state.t3Schedule.A2).toContain(latId)
  })

  it('should set T3 weights in progression using exerciseId as key', () => {
    const params = createCreateParams({
      assignments: {
        mainLifts: {
          squat: 'squat-template',
          bench: 'bench-template',
          ohp: 'ohp-template',
          deadlift: 'deadlift-template',
        },
        t3Exercises: {
          A1: ['t3-lat-template'],
          B1: [],
          A2: [],
          B2: [],
        },
      },
      weights: {
        squat: 60,
        bench: 40,
        ohp: 30,
        deadlift: 80,
        't3_t3-lat-template': 25,
      },
    })

    const state = buildCreateProgramState(params)

    const latExercise = Object.values(state.exercises).find(
      (e) => e.name === 'Lat Pulldown'
    )
    expect(latExercise).toBeDefined()

    // T3 progression key is exerciseId, not role-tier
    expect(state.progression[latExercise!.id]).toBeDefined()
    expect(state.progression[latExercise!.id].currentWeight).toBe(25)
  })

  it('should set currentDay from selectedDay', () => {
    const params = createCreateParams({ selectedDay: 'B1' })
    const state = buildCreateProgramState(params)

    expect(state.program.currentDay).toBe('B1')
  })

  it('should set weight unit and workoutsPerWeek', () => {
    const params = createCreateParams({
      unit: 'lbs',
      workoutsPerWeek: 4,
    })
    const state = buildCreateProgramState(params)

    expect(state.settings.weightUnit).toBe('lbs')
    expect(state.program.workoutsPerWeek).toBe(4)
  })

  it('should handle missing main lift assignments gracefully', () => {
    const params = createCreateParams({
      assignments: {
        mainLifts: {
          squat: 'squat-template',
          bench: 'bench-template',
          ohp: null, // Not assigned
          deadlift: null, // Not assigned
        },
        t3Exercises: { A1: [], B1: [], A2: [], B2: [] },
      },
      weights: {
        squat: 60,
        bench: 40,
      },
    })

    const state = buildCreateProgramState(params)

    // Should only have 2 main lift exercises
    const mainLifts = Object.values(state.exercises).filter(
      (e) => e.role && ['squat', 'bench', 'ohp', 'deadlift'].includes(e.role)
    )
    expect(mainLifts).toHaveLength(2)

    // Only squat and bench progressions should exist
    expect(state.progression['squat-T1']).toBeDefined()
    expect(state.progression['squat-T2']).toBeDefined()
    expect(state.progression['bench-T1']).toBeDefined()
    expect(state.progression['bench-T2']).toBeDefined()
    expect(state.progression['ohp-T1']).toBeUndefined()
    expect(state.progression['deadlift-T1']).toBeUndefined()
  })

  it('should initialize progression state with stage 0 and null workout IDs', () => {
    const params = createCreateParams()
    const state = buildCreateProgramState(params)

    // All progressions should start at stage 0 with null workout tracking
    for (const progression of Object.values(state.progression)) {
      expect(progression.stage).toBe(0)
      expect(progression.lastWorkoutId).toBeNull()
      expect(progression.lastWorkoutDate).toBeNull()
      expect(progression.amrapRecord).toBe(0)
    }
  })

  it('should set baseWeight equal to currentWeight for new exercises', () => {
    const params = createCreateParams()
    const state = buildCreateProgramState(params)

    expect(state.progression['squat-T1'].baseWeight).toBe(60)
    expect(state.progression['bench-T1'].baseWeight).toBe(40)
  })

  it('should initialize empty progressionHistory for create path', () => {
    const params = createCreateParams()
    const state = buildCreateProgramState(params)

    expect(state.progressionHistory).toEqual({})
  })
})
