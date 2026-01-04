/**
 * DayTabBar Component Tests
 *
 * Tests for the tab navigation component used in import review.
 *
 * Phase 5: UI Components - Tab Navigation
 * @see docs/006-per-day-t3-and-import-ux.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DayTabBar } from '@/components/SetupWizard/DayTabBar'
import type { GZCLPDay } from '@/types/state'

describe('DayTabBar', () => {
  const defaultProps = {
    activeDay: 'A1' as GZCLPDay,
    validatedDays: [] as GZCLPDay[],
    onDayChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders 4 day tabs (A1, B1, A2, B2)', () => {
      render(<DayTabBar {...defaultProps} />)

      expect(screen.getByRole('tab', { name: /A1/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /B1/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /A2/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /B2/i })).toBeInTheDocument()
    })

    it('highlights the active tab with aria-selected', () => {
      render(<DayTabBar {...defaultProps} activeDay="B1" />)

      const a1Tab = screen.getByRole('tab', { name: /A1/i })
      const b1Tab = screen.getByRole('tab', { name: /B1/i })

      expect(b1Tab).toHaveAttribute('aria-selected', 'true')
      expect(a1Tab).toHaveAttribute('aria-selected', 'false')
    })

    it('applies active styling to active tab', () => {
      render(<DayTabBar {...defaultProps} activeDay="A2" />)

      const a2Tab = screen.getByRole('tab', { name: /A2/i })
      expect(a2Tab).toHaveClass('bg-blue-600')
      expect(a2Tab).toHaveClass('text-white')
    })

    it('shows checkmark indicator for validated days', () => {
      render(<DayTabBar {...defaultProps} validatedDays={['A1', 'B2']} />)

      const a1Tab = screen.getByRole('tab', { name: /A1/i })
      const b1Tab = screen.getByRole('tab', { name: /B1/i })
      const b2Tab = screen.getByRole('tab', { name: /B2/i })

      // A1 and B2 should have checkmark (validated)
      expect(a1Tab.querySelector('svg')).toBeInTheDocument()
      expect(b2Tab.querySelector('svg')).toBeInTheDocument()

      // B1 should not have checkmark
      expect(b1Tab.querySelector('svg')).toBeNull()
    })

    it('shows checkmark on all days when all validated', () => {
      render(<DayTabBar {...defaultProps} validatedDays={['A1', 'B1', 'A2', 'B2']} />)

      const tabs = screen.getAllByRole('tab')
      tabs.forEach((tab) => {
        expect(tab.querySelector('svg')).toBeInTheDocument()
      })
    })

    it('applies custom className when provided', () => {
      render(<DayTabBar {...defaultProps} className="mt-4 mb-2" />)

      const tablist = screen.getByRole('tablist')
      expect(tablist).toHaveClass('mt-4')
      expect(tablist).toHaveClass('mb-2')
    })
  })

  describe('interactions', () => {
    it('calls onDayChange when tab is clicked', async () => {
      const onDayChange = vi.fn()
      render(<DayTabBar {...defaultProps} onDayChange={onDayChange} />)

      await userEvent.click(screen.getByRole('tab', { name: /B2/i }))

      expect(onDayChange).toHaveBeenCalledTimes(1)
      expect(onDayChange).toHaveBeenCalledWith('B2')
    })

    it('calls onDayChange with correct day for each tab', async () => {
      const onDayChange = vi.fn()
      render(<DayTabBar {...defaultProps} onDayChange={onDayChange} />)

      await userEvent.click(screen.getByRole('tab', { name: /A1/i }))
      expect(onDayChange).toHaveBeenLastCalledWith('A1')

      await userEvent.click(screen.getByRole('tab', { name: /B1/i }))
      expect(onDayChange).toHaveBeenLastCalledWith('B1')

      await userEvent.click(screen.getByRole('tab', { name: /A2/i }))
      expect(onDayChange).toHaveBeenLastCalledWith('A2')

      await userEvent.click(screen.getByRole('tab', { name: /B2/i }))
      expect(onDayChange).toHaveBeenLastCalledWith('B2')
    })

    it('allows clicking on the already active tab', async () => {
      const onDayChange = vi.fn()
      render(<DayTabBar {...defaultProps} activeDay="A1" onDayChange={onDayChange} />)

      await userEvent.click(screen.getByRole('tab', { name: /A1/i }))

      expect(onDayChange).toHaveBeenCalledWith('A1')
    })
  })

  describe('accessibility', () => {
    it('has role="tablist" on container', () => {
      render(<DayTabBar {...defaultProps} />)

      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    it('has role="tab" on each button', () => {
      render(<DayTabBar {...defaultProps} />)

      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(4)
    })

    it('has minimum 44px touch targets', () => {
      render(<DayTabBar {...defaultProps} />)

      const tabs = screen.getAllByRole('tab')
      tabs.forEach((tab) => {
        expect(tab).toHaveClass('min-h-[44px]')
      })
    })

    it('has aria-label describing each day', () => {
      render(<DayTabBar {...defaultProps} />)

      expect(screen.getByRole('tab', { name: 'Day A1' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Day B1' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Day A2' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Day B2' })).toBeInTheDocument()
    })
  })
})
