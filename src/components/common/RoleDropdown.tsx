/**
 * RoleDropdown Component
 *
 * Dropdown select for exercise role selection.
 * Displays all 7 roles with support for excluding already-assigned main lift roles.
 */

import type { ExerciseRole } from '@/types/state'
import { EXERCISE_ROLES, ROLE_DISPLAY } from '@/lib/constants'

export interface RoleDropdownProps {
  /** Current selected role (or undefined if not set) */
  value: ExerciseRole | undefined
  /** Callback when role changes */
  onChange: (role: ExerciseRole) => void
  /** Unique ID for the dropdown (for label association) */
  id?: string
  /** Accessible label for the dropdown */
  ariaLabel?: string
  /** Whether to show a placeholder option */
  showPlaceholder?: boolean
  /** Placeholder text when no role is selected */
  placeholder?: string
  /** Additional CSS classes */
  className?: string
  /** Whether the dropdown is disabled */
  disabled?: boolean
  /** Roles to exclude from selection (e.g., already-assigned main lifts) */
  excludeRoles?: ExerciseRole[]
}

/**
 * Dropdown for selecting an exercise role.
 */
export function RoleDropdown({
  value,
  onChange,
  id,
  ariaLabel = 'Role',
  showPlaceholder = true,
  placeholder = 'Select role',
  className = '',
  disabled = false,
  excludeRoles = [],
}: RoleDropdownProps) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value ?? ''}
      onChange={(e) => {
        if (e.target.value) {
          onChange(e.target.value as ExerciseRole)
        }
      }}
      disabled={disabled}
      className={`block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm text-sm
                 focus:border-blue-500 focus:ring-blue-500
                 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                 ${className}`}
    >
      {showPlaceholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {EXERCISE_ROLES.map((role) => {
        const display = ROLE_DISPLAY[role]
        const isExcluded = excludeRoles.includes(role)
        const isCurrentValue = role === value
        // Allow the current value even if excluded (to show what's selected)
        const shouldDisable = isExcluded && !isCurrentValue
        return (
          <option key={role} value={role} disabled={shouldDisable}>
            {display.label}
            {shouldDisable ? ' (already assigned)' : ''}
          </option>
        )
      })}
    </select>
  )
}
