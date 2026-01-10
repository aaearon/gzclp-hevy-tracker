/**
 * History Importer Tests
 *
 * Tests for importing historical workout data from Hevy.
 */

import { describe, it, expect, vi } from 'vitest'
import { importProgressionHistory } from '@/lib/history-importer'
import type { HevyClient } from '@/lib/hevy-client'
import type { Workout, WorkoutExercise } from '@/types/hevy'
import type { ExerciseConfig, GZCLPDay } from '@/types/state'

// Mock exercises config
const mockExercises: Record<string, ExerciseConfig> = {
  'ex-squat': {
    id: 'ex-squat',
    hevyTemplateId: 'hevy-squat',
    name: 'Barbell Back Squat',
    role: 'squat',
  },
  'ex-bench': {
    id: 'ex-bench',
    hevyTemplateId: 'hevy-bench',
    name: 'Bench Press',
    role: 'bench',
  },
  'ex-ohp': {
    id: 'ex-ohp',
    hevyTemplateId: 'hevy-ohp',
    name: 'Overhead Press',
    role: 'ohp',
  },
  'ex-deadlift': {
    id: 'ex-deadlift',
    hevyTemplateId: 'hevy-deadlift',
    name: 'Deadlift',
    role: 'deadlift',
  },
  'ex-lat': {
    id: 'ex-lat',
    hevyTemplateId: 'hevy-lat',
    name: 'Lat Pulldown',
    role: 't3',
  },
}

// Mock routine IDs mapping
const mockRoutineIds: Record<GZCLPDay, string | null> = {
  A1: 'routine-a1',
  B1: 'routine-b1',
  A2: 'routine-a2',
  B2: 'routine-b2',
}

// Helper to create a mock workout exercise
function createWorkoutExercise(
  templateId: string,
  weight: number,
  reps = 5
): WorkoutExercise {
  return {
    index: 0,
    title: 'Exercise',
    notes: '',
    exercise_template_id: templateId,
    supersets_id: null,
    sets: [
      { index: 0, type: 'warmup', weight_kg: weight * 0.5, reps: 10, distance_meters: null, duration_seconds: null, rpe: null, custom_metric: null },
      { index: 1, type: 'normal', weight_kg: weight, reps, distance_meters: null, duration_seconds: null, rpe: null, custom_metric: null },
      { index: 2, type: 'normal', weight_kg: weight, reps, distance_meters: null, duration_seconds: null, rpe: null, custom_metric: null },
      { index: 3, type: 'normal', weight_kg: weight, reps, distance_meters: null, duration_seconds: null, rpe: null, custom_metric: null },
    ],
  }
}

// Helper to create a mock workout
function createWorkout(
  id: string,
  routineId: string,
  startTime: string,
  exercises: WorkoutExercise[]
): Workout {
  return {
    id,
    title: 'Test Workout',
    routine_id: routineId,
    description: '',
    start_time: startTime,
    end_time: startTime,
    updated_at: startTime,
    created_at: startTime,
    exercises,
  }
}

