/**
 * ProgressionChart Component
 *
 * Chart.js Line chart showing progression history and predictions.
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { ChartDataPoint, WeightUnit, Tier } from '@/types/state'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ProgressionChartProps {
  data: ChartDataPoint[]
  predictionStartIndex: number
  yMin: number
  yMax: number
  xAxisLabel: string
  unit: WeightUnit
  tier: Tier
}

/** Tier colors for the chart line */
const TIER_COLORS: Record<Tier, { line: string; fill: string }> = {
  T1: { line: 'rgb(239, 68, 68)', fill: 'rgba(239, 68, 68, 0.1)' },    // Red
  T2: { line: 'rgb(59, 130, 246)', fill: 'rgba(59, 130, 246, 0.1)' },  // Blue
  T3: { line: 'rgb(34, 197, 94)', fill: 'rgba(34, 197, 94, 0.1)' },    // Green
}

/** Event marker colors */
const EVENT_COLORS = {
  deload: 'rgb(239, 68, 68)',     // Red
  stage_change: 'rgb(234, 179, 8)', // Yellow
  pr: 'rgb(34, 197, 94)',          // Green
}

export function ProgressionChart({
  data,
  predictionStartIndex,
  yMin,
  yMax,
  xAxisLabel,
  unit,
  tier,
}: ProgressionChartProps) {
  const colors = TIER_COLORS[tier]

  // Prepare chart data
  const chartData = {
    labels: data.map((d) => d.x.toString()),
    datasets: [
      {
        label: 'Weight',
        data: data.map((d) => d.y),
        borderColor: colors.line,
        backgroundColor: colors.fill,
        fill: true,
        tension: 0.3, // Smooth curve
        pointRadius: (ctx: { dataIndex: number }) => {
          // Larger points for events
          const point = data[ctx.dataIndex]
          return point?.event ? 6 : 3
        },
        pointBackgroundColor: (ctx: { dataIndex: number }) => {
          const point = data[ctx.dataIndex]
          if (point?.event) {
            return EVENT_COLORS[point.event]
          }
          return colors.line
        },
        pointBorderColor: (ctx: { dataIndex: number }) => {
          const point = data[ctx.dataIndex]
          return point?.isHistorical ? colors.line : 'transparent'
        },
        pointBorderWidth: 2,
        borderWidth: 2,
        // Dashed line for predictions using segment styling
        segment: {
          borderDash: (ctx: { p0DataIndex: number; p1DataIndex: number }) => {
            // Dash after prediction start
            if (ctx.p0DataIndex >= predictionStartIndex - 1) {
              return [6, 4]
            }
            return undefined
          },
          borderColor: (ctx: { p0DataIndex: number }) => {
            // Lighter color for predictions
            if (ctx.p0DataIndex >= predictionStartIndex - 1) {
              return `${colors.line}80` // 50% opacity
            }
            return colors.line
          },
        },
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Using custom legend
      },
      tooltip: {
        callbacks: {
          title: (items: { dataIndex: number }[]) => {
            const idx = items[0]?.dataIndex
            if (idx === undefined) return ''
            const point = data[idx]
            if (!point) return ''
            const dateStr = new Date(point.date).toLocaleDateString()
            return `${xAxisLabel} ${String(point.x)} - ${dateStr}`
          },
          label: (item: { dataIndex: number; formattedValue: string }) => {
            const point = data[item.dataIndex]
            const unitLabel = unit === 'kg' ? 'kg' : 'lbs'
            let label = `Weight: ${item.formattedValue} ${unitLabel}`

            if (point?.event === 'deload') {
              label += ' (Deload)'
            } else if (point?.event === 'stage_change') {
              label += ' (Stage Change)'
            }

            if (!point?.isHistorical) {
              label += ' [Predicted]'
            }

            return label
          },
          afterLabel: (item: { dataIndex: number }) => {
            const point = data[item.dataIndex]
            if (point === undefined) return ''
            return `Stage: ${String(point.stage + 1)}` // Display as 1-indexed
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xAxisLabel,
          font: { size: 12, weight: 500 },
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: `Weight (${unit})`,
          font: { size: 12, weight: 500 },
        },
        min: yMin,
        max: yMax,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }

  return (
    <div className="h-64 w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}
