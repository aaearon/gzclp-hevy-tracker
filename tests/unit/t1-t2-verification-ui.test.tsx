/**
 * T1/T2 Verification UI Tests
 *
 * Tests for the main lift weight verification section in ImportReviewStep.
 * Tasks: T020, T021, T022, T023
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MainLiftVerification, type MainLiftVerificationProps } from '@/components/SetupWizard/MainLiftVerification'
import type { MainLiftWeights, MainLiftRole } from '@/types/state'

// =============================================================================
// Test Data Factories
// =============================================================================

function createMainLiftWeights(
  role: MainLiftRole,
  t1Weight: number,
  t2Weight: number,
  hasWarning = false
): MainLiftWeights {
  return {
    role,
    t1: { weight: t1Weight, source: `T1 from Day`, stage: 0 },
    t2: { weight: t2Weight, source: `T2 from Day`, stage: 0 },
    hasWarning,
  }
}

describe('MainLiftVerification', () => {
  const defaultProps: MainLiftVerificationProps = {
    mainLiftWeights: [
      createMainLiftWeights('squat', 100, 70),
      createMainLiftWeights('bench', 80, 56),
      createMainLiftWeights('ohp', 50, 35),
      createMainLiftWeights('deadlift', 120, 84),
    ],
    onWeightsUpdate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // T020: Create T1/T2 verification UI section
  // ===========================================================================

  describe('T020: verification UI section', () => {
    it('renders a section with main lift verification title', () => {
      render(<MainLiftVerification {...defaultProps} />)

      expect(screen.getByText(/main lift weights/i)).toBeInTheDocument()
    })

    it('displays all four main lifts', () => {
      render(<MainLiftVerification {...defaultProps} />)

      expect(screen.getByText('Squat')).toBeInTheDocument()
      expect(screen.getByText('Bench Press')).toBeInTheDocument()
      expect(screen.getByText('Overhead Press')).toBeInTheDocument()
      expect(screen.getByText('Deadlift')).toBeInTheDocument()
    })

    it('shows T1 and T2 weight inputs for each lift', () => {
      render(<MainLiftVerification {...defaultProps} />)

      // Should have 8 weight inputs (4 lifts x 2 tiers)
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs).toHaveLength(8)
    })

    it('displays T1 and T2 labels', () => {
      render(<MainLiftVerification {...defaultProps} />)

      // Look for T1 and T2 labels
      const t1Labels = screen.getAllByText(/T1/i)
      const t2Labels = screen.getAllByText(/T2/i)
      expect(t1Labels.length).toBeGreaterThan(0)
      expect(t2Labels.length).toBeGreaterThan(0)
    })

    it('shows detected weight values in inputs', () => {
      render(<MainLiftVerification {...defaultProps} />)

      // Check squat weights
      expect(screen.getByDisplayValue('100')).toBeInTheDocument()
      expect(screen.getByDisplayValue('70')).toBeInTheDocument()
    })

    it('shows rep scheme labels (5x3+ for T1, 3x10 for T2)', () => {
      render(<MainLiftVerification {...defaultProps} />)

      expect(screen.getAllByText(/5x3\+/)).toHaveLength(4) // 4 T1 lifts
      expect(screen.getAllByText(/3x10/)).toHaveLength(4) // 4 T2 lifts
    })
  })

  // ===========================================================================
  // T021: Add swap functionality for T1/T2 values
  // ===========================================================================

  describe('T021: swap functionality', () => {
    it('renders a swap button for each main lift', () => {
      render(<MainLiftVerification {...defaultProps} />)

      const swapButtons = screen.getAllByRole('button', { name: /swap/i })
      expect(swapButtons).toHaveLength(4)
    })

    it('calls onWeightsUpdate with swapped values when swap is clicked', () => {
      const onWeightsUpdate = vi.fn()
      render(<MainLiftVerification {...defaultProps} onWeightsUpdate={onWeightsUpdate} />)

      // Find the squat row and click swap
      const squatRow = screen.getByText('Squat').closest('[data-testid="main-lift-row"]')
      expect(squatRow).toBeInTheDocument()
      const swapButton = within(squatRow!).getByRole('button', { name: /swap/i })
      fireEvent.click(swapButton)

      // Should be called with squat weights swapped (100, 70) -> (70, 100)
      expect(onWeightsUpdate).toHaveBeenCalledWith('squat', {
        t1Weight: 70,
        t2Weight: 100,
      })
    })

    it('swap button has accessible label', () => {
      render(<MainLiftVerification {...defaultProps} />)

      const swapButtons = screen.getAllByRole('button', { name: /swap/i })
      swapButtons.forEach(button => {
        expect(button).toHaveAccessibleName()
      })
    })
  })

  // ===========================================================================
  // T022: Add manual edit functionality for detected weights
  // ===========================================================================

  describe('T022: manual weight editing', () => {
    it('T1 weight input is editable', () => {
      const onWeightsUpdate = vi.fn()
      render(<MainLiftVerification {...defaultProps} onWeightsUpdate={onWeightsUpdate} />)

      const squatT1Input = screen.getByDisplayValue('100')
      fireEvent.change(squatT1Input, { target: { value: '105' } })

      expect(onWeightsUpdate).toHaveBeenCalledWith('squat', {
        t1Weight: 105,
        t2Weight: 70,
      })
    })

    it('T2 weight input is editable', () => {
      const onWeightsUpdate = vi.fn()
      render(<MainLiftVerification {...defaultProps} onWeightsUpdate={onWeightsUpdate} />)

      const squatT2Input = screen.getByDisplayValue('70')
      fireEvent.change(squatT2Input, { target: { value: '75' } })

      expect(onWeightsUpdate).toHaveBeenCalledWith('squat', {
        t1Weight: 100,
        t2Weight: 75,
      })
    })

    it('weight inputs accept decimal values', () => {
      const onWeightsUpdate = vi.fn()
      render(<MainLiftVerification {...defaultProps} onWeightsUpdate={onWeightsUpdate} />)

      const squatT1Input = screen.getByDisplayValue('100')
      fireEvent.change(squatT1Input, { target: { value: '102.5' } })

      expect(onWeightsUpdate).toHaveBeenCalledWith('squat', {
        t1Weight: 102.5,
        t2Weight: 70,
      })
    })

    it('weight inputs have step of 0.5', () => {
      render(<MainLiftVerification {...defaultProps} />)

      const inputs = screen.getAllByRole('spinbutton')
      inputs.forEach(input => {
        expect(input).toHaveAttribute('step', '0.5')
      })
    })

    it('weight inputs have min of 0', () => {
      render(<MainLiftVerification {...defaultProps} />)

      const inputs = screen.getAllByRole('spinbutton')
      inputs.forEach(input => {
        expect(input).toHaveAttribute('min', '0')
      })
    })
  })

  // ===========================================================================
  // T023: Add warning indicator for partial data
  // ===========================================================================

  describe('T023: warning indicator for partial data', () => {
    it('shows warning icon when hasWarning is true', () => {
      const propsWithWarning: MainLiftVerificationProps = {
        ...defaultProps,
        mainLiftWeights: [
          createMainLiftWeights('squat', 100, 70, true), // hasWarning = true
          createMainLiftWeights('bench', 80, 56),
          createMainLiftWeights('ohp', 50, 35),
          createMainLiftWeights('deadlift', 120, 84),
        ],
      }

      render(<MainLiftVerification {...propsWithWarning} />)

      const squatRow = screen.getByText('Squat').closest('[data-testid="main-lift-row"]')
      expect(within(squatRow!).getByTestId('partial-data-warning')).toBeInTheDocument()
    })

    it('does not show warning icon when hasWarning is false', () => {
      render(<MainLiftVerification {...defaultProps} />)

      expect(screen.queryByTestId('partial-data-warning')).not.toBeInTheDocument()
    })

    it('warning has tooltip or accessible description', () => {
      const propsWithWarning: MainLiftVerificationProps = {
        ...defaultProps,
        mainLiftWeights: [
          createMainLiftWeights('squat', 100, 70, true),
          createMainLiftWeights('bench', 80, 56),
          createMainLiftWeights('ohp', 50, 35),
          createMainLiftWeights('deadlift', 120, 84),
        ],
      }

      render(<MainLiftVerification {...propsWithWarning} />)

      const warning = screen.getByTestId('partial-data-warning')
      expect(warning).toHaveAttribute('title')
    })

    it('shows estimated label for weights that are estimated', () => {
      const propsWithEstimated: MainLiftVerificationProps = {
        ...defaultProps,
        mainLiftWeights: [
          {
            role: 'squat',
            t1: { weight: 100, source: 'A1, position 1', stage: 0 },
            t2: { weight: 70, source: 'Estimated from T1 (A1)', stage: 0 },
            hasWarning: true,
          },
          createMainLiftWeights('bench', 80, 56),
          createMainLiftWeights('ohp', 50, 35),
          createMainLiftWeights('deadlift', 120, 84),
        ],
      }

      render(<MainLiftVerification {...propsWithEstimated} />)

      expect(screen.getByText(/estimated/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Accessibility
  // ===========================================================================

  describe('accessibility', () => {
    it('inputs have associated labels', () => {
      render(<MainLiftVerification {...defaultProps} />)

      const inputs = screen.getAllByRole('spinbutton')
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName()
      })
    })

    it('buttons have minimum touch target size (44x44px)', () => {
      render(<MainLiftVerification {...defaultProps} />)

      const swapButtons = screen.getAllByRole('button', { name: /swap/i })
      swapButtons.forEach(button => {
        expect(button).toHaveClass('min-h-[44px]', 'min-w-[44px]')
      })
    })
  })
})
