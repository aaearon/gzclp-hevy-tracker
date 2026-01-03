/**
 * RoutineAssignmentStep Unit Tests
 *
 * Tests for the routine assignment step component.
 * TDD: Written BEFORE implementation.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoutineAssignmentStep } from '@/components/SetupWizard/RoutineAssignmentStep'
import type { AvailableRoutine, RoutineAssignment } from '@/types/state'

describe('RoutineAssignmentStep', () => {
  const mockRoutines: AvailableRoutine[] = [
    {
      id: 'routine-1',
      title: 'GZCLP A1',
      exerciseCount: 5,
      exercisePreview: ['Squat', 'Bench Press', 'Lat Pulldown'],
      updatedAt: '2026-01-03T10:00:00Z',
    },
    {
      id: 'routine-2',
      title: 'GZCLP B1',
      exerciseCount: 5,
      exercisePreview: ['OHP', 'Deadlift', 'Cable Row'],
      updatedAt: '2026-01-02T10:00:00Z',
    },
    {
      id: 'routine-3',
      title: 'GZCLP A2',
      exerciseCount: 5,
      exercisePreview: ['Bench', 'Squat', 'Curls'],
      updatedAt: '2026-01-01T10:00:00Z',
    },
    {
      id: 'routine-4',
      title: 'GZCLP B2',
      exerciseCount: 5,
      exercisePreview: ['Deadlift', 'OHP', 'Rows'],
      updatedAt: '2025-12-31T10:00:00Z',
    },
  ]

  const emptyAssignment: RoutineAssignment = {
    A1: null,
    B1: null,
    A2: null,
    B2: null,
  }

  const defaultProps = {
    routines: mockRoutines,
    assignment: emptyAssignment,
    onAssign: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('shows 4 slot assignment areas for A1, B1, A2, B2', () => {
      render(<RoutineAssignmentStep {...defaultProps} />)

      expect(screen.getByText(/A1/)).toBeInTheDocument()
      expect(screen.getByText(/B1/)).toBeInTheDocument()
      expect(screen.getByText(/A2/)).toBeInTheDocument()
      expect(screen.getByText(/B2/)).toBeInTheDocument()
    })

    it('shows slot descriptions for each day', () => {
      render(<RoutineAssignmentStep {...defaultProps} />)

      expect(screen.getByText(/squat.*t1.*bench.*t2/i)).toBeInTheDocument()
      expect(screen.getByText(/ohp.*t1.*deadlift.*t2/i)).toBeInTheDocument()
    })

    it('shows "Select routine" button when slot is empty', () => {
      render(<RoutineAssignmentStep {...defaultProps} />)

      const selectButtons = screen.getAllByRole('button', { name: /select routine/i })
      expect(selectButtons).toHaveLength(4)
    })

    it('shows routine name when slot is assigned', () => {
      const assignment: RoutineAssignment = {
        A1: 'routine-1',
        B1: null,
        A2: null,
        B2: null,
      }

      render(<RoutineAssignmentStep {...defaultProps} assignment={assignment} />)

      expect(screen.getByText('GZCLP A1')).toBeInTheDocument()
    })
  })

  describe('assignment', () => {
    it('opens routine selector when "Select routine" is clicked', async () => {
      render(<RoutineAssignmentStep {...defaultProps} />)

      const selectButtons = screen.getAllByRole('button', { name: /select routine/i })
      await userEvent.click(selectButtons[0])

      // Should show the routine selector modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('calls onAssign when a routine is selected', async () => {
      const onAssign = vi.fn()
      render(<RoutineAssignmentStep {...defaultProps} onAssign={onAssign} />)

      const selectButtons = screen.getAllByRole('button', { name: /select routine/i })
      await userEvent.click(selectButtons[0])

      // Wait for selector to open and click a routine
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const routineOption = screen.getByText('GZCLP A1').closest('button')!
      await userEvent.click(routineOption)

      expect(onAssign).toHaveBeenCalledWith('A1', 'routine-1')
    })

    it('allows clearing an assigned routine', async () => {
      const onAssign = vi.fn()
      const assignment: RoutineAssignment = {
        A1: 'routine-1',
        B1: null,
        A2: null,
        B2: null,
      }

      render(
        <RoutineAssignmentStep
          {...defaultProps}
          assignment={assignment}
          onAssign={onAssign}
        />
      )

      const clearButton = screen.getByRole('button', { name: /clear/i })
      await userEvent.click(clearButton)

      expect(onAssign).toHaveBeenCalledWith('A1', null)
    })
  })

  describe('duplicate detection', () => {
    it('shows warning when same routine is assigned to multiple days', () => {
      const assignment: RoutineAssignment = {
        A1: 'routine-1',
        B1: 'routine-1', // Same as A1
        A2: null,
        B2: null,
      }

      render(<RoutineAssignmentStep {...defaultProps} assignment={assignment} />)

      expect(screen.getByText(/same routine/i)).toBeInTheDocument()
    })

    it('does not show warning for unique assignments', () => {
      const assignment: RoutineAssignment = {
        A1: 'routine-1',
        B1: 'routine-2',
        A2: null,
        B2: null,
      }

      render(<RoutineAssignmentStep {...defaultProps} assignment={assignment} />)

      expect(screen.queryByText(/same routine/i)).not.toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('enables Next button when at least 1 routine is assigned', () => {
      const assignment: RoutineAssignment = {
        A1: 'routine-1',
        B1: null,
        A2: null,
        B2: null,
      }

      render(<RoutineAssignmentStep {...defaultProps} assignment={assignment} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).not.toBeDisabled()
    })

    it('disables Next button when no routines are assigned', () => {
      render(<RoutineAssignmentStep {...defaultProps} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })

    it('calls onNext when Next is clicked', async () => {
      const onNext = vi.fn()
      const assignment: RoutineAssignment = {
        A1: 'routine-1',
        B1: null,
        A2: null,
        B2: null,
      }

      render(
        <RoutineAssignmentStep
          {...defaultProps}
          assignment={assignment}
          onNext={onNext}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      await userEvent.click(nextButton)

      expect(onNext).toHaveBeenCalled()
    })

    it('calls onBack when Back is clicked', async () => {
      const onBack = vi.fn()
      render(<RoutineAssignmentStep {...defaultProps} onBack={onBack} />)

      const backButton = screen.getByRole('button', { name: /back/i })
      await userEvent.click(backButton)

      expect(onBack).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('has minimum 44x44px touch targets', () => {
      render(<RoutineAssignmentStep {...defaultProps} />)

      const selectButtons = screen.getAllByRole('button', { name: /select routine/i })
      selectButtons.forEach((button) => {
        expect(button).toHaveClass('min-h-[44px]')
      })
    })
  })
})
