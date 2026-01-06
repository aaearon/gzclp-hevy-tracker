/**
 * ProgressionChart Container
 *
 * Main entry point for progression visualization.
 * Manages state and coordinates child components.
 */

import { useState, useMemo } from 'react'
import { ProgressionChart } from './ProgressionChart'
import { ExerciseSelector, buildExerciseOptions } from './ExerciseSelector'
import { GranularityToggle } from './GranularityToggle'
import { ChartLegend } from './ChartLegend'
import { usePrediction } from '@/hooks/usePrediction'
import { useChartData } from '@/hooks/useChartData'
import type {
  ExerciseConfig,
  ExerciseHistory,
  ProgressionState,
  ChartGranularity,
  Tier,
  WeightUnit,
} from '@/types/state'

interface ProgressionChartContainerProps {
  exercises: Record<string, ExerciseConfig>
  progression: Record<string, ProgressionState>
  progressionHistory: Record<string, ExerciseHistory>
  unit: WeightUnit
  workoutsPerWeek: number
}

/**
 * Derive tier from progression key.
 */
function deriveTierFromKey(key: string): Tier {
  if (key.endsWith('-T1')) return 'T1'
  if (key.endsWith('-T2')) return 'T2'
  return 'T3'
}

export function ProgressionChartContainer({
  exercises,
  progression,
  progressionHistory,
  unit,
  workoutsPerWeek,
}: ProgressionChartContainerProps) {
  // Get available progression keys
  const progressionKeys = useMemo(() => Object.keys(progression), [progression])
  const exerciseOptions = useMemo(
    () => buildExerciseOptions(exercises, progressionKeys),
    [exercises, progressionKeys]
  )

  // State
  const [selectedKey, setSelectedKey] = useState<string>(
    exerciseOptions[0]?.key ?? ''
  )
  const [granularity, setGranularity] = useState<ChartGranularity>('workout')
  const [showPredictions, setShowPredictions] = useState(true)

  // Get current selection data
  const currentProgression = progression[selectedKey]
  const currentHistory = progressionHistory[selectedKey]
  const currentExercise = useMemo(() => {
    // Find exercise by key (either role-tier format or exerciseId)
    if (selectedKey.includes('-T')) {
      // Main lift: find by role
      const role = selectedKey.replace(/-T[12]$/, '')
      return Object.values(exercises).find((e) => e.role === role)
    }
    return exercises[selectedKey]
  }, [selectedKey, exercises])

  const tier = deriveTierFromKey(selectedKey)

  // Get predictions
  const { predictions, confidence, weeksToDeload } = usePrediction({
    progressionKey: selectedKey,
    progression: currentProgression,
    history: currentHistory,
    exercise: currentExercise,
    unit,
    workoutsPerWeek,
    horizonWorkouts: granularity === 'week' ? 24 : 12, // More for weekly view
  })

  // Transform to chart data
  const { chartData, predictionStartIndex, yMin, yMax, xAxisLabel } = useChartData({
    history: currentHistory,
    predictions: showPredictions ? predictions : [],
    granularity,
    workoutsPerWeek,
  })

  // Empty state
  if (exerciseOptions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-gray-500">No exercises configured yet.</p>
        <p className="mt-1 text-sm text-gray-400">
          Complete the setup wizard to start tracking progression.
        </p>
      </div>
    )
  }

  // No data state
  if (chartData.length === 0 && !showPredictions) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ExerciseSelector
            options={exerciseOptions}
            selectedKey={selectedKey}
            onChange={setSelectedKey}
          />
          <GranularityToggle value={granularity} onChange={setGranularity} />
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">No workout history yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Sync your workouts from Hevy to see progression charts.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ExerciseSelector
            options={exerciseOptions}
            selectedKey={selectedKey}
            onChange={setSelectedKey}
          />

          {/* Prediction toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showPredictions}
              onChange={(e) => { setShowPredictions(e.target.checked) }}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Show Predictions</span>
          </label>
        </div>

        <GranularityToggle value={granularity} onChange={setGranularity} />
      </div>

      {/* Confidence indicator */}
      {showPredictions && predictions.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Prediction confidence:</span>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${String(confidence * 100)}%` }}
            />
          </div>
          <span className="text-gray-600">{Math.round(confidence * 100)}%</span>
          {weeksToDeload !== null && (
            <span className="ml-4 text-gray-500">
              Est. deload in ~{Math.round(weeksToDeload)} weeks
            </span>
          )}
        </div>
      )}

      {/* Chart */}
      <ProgressionChart
        data={chartData}
        predictionStartIndex={showPredictions ? predictionStartIndex : chartData.length}
        yMin={yMin}
        yMax={yMax}
        xAxisLabel={xAxisLabel}
        unit={unit}
        tier={tier}
      />

      {/* Legend */}
      <ChartLegend showPredictions={showPredictions && predictions.length > 0} />
    </div>
  )
}
