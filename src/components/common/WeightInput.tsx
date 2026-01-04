/**
 * WeightInput Components
 *
 * Reusable weight input components for the application:
 * - ValidatingWeightInput: Input with real-time inline validation and T1/T2 warnings
 *
 * [US3] User Story 3 - Create Path Weight Setup (FR-024)
 */

import { useState } from 'react'
import { validateWeight } from '@/utils/validation'
import type { WeightUnit } from '@/types/state'

// =============================================================================
// T1/T2 Relationship Warning Thresholds
// =============================================================================

/** T2 warning if >= 100% of T1 */
const T2_HIGH_THRESHOLD = 1.0
/** T2 warning if < 50% of T1 */
const T2_LOW_THRESHOLD = 0.5

// =============================================================================
// ValidatingWeightInput Props
// =============================================================================

export interface ValidatingWeightInputProps {
  /** Input label (e.g., "T1 Squat (5x3+)") */
  label: string
  /** Current input value as string */
  value: string
  /** Called when value changes */
  onChange: (value: string) => void
  /** Weight unit (kg or lbs) */
  unit: WeightUnit
  /** Optional hint text below label */
  hint?: string
  /** Unique input id */
  id?: string
  /** Disable input */
  disabled?: boolean
  /** T1 weight for T1/T2 relationship warnings (only for T2 inputs) */
  t1Weight?: number
}

// =============================================================================
// ValidatingWeightInput Component
// =============================================================================

/**
 * Weight input with real-time validation and error display.
 *
 * Features:
 * - Real-time validation (empty, non-numeric, <= 0, too high)
 * - Error styling (red border) for invalid input
 * - T1/T2 relationship warnings (when t1Weight is provided)
 * - 44px minimum touch target for mobile
 */
export function ValidatingWeightInput({
  label,
  value,
  onChange,
  unit,
  hint,
  id,
  disabled = false,
  t1Weight,
}: ValidatingWeightInputProps) {
  // Track if field has been touched (for showing empty error only after blur)
  const [touched, setTouched] = useState(false)

  // Validate current value
  const validation = value === '' && !touched
    ? { isValid: true, error: null } // Don't show error for empty untouched field
    : validateWeight(value, unit)

  // Check T1/T2 relationship warning (separate from validation errors)
  const t2Warning = getT2Warning(value, t1Weight)

  // Combined error/warning message
  const message = validation.error ?? t2Warning
  const hasError = !validation.isValid

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleBlur = () => {
    setTouched(true)
  }

  // Generate unique id if not provided
  const inputId = id ?? `weight-input-${label.replace(/\s+/g, '-').toLowerCase()}`

  // Determine input border color
  const borderClass = hasError
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {hint && (
        <p className="text-xs text-gray-500 mb-1">{hint}</p>
      )}
      <div className="flex items-center space-x-2">
        <input
          id={inputId}
          type="number"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="0"
          className={`w-24 px-3 py-2 border rounded-md shadow-sm
                     ${borderClass}
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     min-h-[44px]`}
          aria-invalid={hasError}
          aria-describedby={message ? `${inputId}-error` : undefined}
        />
        <span className="text-gray-600">{unit}</span>
      </div>
      {message && (
        <p
          id={`${inputId}-error`}
          className={`mt-1 text-sm ${hasError ? 'text-red-600' : 'text-amber-600'}`}
          role={hasError ? 'alert' : undefined}
        >
          {message}
        </p>
      )}
    </div>
  )
}

// =============================================================================
// T1/T2 Relationship Warning Helper
// =============================================================================

/**
 * Check if T2 weight has a warning relative to T1 weight.
 *
 * @param t2Value - The T2 weight value (as string)
 * @param t1Weight - The T1 weight (as number, optional)
 * @returns Warning message or null
 */
function getT2Warning(t2Value: string, t1Weight: number | undefined): string | null {
  if (t1Weight === undefined || t1Weight <= 0) {
    return null
  }

  const t2Num = parseFloat(t2Value)
  if (isNaN(t2Num) || t2Num <= 0) {
    return null
  }

  const ratio = t2Num / t1Weight

  if (ratio >= T2_HIGH_THRESHOLD) {
    return 'T2 is usually lighter than T1 - please verify'
  }

  if (ratio < T2_LOW_THRESHOLD) {
    return 'T2 seems very light compared to T1 - please verify'
  }

  return null
}
