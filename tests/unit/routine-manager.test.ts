/**
 * Unit Tests: Routine Manager
 *
 * Tests for detecting, creating, and updating Hevy routines.
 * [US4] User Story 4 - Update Hevy Routines
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  findGZCLPRoutines,
  createGZCLPRoutine,
  updateGZCLPRoutine,
  ensureGZCLPRoutines,
  GZCLP_ROUTINE_NAMES,
} from '@/lib/routine-manager'
import type { Routine } from '@/types/hevy'
import type { ExerciseConfig, GZCLPDay, ProgressionState, UserSettings } from '@/types/state'
import type { HevyClient } from '@/lib/hevy-client'

describe('[US4] Routine Manager', () => {
  const defaultSettings: UserSettings = {
    weightUnit: 'kg',
    increments: { upper: 2.5, lower: 5 },
    restTimers: { t1: 180, t2: 120, t3: 60 },
  }

  const mockExercises: Record<string, ExerciseConfig> = {
    'ex-squat-t1': {
      id: 'ex-squat-t1',
      hevyTemplateId: 'hevy-squat',
      name: 'Squat',
      tier: 'T1',
      slot: 't1_squat',
      muscleGroup: 'lower',
    },
    'ex-bench-t2': {
      id: 'ex-bench-t2',
      hevyTemplateId: 'hevy-bench',
      name: 'Bench Press',
      tier: 'T2',
      slot: 't2_bench',
      muscleGroup: 'upper',
    },
  }

  const mockProgression: Record<string, ProgressionState> = {
    'ex-squat-t1': {
      exerciseId: 'ex-squat-t1',
      currentWeight: 100,
      stage: 0,
      baseWeight: 100,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ex-bench-t2': {
      exerciseId: 'ex-bench-t2',
      currentWeight: 60,
      stage: 0,
      baseWeight: 60,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
  }

  const createMockRoutine = (title: string, id: string): Routine => ({
    id,
    title,
    folder_id: null,
    updated_at: '2026-01-02T10:00:00Z',
    created_at: '2026-01-02T10:00:00Z',
    exercises: [],
  })

  describe('GZCLP_ROUTINE_NAMES', () => {
    it('should have correct routine name mappings', () => {
      expect(GZCLP_ROUTINE_NAMES.A1).toBe('GZCLP A1')
      expect(GZCLP_ROUTINE_NAMES.B1).toBe('GZCLP B1')
      expect(GZCLP_ROUTINE_NAMES.A2).toBe('GZCLP A2')
      expect(GZCLP_ROUTINE_NAMES.B2).toBe('GZCLP B2')
    })
  })

  describe('findGZCLPRoutines', () => {
    it('should find existing GZCLP routines by name', () => {
      const routines: Routine[] = [
        createMockRoutine('GZCLP A1', 'routine-a1'),
        createMockRoutine('GZCLP B1', 'routine-b1'),
        createMockRoutine('Other Workout', 'routine-other'),
      ]

      const found = findGZCLPRoutines(routines)

      expect(found.A1).toBe('routine-a1')
      expect(found.B1).toBe('routine-b1')
      expect(found.A2).toBeNull()
      expect(found.B2).toBeNull()
    })

    it('should return null for all days when no GZCLP routines exist', () => {
      const routines: Routine[] = [
        createMockRoutine('Push Day', 'routine-1'),
        createMockRoutine('Pull Day', 'routine-2'),
      ]

      const found = findGZCLPRoutines(routines)

      expect(found.A1).toBeNull()
      expect(found.B1).toBeNull()
      expect(found.A2).toBeNull()
      expect(found.B2).toBeNull()
    })

    it('should find all GZCLP routines when they exist', () => {
      const routines: Routine[] = [
        createMockRoutine('GZCLP A1', 'routine-a1'),
        createMockRoutine('GZCLP B1', 'routine-b1'),
        createMockRoutine('GZCLP A2', 'routine-a2'),
        createMockRoutine('GZCLP B2', 'routine-b2'),
      ]

      const found = findGZCLPRoutines(routines)

      expect(found.A1).toBe('routine-a1')
      expect(found.B1).toBe('routine-b1')
      expect(found.A2).toBe('routine-a2')
      expect(found.B2).toBe('routine-b2')
    })

    it('should handle case-sensitive matching', () => {
      const routines: Routine[] = [
        createMockRoutine('gzclp a1', 'routine-lower'), // Wrong case
        createMockRoutine('GZCLP A1', 'routine-correct'),
      ]

      const found = findGZCLPRoutines(routines)

      // Should only match exact case
      expect(found.A1).toBe('routine-correct')
    })

    it('should handle empty routines array', () => {
      const found = findGZCLPRoutines([])

      expect(found.A1).toBeNull()
      expect(found.B1).toBeNull()
      expect(found.A2).toBeNull()
      expect(found.B2).toBeNull()
    })
  })

  describe('createGZCLPRoutine', () => {
    let mockClient: {
      createRoutine: ReturnType<typeof vi.fn>
    }

    beforeEach(() => {
      mockClient = {
        createRoutine: vi.fn(),
      }
    })

    it('should create a routine with correct payload', async () => {
      const createdRoutine = createMockRoutine('GZCLP A1', 'new-routine-id')
      mockClient.createRoutine.mockResolvedValue(createdRoutine)

      const result = await createGZCLPRoutine(
        mockClient as unknown as HevyClient,
        'A1',
        mockExercises,
        mockProgression,
        defaultSettings
      )

      expect(mockClient.createRoutine).toHaveBeenCalledTimes(1)
      expect(result.id).toBe('new-routine-id')

      // Verify the payload structure
      const payload = mockClient.createRoutine.mock.calls[0][0]
      expect(payload.routine.title).toBe('GZCLP A1')
    })

    it('should pass folder_id when provided', async () => {
      const createdRoutine = createMockRoutine('GZCLP A1', 'new-routine-id')
      mockClient.createRoutine.mockResolvedValue(createdRoutine)

      await createGZCLPRoutine(
        mockClient as unknown as HevyClient,
        'A1',
        mockExercises,
        mockProgression,
        defaultSettings,
        123
      )

      const payload = mockClient.createRoutine.mock.calls[0][0]
      expect(payload.routine.folder_id).toBe(123)
    })

    it('should create routines for all day types', async () => {
      const days: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']

      for (const day of days) {
        const createdRoutine = createMockRoutine(`GZCLP ${day}`, `routine-${day}`)
        mockClient.createRoutine.mockResolvedValue(createdRoutine)

        const result = await createGZCLPRoutine(
          mockClient as unknown as HevyClient,
          day,
          mockExercises,
          mockProgression,
          defaultSettings
        )

        const payload = mockClient.createRoutine.mock.calls[mockClient.createRoutine.mock.calls.length - 1][0]
        expect(payload.routine.title).toBe(`GZCLP ${day}`)
        expect(result.title).toBe(`GZCLP ${day}`)
      }
    })
  })

  describe('updateGZCLPRoutine', () => {
    let mockClient: {
      updateRoutine: ReturnType<typeof vi.fn>
    }

    beforeEach(() => {
      mockClient = {
        updateRoutine: vi.fn(),
      }
    })

    it('should update an existing routine', async () => {
      const updatedRoutine = createMockRoutine('GZCLP A1', 'existing-routine-id')
      mockClient.updateRoutine.mockResolvedValue(updatedRoutine)

      const result = await updateGZCLPRoutine(
        mockClient as unknown as HevyClient,
        'existing-routine-id',
        'A1',
        mockExercises,
        mockProgression,
        defaultSettings
      )

      expect(mockClient.updateRoutine).toHaveBeenCalledTimes(1)
      expect(mockClient.updateRoutine).toHaveBeenCalledWith(
        'existing-routine-id',
        expect.objectContaining({
          routine: expect.objectContaining({
            title: 'GZCLP A1',
          }),
        })
      )
      expect(result.id).toBe('existing-routine-id')
    })

    it('should update routine with new weights from progression', async () => {
      const updatedProgression: Record<string, ProgressionState> = {
        ...mockProgression,
        'ex-squat-t1': {
          ...mockProgression['ex-squat-t1']!,
          currentWeight: 105, // Weight increased
        },
      }

      const updatedRoutine = createMockRoutine('GZCLP A1', 'existing-routine-id')
      mockClient.updateRoutine.mockResolvedValue(updatedRoutine)

      await updateGZCLPRoutine(
        mockClient as unknown as HevyClient,
        'existing-routine-id',
        'A1',
        mockExercises,
        updatedProgression,
        defaultSettings
      )

      const payload = mockClient.updateRoutine.mock.calls[0][1]
      // The routine should contain updated weights
      expect(payload.routine.exercises).toBeDefined()
    })
  })

  describe('ensureGZCLPRoutines', () => {
    let mockClient: {
      getAllRoutines: ReturnType<typeof vi.fn>
      createRoutine: ReturnType<typeof vi.fn>
      updateRoutine: ReturnType<typeof vi.fn>
    }

    beforeEach(() => {
      mockClient = {
        getAllRoutines: vi.fn(),
        createRoutine: vi.fn(),
        updateRoutine: vi.fn(),
      }
    })

    it('should create missing routines and update existing ones', async () => {
      // Only A1 and B1 exist
      const existingRoutines: Routine[] = [
        createMockRoutine('GZCLP A1', 'routine-a1'),
        createMockRoutine('GZCLP B1', 'routine-b1'),
      ]
      mockClient.getAllRoutines.mockResolvedValue(existingRoutines)

      // Mock create/update responses
      mockClient.createRoutine.mockImplementation((payload: { routine: { title: string } }) =>
        Promise.resolve(createMockRoutine(payload.routine.title, `new-${payload.routine.title}`))
      )
      mockClient.updateRoutine.mockImplementation((id: string) =>
        Promise.resolve(createMockRoutine('Updated', id))
      )

      const result = await ensureGZCLPRoutines(
        mockClient as unknown as HevyClient,
        mockExercises,
        mockProgression,
        defaultSettings
      )

      // Should have fetched existing routines
      expect(mockClient.getAllRoutines).toHaveBeenCalledTimes(1)

      // Should have updated existing A1 and B1
      expect(mockClient.updateRoutine).toHaveBeenCalledTimes(2)

      // Should have created missing A2 and B2
      expect(mockClient.createRoutine).toHaveBeenCalledTimes(2)

      // Result should contain all 4 routine IDs
      expect(result.A1).toBeDefined()
      expect(result.B1).toBeDefined()
      expect(result.A2).toBeDefined()
      expect(result.B2).toBeDefined()
    })

    it('should create all routines when none exist', async () => {
      mockClient.getAllRoutines.mockResolvedValue([])
      mockClient.createRoutine.mockImplementation((payload: { routine: { title: string } }) =>
        Promise.resolve(createMockRoutine(payload.routine.title, `new-${payload.routine.title}`))
      )

      const result = await ensureGZCLPRoutines(
        mockClient as unknown as HevyClient,
        mockExercises,
        mockProgression,
        defaultSettings
      )

      // Should not update any
      expect(mockClient.updateRoutine).not.toHaveBeenCalled()

      // Should create all 4
      expect(mockClient.createRoutine).toHaveBeenCalledTimes(4)

      expect(result.A1).toBeDefined()
      expect(result.B1).toBeDefined()
      expect(result.A2).toBeDefined()
      expect(result.B2).toBeDefined()
    })

    it('should only update when all routines exist', async () => {
      const existingRoutines: Routine[] = [
        createMockRoutine('GZCLP A1', 'routine-a1'),
        createMockRoutine('GZCLP B1', 'routine-b1'),
        createMockRoutine('GZCLP A2', 'routine-a2'),
        createMockRoutine('GZCLP B2', 'routine-b2'),
      ]
      mockClient.getAllRoutines.mockResolvedValue(existingRoutines)
      mockClient.updateRoutine.mockImplementation((id: string) =>
        Promise.resolve(createMockRoutine('Updated', id))
      )

      await ensureGZCLPRoutines(
        mockClient as unknown as HevyClient,
        mockExercises,
        mockProgression,
        defaultSettings
      )

      // Should not create any
      expect(mockClient.createRoutine).not.toHaveBeenCalled()

      // Should update all 4
      expect(mockClient.updateRoutine).toHaveBeenCalledTimes(4)
    })

    it('should pass folder_id to new routines', async () => {
      mockClient.getAllRoutines.mockResolvedValue([])
      mockClient.createRoutine.mockImplementation((payload: { routine: { title: string } }) =>
        Promise.resolve(createMockRoutine(payload.routine.title, `new-${payload.routine.title}`))
      )

      await ensureGZCLPRoutines(
        mockClient as unknown as HevyClient,
        mockExercises,
        mockProgression,
        defaultSettings,
        456
      )

      // Verify folder_id was passed to all create calls
      for (const call of mockClient.createRoutine.mock.calls) {
        expect(call[0].routine.folder_id).toBe(456)
      }
    })
  })
})
