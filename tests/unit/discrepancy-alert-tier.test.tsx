/**
 * Unit Tests: ReviewModal Discrepancy Display
 *
 * Tests for displaying weight discrepancy info in ReviewModal's PendingChangeCard.
 * Discrepancies are now shown inline on pending change cards instead of as a separate alert.
 *
 * @see feature/consolidate-discrepancy-ui
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReviewModal } from '@/components/ReviewModal'
import type { PendingChange, Tier } from '@/types/state'

describe('ReviewModal - Discrepancy Display', () => {
  const createPendingChange = (
    name: string,
    tier: Tier,
    currentWeight: number,
    newWeight: number,
    discrepancy?: { storedWeight: number; actualWeight: number }
  ): PendingChange => ({
    id: `change-${name.toLowerCase().replace(' ', '-')}-${tier.toLowerCase()}`,
    exerciseId: `ex-${name.toLowerCase().replace(' ', '-')}`,
    exerciseName: `${tier} ${name}`,
    tier,
    type: 'progress',
    progressionKey: `${name.toLowerCase()}-${tier}`,
    currentWeight,
    currentStage: 0,
    newWeight,
    newStage: 0,
    newScheme: tier === 'T1' ? '5x3+' : tier === 'T2' ? '3x10' : '3x15+',
    reason: `Completed workout at ${currentWeight}kg`,
    workoutId: 'workout-1',
    workoutDate: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T12:00:00Z',
    discrepancy,
  })

  const defaultProps = {
    isOpen: true,
    pendingChanges: [] as PendingChange[],
    unit: 'kg' as const,
    onApply: vi.fn(),
    onApplyAll: vi.fn(),
    onReject: vi.fn(),
    onModify: vi.fn(),
    onClose: vi.fn(),
  }

  describe('discrepancy indicator visibility', () => {
    it('shows discrepancy warning when actual weight differs from expected', () => {
      const pendingChanges = [
        createPendingChange('Squat', 'T1', 100, 105, {
          storedWeight: 100,
          actualWeight: 105,
        }),
      ]

      render(<ReviewModal {...defaultProps} pendingChanges={pendingChanges} />)

      expect(screen.getByText(/Different weight used/)).toBeInTheDocument()
    })

    it('does not show discrepancy warning when no discrepancy exists', () => {
      const pendingChanges = [
        createPendingChange('Squat', 'T1', 100, 105), // No discrepancy
      ]

      render(<ReviewModal {...defaultProps} pendingChanges={pendingChanges} />)

      expect(screen.queryByText(/Different weight used/)).not.toBeInTheDocument()
    })
  })

  describe('discrepancy details display', () => {
    it('shows actual weight lifted', () => {
      const pendingChanges = [
        createPendingChange('Squat', 'T1', 100, 110, {
          storedWeight: 100,
          actualWeight: 105,
        }),
      ]

      render(<ReviewModal {...defaultProps} pendingChanges={pendingChanges} />)

      expect(screen.getByText(/Lifted/)).toBeInTheDocument()
      expect(screen.getByText(/105 kg/)).toBeInTheDocument()
    })

    it('shows expected weight', () => {
      const pendingChanges = [
        createPendingChange('Bench Press', 'T2', 60, 65, {
          storedWeight: 60,
          actualWeight: 65,
        }),
      ]

      render(<ReviewModal {...defaultProps} pendingChanges={pendingChanges} />)

      expect(screen.getByText(/expected 60 kg/)).toBeInTheDocument()
    })

    it('shows green color when actual weight is higher', () => {
      const pendingChanges = [
        createPendingChange('Squat', 'T1', 100, 110, {
          storedWeight: 100,
          actualWeight: 105, // Higher than expected
        }),
      ]

      render(<ReviewModal {...defaultProps} pendingChanges={pendingChanges} />)

      const actualWeightText = screen.getByText('105 kg')
      expect(actualWeightText).toHaveClass('text-green-600')
    })

    it('shows amber color when actual weight is lower', () => {
      const pendingChanges = [
        createPendingChange('Squat', 'T1', 100, 100, {
          storedWeight: 100,
          actualWeight: 95, // Lower than expected
        }),
      ]

      render(<ReviewModal {...defaultProps} pendingChanges={pendingChanges} />)

      const actualWeightText = screen.getByText('95 kg')
      expect(actualWeightText).toHaveClass('text-amber-600')
    })
  })

  describe('multiple pending changes with discrepancies', () => {
    it('shows discrepancy indicator on each card that has one', () => {
      const pendingChanges = [
        createPendingChange('Squat', 'T1', 100, 105, {
          storedWeight: 100,
          actualWeight: 105,
        }),
        createPendingChange('Bench Press', 'T2', 60, 62.5), // No discrepancy
        createPendingChange('Deadlift', 'T1', 120, 127.5, {
          storedWeight: 120,
          actualWeight: 125,
        }),
      ]

      render(<ReviewModal {...defaultProps} pendingChanges={pendingChanges} />)

      // Should have exactly 2 discrepancy warnings (Squat T1 and Deadlift T1)
      const warnings = screen.getAllByText(/Different weight used/)
      expect(warnings).toHaveLength(2)
    })
  })

  describe('pending change card still works with discrepancy', () => {
    it('shows exercise name and tier', () => {
      const pendingChanges = [
        createPendingChange('Squat', 'T1', 100, 105, {
          storedWeight: 100,
          actualWeight: 105,
        }),
      ]

      render(<ReviewModal {...defaultProps} pendingChanges={pendingChanges} />)

      expect(screen.getByText('T1 Squat')).toBeInTheDocument()
      expect(screen.getByText('T1')).toBeInTheDocument() // Tier badge
    })

    it('shows weight progression arrow', () => {
      const pendingChanges = [
        createPendingChange('Squat', 'T1', 100, 110, { // Use 110 to avoid matching discrepancy
          storedWeight: 100,
          actualWeight: 105,
        }),
      ]

      render(<ReviewModal {...defaultProps} pendingChanges={pendingChanges} />)

      // Should show current weight -> new weight
      // The 100 kg appears in both current weight and expected weight, so use getAllByText
      expect(screen.getAllByText(/100 kg/).length).toBeGreaterThan(0)
      // New weight of 110 should be unique
      expect(screen.getByText('110 kg')).toBeInTheDocument()
    })

    it('has Apply and Reject buttons', () => {
      const pendingChanges = [
        createPendingChange('Squat', 'T1', 100, 105, {
          storedWeight: 100,
          actualWeight: 105,
        }),
      ]

      render(<ReviewModal {...defaultProps} pendingChanges={pendingChanges} />)

      // Multiple apply buttons exist (per-card Apply and Apply All)
      const applyButtons = screen.getAllByRole('button', { name: /apply/i })
      expect(applyButtons.length).toBeGreaterThan(0)
      expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
    })
  })
})
