/**
 * RoutineSelector Unit Tests
 *
 * Tests for the routine selector component (full-screen modal with search).
 * TDD: Written BEFORE implementation.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoutineSelector } from '@/components/common/RoutineSelector'
import type { AvailableRoutine } from '@/types/state'

describe('RoutineSelector', () => {
  const mockRoutines: AvailableRoutine[] = [
    {
      id: 'routine-1',
      title: 'GZCLP Day A1',
      exerciseCount: 5,
      exercisePreview: ['Squat', 'Bench Press', 'Lat Pulldown'],
      updatedAt: '2026-01-03T10:00:00Z',
    },
    {
      id: 'routine-2',
      title: 'GZCLP Day B1',
      exerciseCount: 5,
      exercisePreview: ['OHP', 'Deadlift', 'Cable Row'],
      updatedAt: '2026-01-02T10:00:00Z',
    },
    {
      id: 'routine-3',
      title: 'Upper Body',
      exerciseCount: 6,
      exercisePreview: ['Bench', 'Rows', 'Curls'],
      updatedAt: '2026-01-01T10:00:00Z',
    },
  ]

  const defaultProps = {
    routines: mockRoutines,
    selectedId: null,
    onSelect: vi.fn(),
    onClose: vi.fn(),
    isOpen: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders routine list when open', () => {
      render(<RoutineSelector {...defaultProps} />)

      expect(screen.getByText('GZCLP Day A1')).toBeInTheDocument()
      expect(screen.getByText('GZCLP Day B1')).toBeInTheDocument()
      expect(screen.getByText('Upper Body')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<RoutineSelector {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('GZCLP Day A1')).not.toBeInTheDocument()
    })

    it('displays exercise preview for each routine', () => {
      render(<RoutineSelector {...defaultProps} />)

      expect(screen.getByText(/squat/i)).toBeInTheDocument()
      expect(screen.getByText(/bench press/i)).toBeInTheDocument()
    })

    it('displays exercise count for each routine', () => {
      render(<RoutineSelector {...defaultProps} />)

      const routine1 = screen.getByText('GZCLP Day A1').closest('button')
      expect(routine1).toHaveTextContent('5 exercises')
    })
  })

  describe('sorting', () => {
    it('sorts routines by date (most recent first)', () => {
      render(<RoutineSelector {...defaultProps} />)

      const routineButtons = screen.getAllByRole('button').filter(
        (btn) => btn.textContent?.includes('exercises')
      )

      // First routine should be the most recent (GZCLP Day A1)
      expect(routineButtons[0]).toHaveTextContent('GZCLP Day A1')
      // Second should be GZCLP Day B1
      expect(routineButtons[1]).toHaveTextContent('GZCLP Day B1')
      // Third should be Upper Body
      expect(routineButtons[2]).toHaveTextContent('Upper Body')
    })
  })

  describe('search/filter', () => {
    it('shows search input when more than 10 routines', () => {
      const manyRoutines = Array.from({ length: 12 }, (_, i) => ({
        id: `routine-${i}`,
        title: `Routine ${i}`,
        exerciseCount: 3,
        exercisePreview: ['Ex1', 'Ex2'],
        updatedAt: new Date().toISOString(),
      }))

      render(<RoutineSelector {...defaultProps} routines={manyRoutines} />)

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    })

    it('hides search input when 10 or fewer routines', () => {
      render(<RoutineSelector {...defaultProps} />)

      expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument()
    })

    it('filters routines by search term', async () => {
      const manyRoutines = Array.from({ length: 12 }, (_, i) => ({
        id: `routine-${i}`,
        title: i < 3 ? `GZCLP Day ${i}` : `Other Routine ${i}`,
        exerciseCount: 3,
        exercisePreview: ['Ex1', 'Ex2'],
        updatedAt: new Date().toISOString(),
      }))

      render(<RoutineSelector {...defaultProps} routines={manyRoutines} />)

      const searchInput = screen.getByPlaceholderText(/search/i)
      await userEvent.type(searchInput, 'GZCLP')

      // Should show GZCLP routines
      expect(screen.getByText('GZCLP Day 0')).toBeInTheDocument()
      expect(screen.getByText('GZCLP Day 1')).toBeInTheDocument()
      expect(screen.getByText('GZCLP Day 2')).toBeInTheDocument()

      // Should not show Other routines
      expect(screen.queryByText('Other Routine 5')).not.toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('calls onSelect with routine id when clicked', async () => {
      const onSelect = vi.fn()
      render(<RoutineSelector {...defaultProps} onSelect={onSelect} />)

      const routine1Button = screen.getByText('GZCLP Day A1').closest('button')!
      await userEvent.click(routine1Button)

      expect(onSelect).toHaveBeenCalledWith('routine-1')
    })

    it('highlights currently selected routine', () => {
      render(<RoutineSelector {...defaultProps} selectedId="routine-2" />)

      const routine2Button = screen.getByText('GZCLP Day B1').closest('button')
      expect(routine2Button).toHaveClass('border-blue-500')
    })
  })

  describe('close behavior', () => {
    it('calls onClose when close button clicked', async () => {
      const onClose = vi.fn()
      render(<RoutineSelector {...defaultProps} onClose={onClose} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await userEvent.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('has minimum 44x44px touch targets', () => {
      render(<RoutineSelector {...defaultProps} />)

      const routineButtons = screen.getAllByRole('button').filter(
        (btn) => btn.textContent?.includes('exercises')
      )

      routineButtons.forEach((button) => {
        expect(button).toHaveClass('min-h-[44px]')
      })
    })
  })
})
