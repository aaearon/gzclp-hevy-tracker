/**
 * Unit Tests: WeightInput Component
 *
 * Tests for the WeightInput component with inline validation.
 * [US3] User Story 3 - Create Path Weight Setup (FR-024)
 *
 * Requirements:
 * - Shows error message for invalid input in real-time
 * - Has 44x44px touch target for mobile
 * - Supports both kg and lbs units
 * - Auto-suggests T2 weight as 70% of T1 when applicable
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ValidatingWeightInput } from '@/components/common/WeightInput'

describe('ValidatingWeightInput', () => {
  describe('rendering', () => {
    it('renders with label and unit', () => {
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value=""
          onChange={vi.fn()}
          unit="kg"
        />
      )

      expect(screen.getByLabelText('T1 Squat (5x3+)')).toBeInTheDocument()
      expect(screen.getByText('kg')).toBeInTheDocument()
    })

    it('renders with hint text when provided', () => {
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value=""
          onChange={vi.fn()}
          unit="kg"
          hint="Enter your current working weight"
        />
      )

      expect(screen.getByText('Enter your current working weight')).toBeInTheDocument()
    })

    it('has minimum 44px touch target height for mobile', () => {
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value=""
          onChange={vi.fn()}
          unit="kg"
        />
      )

      const input = screen.getByRole('spinbutton')
      // Check for min-h-[44px] class or equivalent
      expect(input).toHaveClass('min-h-[44px]')
    })
  })

  describe('real-time validation', () => {
    it('shows error for empty value on blur', async () => {
      const user = userEvent.setup()
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value=""
          onChange={vi.fn()}
          unit="kg"
        />
      )

      const input = screen.getByRole('spinbutton')
      await user.click(input)
      await user.tab() // blur

      expect(screen.getByText('Weight is required')).toBeInTheDocument()
    })

    it('shows error for non-numeric value', () => {
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value="abc"
          onChange={vi.fn()}
          unit="kg"
        />
      )

      // Error should be shown for invalid value
      expect(screen.getByText('Must be a number')).toBeInTheDocument()
    })

    it('shows error for zero value', () => {
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value="0"
          onChange={vi.fn()}
          unit="kg"
        />
      )

      expect(screen.getByText('Must be greater than 0')).toBeInTheDocument()
    })

    it('shows error for negative value', () => {
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value="-10"
          onChange={vi.fn()}
          unit="kg"
        />
      )

      expect(screen.getByText('Must be greater than 0')).toBeInTheDocument()
    })

    it('shows error when weight exceeds maximum (500kg)', () => {
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value="501"
          onChange={vi.fn()}
          unit="kg"
        />
      )

      expect(screen.getByText('Weight seems too high')).toBeInTheDocument()
    })

    it('shows error when weight exceeds maximum (1100lbs)', () => {
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value="1101"
          onChange={vi.fn()}
          unit="lbs"
        />
      )

      expect(screen.getByText('Weight seems too high')).toBeInTheDocument()
    })

    it('does not show error for valid positive value', () => {
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value="100"
          onChange={vi.fn()}
          unit="kg"
        />
      )

      expect(screen.queryByText('Weight is required')).not.toBeInTheDocument()
      expect(screen.queryByText('Must be a number')).not.toBeInTheDocument()
      expect(screen.queryByText('Must be greater than 0')).not.toBeInTheDocument()
      expect(screen.queryByText('Weight seems too high')).not.toBeInTheDocument()
    })

    it('clears error when valid value entered', () => {
      const { rerender } = render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value="0"
          onChange={vi.fn()}
          unit="kg"
        />
      )

      expect(screen.getByText('Must be greater than 0')).toBeInTheDocument()

      // Rerender with valid value
      rerender(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value="100"
          onChange={vi.fn()}
          unit="kg"
        />
      )

      expect(screen.queryByText('Must be greater than 0')).not.toBeInTheDocument()
    })
  })

  describe('user interaction', () => {
    it('calls onChange with input value', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value=""
          onChange={onChange}
          unit="kg"
        />
      )

      const input = screen.getByRole('spinbutton')
      await user.type(input, '100')

      expect(onChange).toHaveBeenCalled()
    })

    it('displays the current value', () => {
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value="100"
          onChange={vi.fn()}
          unit="kg"
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveValue(100)
    })

    it('is disabled when disabled prop is true', () => {
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value="100"
          onChange={vi.fn()}
          unit="kg"
          disabled
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toBeDisabled()
    })
  })

  describe('T1/T2 relationship warnings', () => {
    it('shows warning when T2 weight is >= T1 weight', () => {
      render(
        <ValidatingWeightInput
          label="T2 Squat (3x10)"
          value="100"
          onChange={vi.fn()}
          unit="kg"
          t1Weight={100}
        />
      )

      expect(screen.getByText(/T2 is usually lighter than T1/)).toBeInTheDocument()
    })

    it('shows warning when T2 weight is < 50% of T1 weight', () => {
      render(
        <ValidatingWeightInput
          label="T2 Squat (3x10)"
          value="40"
          onChange={vi.fn()}
          unit="kg"
          t1Weight={100}
        />
      )

      expect(screen.getByText(/T2 seems very light compared to T1/)).toBeInTheDocument()
    })

    it('does not show warning for reasonable T2 weight (50-100% of T1)', () => {
      render(
        <ValidatingWeightInput
          label="T2 Squat (3x10)"
          value="70"
          onChange={vi.fn()}
          unit="kg"
          t1Weight={100}
        />
      )

      expect(screen.queryByText(/T2 is usually lighter/)).not.toBeInTheDocument()
      expect(screen.queryByText(/T2 seems very light/)).not.toBeInTheDocument()
    })
  })

  describe('visual error state', () => {
    it('applies error styling to input when invalid', () => {
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value="0"
          onChange={vi.fn()}
          unit="kg"
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveClass('border-red-500')
    })

    it('applies normal styling when valid', () => {
      render(
        <ValidatingWeightInput
          label="T1 Squat (5x3+)"
          value="100"
          onChange={vi.fn()}
          unit="kg"
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).not.toHaveClass('border-red-500')
      expect(input).toHaveClass('border-gray-300')
    })
  })
})
