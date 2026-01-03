/**
 * NextWorkoutStep Unit Tests
 *
 * Tests for the next workout selection step component.
 * TDD: Written BEFORE implementation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NextWorkoutStep } from '@/components/SetupWizard/NextWorkoutStep'
import type { GZCLPDay } from '@/types/state'

describe('NextWorkoutStep', () => {
  const defaultProps = {
    selectedDay: 'A1' as GZCLPDay,
    onDaySelect: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // T037: Shows 4 day options, defaults to A1
  // ===========================================================================

  describe('T037: day options display', () => {
    it('renders 4 day options (A1, B1, A2, B2)', () => {
      render(<NextWorkoutStep {...defaultProps} />)

      expect(screen.getByRole('button', { name: /A1/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /B1/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /A2/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /B2/i })).toBeInTheDocument()
    })

    it('shows A1 as selected by default', () => {
      render(<NextWorkoutStep {...defaultProps} selectedDay="A1" />)

      const a1Button = screen.getByRole('button', { name: /A1/i })
      expect(a1Button).toHaveClass('bg-blue-600')
    })

    it('shows selected day as highlighted', () => {
      render(<NextWorkoutStep {...defaultProps} selectedDay="B2" />)

      const b2Button = screen.getByRole('button', { name: /B2/i })
      expect(b2Button).toHaveClass('bg-blue-600')
    })

    it('shows non-selected days as unselected style', () => {
      render(<NextWorkoutStep {...defaultProps} selectedDay="A1" />)

      const b1Button = screen.getByRole('button', { name: /B1/i })
      expect(b1Button).not.toHaveClass('bg-blue-600')
    })

    it('displays exercise info for each day', () => {
      render(<NextWorkoutStep {...defaultProps} />)

      // Should show T1/T2 exercise info for each day
      expect(screen.getByText(/Squat.*T1/i)).toBeInTheDocument()
      expect(screen.getByText(/Bench.*T2/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Day Selection
  // ===========================================================================

  describe('day selection', () => {
    it('calls onDaySelect when a day is clicked', () => {
      const onDaySelect = vi.fn()
      render(<NextWorkoutStep {...defaultProps} onDaySelect={onDaySelect} />)

      fireEvent.click(screen.getByRole('button', { name: /B1/i }))

      expect(onDaySelect).toHaveBeenCalledWith('B1')
    })

    it('calls onDaySelect with correct day for each button', () => {
      const onDaySelect = vi.fn()
      render(<NextWorkoutStep {...defaultProps} onDaySelect={onDaySelect} />)

      fireEvent.click(screen.getByRole('button', { name: /A2/i }))
      expect(onDaySelect).toHaveBeenCalledWith('A2')

      fireEvent.click(screen.getByRole('button', { name: /B2/i }))
      expect(onDaySelect).toHaveBeenCalledWith('B2')
    })
  })

  // ===========================================================================
  // Navigation
  // ===========================================================================

  describe('navigation', () => {
    it('renders Complete Setup button', () => {
      render(<NextWorkoutStep {...defaultProps} />)

      expect(screen.getByRole('button', { name: /complete setup/i })).toBeInTheDocument()
    })

    it('renders Back button', () => {
      render(<NextWorkoutStep {...defaultProps} />)

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })

    it('calls onNext when Complete Setup is clicked', () => {
      const onNext = vi.fn()
      render(<NextWorkoutStep {...defaultProps} onNext={onNext} />)

      fireEvent.click(screen.getByRole('button', { name: /complete setup/i }))

      expect(onNext).toHaveBeenCalled()
    })

    it('calls onBack when Back is clicked', () => {
      const onBack = vi.fn()
      render(<NextWorkoutStep {...defaultProps} onBack={onBack} />)

      fireEvent.click(screen.getByRole('button', { name: /back/i }))

      expect(onBack).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Content
  // ===========================================================================

  describe('content', () => {
    it('displays a title asking which workout is next', () => {
      render(<NextWorkoutStep {...defaultProps} />)

      // Use heading role to be more specific
      expect(screen.getByRole('heading', { name: /which workout/i })).toBeInTheDocument()
    })

    it('displays description text explaining the rotation', () => {
      render(<NextWorkoutStep {...defaultProps} />)

      expect(screen.getByText(/rotation/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Accessibility
  // ===========================================================================

  describe('accessibility', () => {
    it('has minimum 44x44px touch targets for day buttons', () => {
      render(<NextWorkoutStep {...defaultProps} />)

      const dayButtons = screen.getAllByRole('button').filter(
        (btn) => btn.textContent?.match(/^[AB][12]/)
      )

      dayButtons.forEach((button) => {
        expect(button).toHaveClass('min-h-[44px]')
      })
    })

    it('has minimum 44x44px touch targets for navigation buttons', () => {
      render(<NextWorkoutStep {...defaultProps} />)

      const backButton = screen.getByRole('button', { name: /back/i })
      const nextButton = screen.getByRole('button', { name: /complete setup/i })

      expect(backButton).toHaveClass('min-h-[44px]')
      expect(nextButton).toHaveClass('min-h-[44px]')
    })

    it('uses appropriate ARIA labels for day buttons', () => {
      render(<NextWorkoutStep {...defaultProps} selectedDay="A1" />)

      const a1Button = screen.getByRole('button', { name: /A1/i })
      expect(a1Button).toHaveAttribute('aria-pressed', 'true')

      const b1Button = screen.getByRole('button', { name: /B1/i })
      expect(b1Button).toHaveAttribute('aria-pressed', 'false')
    })
  })
})
