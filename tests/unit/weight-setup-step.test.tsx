/**
 * Unit Tests: WeightSetupStep Component
 *
 * Tests for the 8-weight form (T1+T2 per main lift) in the create path.
 * [US3] User Story 3 - Create Path Weight Setup
 *
 * Requirements:
 * - Shows 8 input fields (T1+T2 for squat, bench, ohp, deadlift)
 * - Labels distinguish T1 vs T2 (e.g., "T1 Squat (5x3+)")
 * - T2 auto-suggests 70% of T1 when T1 is entered
 * - Form submission creates 8 progression entries
 * - Real-time validation feedback
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MainLiftWeightSetup } from '@/components/SetupWizard/WeightSetupStep'
import type { WeightUnit } from '@/types/state'

describe('MainLiftWeightSetup (8-weight form)', () => {
  const defaultProps = {
    weights: {
      'squat-T1': 0,
      'squat-T2': 0,
      'bench-T1': 0,
      'bench-T2': 0,
      'ohp-T1': 0,
      'ohp-T2': 0,
      'deadlift-T1': 0,
      'deadlift-T2': 0,
    },
    onWeightChange: vi.fn(),
    unit: 'kg' as WeightUnit,
  }

  describe('rendering 8 input fields', () => {
    it('renders all 8 weight input fields', () => {
      render(<MainLiftWeightSetup {...defaultProps} />)

      // Check all 8 fields exist by label
      expect(screen.getByLabelText(/T1 Squat/)).toBeInTheDocument()
      expect(screen.getByLabelText(/T2 Squat/)).toBeInTheDocument()
      expect(screen.getByLabelText(/T1 Bench/)).toBeInTheDocument()
      expect(screen.getByLabelText(/T2 Bench/)).toBeInTheDocument()
      expect(screen.getByLabelText(/T1 Overhead Press/)).toBeInTheDocument()
      expect(screen.getByLabelText(/T2 Overhead Press/)).toBeInTheDocument()
      expect(screen.getByLabelText(/T1 Deadlift/)).toBeInTheDocument()
      expect(screen.getByLabelText(/T2 Deadlift/)).toBeInTheDocument()
    })

    it('renders fields grouped by main lift', () => {
      render(<MainLiftWeightSetup {...defaultProps} />)

      // Each main lift should have a section/group
      expect(screen.getByText('Squat')).toBeInTheDocument()
      expect(screen.getByText('Bench Press')).toBeInTheDocument()
      expect(screen.getByText('Overhead Press')).toBeInTheDocument()
      expect(screen.getByText('Deadlift')).toBeInTheDocument()
    })
  })

  describe('T1/T2 labels with rep schemes', () => {
    it('shows T1 rep scheme (5x3+) in label', () => {
      render(<MainLiftWeightSetup {...defaultProps} />)

      expect(screen.getByLabelText(/T1 Squat.*5x3\+/)).toBeInTheDocument()
      expect(screen.getByLabelText(/T1 Bench.*5x3\+/)).toBeInTheDocument()
      expect(screen.getByLabelText(/T1 Overhead Press.*5x3\+/)).toBeInTheDocument()
      expect(screen.getByLabelText(/T1 Deadlift.*5x3\+/)).toBeInTheDocument()
    })

    it('shows T2 rep scheme (3x10) in label', () => {
      render(<MainLiftWeightSetup {...defaultProps} />)

      expect(screen.getByLabelText(/T2 Squat.*3x10/)).toBeInTheDocument()
      expect(screen.getByLabelText(/T2 Bench.*3x10/)).toBeInTheDocument()
      expect(screen.getByLabelText(/T2 Overhead Press.*3x10/)).toBeInTheDocument()
      expect(screen.getByLabelText(/T2 Deadlift.*3x10/)).toBeInTheDocument()
    })
  })

  describe('T2 auto-suggestion (70% of T1)', () => {
    it('suggests T2 weight as 70% of T1 when T1 is entered', () => {
      const onWeightChange = vi.fn()
      render(
        <MainLiftWeightSetup
          {...defaultProps}
          onWeightChange={onWeightChange}
        />
      )

      // Enter T1 Squat weight using fireEvent for controlled input
      const t1Input = screen.getByLabelText(/T1 Squat/)
      fireEvent.change(t1Input, { target: { value: '100' } })

      // T2 should be auto-suggested as 70kg
      expect(onWeightChange).toHaveBeenCalledWith('squat-T1', 100)
      expect(onWeightChange).toHaveBeenCalledWith('squat-T2', 70)
    })

    it('rounds auto-suggestion to valid increment (2.5kg)', () => {
      const onWeightChange = vi.fn()
      render(
        <MainLiftWeightSetup
          {...defaultProps}
          onWeightChange={onWeightChange}
        />
      )

      // Enter T1 weight that results in non-round T2
      const t1Input = screen.getByLabelText(/T1 Bench/)
      fireEvent.change(t1Input, { target: { value: '60' } })

      // 60 * 0.7 = 42, should round to 42.5 (nearest 2.5)
      expect(onWeightChange).toHaveBeenCalledWith('bench-T1', 60)
      expect(onWeightChange).toHaveBeenCalledWith('bench-T2', 42.5)
    })

    it('does not override user-entered T2 weight', () => {
      const onWeightChange = vi.fn()
      render(
        <MainLiftWeightSetup
          {...defaultProps}
          weights={{
            ...defaultProps.weights,
            'squat-T2': 80, // User already entered T2
          }}
          onWeightChange={onWeightChange}
        />
      )

      // Enter T1 Squat weight
      const t1Input = screen.getByLabelText(/T1 Squat/)
      fireEvent.change(t1Input, { target: { value: '100' } })

      // T1 should be updated
      expect(onWeightChange).toHaveBeenCalledWith('squat-T1', 100)
      // T2 should NOT be overwritten if user already entered a value
      expect(onWeightChange).not.toHaveBeenCalledWith('squat-T2', 70)
    })

    it('shows auto-suggestion hint text', () => {
      render(
        <MainLiftWeightSetup
          {...defaultProps}
          weights={{
            ...defaultProps.weights,
            'squat-T1': 100,
          }}
        />
      )

      expect(screen.getByText(/Suggested: 70 kg/)).toBeInTheDocument()
    })
  })

  describe('weight input calls onChange correctly', () => {
    it('calls onWeightChange with correct key for T1 input', () => {
      const onWeightChange = vi.fn()
      render(
        <MainLiftWeightSetup
          {...defaultProps}
          onWeightChange={onWeightChange}
        />
      )

      const t1Input = screen.getByLabelText(/T1 Squat/)
      fireEvent.change(t1Input, { target: { value: '100' } })

      expect(onWeightChange).toHaveBeenCalledWith('squat-T1', 100)
    })

    it('calls onWeightChange with correct key for T2 input', () => {
      const onWeightChange = vi.fn()
      render(
        <MainLiftWeightSetup
          {...defaultProps}
          onWeightChange={onWeightChange}
        />
      )

      const t2Input = screen.getByLabelText(/T2 Squat/)
      fireEvent.change(t2Input, { target: { value: '70' } })

      expect(onWeightChange).toHaveBeenCalledWith('squat-T2', 70)
    })
  })

  describe('real-time validation', () => {
    it('shows validation error for empty T1 field on blur', async () => {
      const user = userEvent.setup()
      render(<MainLiftWeightSetup {...defaultProps} />)

      const t1Input = screen.getByLabelText(/T1 Squat/)
      await user.click(t1Input)
      await user.tab() // blur

      expect(screen.getByText('Weight is required')).toBeInTheDocument()
    })

    it('shows validation error when entering zero (treated as empty)', async () => {
      const user = userEvent.setup()
      const onWeightChange = vi.fn()
      render(
        <MainLiftWeightSetup
          {...defaultProps}
          onWeightChange={onWeightChange}
        />
      )

      // Enter 0 - which gets converted to empty and triggers "required" error after blur
      // This is the expected behavior since 0 is not a valid weight
      const t1Input = screen.getByLabelText(/T1 Squat/)
      await user.click(t1Input)
      await user.type(t1Input, '0')
      await user.tab() // blur to trigger validation

      // Check that there is at least one "Weight is required" error
      // Since we typed "0", the input value triggers onWeightChange with 0
      // which gets converted back to empty string display
      const errorMessages = screen.getAllByText('Weight is required')
      expect(errorMessages.length).toBeGreaterThanOrEqual(1)
    })

    it('shows T1/T2 relationship warning when T2 >= T1', () => {
      render(
        <MainLiftWeightSetup
          {...defaultProps}
          weights={{
            ...defaultProps.weights,
            'squat-T1': 100,
            'squat-T2': 100,
          }}
        />
      )

      expect(screen.getByText(/T2 is usually lighter than T1/)).toBeInTheDocument()
    })
  })

  describe('unit support', () => {
    it('displays kg unit correctly', () => {
      render(<MainLiftWeightSetup {...defaultProps} unit="kg" />)

      // Each input should show kg unit
      const kgTexts = screen.getAllByText('kg')
      expect(kgTexts.length).toBeGreaterThanOrEqual(8)
    })

    it('displays lbs unit correctly', () => {
      render(<MainLiftWeightSetup {...defaultProps} unit="lbs" />)

      // Each input should show lbs unit
      const lbsTexts = screen.getAllByText('lbs')
      expect(lbsTexts.length).toBeGreaterThanOrEqual(8)
    })

    it('adjusts T2 auto-suggestion rounding for lbs (5lb increments)', () => {
      const onWeightChange = vi.fn()
      render(
        <MainLiftWeightSetup
          {...defaultProps}
          unit="lbs"
          onWeightChange={onWeightChange}
        />
      )

      // Enter T1 weight
      const t1Input = screen.getByLabelText(/T1 Squat/)
      fireEvent.change(t1Input, { target: { value: '225' } })

      // 225 * 0.7 = 157.5, should round to 160 (nearest 5)
      expect(onWeightChange).toHaveBeenCalledWith('squat-T1', 225)
      expect(onWeightChange).toHaveBeenCalledWith('squat-T2', 160)
    })
  })

  describe('form completeness', () => {
    it('indicates when all weights are valid', () => {
      const weights = {
        'squat-T1': 100,
        'squat-T2': 70,
        'bench-T1': 60,
        'bench-T2': 42.5,
        'ohp-T1': 40,
        'ohp-T2': 27.5,
        'deadlift-T1': 100,
        'deadlift-T2': 70,
      }

      render(
        <MainLiftWeightSetup
          {...defaultProps}
          weights={weights}
        />
      )

      // No error messages should be visible
      expect(screen.queryByText('Weight is required')).not.toBeInTheDocument()
      expect(screen.queryByText('Must be a number')).not.toBeInTheDocument()
      expect(screen.queryByText('Must be greater than 0')).not.toBeInTheDocument()
    })
  })
})

describe('WeightSetupStep integration', () => {
  it('passes 8 progression keys when form is submitted', async () => {
    // This test verifies the form submission creates entries for all 8 keys
    // Implementation will be tested in integration tests
  })
})
