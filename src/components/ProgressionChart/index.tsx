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

  // Get current selection data
  const currentHistory = progressionHistory[selectedKey]
  const tier = deriveTierFromKey(selectedKey)

  // Transform to chart data (historical only)
  const { chartData, yMin, yMax, xAxisLabel } = useChartData({
    history: currentHistory,
    granularity,
    workoutsPerWeek,
  })

  // Empty state - no exercises configured
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

  // No data state - no historical data for selected exercise
  if (chartData.length === 0) {
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
        <ExerciseSelector
          options={exerciseOptions}
          selectedKey={selectedKey}
          onChange={setSelectedKey}
        />
        <GranularityToggle value={granularity} onChange={setGranularity} />
      </div>

      {/* Chart */}
      <ProgressionChart
        data={chartData}
        yMin={yMin}
        yMax={yMax}
        xAxisLabel={xAxisLabel}
        unit={unit}
        tier={tier}
      />

      {/* Legend */}
      <ChartLegend />
    </div>
  )
}
