/**
 * Tests for PendingChange Generator
 *
 * Tests for creating PendingChange objects from progression results.
 */

import { describe, it, expect } from 'vitest'
import {
  createPendingChange,
  createPendingChangesFromAnalysis,
} from '@/lib/progression'
import type {
  ExerciseConfig,
  ProgressionState,
  PendingChange,
  WeightUnit,
} from '@/types/state'
import type { WorkoutAnalysisResult } from '@/lib/workout-analysis'

describe('createPendingChange', () => {
  const mockExercise: ExerciseConfig = {
    id: 'ex-1',
    hevyTemplateId: 'hevy-1',
    name: 'Squat',
    tier: 'T1',
    slot: 't1_squat',
    muscleGroup: 'lower',
  }

  const mockProgression: ProgressionState = {
    exerciseId: 'ex-1',
    currentWeight: 100,
    stage: 0,
    baseWeight: 100,
    lastWorkoutId: null,
    lastWorkoutDate: null,
    amrapRecord: 5,
  }

  it('should create a PendingChange for T1 weight progression', () => {
    const result = createPendingChange(
      mockExercise,
      mockProgression,
      {
        type: 'progress',
        newWeight: 105,
        newStage: 0,
        newScheme: '5x3+',
        reason: 'Completed 5x3+ at 100kg. Adding 5kg.',
      },
      'workout-123',
      '2024-01-15T10:00:00Z'
    )

    expect(result.id).toBeDefined()
    expect(result.id.length).toBeGreaterThan(0)
    expect(result.exerciseId).toBe('ex-1')
    expect(result.exerciseName).toBe('Squat')
    expect(result.tier).toBe('T1')
    expect(result.type).toBe('progress')
    expect(result.currentWeight).toBe(100)
    expect(result.currentStage).toBe(0)
    expect(result.newWeight).toBe(105)
    expect(result.newStage).toBe(0)
    expect(result.newScheme).toBe('5x3+')
    expect(result.reason).toBe('Completed 5x3+ at 100kg. Adding 5kg.')
    expect(result.workoutId).toBe('workout-123')
    expect(result.workoutDate).toBe('2024-01-15T10:00:00Z')
    expect(result.createdAt).toBeDefined()
  })

  it('should create a PendingChange for T1 stage change', () => {
    const result = createPendingChange(
      mockExercise,
      mockProgression,
      {
        type: 'stage_change',
        newWeight: 100,
        newStage: 1,
        newScheme: '6x2+',
        reason: 'Failed to complete 5x3+ at 100kg. Moving to 6x2+.',
      },
      'workout-456',
      '2024-01-16T10:00:00Z'
    )

    expect(result.type).toBe('stage_change')
    expect(result.newWeight).toBe(100)
    expect(result.newStage).toBe(1)
    expect(result.newScheme).toBe('6x2+')
  })

  it('should create a PendingChange for deload', () => {
    const progressionAtStage2: ProgressionState = {
      ...mockProgression,
      stage: 2,
    }

    const result = createPendingChange(
      mockExercise,
      progressionAtStage2,
      {
        type: 'deload',
        newWeight: 85,
        newStage: 0,
        newScheme: '5x3+',
        newBaseWeight: 85,
        reason: 'Failed 10x1+ at 100kg. Deloading to 85kg and restarting at 5x3+.',
      },
      'workout-789',
      '2024-01-17T10:00:00Z'
    )

    expect(result.type).toBe('deload')
    expect(result.currentStage).toBe(2)
    expect(result.newWeight).toBe(85)
    expect(result.newStage).toBe(0)
  })

  it('should create a PendingChange for T3 repeat', () => {
    const t3Exercise: ExerciseConfig = {
      id: 'ex-t3',
      hevyTemplateId: 'hevy-t3',
      name: 'Lat Pulldown',
      tier: 'T3',
      slot: 't3_1',
      muscleGroup: 'upper',
    }

    const t3Progression: ProgressionState = {
      exerciseId: 'ex-t3',
      currentWeight: 50,
      stage: 0,
      baseWeight: 50,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    }

    const result = createPendingChange(
      t3Exercise,
      t3Progression,
      {
        type: 'repeat',
        newWeight: 50,
        newStage: 0,
        newScheme: '3x15+',
        reason: 'Hit 20 total reps (need 25+) at 50kg. Repeat same weight.',
      },
      'workout-t3',
      '2024-01-18T10:00:00Z'
    )

    expect(result.type).toBe('repeat')
    expect(result.tier).toBe('T3')
    expect(result.newWeight).toBe(50)
  })

  it('should generate unique IDs for each change', () => {
    const result1 = createPendingChange(
      mockExercise,
      mockProgression,
      {
        type: 'progress',
        newWeight: 105,
        newStage: 0,
        newScheme: '5x3+',
        reason: 'Test',
      },
      'workout-1',
      '2024-01-15T10:00:00Z'
    )

    const result2 = createPendingChange(
      mockExercise,
      mockProgression,
      {
        type: 'progress',
        newWeight: 105,
        newStage: 0,
        newScheme: '5x3+',
        reason: 'Test',
      },
      'workout-2',
      '2024-01-16T10:00:00Z'
    )

    expect(result1.id).not.toBe(result2.id)
  })
})

