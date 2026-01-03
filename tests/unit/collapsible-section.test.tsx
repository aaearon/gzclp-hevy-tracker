/**
 * CollapsibleSection Component Tests
 *
 * Tests for the CollapsibleSection component used to group
 * warmup/cooldown exercises in the Dashboard.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CollapsibleSection } from '@/components/common/CollapsibleSection'

describe('CollapsibleSection', () => {
  describe('rendering', () => {
    it('renders the title', () => {
      render(
        <CollapsibleSection title="Warmup">
          <div>Content</div>
        </CollapsibleSection>
      )

      expect(screen.getByText('Warmup')).toBeInTheDocument()
    })

    it('renders children content', () => {
      render(
        <CollapsibleSection title="Warmup">
          <div>Exercise content here</div>
        </CollapsibleSection>
      )

      expect(screen.getByText('Exercise content here')).toBeInTheDocument()
    })

    it('uses native details/summary elements', () => {
      render(
        <CollapsibleSection title="Cooldown">
          <div>Content</div>
        </CollapsibleSection>
      )

      expect(screen.getByRole('group')).toBeInTheDocument()
      const details = document.querySelector('details')
      expect(details).toBeInTheDocument()
    })

    it('is expanded by default when defaultOpen is true', () => {
      render(
        <CollapsibleSection title="Warmup" defaultOpen={true}>
          <div>Visible content</div>
        </CollapsibleSection>
      )

      const details = document.querySelector('details')
      expect(details).toHaveAttribute('open')
    })

    it('is collapsed by default when defaultOpen is false', () => {
      render(
        <CollapsibleSection title="Warmup" defaultOpen={false}>
          <div>Hidden content</div>
        </CollapsibleSection>
      )

      const details = document.querySelector('details')
      expect(details).not.toHaveAttribute('open')
    })

    it('defaults to collapsed when no defaultOpen specified', () => {
      render(
        <CollapsibleSection title="Warmup">
          <div>Content</div>
        </CollapsibleSection>
      )

      const details = document.querySelector('details')
      expect(details).not.toHaveAttribute('open')
    })
  })

  describe('interaction', () => {
    it('toggles content visibility when clicked', async () => {
      const user = userEvent.setup()
      render(
        <CollapsibleSection title="Warmup" defaultOpen={false}>
          <div>Exercise list</div>
        </CollapsibleSection>
      )

      const summary = screen.getByText('Warmup')
      const details = document.querySelector('details')

      expect(details).not.toHaveAttribute('open')

      await user.click(summary)

      expect(details).toHaveAttribute('open')
    })

    it('calls onToggle callback when state changes', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      render(
        <CollapsibleSection title="Warmup" onToggle={onToggle}>
          <div>Content</div>
        </CollapsibleSection>
      )

      const summary = screen.getByText('Warmup')
      await user.click(summary)

      expect(onToggle).toHaveBeenCalledWith(true)

      await user.click(summary)

      expect(onToggle).toHaveBeenCalledWith(false)
    })
  })

  describe('styling', () => {
    it('accepts custom className', () => {
      render(
        <CollapsibleSection title="Warmup" className="custom-class">
          <div>Content</div>
        </CollapsibleSection>
      )

      const details = document.querySelector('details')
      expect(details).toHaveClass('custom-class')
    })

    it('shows chevron indicator in summary', () => {
      render(
        <CollapsibleSection title="Warmup">
          <div>Content</div>
        </CollapsibleSection>
      )

      // Look for an svg or icon element (chevron)
      const summary = screen.getByText('Warmup').closest('summary')
      expect(summary).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('summary is focusable', () => {
      render(
        <CollapsibleSection title="Warmup">
          <div>Content</div>
        </CollapsibleSection>
      )

      // Get the summary element (parent of the span containing title)
      const summary = screen.getByText('Warmup').closest('summary')!
      summary.focus()
      expect(document.activeElement).toBe(summary)
    })

    it('details element has role="group"', () => {
      render(
        <CollapsibleSection title="Warmup">
          <div>Content</div>
        </CollapsibleSection>
      )

      const details = document.querySelector('details')
      expect(details).toHaveAttribute('role', 'group')
    })
  })
})
