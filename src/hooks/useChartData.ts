/**
 * useChartData Hook
 *
 * Transforms progression history into chart-ready data format.
 * Supports both workout-by-workout and week-by-week aggregation.
 */

import { useMemo } from 'react'
import type {
  ExerciseHistory,
  ChartDataPoint,
  ChartGranularity,
} from '@/types/state'

export interface UseChartDataProps {
  /** Historical workout data */
  history: ExerciseHistory | undefined
  /** Time granularity: 'workout' or 'week' */
  granularity: ChartGranularity
  /** Workouts per week (for week calculation) */
  workoutsPerWeek: number
}

export interface UseChartDataResult {
  /** Chart data points */
  chartData: ChartDataPoint[]
  /** Min/max values for axis scaling */
  yMin: number
  yMax: number
  /** X-axis label format */
  xAxisLabel: string
}

/**
 * Calculate week number from workout index.
 */
function getWeekNumber(workoutIndex: number, workoutsPerWeek: number): number {
  return Math.floor(workoutIndex / workoutsPerWeek) + 1
}

/**
 * Aggregate data points by week (average weight, most recent stage).
 */
function aggregateByWeek(
  data: ChartDataPoint[],
  workoutsPerWeek: number
): ChartDataPoint[] {
  const weekMap = new Map<number, ChartDataPoint[]>()

  // Group by week
  for (const point of data) {
    const weekNum = getWeekNumber(point.x - 1, workoutsPerWeek) // x is 1-indexed
    const existing = weekMap.get(weekNum)
    if (existing) {
      existing.push(point)
    } else {
      weekMap.set(weekNum, [point])
    }
  }

  // Aggregate each week
  const aggregated: ChartDataPoint[] = []
  const sortedWeeks = Array.from(weekMap.keys()).sort((a, b) => a - b)

  for (const weekNum of sortedWeeks) {
    const points = weekMap.get(weekNum)
    if (!points) continue
    const avgWeight = points.reduce((sum, p) => sum + p.y, 0) / points.length
    const lastPoint = points[points.length - 1]

    // Find any events in this week
    const hasDeload = points.some((p) => p.event === 'deload')
    const hasStageChange = points.some((p) => p.event === 'stage_change')
    const hasPR = points.some((p) => p.event === 'pr')

    // Determine event for this week
    let event: 'deload' | 'stage_change' | 'pr' | undefined
    if (hasDeload) event = 'deload'
    else if (hasStageChange) event = 'stage_change'
    else if (hasPR) event = 'pr'

    // Ensure lastPoint exists (it should, since we have points in this week)
    if (!lastPoint) continue

    const point: ChartDataPoint = {
      x: weekNum,
      y: Math.round(avgWeight * 10) / 10, // Round to 1 decimal
      date: lastPoint.date,
      isHistorical: true,
      stage: lastPoint.stage,
    }
    if (event) point.event = event

    aggregated.push(point)
  }

  return aggregated
}

/**
 * Hook to transform history into chart data.
 */
export function useChartData(props: UseChartDataProps): UseChartDataResult {
  const { history, granularity, workoutsPerWeek } = props

  const result = useMemo(() => {
    const chartData: ChartDataPoint[] = []

    // Add historical data
    const entries = history?.entries ?? []
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (!entry) continue

      // Determine event marker
      let event: 'deload' | 'stage_change' | 'pr' | undefined
      if (entry.changeType === 'deload') {
        event = 'deload'
      } else if (entry.changeType === 'stage_change') {
        event = 'stage_change'
      }
      // Note: PR detection would require comparing amrapReps to previous records
      // This is simplified for now

      const point: ChartDataPoint = {
        x: i + 1, // 1-indexed workout number
        y: entry.weight,
        date: entry.date,
        isHistorical: true,
        stage: entry.stage,
      }
      if (event) point.event = event

      chartData.push(point)
    }

    // Apply week aggregation if needed
    let finalData = chartData

    if (granularity === 'week' && chartData.length > 0) {
      finalData = aggregateByWeek(chartData, workoutsPerWeek)
    }

    // Calculate Y-axis bounds (with padding)
    const weights = finalData.map((p) => p.y)
    const yMin = weights.length > 0 ? Math.min(...weights) * 0.9 : 0
    const yMax = weights.length > 0 ? Math.max(...weights) * 1.1 : 100

    return {
      chartData: finalData,
      yMin: Math.floor(yMin / 5) * 5, // Round to nearest 5
      yMax: Math.ceil(yMax / 5) * 5,
      xAxisLabel: granularity === 'week' ? 'Week' : 'Workout',
    }
  }, [history, granularity, workoutsPerWeek])

  return result
}
