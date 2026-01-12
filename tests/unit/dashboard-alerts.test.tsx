/**
 * DashboardAlerts Component Tests
 *
 * Tests for the DashboardAlerts component that displays update status messages.
 * Note: Discrepancy alerts have been moved to ReviewModal.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardAlerts } from '@/components/Dashboard/DashboardAlerts'

describe('DashboardAlerts', () => {
  const defaultProps = {
    updateError: null,
    updateSuccess: false,
    onDismissUpdate: vi.fn(),
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
})