describe('createPendingChangesFromAnalysis', () => {
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

  const unit: WeightUnit = 'kg'

  it('should create pending changes from workout analysis results', () => {
    const analysisResults: WorkoutAnalysisResult[] = [
      {
        exerciseId: 'ex-squat',
        exerciseName: 'Squat',
        tier: 'T1',
        reps: [3, 3, 3, 3, 5], // Success - 5x3+
        weight: 100,
        workoutId: 'workout-1',
        workoutDate: '2024-01-15T10:00:00Z',
      },
    ]

    const changes = createPendingChangesFromAnalysis(
      analysisResults,
      mockExercises,
      mockProgression,
      unit
    )

    expect(changes).toHaveLength(1)
    expect(changes[0].type).toBe('progress')
    expect(changes[0].newWeight).toBe(105)
    expect(changes[0].exerciseName).toBe('Squat')
  })

  it('should handle multiple exercises in one workout', () => {
    const analysisResults: WorkoutAnalysisResult[] = [
      {
        exerciseId: 'ex-squat',
        exerciseName: 'Squat',
        tier: 'T1',
        reps: [3, 3, 3, 3, 5],
        weight: 100,
        workoutId: 'workout-1',
        workoutDate: '2024-01-15T10:00:00Z',
      },
      {
        exerciseId: 'ex-bench',
        exerciseName: 'Bench Press',
        tier: 'T2',
        reps: [10, 10, 10],
        weight: 60,
        workoutId: 'workout-1',
        workoutDate: '2024-01-15T10:00:00Z',
      },
    ]

    const changes = createPendingChangesFromAnalysis(
      analysisResults,
      mockExercises,
      mockProgression,
      unit
    )

    expect(changes).toHaveLength(2)
    expect(changes.find((c) => c.exerciseName === 'Squat')?.type).toBe('progress')
    expect(changes.find((c) => c.exerciseName === 'Bench Press')?.type).toBe('progress')
  })

  it('should handle T1 failure with stage change', () => {
    const analysisResults: WorkoutAnalysisResult[] = [
      {
        exerciseId: 'ex-squat',
        exerciseName: 'Squat',
        tier: 'T1',
        reps: [3, 3, 2, 2, 1], // Failure - not all sets hit 3 reps
        weight: 100,
        workoutId: 'workout-1',
        workoutDate: '2024-01-15T10:00:00Z',
      },
    ]

    const changes = createPendingChangesFromAnalysis(
      analysisResults,
      mockExercises,
      mockProgression,
      unit
    )

    expect(changes).toHaveLength(1)
    expect(changes[0].type).toBe('stage_change')
    expect(changes[0].newStage).toBe(1)
    expect(changes[0].newScheme).toBe('6x2+')
  })

  it('should handle T3 repeat when below threshold', () => {
    const analysisResults: WorkoutAnalysisResult[] = [
      {
        exerciseId: 'ex-lat',
        exerciseName: 'Lat Pulldown',
        tier: 'T3',
        reps: [8, 7, 6], // Total 21, below 25 threshold
        weight: 40,
        workoutId: 'workout-1',
        workoutDate: '2024-01-15T10:00:00Z',
      },
    ]

    const changes = createPendingChangesFromAnalysis(
      analysisResults,
      mockExercises,
      mockProgression,
      unit
    )

    expect(changes).toHaveLength(1)
    expect(changes[0].type).toBe('repeat')
    expect(changes[0].newWeight).toBe(40)
  })

  it('should skip exercises not found in config', () => {
    const analysisResults: WorkoutAnalysisResult[] = [
      {
        exerciseId: 'unknown-exercise',
        exerciseName: 'Unknown',
        tier: 'T1',
        reps: [3, 3, 3, 3, 5],
        weight: 100,
        workoutId: 'workout-1',
        workoutDate: '2024-01-15T10:00:00Z',
      },
    ]

    const changes = createPendingChangesFromAnalysis(
      analysisResults,
      mockExercises,
      mockProgression,
      unit
    )

    expect(changes).toHaveLength(0)
  })

  it('should skip exercises without progression state', () => {
    const analysisResults: WorkoutAnalysisResult[] = [
      {
        exerciseId: 'ex-squat',
        exerciseName: 'Squat',
        tier: 'T1',
        reps: [3, 3, 3, 3, 5],
        weight: 100,
        workoutId: 'workout-1',
        workoutDate: '2024-01-15T10:00:00Z',
      },
    ]

    const emptyProgression: Record<string, ProgressionState> = {}

    const changes = createPendingChangesFromAnalysis(
      analysisResults,
      mockExercises,
      emptyProgression,
      unit
    )

    expect(changes).toHaveLength(0)
  })

  it('should return empty array for empty analysis results', () => {
    const changes = createPendingChangesFromAnalysis(
      [],
      mockExercises,
      mockProgression,
      unit
    )

    expect(changes).toHaveLength(0)
  })

  it('should use lbs increments when unit is lbs', () => {
    const analysisResults: WorkoutAnalysisResult[] = [
      {
        exerciseId: 'ex-squat',
        exerciseName: 'Squat',
        tier: 'T1',
        reps: [3, 3, 3, 3, 5],
        weight: 220, // Weight in lbs
        workoutId: 'workout-1',
        workoutDate: '2024-01-15T10:00:00Z',
      },
    ]

    const lbsProgression: Record<string, ProgressionState> = {
      'ex-squat': {
        exerciseId: 'ex-squat',
        currentWeight: 220,
        stage: 0,
        baseWeight: 220,
        lastWorkoutId: null,
        lastWorkoutDate: null,
        amrapRecord: 5,
      },
    }

    const changes = createPendingChangesFromAnalysis(
      analysisResults,
      mockExercises,
      lbsProgression,
      'lbs'
    )

    expect(changes).toHaveLength(1)
    expect(changes[0].newWeight).toBe(230) // 220 + 10lbs (lower body increment)
  })

  it('should handle discrepancy by using actual workout weight', () => {
    // When there's a weight discrepancy, the progression should be based on
    // the actual weight used in the workout, not the stored weight
    const analysisResults: WorkoutAnalysisResult[] = [
      {
        exerciseId: 'ex-squat',
        exerciseName: 'Squat',
        tier: 'T1',
        reps: [3, 3, 3, 3, 5],
        weight: 95, // Actual weight differs from stored (100)
        workoutId: 'workout-1',
        workoutDate: '2024-01-15T10:00:00Z',
        discrepancy: {
          storedWeight: 100,
          actualWeight: 95,
        },
      },
    ]

    const changes = createPendingChangesFromAnalysis(
      analysisResults,
      mockExercises,
      mockProgression,
      unit
    )

    expect(changes).toHaveLength(1)
    // Progression should be based on actual workout weight (95), not stored (100)
    expect(changes[0].newWeight).toBe(100) // 95 + 5kg
    expect(changes[0].currentWeight).toBe(100) // Still shows stored weight for reference
  })
})
