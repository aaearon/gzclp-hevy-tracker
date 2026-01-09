/**
 * DashboardHeader Component Tests
 *
 * Tests for the DashboardHeader component that displays
 * the header section with title, sync status, and action buttons.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardHeader } from '@/components/Dashboard/DashboardHeader'

describe('DashboardHeader', () => {
  const defaultProps = {
    lastSync: null,
    syncError: null,
    pendingChangesCount: 0,
    isSyncing: false,
    isUpdating: false,
    isOffline: false,
    hasApiKey: true,
    needsPush: false,
    onSync: vi.fn(),
    onOpenPushDialog: vi.fn(),
    onOpenReviewModal: vi.fn(),
    onNavigateToSettings: vi.fn(),
    onDismissError: vi.fn(),
  }

  describe('rendering', () => {
    it('renders the title', () => {
      render(<DashboardHeader {...defaultProps} />)

      expect(screen.getByText('GZCLP Tracker')).toBeInTheDocument()
    })

    it('renders sync status with last sync time', () => {
      const lastSync = new Date().toISOString()
      render(<DashboardHeader {...defaultProps} lastSync={lastSync} />)

      expect(screen.getByText(/Last synced/)).toBeInTheDocument()
    })

    it('renders "Not synced yet" when lastSync is null', () => {
      render(<DashboardHeader {...defaultProps} lastSync={null} />)

      expect(screen.getByText('Not synced yet')).toBeInTheDocument()
    })

    it('renders sync error when present', () => {
      render(<DashboardHeader {...defaultProps} syncError="Network error" />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    it('renders settings button when onNavigateToSettings is provided', () => {
      render(<DashboardHeader {...defaultProps} />)

      expect(screen.getByLabelText('Settings')).toBeInTheDocument()
    })

    it('does not render settings button when onNavigateToSettings is undefined', () => {
      render(<DashboardHeader {...defaultProps} onNavigateToSettings={undefined} />)

      expect(screen.queryByLabelText('Settings')).not.toBeInTheDocument()
    })
  })

  describe('pending changes indicator', () => {
    it('does not show pending changes button when count is 0', () => {
      render(<DashboardHeader {...defaultProps} pendingChangesCount={0} />)

      expect(screen.queryByText('Review changes:')).not.toBeInTheDocument()
    })

    it('shows pending changes button when count > 0', () => {
      render(<DashboardHeader {...defaultProps} pendingChangesCount={3} />)

      expect(screen.getByText('Review changes:')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('calls onOpenReviewModal when pending changes button is clicked', async () => {
      const user = userEvent.setup()
      const onOpenReviewModal = vi.fn()
      render(
        <DashboardHeader
          {...defaultProps}
          pendingChangesCount={2}
          onOpenReviewModal={onOpenReviewModal}
        />
      )

      await user.click(screen.getByText('Review changes:'))

      expect(onOpenReviewModal).toHaveBeenCalled()
    })
  })

  describe('sync button', () => {
    it('calls onSync when sync button is clicked', async () => {
      const user = userEvent.setup()
      const onSync = vi.fn()
      render(<DashboardHeader {...defaultProps} onSync={onSync} />)

      const syncButton = screen.getByRole('button', { name: /fetch workouts from hevy/i })
      await user.click(syncButton)

      expect(onSync).toHaveBeenCalled()
    })

    it('disables sync button when offline', () => {
      render(<DashboardHeader {...defaultProps} isOffline={true} />)

      const syncButton = screen.getByRole('button', { name: /fetch workouts from hevy/i })
      expect(syncButton).toBeDisabled()
    })

    it('disables sync button when no API key', () => {
      render(<DashboardHeader {...defaultProps} hasApiKey={false} />)

      const syncButton = screen.getByRole('button', { name: /fetch workouts from hevy/i })
      expect(syncButton).toBeDisabled()
    })
  })

  describe('update hevy button', () => {
    it('calls onOpenPushDialog when update button is clicked', async () => {
      const user = userEvent.setup()
      const onOpenPushDialog = vi.fn()
      render(<DashboardHeader {...defaultProps} onOpenPushDialog={onOpenPushDialog} />)

      const updateButton = screen.getByRole('button', { name: /push to hevy/i })
      await user.click(updateButton)

      expect(onOpenPushDialog).toHaveBeenCalled()
    })

    it('disables update button when offline', () => {
      render(<DashboardHeader {...defaultProps} isOffline={true} />)

      const updateButton = screen.getByRole('button', { name: /push to hevy/i })
      expect(updateButton).toBeDisabled()
    })

    it('disables update button when no API key', () => {
      render(<DashboardHeader {...defaultProps} hasApiKey={false} />)

      const updateButton = screen.getByRole('button', { name: /push to hevy/i })
      expect(updateButton).toBeDisabled()
    })

    it('shows badge indicator when needsPush is true', () => {
      render(<DashboardHeader {...defaultProps} needsPush={true} />)

      // Badge has aria-label for accessibility
      expect(screen.getByLabelText('Changes need to be pushed to Hevy')).toBeInTheDocument()
    })

    it('does not show badge indicator when needsPush is false', () => {
      render(<DashboardHeader {...defaultProps} needsPush={false} />)

      expect(screen.queryByLabelText('Changes need to be pushed to Hevy')).not.toBeInTheDocument()
    })

    it('does not show badge indicator when button is disabled', () => {
      render(<DashboardHeader {...defaultProps} needsPush={true} isOffline={true} />)

      // Badge should be hidden when button is disabled
      expect(screen.queryByLabelText('Changes need to be pushed to Hevy')).not.toBeInTheDocument()
    })
  })

  describe('settings navigation', () => {
    it('calls onNavigateToSettings when settings button is clicked', async () => {
      const user = userEvent.setup()
      const onNavigateToSettings = vi.fn()
      render(<DashboardHeader {...defaultProps} onNavigateToSettings={onNavigateToSettings} />)

      await user.click(screen.getByLabelText('Settings'))

      expect(onNavigateToSettings).toHaveBeenCalled()
    })
  })

  describe('error dismissal', () => {
    it('calls onDismissError when error dismiss button is clicked', async () => {
      const user = userEvent.setup()
      const onDismissError = vi.fn()
      render(
        <DashboardHeader
          {...defaultProps}
          syncError="Some error"
          onDismissError={onDismissError}
        />
      )

      const dismissButton = screen.getByLabelText('Dismiss error')
      await user.click(dismissButton)

      expect(onDismissError).toHaveBeenCalled()
    })
  })
})
