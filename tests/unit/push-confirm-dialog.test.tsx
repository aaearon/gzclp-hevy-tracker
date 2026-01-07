/**
 * PushConfirmDialog Component Tests
 *
 * Tests for the push confirmation dialog that shows a preview
 * of changes before pushing to Hevy.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PushConfirmDialog } from '@/components/Dashboard/PushConfirmDialog'
import type { SelectablePushPreview, SelectableDayDiff, SyncAction } from '@/lib/push-preview'

// =============================================================================
// Test Fixtures
// =============================================================================

function createDayDiff(
  day: 'A1' | 'B1' | 'A2' | 'B2',
  routineExists: boolean,
  changeCount: number
): SelectableDayDiff {
  const isChanged = changeCount > 0 || !routineExists
  return {
    day,
    routineName: `Day ${day}`,
    routineExists,
    exercises: [
      {
        exerciseId: `${day}-t1`,
        name: day.startsWith('A') ? 'Squat' : 'OHP',
        tier: 'T1',
        oldWeight: routineExists ? 60 : null,
        newWeight: changeCount > 0 ? 62.5 : 60,
        stage: 0,
        isChanged: changeCount > 0 || !routineExists,
        progressionKey: `${day}-t1-key`,
        action: (changeCount > 0 || !routineExists) ? 'push' : 'skip' as SyncAction,
      },
      {
        exerciseId: `${day}-t2`,
        name: day.startsWith('A') ? 'Bench Press' : 'Deadlift',
        tier: 'T2',
        oldWeight: routineExists ? 40 : null,
        newWeight: 40,
        stage: 0,
        isChanged: !routineExists,
        progressionKey: `${day}-t2-key`,
        action: (!routineExists) ? 'push' : 'skip' as SyncAction,
      },
      {
        exerciseId: `${day}-t3`,
        name: 'Lat Pulldown',
        tier: 'T3',
        oldWeight: routineExists ? 30 : null,
        newWeight: 30,
        stage: null,
        isChanged: !routineExists,
        progressionKey: `${day}-t3-key`,
        action: (!routineExists) ? 'push' : 'skip' as SyncAction,
      },
    ],
    changeCount,
  }
}

function createPreview(options: {
  totalChanges?: number
  hasAnyRoutines?: boolean
  days?: SelectableDayDiff[]
  pushCount?: number
  pullCount?: number
  skipCount?: number
}): SelectablePushPreview {
  const { totalChanges = 2, hasAnyRoutines = true, days, pushCount, pullCount = 0, skipCount } = options

  const defaultDays = [
    createDayDiff('A1', hasAnyRoutines, 1),
    createDayDiff('B1', hasAnyRoutines, 1),
    createDayDiff('A2', hasAnyRoutines, 0),
    createDayDiff('B2', hasAnyRoutines, 0),
  ]

  // Calculate default counts from days if not provided
  const finalDays = days ?? defaultDays
  const defaultPushCount = pushCount ?? finalDays.reduce((sum, d) => sum + d.exercises.filter(e => e.action === 'push').length, 0)
  const defaultSkipCount = skipCount ?? finalDays.reduce((sum, d) => sum + d.exercises.filter(e => e.action === 'skip').length, 0)

  return {
    days: finalDays,
    totalChanges,
    hasAnyRoutines,
    pushCount: defaultPushCount,
    pullCount,
    skipCount: defaultSkipCount,
  }
}

const defaultProps = {
  isOpen: true,
  isLoading: false,
  error: null,
  preview: createPreview({}),
  weightUnit: 'kg' as const,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  onRetry: vi.fn(),
  onActionChange: vi.fn(),
}

// =============================================================================
// Tests
// =============================================================================

describe('PushConfirmDialog', () => {
  describe('visibility', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(<PushConfirmDialog {...defaultProps} isOpen={false} />)
      expect(container).toBeEmptyDOMElement()
    })

    it('renders dialog when isOpen is true', () => {
      render(<PushConfirmDialog {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<PushConfirmDialog {...defaultProps} isLoading={true} />)
      expect(screen.getByText(/Loading current routines from Hevy/i)).toBeInTheDocument()
    })

    it('does not show preview content while loading', () => {
      render(<PushConfirmDialog {...defaultProps} isLoading={true} />)
      expect(screen.queryByText('Day A1')).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows error message when error is set', () => {
      render(<PushConfirmDialog {...defaultProps} error="Failed to fetch routines" />)
      expect(screen.getByText('Failed to fetch routines')).toBeInTheDocument()
    })

    it('shows retry button when in error state', () => {
      render(<PushConfirmDialog {...defaultProps} error="Network error" />)
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', async () => {
      const onRetry = vi.fn()
      render(<PushConfirmDialog {...defaultProps} error="Network error" onRetry={onRetry} />)

      await userEvent.click(screen.getByRole('button', { name: /retry/i }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('shows cancel button in error state', () => {
      render(<PushConfirmDialog {...defaultProps} error="Network error" />)
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })

  describe('preview display', () => {
    it('shows all four day sections', () => {
      render(<PushConfirmDialog {...defaultProps} />)
      expect(screen.getByText('Day A1')).toBeInTheDocument()
      expect(screen.getByText('Day B1')).toBeInTheDocument()
      expect(screen.getByText('Day A2')).toBeInTheDocument()
      expect(screen.getByText('Day B2')).toBeInTheDocument()
    })

    it('shows exercise names', () => {
      render(<PushConfirmDialog {...defaultProps} />)
      // Squat appears in A1 and A2, so use getAllByText
      expect(screen.getAllByText('Squat')).toHaveLength(2)
      expect(screen.getAllByText('Bench Press')).toHaveLength(2)
    })

    it('shows tier labels for exercises', () => {
      render(<PushConfirmDialog {...defaultProps} />)
      expect(screen.getAllByText('T1')).toHaveLength(4) // One per day
      expect(screen.getAllByText('T2')).toHaveLength(4)
      expect(screen.getAllByText('T3')).toHaveLength(4)
    })

    it('shows push/skip counts', () => {
      const preview = createPreview({ totalChanges: 5, pushCount: 5, skipCount: 7 })
      render(<PushConfirmDialog {...defaultProps} preview={preview} />)
      // Now shows "5 push" and "7 skip" in the footer
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('push')).toBeInTheDocument()
      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.getByText('skip')).toBeInTheDocument()
    })

    it('shows "No changes" message when no push/pull actions', () => {
      const preview = createPreview({ totalChanges: 0, pushCount: 0, pullCount: 0, skipCount: 12 })
      render(<PushConfirmDialog {...defaultProps} preview={preview} />)
      expect(screen.getByText(/All weights are already up to date/i)).toBeInTheDocument()
    })

    it('shows NEW badge for new routines', () => {
      const preview = createPreview({ hasAnyRoutines: false })
      render(<PushConfirmDialog {...defaultProps} preview={preview} />)
      expect(screen.getAllByText('NEW ROUTINE')).toHaveLength(4)
    })

    it('shows change count per day', () => {
      render(<PushConfirmDialog {...defaultProps} />)
      expect(screen.getAllByText(/1 change\(s\)/i)).toHaveLength(2)
      expect(screen.getAllByText(/No changes/i)).toHaveLength(2)
    })
  })

  describe('weight display', () => {
    it('formats weights with unit', () => {
      render(<PushConfirmDialog {...defaultProps} />)
      // Should show "60 kg" format - appears in old weight column for T1 exercises
      // Each of 4 days has T1 and T2 with oldWeight=60, but some are new weight too
      expect(screen.getAllByText(/60 kg/).length).toBeGreaterThan(0)
    })

    it('uses lbs unit when specified', () => {
      render(<PushConfirmDialog {...defaultProps} weightUnit="lbs" />)
      expect(screen.getAllByText(/60 lbs/).length).toBeGreaterThan(0)
    })
  })

  describe('button interactions', () => {
    it('calls onCancel when Cancel button is clicked', async () => {
      const onCancel = vi.fn()
      render(<PushConfirmDialog {...defaultProps} onCancel={onCancel} />)

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when close (X) button is clicked', async () => {
      const onCancel = vi.fn()
      render(<PushConfirmDialog {...defaultProps} onCancel={onCancel} />)

      await userEvent.click(screen.getByRole('button', { name: /close dialog/i }))
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('calls onConfirm when Push Changes button is clicked', async () => {
      const onConfirm = vi.fn()
      render(<PushConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

      await userEvent.click(screen.getByRole('button', { name: /push changes/i }))
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('disables button when no push/pull actions', () => {
      const preview = createPreview({ totalChanges: 0, pushCount: 0, pullCount: 0, skipCount: 12 })
      render(<PushConfirmDialog {...defaultProps} preview={preview} />)

      expect(screen.getByRole('button', { name: /push changes/i })).toBeDisabled()
    })

    it('enables button when there are push actions', () => {
      const preview = createPreview({ totalChanges: 2, pushCount: 2 })
      render(<PushConfirmDialog {...defaultProps} preview={preview} />)

      expect(screen.getByRole('button', { name: /push changes/i })).toBeEnabled()
    })
  })

  describe('accessibility', () => {
    it('has proper dialog role and aria-modal', () => {
      render(<PushConfirmDialog {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-labelledby pointing to title', () => {
      render(<PushConfirmDialog {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby', 'push-dialog-title')
      expect(screen.getByText('Sync with Hevy')).toHaveAttribute('id', 'push-dialog-title')
    })
  })

  describe('collapsible sections', () => {
    it('first two days are expanded by default', () => {
      render(<PushConfirmDialog {...defaultProps} />)

      // Check that details elements exist
      const details = document.querySelectorAll('details')
      expect(details).toHaveLength(4)

      // First two should be open
      expect(details[0]).toHaveAttribute('open')
      expect(details[1]).toHaveAttribute('open')
    })
  })
})
