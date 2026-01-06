/**
 * Progression Prediction Algorithm
 *
 * GZCLP-aware prediction model that factors in deloads, stage changes,
 * and historical failure rates to predict future progression.
 */

import type {
  ProgressionHistoryEntry,
  PredictionDataPoint,
  Tier,
  Stage,
  MuscleGroupCategory,
  WeightUnit,
  ChangeType,
} from '@/types/state'
import { WEIGHT_INCREMENTS, DELOAD_PERCENTAGE, WEIGHT_ROUNDING } from './constants'

// =============================================================================
// Configuration
// =============================================================================

export interface PredictionConfig {
  /** Number of workouts to predict ahead */
  horizonWorkouts: number
  /** Default workouts per stage if no history */
  defaultWorkoutsPerStage: number
  /** Minimum confidence to include prediction */
  minConfidence: number
  /** Confidence decay per workout (0-1) */
  confidenceDecay: number
  /** Assume all workouts succeed (for deterministic prediction) */
  assumeSuccess?: boolean
}

export const DEFAULT_PREDICTION_CONFIG: PredictionConfig = {
  horizonWorkouts: 12,
  defaultWorkoutsPerStage: 8,
  minConfidence: 0.1,
  confidenceDecay: 0.02,
}

// =============================================================================
// Input/Output Types
// =============================================================================

export interface PredictionInput {
  progressionKey: string
  currentWeight: number
  currentStage: Stage
  tier: Tier
  muscleGroup: MuscleGroupCategory
  unit: WeightUnit
  history: ProgressionHistoryEntry[]
  workoutsPerWeek: number
}

export interface PredictionResult {
  predictions: PredictionDataPoint[]
  /** Overall confidence based on history length */
  overallConfidence: number
  /** Expected weeks until next deload (null if none predicted) */
  weeksToDeload: number | null
}

export interface HistoricalMetrics {
  failureRate: number
  avgWorkoutsPerStage: number
  deloadFrequency: number
  sampleSize: number
}

export interface SimulationOutcome {
  type: ChangeType
  newWeight: number
  newStage: Stage
}

// =============================================================================
// Historical Metrics Calculation
// =============================================================================

/**
 * Calculate metrics from historical workout data.
 */
export function calculateHistoricalMetrics(
  history: ProgressionHistoryEntry[]
): HistoricalMetrics {
  if (history.length === 0) {
    return {
      failureRate: 0.3, // Conservative default
      avgWorkoutsPerStage: 8,
      deloadFrequency: 0,
      sampleSize: 0,
    }
  }

  // Calculate failure rate
  const failures = history.filter((h) => !h.success).length
  const failureRate = failures / history.length

  // Calculate deload frequency
  const deloads = history.filter((h) => h.changeType === 'deload').length
  const deloadFrequency = deloads / history.length

  // Calculate average workouts per stage
  // Count workouts between stage changes
  const stageChanges = history.filter((h) => h.changeType === 'stage_change')
  let avgWorkoutsPerStage = 8 // Default

  if (stageChanges.length > 0) {
    // Find indices of stage changes
    const stageChangeIndices = history
      .map((h, i) => (h.changeType === 'stage_change' ? i : -1))
      .filter((i) => i >= 0)

    // Calculate average span between stage changes
    let totalWorkouts = 0
    let spans = 0

    // First span: start to first stage change
    const firstIndex = stageChangeIndices[0]
    if (firstIndex !== undefined && firstIndex > 0) {
      totalWorkouts += firstIndex + 1
      spans++
    }

    // Subsequent spans
    for (let i = 1; i < stageChangeIndices.length; i++) {
      const currIndex = stageChangeIndices[i]
      const prevIndex = stageChangeIndices[i - 1]
      if (currIndex !== undefined && prevIndex !== undefined) {
        const span = currIndex - prevIndex
        totalWorkouts += span
        spans++
      }
    }

    if (spans > 0) {
      avgWorkoutsPerStage = totalWorkouts / spans
    }
  }

  return {
    failureRate,
    avgWorkoutsPerStage,
    deloadFrequency,
    sampleSize: history.length,
  }
}

// =============================================================================
// Workout Outcome Simulation
// =============================================================================

/**
 * Simulate a single workout outcome based on GZCLP rules.
 */
