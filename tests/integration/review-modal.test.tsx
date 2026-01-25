/**
 * Integration Tests: Review Modal Flow
 *
 * Tests the review modal for reviewing and confirming pending changes.
 * [US3] User Story 3 - Review and Confirm Progression Changes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReviewModal } from '@/components/ReviewModal'
import type { PendingChange } from '@/types/state'

describe('[US3] Review Modal Flow', () => {
  const user = userEvent.setup()

  const mockPendingChanges: PendingChange[] = [
    {
      id: 'change-1',
      exerciseId: 'ex-squat',
      exerciseName: 'Squat',
      tier: 'T1',
      type: 'progress',
      currentWeight: 100,
      currentStage: 0,
      newWeight: 105,
      newStage: 0,
      newScheme: '5x3+',
      reason: 'Completed 5x3+ at 100kg. Adding 5kg.',
      workoutId: 'workout-1',
      workoutDate: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-15T12:00:00Z',
    },
    {
      id: 'change-2',
      exerciseId: 'ex-bench',
      exerciseName: 'Bench Press',
      tier: 'T2',
      type: 'stage_change',
      currentWeight: 60,
      currentStage: 0,
      newWeight: 60,
      newStage: 1,
      newScheme: '3x8',
      reason: 'Failed to complete 3x10 at 60kg. Moving to 3x8.',
      workoutId: 'workout-1',
      workoutDate: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-15T12:00:00Z',
    },
  ]

  const mockOnApply = vi.fn()
  const mockOnApplyAll = vi.fn()
  const mockOnReject = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Display', () => {
    it('should display all pending changes', () => {
      render(
        <ReviewModal
          isOpen={true}
          pendingChanges={mockPendingChanges}
          unit="kg"
          onApply={mockOnApply}
          onApplyAll={mockOnApplyAll}
          onReject={mockOnReject}

          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Squat')).toBeInTheDocument()
      expect(screen.getByText('Bench Press')).toBeInTheDocument()
    })

    it('should show current and new weights for each change', () => {
      render(
        <ReviewModal
          isOpen={true}
          pendingChanges={mockPendingChanges}
          unit="kg"
          onApply={mockOnApply}
          onApplyAll={mockOnApplyAll}
          onReject={mockOnReject}

          onClose={mockOnClose}
        />
      )

      // Squat: 100kg -> 105kg (multiple instances possible due to reason text)
      expect(screen.getAllByText(/100.*kg/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/105.*kg/).length).toBeGreaterThan(0)
    })

    it('should display change type badges', () => {
      render(
        <ReviewModal
          isOpen={true}
          pendingChanges={mockPendingChanges}
          unit="kg"
          onApply={mockOnApply}
          onApplyAll={mockOnApplyAll}
          onReject={mockOnReject}

          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/weight.*increase/i)).toBeInTheDocument()
      expect(screen.getByText(/stage.*change/i)).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(
        <ReviewModal
          isOpen={false}
          pendingChanges={mockPendingChanges}
          unit="kg"
          onApply={mockOnApply}
          onApplyAll={mockOnApplyAll}
          onReject={mockOnReject}

          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('Squat')).not.toBeInTheDocument()
    })

    it('should show empty state when no changes', () => {
      render(
        <ReviewModal
          isOpen={true}
          pendingChanges={[]}
          unit="kg"
          onApply={mockOnApply}
          onApplyAll={mockOnApplyAll}
          onReject={mockOnReject}

          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/no pending changes/i)).toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('should call onApply when apply button is clicked', async () => {
      render(
        <ReviewModal
          isOpen={true}
          pendingChanges={mockPendingChanges}
          unit="kg"
          onApply={mockOnApply}
          onApplyAll={mockOnApplyAll}
          onReject={mockOnReject}

          onClose={mockOnClose}
        />
      )

      // Find the first apply button
      const applyButtons = screen.getAllByRole('button', { name: /apply|accept/i })
      await user.click(applyButtons[0])

      expect(mockOnApply).toHaveBeenCalledWith(mockPendingChanges[0])
    })

    it('should call onReject when reject button is clicked', async () => {
      render(
        <ReviewModal
          isOpen={true}
          pendingChanges={mockPendingChanges}
          unit="kg"
          onApply={mockOnApply}
          onApplyAll={mockOnApplyAll}
          onReject={mockOnReject}

          onClose={mockOnClose}
        />
      )

      // Find the first reject button
      const rejectButtons = screen.getAllByRole('button', { name: /reject|dismiss/i })
      await user.click(rejectButtons[0])

      expect(mockOnReject).toHaveBeenCalledWith(mockPendingChanges[0].id)
    })

    it('should call onClose when close button is clicked', async () => {
      render(
        <ReviewModal
          isOpen={true}
          pendingChanges={mockPendingChanges}
          unit="kg"
          onApply={mockOnApply}
          onApplyAll={mockOnApplyAll}
          onReject={mockOnReject}

          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should call onApplyAll when apply all is clicked', async () => {
      render(
        <ReviewModal
          isOpen={true}
          pendingChanges={mockPendingChanges}
          unit="kg"
          onApply={mockOnApply}
          onApplyAll={mockOnApplyAll}
          onReject={mockOnReject}

          onClose={mockOnClose}
        />
      )

      const applyAllButton = screen.getByRole('button', { name: /apply all/i })
      await user.click(applyAllButton)

      expect(mockOnApplyAll).toHaveBeenCalledTimes(1)
    })
  })

})
