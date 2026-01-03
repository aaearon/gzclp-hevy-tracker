/**
 * Integration Tests: Sync Flow
 *
 * Tests the sync flow for fetching workouts, analyzing them, and generating pending changes.
 * [US2] User Story 2 - Sync Workouts and Calculate Progression
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useProgression } from '@/hooks/useProgression'
import type { Workout, WorkoutExercise, WorkoutSet } from '@/types/hevy'
import type { ExerciseConfig, ProgressionState, GZCLPState, WeightUnit } from '@/types/state'
import { createInitialState } from '@/lib/state-factory'

// Mock the Hevy client
const mockGetWorkouts = vi.fn()
const mockGetAllWorkouts = vi.fn()

vi.mock('@/lib/hevy-client', () => ({
  createHevyClient: vi.fn(() => ({
    getWorkouts: mockGetWorkouts,
    getAllWorkouts: mockGetAllWorkouts,
    testConnection: vi.fn().mockResolvedValue(true),
  })),
  HevyApiClientError: class HevyApiClientError extends Error {
    constructor(message: string, public status: number) {
      super(message)
      this.name = 'HevyApiClientError'
    }
  },
}))

// Helper to create a workout set
function createSet(reps: number, weight: number, type: 'normal' | 'warmup' = 'normal'): WorkoutSet {
  return {
    index: 0,
    type,
    weight_kg: weight,
    reps,
    distance_meters: null,
    duration_seconds: null,
    rpe: null,
  }
}

// Helper to create a workout exercise
function createWorkoutExercise(
  templateId: string,
  sets: WorkoutSet[]
): WorkoutExercise {
  return {
    index: 0,
    title: 'Test Exercise',
    notes: null,
    exercise_template_id: templateId,
    superset_id: null,
    sets,
  }
}

// Helper to create a workout
function createWorkout(
  id: string,
  date: string,
  exercises: WorkoutExercise[]
): Workout {
  return {
    id,
    title: 'GZCLP A1',
    description: null,
    start_time: date,
    end_time: date,
    updated_at: date,
    created_at: date,
    exercises,
  }
}

// Sample exercise configs
const mockExercises: Record<string, ExerciseConfig> = {
  'ex-squat': {
    id: 'ex-squat',
    hevyTemplateId: 'hevy-squat',
    name: 'Squat',
    tier: 'T1',
    slot: 't1_squat',
    muscleGroup: 'lower',
  },
  'ex-bench': {
    id: 'ex-bench',
    hevyTemplateId: 'hevy-bench',
    name: 'Bench Press',
    tier: 'T2',
    slot: 't2_bench',
    muscleGroup: 'upper',
  },
  'ex-lat': {
    id: 'ex-lat',
    hevyTemplateId: 'hevy-lat',
    name: 'Lat Pulldown',
    tier: 'T3',
    slot: 't3_1',
    muscleGroup: 'upper',
  },
}

// Sample progression states
const mockProgression: Record<string, ProgressionState> = {
  'ex-squat': {
    exerciseId: 'ex-squat',
    currentWeight: 100,
    stage: 0,
    baseWeight: 100,
    lastWorkoutId: null,
    lastWorkoutDate: null,
    amrapRecord: 5,
  },
  'ex-bench': {
    exerciseId: 'ex-bench',
    currentWeight: 60,
    stage: 0,
    baseWeight: 60,
    lastWorkoutId: null,
    lastWorkoutDate: null,
    amrapRecord: 0,
  },
  'ex-lat': {
    exerciseId: 'ex-lat',
    currentWeight: 40,
    stage: 0,
    baseWeight: 40,
    lastWorkoutId: null,
    lastWorkoutDate: null,
    amrapRecord: 0,
  },
}

describe('[US2] Sync Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Workout Analysis', () => {
    it('should analyze successful T1 workout and generate progress change', async () => {
      const workout = createWorkout('workout-1', '2024-01-15T10:00:00Z', [
        createWorkoutExercise('hevy-squat', [
          createSet(3, 100),
          createSet(3, 100),
          createSet(3, 100),
          createSet(3, 100),
          createSet(5, 100), // AMRAP
        ]),
      ])

      mockGetWorkouts.mockResolvedValue({
        workouts: [workout],
        page: 1,
        page_count: 1,
      })

      const { result } = renderHook(() =>
        useProgression({
          apiKey: 'test-api-key',
          exercises: mockExercises,
          progression: mockProgression,
          settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
          lastSync: null,
        })
      )

      await act(async () => {
        await result.current.syncWorkouts()
      })

      await waitFor(() => {
        expect(result.current.pendingChanges).toHaveLength(1)
        expect(result.current.pendingChanges[0].type).toBe('progress')
        expect(result.current.pendingChanges[0].newWeight).toBe(105)
      })
    })

    it('should analyze failed T1 workout and generate stage change', async () => {
      const workout = createWorkout('workout-1', '2024-01-15T10:00:00Z', [
        createWorkoutExercise('hevy-squat', [
          createSet(3, 100),
          createSet(3, 100),
          createSet(2, 100), // Failed
          createSet(2, 100),
          createSet(1, 100),
        ]),
      ])

      mockGetWorkouts.mockResolvedValue({
        workouts: [workout],
        page: 1,
        page_count: 1,
      })

      const { result } = renderHook(() =>
        useProgression({
          apiKey: 'test-api-key',
          exercises: mockExercises,
          progression: mockProgression,
          settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
          lastSync: null,
        })
      )

      await act(async () => {
        await result.current.syncWorkouts()
      })

      await waitFor(() => {
        expect(result.current.pendingChanges).toHaveLength(1)
        expect(result.current.pendingChanges[0].type).toBe('stage_change')
        expect(result.current.pendingChanges[0].newStage).toBe(1)
      })
    })

    it('should handle multiple exercises in one workout', async () => {
      const workout = createWorkout('workout-1', '2024-01-15T10:00:00Z', [
        createWorkoutExercise('hevy-squat', [
          createSet(3, 100),
          createSet(3, 100),
          createSet(3, 100),
          createSet(3, 100),
          createSet(5, 100),
        ]),
        createWorkoutExercise('hevy-bench', [
          createSet(10, 60),
          createSet(10, 60),
          createSet(10, 60),
        ]),
      ])

      mockGetWorkouts.mockResolvedValue({
        workouts: [workout],
        page: 1,
        page_count: 1,
      })

      const { result } = renderHook(() =>
        useProgression({
          apiKey: 'test-api-key',
          exercises: mockExercises,
          progression: mockProgression,
          settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
          lastSync: null,
        })
      )

      await act(async () => {
        await result.current.syncWorkouts()
      })

      await waitFor(() => {
        expect(result.current.pendingChanges).toHaveLength(2)
        expect(result.current.pendingChanges.find(c => c.exerciseName === 'Squat')).toBeDefined()
        expect(result.current.pendingChanges.find(c => c.exerciseName === 'Bench Press')).toBeDefined()
      })
    })
  })

  describe('Discrepancy Detection', () => {
    it('should detect weight discrepancy between stored and actual weight', async () => {
      // Actual workout used 95kg but we have 100kg stored
      const workout = createWorkout('workout-1', '2024-01-15T10:00:00Z', [
        createWorkoutExercise('hevy-squat', [
          createSet(3, 95), // Different from stored 100kg
          createSet(3, 95),
          createSet(3, 95),
          createSet(3, 95),
          createSet(5, 95),
        ]),
      ])

      mockGetWorkouts.mockResolvedValue({
        workouts: [workout],
        page: 1,
        page_count: 1,
      })

      const { result } = renderHook(() =>
        useProgression({
          apiKey: 'test-api-key',
          exercises: mockExercises,
          progression: mockProgression,
          settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
          lastSync: null,
        })
      )

      await act(async () => {
        await result.current.syncWorkouts()
      })

      await waitFor(() => {
        expect(result.current.discrepancies).toHaveLength(1)
        expect(result.current.discrepancies[0].exerciseId).toBe('ex-squat')
        expect(result.current.discrepancies[0].storedWeight).toBe(100)
        expect(result.current.discrepancies[0].actualWeight).toBe(95)
      })
    })
  })

  describe('Sync State', () => {
    it('should update isSyncing state during sync', async () => {
      const workout = createWorkout('workout-1', '2024-01-15T10:00:00Z', [])

      // Make the promise controllable
      let resolvePromise: (value: unknown) => void
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockGetWorkouts.mockReturnValue(mockPromise)

      const { result } = renderHook(() =>
        useProgression({
          apiKey: 'test-api-key',
          exercises: mockExercises,
          progression: mockProgression,
          settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
          lastSync: null,
        })
      )

      expect(result.current.isSyncing).toBe(false)

      // Start sync
      act(() => {
        result.current.syncWorkouts()
      })

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(true)
      })

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ workouts: [], page: 1, page_count: 1 })
      })

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false)
      })
    })

    it('should set sync error on failure', async () => {
      mockGetWorkouts.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useProgression({
          apiKey: 'test-api-key',
          exercises: mockExercises,
          progression: mockProgression,
          settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
          lastSync: null,
        })
      )

      await act(async () => {
        await result.current.syncWorkouts()
      })

      await waitFor(() => {
        expect(result.current.syncError).toBe('Network error')
      })
    })

    it('should update lastSyncTime on successful sync', async () => {
      mockGetWorkouts.mockResolvedValue({
        workouts: [],
        page: 1,
        page_count: 1,
      })

      const { result } = renderHook(() =>
        useProgression({
          apiKey: 'test-api-key',
          exercises: mockExercises,
          progression: mockProgression,
          settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
          lastSync: null,
        })
      )

      expect(result.current.lastSyncTime).toBeNull()

      await act(async () => {
        await result.current.syncWorkouts()
      })

      await waitFor(() => {
        expect(result.current.lastSyncTime).not.toBeNull()
      })
    })
  })

  describe('T3 Progression', () => {
    it('should generate progress for T3 when total reps >= 25', async () => {
      const workout = createWorkout('workout-1', '2024-01-15T10:00:00Z', [
        createWorkoutExercise('hevy-lat', [
          createSet(10, 40),
          createSet(9, 40),
          createSet(8, 40), // Total: 27 reps
        ]),
      ])

      mockGetWorkouts.mockResolvedValue({
        workouts: [workout],
        page: 1,
        page_count: 1,
      })

      const { result } = renderHook(() =>
        useProgression({
          apiKey: 'test-api-key',
          exercises: mockExercises,
          progression: mockProgression,
          settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
          lastSync: null,
        })
      )

      await act(async () => {
        await result.current.syncWorkouts()
      })

      await waitFor(() => {
        const t3Change = result.current.pendingChanges.find(c => c.exerciseName === 'Lat Pulldown')
        expect(t3Change).toBeDefined()
        expect(t3Change!.type).toBe('progress')
        expect(t3Change!.newWeight).toBe(42.5) // 40 + 2.5 (upper body increment)
      })
    })

    it('should generate repeat for T3 when total reps < 25', async () => {
      const workout = createWorkout('workout-1', '2024-01-15T10:00:00Z', [
        createWorkoutExercise('hevy-lat', [
          createSet(8, 40),
          createSet(7, 40),
          createSet(6, 40), // Total: 21 reps
        ]),
      ])

      mockGetWorkouts.mockResolvedValue({
        workouts: [workout],
        page: 1,
        page_count: 1,
      })

      const { result } = renderHook(() =>
        useProgression({
          apiKey: 'test-api-key',
          exercises: mockExercises,
          progression: mockProgression,
          settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
          lastSync: null,
        })
      )

      await act(async () => {
        await result.current.syncWorkouts()
      })

      await waitFor(() => {
        const t3Change = result.current.pendingChanges.find(c => c.exerciseName === 'Lat Pulldown')
        expect(t3Change).toBeDefined()
        expect(t3Change!.type).toBe('repeat')
        expect(t3Change!.newWeight).toBe(40) // Same weight
      })
    })
  })

  describe('Empty State', () => {
    it('should handle no workouts gracefully', async () => {
      mockGetWorkouts.mockResolvedValue({
        workouts: [],
        page: 1,
        page_count: 1,
      })

      const { result } = renderHook(() =>
        useProgression({
          apiKey: 'test-api-key',
          exercises: mockExercises,
          progression: mockProgression,
          settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
          lastSync: null,
        })
      )

      await act(async () => {
        await result.current.syncWorkouts()
      })

      await waitFor(() => {
        expect(result.current.pendingChanges).toHaveLength(0)
        expect(result.current.syncError).toBeNull()
      })
    })

    it('should skip workouts with no matching exercises', async () => {
      const workout = createWorkout('workout-1', '2024-01-15T10:00:00Z', [
        createWorkoutExercise('unknown-exercise', [
          createSet(10, 50),
        ]),
      ])

      mockGetWorkouts.mockResolvedValue({
        workouts: [workout],
        page: 1,
        page_count: 1,
      })

      const { result } = renderHook(() =>
        useProgression({
          apiKey: 'test-api-key',
          exercises: mockExercises,
          progression: mockProgression,
          settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
          lastSync: null,
        })
      )

      await act(async () => {
        await result.current.syncWorkouts()
      })

      await waitFor(() => {
        expect(result.current.pendingChanges).toHaveLength(0)
      })
    })
  })
})