export function simulateWorkoutOutcome(params: {
  tier: Tier
  currentWeight: number
  currentStage: Stage
  success: boolean
  muscleGroup: MuscleGroupCategory
  unit: WeightUnit
}): SimulationOutcome {
  const { tier, currentWeight, currentStage, success, muscleGroup, unit } = params
  const increment = WEIGHT_INCREMENTS[unit][muscleGroup]
  const rounding = WEIGHT_ROUNDING[unit]

  // T3: Linear progression, no deloads
  if (tier === 'T3') {
    if (success) {
      return {
        type: 'progress',
        newWeight: currentWeight + increment,
        newStage: 0,
      }
    }
    return {
      type: 'repeat',
      newWeight: currentWeight,
      newStage: 0,
    }
  }

  // T1/T2: Success = weight increase
  if (success) {
    return {
      type: 'progress',
      newWeight: currentWeight + increment,
      newStage: currentStage,
    }
  }

  // T1/T2: Failure - check stage
  if (currentStage < 2) {
    // Move to next stage, keep weight
    return {
      type: 'stage_change',
      newWeight: currentWeight,
      newStage: (currentStage + 1) as Stage,
    }
  }

  // Stage 2 failure = deload
  const deloadWeight = Math.round((currentWeight * DELOAD_PERCENTAGE) / rounding) * rounding
  return {
    type: 'deload',
    newWeight: Math.max(deloadWeight, 20), // Min bar weight
    newStage: 0,
  }
}

// =============================================================================
// Date Estimation
// =============================================================================

/**
 * Estimate the date of a future workout.
 */
export function estimateWorkoutDate(
  workoutNumber: number,
  workoutsPerWeek: number,
  baseDate: Date = new Date()
): string {
  const daysPerWorkout = 7 / workoutsPerWeek
  const daysFromNow = workoutNumber * daysPerWorkout
  const estimatedDate = new Date(baseDate.getTime() + daysFromNow * 24 * 60 * 60 * 1000)
  return estimatedDate.toISOString()
}

// =============================================================================
// Confidence Calculation
// =============================================================================

/**
 * Calculate initial confidence based on history size.
 */
function calculateInitialConfidence(historyLength: number): number {
  if (historyLength < 5) return 0.3
  if (historyLength < 15) return 0.5
  if (historyLength < 30) return 0.7
  return 0.85
}

/**
 * Determine if a workout should succeed based on metrics.
 * Uses deterministic average-based approach for reproducibility.
 */
function shouldWorkoutSucceed(
  metrics: HistoricalMetrics,
  currentStage: Stage,
  workoutIndex: number,
  assumeSuccess?: boolean
): boolean {
  if (assumeSuccess) return true

  // Higher stages have higher failure rates
  const stageMultipliers: Record<Stage, number> = { 0: 1, 1: 1.5, 2: 2 }
  const stageMultiplier = stageMultipliers[currentStage]
  const adjustedFailureRate = Math.min(metrics.failureRate * stageMultiplier, 0.8)

  // Deterministic: fail every N workouts based on failure rate
  if (adjustedFailureRate <= 0) return true

  const failEveryN = Math.round(1 / adjustedFailureRate)
  return (workoutIndex + 1) % failEveryN !== 0
}

// =============================================================================
// Main Prediction Function
// =============================================================================

/**
 * Predict future progression based on current state and history.
 */
export function predictProgression(
  input: PredictionInput,
  config: PredictionConfig = DEFAULT_PREDICTION_CONFIG
): PredictionResult {
  const {
    currentWeight,
    currentStage,
    tier,
    muscleGroup,
    unit,
    history,
    workoutsPerWeek,
  } = input

  const {
    horizonWorkouts,
    confidenceDecay,
    assumeSuccess,
  } = config

  // Calculate historical metrics
  const metrics = calculateHistoricalMetrics(history)

  // Initial confidence based on history
  const initialConfidence = calculateInitialConfidence(history.length)

  // Simulate forward
  const predictions: PredictionDataPoint[] = []
  let simulatedWeight = currentWeight
  let simulatedStage = currentStage
  let firstDeloadIndex: number | null = null

  for (let i = 0; i < horizonWorkouts; i++) {
    // Determine if this workout succeeds
    const success = shouldWorkoutSucceed(metrics, simulatedStage, i, assumeSuccess)

    // Simulate the outcome
    const outcome = simulateWorkoutOutcome({
      tier,
      currentWeight: simulatedWeight,
      currentStage: simulatedStage,
      success,
      muscleGroup,
      unit,
    })

    // Calculate confidence for this prediction
    const confidence = Math.max(initialConfidence * (1 - confidenceDecay * i), config.minConfidence)

    // Track first deload
    if (outcome.type === 'deload' && firstDeloadIndex === null) {
      firstDeloadIndex = i
    }

    // Add prediction
    predictions.push({
      date: estimateWorkoutDate(i + 1, workoutsPerWeek),
      workoutNumber: i + 1,
      weight: outcome.newWeight,
      stage: outcome.newStage,
      confidence,
      isDeload: outcome.type === 'deload',
      isStageChange: outcome.type === 'stage_change',
    })

    // Update simulation state for next iteration
    simulatedWeight = outcome.newWeight
    simulatedStage = outcome.newStage
  }

  // Calculate weeks to deload
  let weeksToDeload: number | null = null
  if (firstDeloadIndex !== null) {
    weeksToDeload = (firstDeloadIndex + 1) / workoutsPerWeek
  }

  return {
    predictions,
    overallConfidence: initialConfidence,
    weeksToDeload,
  }
}
