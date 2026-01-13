/**
 * DashboardHeader Component Tests
 *
 * Tests for the DashboardHeader component that displays
 * the header section with title, sync status, and action buttons.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test-utils'
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
    currentWeek: 3,
    weekCompleted: 2,
    weekTotal: 4,
    onSync: vi.fn(),
    onPush: vi.fn(),
    onOpenReviewModal: vi.fn(),
    onDismissError: vi.fn(),
  }

  describe('rendering', () => {
    it('renders the title', () => {
      render(<DashboardHeader {...defaultProps} />)

      expect(screen.getByText('GZCLP Tracker')).toBeInTheDocument()
    })

    it('renders week progress badge', () => {
      render(<DashboardHeader {...defaultProps} currentWeek={5} weekCompleted={3} weekTotal={4} />)

      expect(screen.getByText('Week 5 - 3/4')).toBeInTheDocument()
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

    it('renders settings link', () => {
      render(<DashboardHeader {...defaultProps} />)

      expect(screen.getByLabelText('Settings')).toBeInTheDocument()
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

  describe('sync button (split button)', () => {
    describe('when needsPush is false', () => {
      it('shows Fetch as primary action', () => {
        render(<DashboardHeader {...defaultProps} needsPush={false} />)

        const fetchButton = screen.getByRole('button', { name: /fetch workouts from hevy/i })
        expect(fetchButton).toBeInTheDocument()
      })

      it('calls onSync when primary button is clicked', async () => {
        const user = userEvent.setup()
        const onSync = vi.fn()
        render(<DashboardHeader {...defaultProps} needsPush={false} onSync={onSync} />)

        const fetchButton = screen.getByRole('button', { name: /fetch workouts from hevy/i })
        await user.click(fetchButton)

        expect(onSync).toHaveBeenCalled()
      })

      it('shows Push to Hevy in dropdown', async () => {
        const user = userEvent.setup()
        render(<DashboardHeader {...defaultProps} needsPush={false} />)

        // Open dropdown
        const dropdownToggle = screen.getByRole('button', { name: /more sync options/i })
        await user.click(dropdownToggle)

        expect(screen.getByRole('menuitem', { name: /push to hevy/i })).toBeInTheDocument()
      })

      it('calls onPush when Push to Hevy is selected from dropdown', async () => {
        const user = userEvent.setup()
        const onPush = vi.fn()
        render(<DashboardHeader {...defaultProps} needsPush={false} onPush={onPush} />)

        // Open dropdown and click Push to Hevy
        const dropdownToggle = screen.getByRole('button', { name: /more sync options/i })
        await user.click(dropdownToggle)
        await user.click(screen.getByRole('menuitem', { name: /push to hevy/i }))

        expect(onPush).toHaveBeenCalled()
      })
    })

    describe('when needsPush is true', () => {
      it('shows Push to Hevy as primary action', () => {
        render(<DashboardHeader {...defaultProps} needsPush={true} />)

        const pushButton = screen.getByRole('button', { name: /push changes to hevy/i })
        expect(pushButton).toBeInTheDocument()
      })

      it('calls onPush when primary button is clicked', async () => {
        const user = userEvent.setup()
        const onPush = vi.fn()
        render(<DashboardHeader {...defaultProps} needsPush={true} onPush={onPush} />)

        const pushButton = screen.getByRole('button', { name: /push changes to hevy/i })
        await user.click(pushButton)

        expect(onPush).toHaveBeenCalled()
      })

      it('shows Fetch in dropdown', async () => {
        const user = userEvent.setup()
        render(<DashboardHeader {...defaultProps} needsPush={true} />)

        // Open dropdown
        const dropdownToggle = screen.getByRole('button', { name: /more sync options/i })
        await user.click(dropdownToggle)

        expect(screen.getByRole('menuitem', { name: /fetch/i })).toBeInTheDocument()
      })

      it('shows badge indicator when needsPush is true', () => {
        render(<DashboardHeader {...defaultProps} needsPush={true} />)

        expect(screen.getByLabelText('Changes need to be pushed to Hevy')).toBeInTheDocument()
      })
    })

    describe('disabled states', () => {
      it('disables buttons when offline', () => {
        render(<DashboardHeader {...defaultProps} isOffline={true} />)

        const fetchButton = screen.getByRole('button', { name: /fetch workouts from hevy/i })
        const dropdownToggle = screen.getByRole('button', { name: /more sync options/i })
        expect(fetchButton).toBeDisabled()
        expect(dropdownToggle).toBeDisabled()
      })

      it('disables buttons when no API key', () => {
        render(<DashboardHeader {...defaultProps} hasApiKey={false} />)

        const fetchButton = screen.getByRole('button', { name: /fetch workouts from hevy/i })
        const dropdownToggle = screen.getByRole('button', { name: /more sync options/i })
        expect(fetchButton).toBeDisabled()
        expect(dropdownToggle).toBeDisabled()
      })

      it('does not show badge indicator when button is disabled', () => {
        render(<DashboardHeader {...defaultProps} needsPush={true} isOffline={true} />)

        expect(screen.queryByLabelText('Changes need to be pushed to Hevy')).not.toBeInTheDocument()
      })
    })

    describe('dropdown behavior', () => {
      it('closes dropdown when clicking outside', async () => {
        const user = userEvent.setup()
        render(<DashboardHeader {...defaultProps} />)

        // Open dropdown
        const dropdownToggle = screen.getByRole('button', { name: /more sync options/i })
        await user.click(dropdownToggle)
        expect(screen.getByRole('menu')).toBeInTheDocument()

        // Click outside (on the header title)
        await user.click(screen.getByText('GZCLP Tracker'))

        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      })

      it('closes dropdown when selecting an option', async () => {
        const user = userEvent.setup()
        render(<DashboardHeader {...defaultProps} needsPush={false} />)

        // Open dropdown
        const dropdownToggle = screen.getByRole('button', { name: /more sync options/i })
        await user.click(dropdownToggle)
        expect(screen.getByRole('menu')).toBeInTheDocument()

        // Select an option
        await user.click(screen.getByRole('menuitem', { name: /push to hevy/i }))

        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      })

      it('closes dropdown on escape key', async () => {
        const user = userEvent.setup()
        render(<DashboardHeader {...defaultProps} />)

        // Open dropdown
        const dropdownToggle = screen.getByRole('button', { name: /more sync options/i })
        await user.click(dropdownToggle)
        expect(screen.getByRole('menu')).toBeInTheDocument()

        // Press escape
        await user.keyboard('{Escape}')

        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      })
    })
  })

  describe('settings navigation', () => {
    it('settings link points to /settings', () => {
      render(<DashboardHeader {...defaultProps} />)

      const settingsLink = screen.getByLabelText('Settings')
      expect(settingsLink).toHaveAttribute('href', '/settings')
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
