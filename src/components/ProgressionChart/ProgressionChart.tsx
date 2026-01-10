/**
 * ProgressionChart Component
 *
 * Chart.js Line chart showing progression history.
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
import { useTheme } from '@/contexts/ThemeContext'
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

/** Theme-aware colors for chart elements */
const THEME_COLORS = {
  light: {
    gridColor: 'rgba(0, 0, 0, 0.08)',
    textColor: 'rgb(55, 65, 81)', // gray-700
    tooltipBg: 'rgba(255, 255, 255, 0.95)',
    tooltipText: 'rgb(17, 24, 39)', // gray-900
    tooltipBorder: 'rgb(209, 213, 219)', // gray-300
  },
  dark: {
    gridColor: 'rgba(255, 255, 255, 0.1)',
    textColor: 'rgb(209, 213, 219)', // gray-300
    tooltipBg: 'rgba(31, 41, 55, 0.95)', // gray-800
    tooltipText: 'rgb(243, 244, 246)', // gray-100
    tooltipBorder: 'rgb(75, 85, 99)', // gray-600
  },
}

export function ProgressionChart({
  data,
  yMin,
  yMax,
  xAxisLabel,
  unit,
  tier,
}: ProgressionChartProps) {
  const { theme } = useTheme()
  const colors = TIER_COLORS[tier]
  const themeColors = THEME_COLORS[theme]

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
        pointBorderColor: colors.line,
        pointBorderWidth: 2,
        borderWidth: 2,
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
        backgroundColor: themeColors.tooltipBg,
        titleColor: themeColors.tooltipText,
        bodyColor: themeColors.tooltipText,
        borderColor: themeColors.tooltipBorder,
        borderWidth: 1,
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
          color: themeColors.textColor,
          font: { size: 12, weight: 500 as const },
        },
        ticks: {
          color: themeColors.textColor,
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: `Weight (${unit})`,
          color: themeColors.textColor,
          font: { size: 12, weight: 500 as const },
        },
        ticks: {
          color: themeColors.textColor,
        },
        min: yMin,
        max: yMax,
        grid: {
          color: themeColors.gridColor,
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
