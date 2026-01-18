/**
 * Integration Tests: Sync Flow
 *
 * Tests the sync flow for fetching workouts, analyzing them, and generating pending changes.
 * [US2] User Story 2 - Sync Workouts and Calculate Progression
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useProgression } from '@/hooks/useProgression'
import { ToastProvider } from '@/contexts/ToastContext'
import type { Workout, WorkoutExercise, WorkoutSet } from '@/types/hevy'
import type { ExerciseConfig, ProgressionState, WeightUnit } from '@/types/state'

// Wrapper component for hooks that require ToastProvider
function TestWrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}

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

// Mock routine ID for test workouts - must match hevyRoutineIds
const MOCK_ROUTINE_ID = 'test-routine-a1'

// Mock hevyRoutineIds for useProgression
const mockHevyRoutineIds = {
  A1: MOCK_ROUTINE_ID,
  B1: 'test-routine-b1',
  A2: 'test-routine-a2',
  B2: 'test-routine-b2',
}

// Helper to create a workout
function createWorkout(
  id: string,
  date: string,
  exercises: WorkoutExercise[],
  routineId: string = MOCK_ROUTINE_ID
): Workout {
  return {
    id,
    title: 'GZCLP Day A1',
    routine_id: routineId,
    description: '',
    start_time: date,
    end_time: date,
    updated_at: date,
    created_at: date,
    exercises,
  }
}

// Sample exercise configs (role-based)
const mockExercises: Record<string, ExerciseConfig> = {
  'ex-squat': {
    id: 'ex-squat',
    hevyTemplateId: 'hevy-squat',
    name: 'Squat',
    role: 'squat',
  },
  'ex-bench': {
    id: 'ex-bench',
    hevyTemplateId: 'hevy-bench',
    name: 'Bench Press',
    role: 'bench',
  },
  'ex-lat': {
    id: 'ex-lat',
    hevyTemplateId: 'hevy-lat',
    name: 'Lat Pulldown',
    role: 't3',
  },
}

// Sample progression states (use role-tier keys for main lifts, exerciseId for T3)
// Keys follow the format: {role}-{tier} for main lifts
// On day A1: squat is T1, bench is T2
const mockProgression: Record<string, ProgressionState> = {
  'squat-T1': {
    exerciseId: 'squat',
    currentWeight: 100,
    stage: 0,
    baseWeight: 100,
    amrapRecord: 5,
  },
  'bench-T2': {
    exerciseId: 'bench',
    currentWeight: 60,
    stage: 0,
    baseWeight: 60,
    amrapRecord: 0,
  },
  'ex-lat': {
    exerciseId: 'ex-lat',
    currentWeight: 40,
    stage: 0,
    baseWeight: 40,
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

      const { result } = renderHook(
        () =>
          useProgression({
            apiKey: 'test-api-key',
            exercises: mockExercises,
            progression: mockProgression,
            settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
            lastSync: null,
            hevyRoutineIds: mockHevyRoutineIds,
            progressionHistory: {},
          }),
        { wrapper: TestWrapper }
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

      const { result } = renderHook(
        () =>
          useProgression({
            apiKey: 'test-api-key',
            exercises: mockExercises,
            progression: mockProgression,
            settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
            lastSync: null,
            hevyRoutineIds: mockHevyRoutineIds,
            progressionHistory: {},
          }),
        { wrapper: TestWrapper }
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

      const { result } = renderHook(
        () =>
          useProgression({
            apiKey: 'test-api-key',
            exercises: mockExercises,
            progression: mockProgression,
            settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
            lastSync: null,
            hevyRoutineIds: mockHevyRoutineIds,
            progressionHistory: {},
          }),
        { wrapper: TestWrapper }
      )

      await act(async () => {
        await result.current.syncWorkouts()
      })

      await waitFor(() => {
        expect(result.current.pendingChanges).toHaveLength(2)
        // Exercise names include tier prefix for main lifts
        // On day A1: squat is T1, bench is T2
        expect(result.current.pendingChanges.find(c => c.exerciseName === 'T1 Squat')).toBeDefined()
        expect(result.current.pendingChanges.find(c => c.exerciseName === 'T2 Bench Press')).toBeDefined()
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

      const { result } = renderHook(
        () =>
          useProgression({
            apiKey: 'test-api-key',
            exercises: mockExercises,
            progression: mockProgression,
            settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
            lastSync: null,
            hevyRoutineIds: mockHevyRoutineIds,
            progressionHistory: {},
          }),
        { wrapper: TestWrapper }
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
      const _workout = createWorkout('workout-1', '2024-01-15T10:00:00Z', [])

      // Make the promise controllable
      let resolvePromise: (value: unknown) => void
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockGetWorkouts.mockReturnValue(mockPromise)

      const { result } = renderHook(
        () =>
          useProgression({
            apiKey: 'test-api-key',
            exercises: mockExercises,
            progression: mockProgression,
            settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
            lastSync: null,
            hevyRoutineIds: mockHevyRoutineIds,
            progressionHistory: {},
          }),
        { wrapper: TestWrapper }
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

      const { result } = renderHook(
        () =>
          useProgression({
            apiKey: 'test-api-key',
            exercises: mockExercises,
            progression: mockProgression,
            settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
            lastSync: null,
            hevyRoutineIds: mockHevyRoutineIds,
            progressionHistory: {},
          }),
        { wrapper: TestWrapper }
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

      const { result } = renderHook(
        () =>
          useProgression({
            apiKey: 'test-api-key',
            exercises: mockExercises,
            progression: mockProgression,
            settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
            lastSync: null,
            hevyRoutineIds: mockHevyRoutineIds,
            progressionHistory: {},
          }),
        { wrapper: TestWrapper }
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
    it('should generate progress for T3 when AMRAP set >= 25', async () => {
      const workout = createWorkout('workout-1', '2024-01-15T10:00:00Z', [
        createWorkoutExercise('hevy-lat', [
          createSet(15, 40),
          createSet(15, 40),
          createSet(25, 40), // AMRAP set: 25 reps (triggers progress)
        ]),
      ])

      mockGetWorkouts.mockResolvedValue({
        workouts: [workout],
        page: 1,
        page_count: 1,
      })

      const { result } = renderHook(
        () =>
          useProgression({
            apiKey: 'test-api-key',
            exercises: mockExercises,
            progression: mockProgression,
            settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
            lastSync: null,
            hevyRoutineIds: mockHevyRoutineIds,
            progressionHistory: {},
          }),
        { wrapper: TestWrapper }
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

    it('should not generate pending change for T3 when AMRAP set < 25 (repeat is silent)', async () => {
      // When T3 AMRAP is below 25 reps, the user should repeat the same weight.
      // However, since nothing actually changes (same weight, same scheme), no pending
      // change is generated. This keeps the review queue clean of no-op changes.
      const workout = createWorkout('workout-1', '2024-01-15T10:00:00Z', [
        createWorkoutExercise('hevy-lat', [
          createSet(15, 40),
          createSet(15, 40),
          createSet(20, 40), // AMRAP set: 20 reps (below 25 threshold)
        ]),
      ])

      mockGetWorkouts.mockResolvedValue({
        workouts: [workout],
        page: 1,
        page_count: 1,
      })

      const { result } = renderHook(
        () =>
          useProgression({
            apiKey: 'test-api-key',
            exercises: mockExercises,
            progression: mockProgression,
            settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
            lastSync: null,
            hevyRoutineIds: mockHevyRoutineIds,
            progressionHistory: {},
          }),
        { wrapper: TestWrapper }
      )

      await act(async () => {
        await result.current.syncWorkouts()
      })

      await waitFor(() => {
        // No pending change for T3 repeat - nothing actually changes
        const t3Change = result.current.pendingChanges.find(c => c.exerciseName === 'Lat Pulldown')
        expect(t3Change).toBeUndefined()
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

      const { result } = renderHook(
        () =>
          useProgression({
            apiKey: 'test-api-key',
            exercises: mockExercises,
            progression: mockProgression,
            settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
            lastSync: null,
            hevyRoutineIds: mockHevyRoutineIds,
            progressionHistory: {},
          }),
        { wrapper: TestWrapper }
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

      const { result } = renderHook(
        () =>
          useProgression({
            apiKey: 'test-api-key',
            exercises: mockExercises,
            progression: mockProgression,
            settings: { weightUnit: 'kg' as WeightUnit, increments: { upper: 2.5, lower: 5 }, restTimers: { t1: 180, t2: 120, t3: 60 } },
            lastSync: null,
            hevyRoutineIds: mockHevyRoutineIds,
            progressionHistory: {},
          }),
        { wrapper: TestWrapper }
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
