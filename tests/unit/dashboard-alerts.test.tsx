/**
 * DashboardAlerts Component Tests
 *
 * Tests for the DashboardAlerts component that displays
 * update status and discrepancy alerts.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardAlerts } from '@/components/Dashboard/DashboardAlerts'
import type { DiscrepancyInfo } from '@/components/Dashboard/DiscrepancyAlert'

describe('DashboardAlerts', () => {
  const mockDiscrepancy: DiscrepancyInfo = {
    exerciseId: 'squat-t1',
    exerciseName: 'Squat',
    tier: 'T1',
    storedWeight: 100,
    actualWeight: 95,
    workoutId: 'workout-1',
    workoutDate: '2026-01-07T10:00:00Z',
  }

  const defaultProps = {
    updateError: null,
    updateSuccess: false,
    discrepancies: [] as DiscrepancyInfo[],
    weightUnit: 'kg' as const,
    onDismissUpdate: vi.fn(),
    onUseActualWeight: vi.fn(),
    onKeepStoredWeight: vi.fn(),
    onDismissDiscrepancies: vi.fn(),
  }

  describe('rendering', () => {
    it('renders nothing when no alerts are present', () => {
      const { container } = render(<DashboardAlerts {...defaultProps} />)

      expect(container.firstChild).toBeNull()
    })

    it('renders update error when present', () => {
      render(<DashboardAlerts {...defaultProps} updateError="Network error" />)

      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    it('renders success message when updateSuccess is true', () => {
      render(<DashboardAlerts {...defaultProps} updateSuccess={true} />)

      expect(screen.getByText('Routines updated successfully!')).toBeInTheDocument()
    })

    it('renders discrepancy alert when discrepancies are present', () => {
      render(
        <DashboardAlerts
          {...defaultProps}
          discrepancies={[mockDiscrepancy]}
        />
      )

      expect(screen.getByText('Weight Discrepancy Detected')).toBeInTheDocument()
      expect(screen.getByText(/Squat \(T1\)/)).toBeInTheDocument()
    })

    it('renders both update error and discrepancy alerts when both present', () => {
      render(
        <DashboardAlerts
          {...defaultProps}
          updateError="Some error"
          discrepancies={[mockDiscrepancy]}
        />
      )

      expect(screen.getByText('Some error')).toBeInTheDocument()
      expect(screen.getByText('Weight Discrepancy Detected')).toBeInTheDocument()
    })
  })

  describe('update status interactions', () => {
    it('calls onDismissUpdate when dismiss button is clicked on success', async () => {
      const user = userEvent.setup()
      const onDismissUpdate = vi.fn()
      render(
        <DashboardAlerts
          {...defaultProps}
          updateSuccess={true}
          onDismissUpdate={onDismissUpdate}
        />
      )

      await user.click(screen.getByText('Dismiss'))

      expect(onDismissUpdate).toHaveBeenCalled()
    })

    it('calls onDismissUpdate when dismiss button is clicked on error', async () => {
      const user = userEvent.setup()
      const onDismissUpdate = vi.fn()
      render(
        <DashboardAlerts
          {...defaultProps}
          updateError="Some error"
          onDismissUpdate={onDismissUpdate}
        />
      )

      await user.click(screen.getByText('Dismiss'))

      expect(onDismissUpdate).toHaveBeenCalled()
    })
  })

  describe('discrepancy interactions', () => {
    it('calls onUseActualWeight when use actual button is clicked', async () => {
      const user = userEvent.setup()
      const onUseActualWeight = vi.fn()
      render(
        <DashboardAlerts
          {...defaultProps}
          discrepancies={[mockDiscrepancy]}
          onUseActualWeight={onUseActualWeight}
        />
      )

      await user.click(screen.getByText('Use 95kg'))

      expect(onUseActualWeight).toHaveBeenCalledWith('squat-t1', 95, 'T1')
    })

    it('calls onKeepStoredWeight when keep stored button is clicked', async () => {
      const user = userEvent.setup()
      const onKeepStoredWeight = vi.fn()
      render(
        <DashboardAlerts
          {...defaultProps}
          discrepancies={[mockDiscrepancy]}
          onKeepStoredWeight={onKeepStoredWeight}
        />
      )

      await user.click(screen.getByText('Keep 100kg'))

      expect(onKeepStoredWeight).toHaveBeenCalledWith('squat-t1', 95, 'T1')
    })

    it('calls onDismissDiscrepancies when dismiss all is clicked', async () => {
      const user = userEvent.setup()
      const onDismissDiscrepancies = vi.fn()
      render(
        <DashboardAlerts
          {...defaultProps}
          discrepancies={[mockDiscrepancy]}
          onDismissDiscrepancies={onDismissDiscrepancies}
        />
      )

      await user.click(screen.getByText('Dismiss all'))

      expect(onDismissDiscrepancies).toHaveBeenCalled()
    })
  })
})
