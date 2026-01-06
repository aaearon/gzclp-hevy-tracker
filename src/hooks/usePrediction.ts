/**
 * usePrediction Hook
 *
 * Provides prediction data for a specific exercise based on its history and current state.
 */

import { useMemo } from 'react'
import { predictProgression, DEFAULT_PREDICTION_CONFIG } from '@/lib/prediction'
import type {
  ExerciseHistory,
  ProgressionState,
  ExerciseConfig,
  PredictionDataPoint,
  MuscleGroupCategory,
  WeightUnit,
  Tier,
} from '@/types/state'
import { MAIN_LIFT_ROLES } from '@/types/state'

export interface UsePredictionProps {
  /** Progression key (e.g., "squat-T1" or exercise ID for T3) */
  progressionKey: string
  /** Current progression state for this exercise */
  progression: ProgressionState | undefined
  /** Historical data for this exercise */
  history: ExerciseHistory | undefined
  /** Exercise config to determine muscle group */
  exercise: ExerciseConfig | undefined
  /** User's weight unit preference */
  unit: WeightUnit
  /** Workouts per week for date estimation */
  workoutsPerWeek: number
  /** Number of workouts to predict (default: 12) */
  horizonWorkouts?: number
}

export interface UsePredictionResult {
  /** Predicted future data points */
  predictions: PredictionDataPoint[]
  /** Overall prediction confidence (0-1) */
  confidence: number
  /** Estimated weeks until next deload (null if none predicted) */
  weeksToDeload: number | null
  /** Whether we have enough data to make predictions */
  hasSufficientData: boolean
}

/**
 * Derive tier from progression key.
 */
function deriveTierFromKey(key: string): Tier {
  if (key.endsWith('-T1')) return 'T1'
  if (key.endsWith('-T2')) return 'T2'
  return 'T3'
}

/**
 * Derive muscle group from progression key or exercise.
 */
function deriveMuscleGroup(
  progressionKey: string,
  exercise: ExerciseConfig | undefined
): MuscleGroupCategory {
  // Main lifts: derive from key
  const keyLower = progressionKey.toLowerCase()
  if (keyLower.includes('squat') || keyLower.includes('deadlift')) {
    return 'lower'
  }
  if (keyLower.includes('bench') || keyLower.includes('ohp')) {
    return 'upper'
  }

  // T3: Check exercise role
  if (exercise?.role) {
    if (exercise.role === 'squat' || exercise.role === 'deadlift') {
      return 'lower'
    }
    if (MAIN_LIFT_ROLES.includes(exercise.role as typeof MAIN_LIFT_ROLES[number])) {
      return 'upper'
    }
  }

  // Default T3 accessories to upper body (more common)
  return 'upper'
}

/**
 * Hook to get progression predictions for an exercise.
 */
export function usePrediction(props: UsePredictionProps): UsePredictionResult {
  const {
    progressionKey,
    progression,
    history,
    exercise,
    unit,
    workoutsPerWeek,
    horizonWorkouts = 12,
  } = props

  const result = useMemo(() => {
    // No progression state = no predictions
    if (!progression) {
      return {
        predictions: [],
        confidence: 0,
        weeksToDeload: null,
        hasSufficientData: false,
      }
    }

    const tier = deriveTierFromKey(progressionKey)
    const muscleGroup = deriveMuscleGroup(progressionKey, exercise)

    const predictionResult = predictProgression(
      {
        progressionKey,
        currentWeight: progression.currentWeight,
        currentStage: progression.stage,
        tier,
        muscleGroup,
        unit,
        history: history?.entries ?? [],
        workoutsPerWeek,
      },
      {
        ...DEFAULT_PREDICTION_CONFIG,
        horizonWorkouts,
      }
    )

    return {
      predictions: predictionResult.predictions,
      confidence: predictionResult.overallConfidence,
      weeksToDeload: predictionResult.weeksToDeload,
      hasSufficientData: true,
    }
  }, [progressionKey, progression, history, exercise, unit, workoutsPerWeek, horizonWorkouts])

  return result
}
