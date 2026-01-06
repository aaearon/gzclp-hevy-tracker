/**
 * Prediction Algorithm Tests
 *
 * Tests for GZCLP-aware progression prediction.
 */

import { describe, it, expect } from 'vitest'
import {
  predictProgression,
  calculateHistoricalMetrics,
  simulateWorkoutOutcome,
  estimateWorkoutDate,
  DEFAULT_PREDICTION_CONFIG,
} from '@/lib/prediction'
import type { ProgressionHistoryEntry, Tier, Stage } from '@/types/state'

describe('Prediction Algorithm', () => {
  // Helper to create history entries
  const createEntry = (overrides: Partial<ProgressionHistoryEntry> = {}): ProgressionHistoryEntry => ({
    date: '2024-01-15T10:00:00Z',
    workoutId: 'w-1',
    weight: 100,
    stage: 0,
    tier: 'T1',
    success: true,
    amrapReps: 5,
    changeType: 'progress',
    ...overrides,
  })

  describe('calculateHistoricalMetrics', () => {
    it('returns default metrics for empty history', () => {
      const metrics = calculateHistoricalMetrics([])

      expect(metrics.failureRate).toBe(0.3) // Default fallback
      expect(metrics.avgWorkoutsPerStage).toBe(8) // Default
      expect(metrics.deloadFrequency).toBe(0) // No deloads
      expect(metrics.sampleSize).toBe(0)
    })

    it('calculates failure rate from history', () => {
      const history: ProgressionHistoryEntry[] = [
        createEntry({ success: true }),
        createEntry({ success: true }),
        createEntry({ success: false }),
        createEntry({ success: true }),
      ]

      const metrics = calculateHistoricalMetrics(history)

      expect(metrics.failureRate).toBe(0.25) // 1/4 failed
      expect(metrics.sampleSize).toBe(4)
    })

    it('calculates deload frequency', () => {
      const history: ProgressionHistoryEntry[] = [
        createEntry({ changeType: 'progress' }),
        createEntry({ changeType: 'progress' }),
        createEntry({ changeType: 'deload' }),
        createEntry({ changeType: 'progress' }),
        createEntry({ changeType: 'progress' }),
        createEntry({ changeType: 'deload' }),
      ]

      const metrics = calculateHistoricalMetrics(history)

      expect(metrics.deloadFrequency).toBe(2 / 6) // 2 deloads in 6 workouts
    })

    it('calculates average workouts per stage from stage changes', () => {
      // Simulate: 4 workouts at stage 0, then stage change, 3 at stage 1
      const history: ProgressionHistoryEntry[] = [
        createEntry({ stage: 0, changeType: 'progress' }),
        createEntry({ stage: 0, changeType: 'progress' }),
        createEntry({ stage: 0, changeType: 'progress' }),
        createEntry({ stage: 0, changeType: 'stage_change' }), // Failed after 4
        createEntry({ stage: 1, changeType: 'progress' }),
        createEntry({ stage: 1, changeType: 'progress' }),
        createEntry({ stage: 1, changeType: 'stage_change' }), // Failed after 3
      ]

      const metrics = calculateHistoricalMetrics(history)

      // Average: (4 + 3) / 2 = 3.5
      expect(metrics.avgWorkoutsPerStage).toBeCloseTo(3.5, 1)
    })
  })

  describe('simulateWorkoutOutcome', () => {
    it('returns progress for T1 success at stage 0', () => {
      const result = simulateWorkoutOutcome({
        tier: 'T1',
        currentWeight: 100,
        currentStage: 0,
        success: true,
        muscleGroup: 'lower',
        unit: 'kg',
      })

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(105) // +5kg for lower body
      expect(result.newStage).toBe(0)
    })

    it('returns stage_change for T1 failure at stage 0', () => {
      const result = simulateWorkoutOutcome({
        tier: 'T1',
        currentWeight: 100,
        currentStage: 0,
        success: false,
        muscleGroup: 'lower',
        unit: 'kg',
      })

      expect(result.type).toBe('stage_change')
      expect(result.newWeight).toBe(100) // Same weight
      expect(result.newStage).toBe(1) // Next stage
    })

    it('returns deload for T1 failure at stage 2', () => {
      const result = simulateWorkoutOutcome({
        tier: 'T1',
        currentWeight: 100,
        currentStage: 2,
        success: false,
        muscleGroup: 'lower',
        unit: 'kg',
      })

      expect(result.type).toBe('deload')
      expect(result.newWeight).toBe(85) // 85% of 100
      expect(result.newStage).toBe(0) // Reset to stage 0
    })

    it('returns progress for T2 success', () => {
      const result = simulateWorkoutOutcome({
        tier: 'T2',
        currentWeight: 60,
        currentStage: 0,
        success: true,
        muscleGroup: 'upper',
        unit: 'kg',
      })

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(62.5) // +2.5kg for upper body
      expect(result.newStage).toBe(0)
    })

    it('returns progress for T3 success (linear)', () => {
      const result = simulateWorkoutOutcome({
        tier: 'T3',
        currentWeight: 40,
        currentStage: 0,
        success: true,
        muscleGroup: 'upper',
        unit: 'kg',
      })

      expect(result.type).toBe('progress')
      expect(result.newWeight).toBe(42.5) // +2.5kg for upper body
      expect(result.newStage).toBe(0) // T3 stays at stage 0
    })

    it('returns repeat for T3 failure (no deload)', () => {
      const result = simulateWorkoutOutcome({
        tier: 'T3',
        currentWeight: 40,
        currentStage: 0,
        success: false,
        muscleGroup: 'upper',
        unit: 'kg',
      })

      expect(result.type).toBe('repeat')
      expect(result.newWeight).toBe(40) // Same weight
      expect(result.newStage).toBe(0)
    })

    it('uses correct increments for lbs unit', () => {
      const result = simulateWorkoutOutcome({
        tier: 'T1',
        currentWeight: 225,
        currentStage: 0,
        success: true,
        muscleGroup: 'lower',
        unit: 'lbs',
      })

      expect(result.newWeight).toBe(235) // +10lbs for lower body
    })
  })

  describe('estimateWorkoutDate', () => {
    it('estimates future dates based on workouts per week', () => {
      const baseDate = new Date('2024-01-15')
      const workoutsPerWeek = 3

      const date1 = estimateWorkoutDate(1, workoutsPerWeek, baseDate)
      const date2 = estimateWorkoutDate(2, workoutsPerWeek, baseDate)
      const date3 = estimateWorkoutDate(3, workoutsPerWeek, baseDate)

      // 3 workouts/week = ~2.33 days between workouts
      const days1 = (new Date(date1).getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
      const days2 = (new Date(date2).getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
      const days3 = (new Date(date3).getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)

      expect(days1).toBeCloseTo(2.33, 0)
      expect(days2).toBeCloseTo(4.67, 0)
      expect(days3).toBeCloseTo(7, 0) // 1 week
    })
  })

  describe('predictProgression', () => {
    it('generates predictions for specified horizon', () => {
      const result = predictProgression({
        progressionKey: 'squat-T1',
        currentWeight: 100,
        currentStage: 0,
        tier: 'T1',
        muscleGroup: 'lower',
        unit: 'kg',
        history: [],
        workoutsPerWeek: 3,
      }, { ...DEFAULT_PREDICTION_CONFIG, horizonWorkouts: 5 })

      expect(result.predictions).toHaveLength(5)
    })

    it('predicts weight increases for successful workouts', () => {
      // With no history, use deterministic success assumption
      const result = predictProgression({
        progressionKey: 'squat-T1',
        currentWeight: 100,
        currentStage: 0,
        tier: 'T1',
        muscleGroup: 'lower',
        unit: 'kg',
        history: [],
        workoutsPerWeek: 3,
      }, { ...DEFAULT_PREDICTION_CONFIG, horizonWorkouts: 3, assumeSuccess: true })

      // With assumeSuccess, all predictions should show weight increases
      expect(result.predictions[0].weight).toBe(105)
      expect(result.predictions[1].weight).toBe(110)
      expect(result.predictions[2].weight).toBe(115)
    })

    it('includes stage change and deload markers', () => {
      // Force a failure scenario by starting at stage 2
      const result = predictProgression({
        progressionKey: 'squat-T1',
        currentWeight: 100,
        currentStage: 2,
        tier: 'T1',
        muscleGroup: 'lower',
        unit: 'kg',
        history: [
          createEntry({ success: false }), // High failure rate
          createEntry({ success: false }),
          createEntry({ success: false }),
        ],
        workoutsPerWeek: 3,
      }, { ...DEFAULT_PREDICTION_CONFIG, horizonWorkouts: 5 })

      // Should have some predictions with isDeload or isStageChange
      const hasDeload = result.predictions.some(p => p.isDeload)
      expect(hasDeload).toBe(true)
    })

    it('decays confidence over prediction horizon', () => {
      const result = predictProgression({
        progressionKey: 'squat-T1',
        currentWeight: 100,
        currentStage: 0,
        tier: 'T1',
        muscleGroup: 'lower',
        unit: 'kg',
        history: [],
        workoutsPerWeek: 3,
      }, { ...DEFAULT_PREDICTION_CONFIG, horizonWorkouts: 10 })

      // Later predictions should have lower confidence
      expect(result.predictions[0].confidence).toBeGreaterThan(result.predictions[9].confidence)
    })

    it('has higher initial confidence with more history', () => {
      const manyHistory = Array.from({ length: 20 }, (_, i) =>
        createEntry({ workoutId: `w-${i}` })
      )

      const resultWithHistory = predictProgression({
        progressionKey: 'squat-T1',
        currentWeight: 100,
        currentStage: 0,
        tier: 'T1',
        muscleGroup: 'lower',
        unit: 'kg',
        history: manyHistory,
        workoutsPerWeek: 3,
      })

      const resultNoHistory = predictProgression({
        progressionKey: 'squat-T1',
        currentWeight: 100,
        currentStage: 0,
        tier: 'T1',
        muscleGroup: 'lower',
        unit: 'kg',
        history: [],
        workoutsPerWeek: 3,
      })

      expect(resultWithHistory.overallConfidence).toBeGreaterThan(resultNoHistory.overallConfidence)
    })

    it('returns weeksToDeload estimate when deload is predicted', () => {
      const result = predictProgression({
        progressionKey: 'squat-T1',
        currentWeight: 100,
        currentStage: 2, // At stage 2, next failure = deload
        tier: 'T1',
        muscleGroup: 'lower',
        unit: 'kg',
        history: [
          createEntry({ success: false }),
          createEntry({ success: false }),
        ],
        workoutsPerWeek: 3,
      }, { ...DEFAULT_PREDICTION_CONFIG, horizonWorkouts: 20 })

      // With high failure rate and stage 2, should predict deload soon
      if (result.predictions.some(p => p.isDeload)) {
        expect(result.weeksToDeload).toBeGreaterThan(0)
      }
    })
  })

  describe('T3 predictions', () => {
    it('predicts linear progression for T3 (no stage changes)', () => {
      const result = predictProgression({
        progressionKey: 'lat-pulldown-123',
        currentWeight: 40,
        currentStage: 0,
        tier: 'T3',
        muscleGroup: 'upper',
        unit: 'kg',
        history: [],
        workoutsPerWeek: 3,
      }, { ...DEFAULT_PREDICTION_CONFIG, horizonWorkouts: 5, assumeSuccess: true })

      // T3 should show linear weight increases
      expect(result.predictions[0].weight).toBe(42.5)
      expect(result.predictions[1].weight).toBe(45)
      expect(result.predictions[2].weight).toBe(47.5)

      // No stage changes for T3
      expect(result.predictions.every(p => p.stage === 0)).toBe(true)
      expect(result.predictions.every(p => !p.isStageChange)).toBe(true)
    })

    it('predicts repeat (not deload) for T3 failure', () => {
      const result = predictProgression({
        progressionKey: 'lat-pulldown-123',
        currentWeight: 40,
        currentStage: 0,
        tier: 'T3',
        muscleGroup: 'upper',
        unit: 'kg',
        history: [
          createEntry({ tier: 'T3', success: false }),
          createEntry({ tier: 'T3', success: false }),
          createEntry({ tier: 'T3', success: false }),
        ],
        workoutsPerWeek: 3,
      }, { ...DEFAULT_PREDICTION_CONFIG, horizonWorkouts: 5 })

      // T3 never deloads
      expect(result.predictions.every(p => !p.isDeload)).toBe(true)
    })
  })
})