describe('History Importer', () => {
  describe('importProgressionHistory', () => {
    it('imports workouts for matching routines', async () => {
      const workouts: Workout[] = [
        createWorkout('w1', 'routine-a1', '2024-01-01T10:00:00Z', [
          createWorkoutExercise('hevy-squat', 100),
          createWorkoutExercise('hevy-bench', 60),
        ]),
        createWorkout('w2', 'routine-b1', '2024-01-03T10:00:00Z', [
          createWorkoutExercise('hevy-ohp', 50),
          createWorkoutExercise('hevy-deadlift', 120),
        ]),
      ]

      const mockClient = {
        getAllWorkouts: vi.fn().mockResolvedValue(workouts),
      } as unknown as HevyClient

      const result = await importProgressionHistory(mockClient, mockExercises, mockRoutineIds)

      expect(result.workoutCount).toBe(2)
      expect(result.entryCount).toBe(4) // 2 exercises per workout

      // Check squat history (T1 on A1)
      expect(result.history['squat-T1']).toBeDefined()
      expect(result.history['squat-T1'].entries).toHaveLength(1)
      expect(result.history['squat-T1'].entries[0].weight).toBe(100)
      expect(result.history['squat-T1'].entries[0].tier).toBe('T1')

      // Check bench history (T2 on A1)
      expect(result.history['bench-T2']).toBeDefined()
      expect(result.history['bench-T2'].entries).toHaveLength(1)
      expect(result.history['bench-T2'].entries[0].weight).toBe(60)
      expect(result.history['bench-T2'].entries[0].tier).toBe('T2')
    })

    it('skips non-GZCLP workouts', async () => {
      const workouts: Workout[] = [
        createWorkout('w1', 'routine-a1', '2024-01-01T10:00:00Z', [
          createWorkoutExercise('hevy-squat', 100),
        ]),
        createWorkout('w2', 'other-routine', '2024-01-02T10:00:00Z', [
          createWorkoutExercise('hevy-bench', 60),
        ]),
      ]

      const mockClient = {
        getAllWorkouts: vi.fn().mockResolvedValue(workouts),
      } as unknown as HevyClient

      const result = await importProgressionHistory(mockClient, mockExercises, mockRoutineIds)

      expect(result.workoutCount).toBe(1)
      expect(result.entryCount).toBe(1)
    })

    it('skips exercises with zero weight', async () => {
      const workouts: Workout[] = [
        createWorkout('w1', 'routine-a1', '2024-01-01T10:00:00Z', [
          createWorkoutExercise('hevy-squat', 100),
          createWorkoutExercise('hevy-bench', 0), // Zero weight
        ]),
      ]

      const mockClient = {
        getAllWorkouts: vi.fn().mockResolvedValue(workouts),
      } as unknown as HevyClient

      const result = await importProgressionHistory(mockClient, mockExercises, mockRoutineIds)

      expect(result.entryCount).toBe(1)
      expect(result.history['squat-T1']).toBeDefined()
      expect(result.history['bench-T2']).toBeUndefined()
    })

    it('detects deloads when weight decreases within same progression key', async () => {
      // Two A1 workouts where squat T1 weight decreases
      const workouts: Workout[] = [
        createWorkout('w1', 'routine-a1', '2024-01-01T10:00:00Z', [
          createWorkoutExercise('hevy-squat', 100),
        ]),
        createWorkout('w2', 'routine-a1', '2024-01-08T10:00:00Z', [
          createWorkoutExercise('hevy-squat', 90), // Deload - same T1
        ]),
      ]

      const mockClient = {
        getAllWorkouts: vi.fn().mockResolvedValue(workouts),
      } as unknown as HevyClient

      const result = await importProgressionHistory(mockClient, mockExercises, mockRoutineIds)

      expect(result.history['squat-T1'].entries).toHaveLength(2)
      expect(result.history['squat-T1'].entries[0].changeType).toBe('progress') // First entry defaults to progress
      expect(result.history['squat-T1'].entries[1].changeType).toBe('deload')
    })

    it('processes workouts chronologically', async () => {
      // Workouts in reverse order
      const workouts: Workout[] = [
        createWorkout('w2', 'routine-a1', '2024-01-10T10:00:00Z', [
          createWorkoutExercise('hevy-squat', 110),
        ]),
        createWorkout('w1', 'routine-a1', '2024-01-01T10:00:00Z', [
          createWorkoutExercise('hevy-squat', 100),
        ]),
      ]

      const mockClient = {
        getAllWorkouts: vi.fn().mockResolvedValue(workouts),
      } as unknown as HevyClient

      const result = await importProgressionHistory(mockClient, mockExercises, mockRoutineIds)

      // Should be sorted oldest first
      const entries = result.history['squat-T1'].entries
      expect(entries[0].date).toBe('2024-01-01T10:00:00Z')
      expect(entries[0].weight).toBe(100)
      expect(entries[1].date).toBe('2024-01-10T10:00:00Z')
      expect(entries[1].weight).toBe(110)
    })

    it('deduplicates workouts by ID', async () => {
      const workouts: Workout[] = [
        createWorkout('w1', 'routine-a1', '2024-01-01T10:00:00Z', [
          createWorkoutExercise('hevy-squat', 100),
        ]),
        createWorkout('w1', 'routine-a1', '2024-01-01T10:00:00Z', [
          createWorkoutExercise('hevy-squat', 100),
        ]),
      ]

      const mockClient = {
        getAllWorkouts: vi.fn().mockResolvedValue(workouts),
      } as unknown as HevyClient

      const result = await importProgressionHistory(mockClient, mockExercises, mockRoutineIds)

      expect(result.history['squat-T1'].entries).toHaveLength(1)
    })

    it('handles T3 exercises correctly', async () => {
      const workouts: Workout[] = [
        createWorkout('w1', 'routine-a1', '2024-01-01T10:00:00Z', [
          createWorkoutExercise('hevy-lat', 50),
        ]),
      ]

      const mockClient = {
        getAllWorkouts: vi.fn().mockResolvedValue(workouts),
      } as unknown as HevyClient

      const result = await importProgressionHistory(mockClient, mockExercises, mockRoutineIds)

      // T3 uses exerciseId as key
      expect(result.history['ex-lat']).toBeDefined()
      expect(result.history['ex-lat'].entries[0].tier).toBe('T3')
    })

    it('returns empty history when no workouts match', async () => {
      const workouts: Workout[] = [
        createWorkout('w1', 'other-routine', '2024-01-01T10:00:00Z', [
          createWorkoutExercise('hevy-squat', 100),
        ]),
      ]

      const mockClient = {
        getAllWorkouts: vi.fn().mockResolvedValue(workouts),
      } as unknown as HevyClient

      const result = await importProgressionHistory(mockClient, mockExercises, mockRoutineIds)

      expect(result.workoutCount).toBe(0)
      expect(result.entryCount).toBe(0)
      expect(Object.keys(result.history)).toHaveLength(0)
    })

    it('handles empty workout list', async () => {
      const mockClient = {
        getAllWorkouts: vi.fn().mockResolvedValue([]),
      } as unknown as HevyClient

      const result = await importProgressionHistory(mockClient, mockExercises, mockRoutineIds)

      expect(result.workoutCount).toBe(0)
      expect(result.entryCount).toBe(0)
      expect(Object.keys(result.history)).toHaveLength(0)
    })

    it('derives correct tier based on day', async () => {
      // A1: squat=T1, bench=T2
      // A2: bench=T1, squat=T2
      const workouts: Workout[] = [
        createWorkout('w1', 'routine-a1', '2024-01-01T10:00:00Z', [
          createWorkoutExercise('hevy-squat', 100),
          createWorkoutExercise('hevy-bench', 60),
        ]),
        createWorkout('w2', 'routine-a2', '2024-01-03T10:00:00Z', [
          createWorkoutExercise('hevy-squat', 70), // T2 on A2
          createWorkoutExercise('hevy-bench', 80), // T1 on A2
        ]),
      ]

      const mockClient = {
        getAllWorkouts: vi.fn().mockResolvedValue(workouts),
      } as unknown as HevyClient

      const result = await importProgressionHistory(mockClient, mockExercises, mockRoutineIds)

      // Squat: T1 on A1, T2 on A2
      expect(result.history['squat-T1'].entries[0].weight).toBe(100)
      expect(result.history['squat-T2'].entries[0].weight).toBe(70)

      // Bench: T2 on A1, T1 on A2
      expect(result.history['bench-T2'].entries[0].weight).toBe(60)
      expect(result.history['bench-T1'].entries[0].weight).toBe(80)
    })
  })
})
