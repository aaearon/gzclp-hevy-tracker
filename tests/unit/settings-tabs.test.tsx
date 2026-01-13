/**
 * SettingsTabs Component Tests
 *
 * Tests for tab navigation, URL hash persistence, and keyboard accessibility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsTabs, TabPanel, type SettingsTab } from '@/components/Settings/SettingsTabs'

// Helper to render tabs with all panels
function renderTabs(initialHash = '') {
  if (initialHash) {
    window.location.hash = initialHash
  }

  return render(
    <SettingsTabs>
      {(activeTab: SettingsTab) => (
        <>
          <TabPanel id="preferences" activeTab={activeTab}>
            <div data-testid="preferences-content">Preferences Content</div>
          </TabPanel>
          <TabPanel id="exercises" activeTab={activeTab}>
            <div data-testid="exercises-content">Exercises Content</div>
          </TabPanel>
          <TabPanel id="data" activeTab={activeTab}>
            <div data-testid="data-content">Data Content</div>
          </TabPanel>
          <TabPanel id="about" activeTab={activeTab}>
            <div data-testid="about-content">About Content</div>
          </TabPanel>
        </>
      )}
    </SettingsTabs>
  )
}

describe('SettingsTabs', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  afterEach(() => {
    window.location.hash = ''
  })

  describe('rendering', () => {
    it('renders all tab buttons', () => {
      renderTabs()

      expect(screen.getByRole('tab', { name: 'Preferences' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Exercises' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Data' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'About' })).toBeInTheDocument()
    })

    it('renders tablist with correct aria-label', () => {
      renderTabs()

      expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Settings sections')
    })

    it('defaults to preferences tab when no hash', () => {
      renderTabs()

      expect(screen.getByRole('tab', { name: 'Preferences' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByTestId('preferences-content')).toBeVisible()
    })

    it('reads initial tab from URL hash', () => {
      renderTabs('#exercises')

      expect(screen.getByRole('tab', { name: 'Exercises' })).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('tab panel visibility', () => {
    it('shows preferences panel when preferences tab is selected', () => {
      renderTabs('#preferences')

      const panel = screen.getByRole('tabpanel', { name: 'Preferences' })
      expect(panel).not.toHaveAttribute('hidden')
    })

    it('hides other panels when a tab is selected', () => {
      renderTabs('#preferences')

      const exercisesPanel = screen.getByTestId('exercises-content').closest('[role="tabpanel"]')
      expect(exercisesPanel).toHaveAttribute('hidden')
    })

    it('all panels remain in DOM (CSS hidden, not unmounted)', () => {
      renderTabs('#preferences')

      // All panels should exist in the DOM
      expect(screen.getByTestId('preferences-content')).toBeInTheDocument()
      expect(screen.getByTestId('exercises-content')).toBeInTheDocument()
      expect(screen.getByTestId('data-content')).toBeInTheDocument()
      expect(screen.getByTestId('about-content')).toBeInTheDocument()
    })
  })

  describe('tab switching', () => {
    it('switches tab when clicked', async () => {
      const user = userEvent.setup()
      renderTabs()

      await user.click(screen.getByRole('tab', { name: 'Exercises' }))

      expect(screen.getByRole('tab', { name: 'Exercises' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: 'Preferences' })).toHaveAttribute('aria-selected', 'false')
    })

    it('updates URL hash when tab is clicked', async () => {
      const user = userEvent.setup()
      renderTabs()

      await user.click(screen.getByRole('tab', { name: 'Data' }))

      expect(window.location.hash).toBe('#data')
    })

    it('shows corresponding panel when tab is clicked', async () => {
      const user = userEvent.setup()
      renderTabs()

      await user.click(screen.getByRole('tab', { name: 'About' }))

      const aboutPanel = screen.getByRole('tabpanel', { name: 'About' })
      expect(aboutPanel).not.toHaveAttribute('hidden')
    })
  })

  describe('keyboard navigation', () => {
    it('moves to next tab with ArrowRight', async () => {
      const user = userEvent.setup()
      renderTabs()

      const preferencesTab = screen.getByRole('tab', { name: 'Preferences' })
      preferencesTab.focus()

      await user.keyboard('{ArrowRight}')

      expect(screen.getByRole('tab', { name: 'Exercises' })).toHaveAttribute('aria-selected', 'true')
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Exercises' }))
    })

    it('moves to previous tab with ArrowLeft', async () => {
      const user = userEvent.setup()
      renderTabs('#exercises')

      const exercisesTab = screen.getByRole('tab', { name: 'Exercises' })
      exercisesTab.focus()

      await user.keyboard('{ArrowLeft}')

      expect(screen.getByRole('tab', { name: 'Preferences' })).toHaveAttribute('aria-selected', 'true')
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Preferences' }))
    })

    it('wraps around to last tab when pressing ArrowLeft on first tab', async () => {
      const user = userEvent.setup()
      renderTabs()

      const preferencesTab = screen.getByRole('tab', { name: 'Preferences' })
      preferencesTab.focus()

      await user.keyboard('{ArrowLeft}')

      expect(screen.getByRole('tab', { name: 'About' })).toHaveAttribute('aria-selected', 'true')
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'About' }))
    })

    it('wraps around to first tab when pressing ArrowRight on last tab', async () => {
      const user = userEvent.setup()
      renderTabs('#about')

      const aboutTab = screen.getByRole('tab', { name: 'About' })
      aboutTab.focus()

      await user.keyboard('{ArrowRight}')

      expect(screen.getByRole('tab', { name: 'Preferences' })).toHaveAttribute('aria-selected', 'true')
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Preferences' }))
    })

    it('moves to first tab with Home key', async () => {
      const user = userEvent.setup()
      renderTabs('#about')

      const aboutTab = screen.getByRole('tab', { name: 'About' })
      aboutTab.focus()

      await user.keyboard('{Home}')

      expect(screen.getByRole('tab', { name: 'Preferences' })).toHaveAttribute('aria-selected', 'true')
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Preferences' }))
    })

    it('moves to last tab with End key', async () => {
      const user = userEvent.setup()
      renderTabs()

      const preferencesTab = screen.getByRole('tab', { name: 'Preferences' })
      preferencesTab.focus()

      await user.keyboard('{End}')

      expect(screen.getByRole('tab', { name: 'About' })).toHaveAttribute('aria-selected', 'true')
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'About' }))
    })
  })

  describe('ARIA attributes', () => {
    it('selected tab has aria-selected=true', () => {
      renderTabs('#exercises')

      expect(screen.getByRole('tab', { name: 'Exercises' })).toHaveAttribute('aria-selected', 'true')
    })

    it('non-selected tabs have aria-selected=false', () => {
      renderTabs('#exercises')

      expect(screen.getByRole('tab', { name: 'Preferences' })).toHaveAttribute('aria-selected', 'false')
      expect(screen.getByRole('tab', { name: 'Data' })).toHaveAttribute('aria-selected', 'false')
      expect(screen.getByRole('tab', { name: 'About' })).toHaveAttribute('aria-selected', 'false')
    })

    it('selected tab has tabindex=0', () => {
      renderTabs('#exercises')

      expect(screen.getByRole('tab', { name: 'Exercises' })).toHaveAttribute('tabindex', '0')
    })

    it('non-selected tabs have tabindex=-1', () => {
      renderTabs('#exercises')

      expect(screen.getByRole('tab', { name: 'Preferences' })).toHaveAttribute('tabindex', '-1')
      expect(screen.getByRole('tab', { name: 'Data' })).toHaveAttribute('tabindex', '-1')
      expect(screen.getByRole('tab', { name: 'About' })).toHaveAttribute('tabindex', '-1')
    })

    it('tabs have aria-controls pointing to panel', () => {
      renderTabs()

      expect(screen.getByRole('tab', { name: 'Preferences' })).toHaveAttribute('aria-controls', 'panel-preferences')
      expect(screen.getByRole('tab', { name: 'Exercises' })).toHaveAttribute('aria-controls', 'panel-exercises')
    })

    it('panels have aria-labelledby pointing to tab', () => {
      renderTabs()

      const preferencesPanel = screen.getByRole('tabpanel', { name: 'Preferences' })
      expect(preferencesPanel).toHaveAttribute('aria-labelledby', 'tab-preferences')
    })
  })

  describe('URL hash handling', () => {
    it('defaults to preferences for invalid hash', () => {
      renderTabs('#invalid')

      expect(screen.getByRole('tab', { name: 'Preferences' })).toHaveAttribute('aria-selected', 'true')
    })

    it('defaults to preferences for empty hash', () => {
      renderTabs('')

      expect(screen.getByRole('tab', { name: 'Preferences' })).toHaveAttribute('aria-selected', 'true')
    })
  })
})
