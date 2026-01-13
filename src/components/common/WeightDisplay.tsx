/**
 * WeightDisplay Component
 *
 * Reusable component for displaying weights with proper unit conversion
 * and consistent styling across the application.
 *
 * All weights are stored internally in kg. This component handles conversion
 * to the user's preferred display unit.
 */

import type { WeightUnit } from '@/types/state'
import { displayWeight, getDisplayValue } from '@/utils/formatting'

export interface WeightDisplayProps {
  /** Weight in kg (internal format) */
  weight: number
  /** User's display preference */
  unit: WeightUnit
  /** Size variant (default: 'md') */
  size?: 'sm' | 'md' | 'lg'
  /** Optional override for weight color */
  colorClass?: string
  /** Whether to show unit suffix (default: true) */
  showUnit?: boolean
}

const sizeStyles = {
  sm: 'text-sm font-medium',
  md: 'text-xl font-bold',
  lg: 'text-2xl font-bold',
}

const defaultColorClass = 'text-gray-900 dark:text-gray-100'

export function WeightDisplay({
  weight,
  unit,
  size = 'md',
  colorClass,
  showUnit = true,
}: WeightDisplayProps) {
  const displayValue = showUnit
    ? displayWeight(weight, unit)
    : String(getDisplayValue(weight, unit))

  const colorClasses = colorClass ?? defaultColorClass
  const sizeClasses = sizeStyles[size]

  return (
    <span className={`${sizeClasses} ${colorClasses}`}>
      {displayValue}
    </span>
  )
}
