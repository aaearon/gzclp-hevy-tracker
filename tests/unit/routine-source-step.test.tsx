/**
 * RoutineSourceStep Unit Tests
 *
 * Tests for the routine source selection step component.
 * TDD: Written BEFORE implementation.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoutineSourceStep } from '@/components/SetupWizard/RoutineSourceStep'

describe('RoutineSourceStep', () => {
  const defaultProps = {
    hasRoutines: true,
    isLoading: false,
    onSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders both Create New and Use Existing options', () => {
      render(<RoutineSourceStep {...defaultProps} />)

      expect(screen.getByRole('button', { name: /create new routines/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /use existing routines/i })).toBeInTheDocument()
    })

    it('displays loading state when isLoading is true', () => {
      render(<RoutineSourceStep {...defaultProps} isLoading={true} />)

      expect(screen.getByText(/loading routines/i)).toBeInTheDocument()
    })

    it('shows description for each option', () => {
      render(<RoutineSourceStep {...defaultProps} />)

      expect(screen.getByText(/start fresh by selecting exercises/i)).toBeInTheDocument()
      expect(screen.getByText(/import exercises and weights from your existing/i)).toBeInTheDocument()
    })
  })

  describe('option availability', () => {
    it('enables "Use Existing" when hasRoutines is true', () => {
      render(<RoutineSourceStep {...defaultProps} hasRoutines={true} />)

      const useExistingOption = screen.getByRole('button', { name: /use existing/i })
      expect(useExistingOption).not.toBeDisabled()
    })

    it('disables "Use Existing" when hasRoutines is false', () => {
      render(<RoutineSourceStep {...defaultProps} hasRoutines={false} />)

      const useExistingOption = screen.getByRole('button', { name: /use existing/i })
      expect(useExistingOption).toBeDisabled()
    })

    it('"Create New" is always enabled', () => {
      render(<RoutineSourceStep {...defaultProps} hasRoutines={false} />)

      const createNewOption = screen.getByRole('button', { name: /create new/i })
      expect(createNewOption).not.toBeDisabled()
    })

    it('shows "No routines found" message when hasRoutines is false', () => {
      render(<RoutineSourceStep {...defaultProps} hasRoutines={false} />)

      expect(screen.getByText(/no routines found/i)).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('calls onSelect with "create" when Create New is clicked', () => {
      const onSelect = vi.fn()
      render(<RoutineSourceStep {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByRole('button', { name: /create new/i }))

      expect(onSelect).toHaveBeenCalledWith('create')
    })

    it('calls onSelect with "import" when Use Existing is clicked', () => {
      const onSelect = vi.fn()
      render(<RoutineSourceStep {...defaultProps} onSelect={onSelect} hasRoutines={true} />)

      fireEvent.click(screen.getByRole('button', { name: /use existing/i }))

      expect(onSelect).toHaveBeenCalledWith('import')
    })

    it('does not call onSelect when disabled option is clicked', () => {
      const onSelect = vi.fn()
      render(<RoutineSourceStep {...defaultProps} onSelect={onSelect} hasRoutines={false} />)

      fireEvent.click(screen.getByRole('button', { name: /use existing/i }))

      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('has minimum 44x44px touch targets', () => {
      render(<RoutineSourceStep {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button)
        // Check minHeight is set (actual CSS check in integration)
        expect(button).toHaveClass('min-h-[44px]')
      })
    })
  })
})
