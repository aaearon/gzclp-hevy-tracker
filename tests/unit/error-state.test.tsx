/**
 * ErrorState Component Tests
 *
 * Tests for error state display components.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorState, NetworkErrorState, EmptyState } from '@/components/common/ErrorState'

describe('ErrorState', () => {
  it('renders error message', () => {
    render(<ErrorState message="Something went wrong" />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders custom title', () => {
    render(<ErrorState title="Custom Error" message="Details here" />)

    expect(screen.getByText('Custom Error')).toBeInTheDocument()
  })

  it('renders default title when not provided', () => {
    render(<ErrorState message="Details here" />)

    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn()
    render(<ErrorState message="Error occurred" onRetry={onRetry} />)

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorState message="Error occurred" />)

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorState message="Error occurred" onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows cached data indicator when showCachedIndicator is true', () => {
    render(<ErrorState message="Error" showCachedIndicator={true} />)

    expect(screen.getByText(/showing cached data/i)).toBeInTheDocument()
  })

  it('does not show cached data indicator by default', () => {
    render(<ErrorState message="Error" />)

    expect(screen.queryByText(/showing cached data/i)).not.toBeInTheDocument()
  })

  it('renders help link when provided', () => {
    render(<ErrorState message="Error" helpLink="https://example.com/help" />)

    const link = screen.getByRole('link', { name: /get help/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com/help')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('applies custom className', () => {
    render(<ErrorState message="Error" className="custom-class" />)

    expect(screen.getByRole('alert')).toHaveClass('custom-class')
  })
})

describe('NetworkErrorState', () => {
  it('renders with predefined connection error message', () => {
    render(<NetworkErrorState />)

    expect(screen.getByText('Connection Error')).toBeInTheDocument()
    expect(screen.getByText(/unable to connect to hevy/i)).toBeInTheDocument()
  })

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn()
    render(<NetworkErrorState onRetry={onRetry} />)

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('shows cached indicator when specified', () => {
    render(<NetworkErrorState showCachedIndicator={true} />)

    expect(screen.getByText(/showing cached data/i)).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('renders title and message', () => {
    render(<EmptyState title="No Data" message="Nothing to display" />)

    expect(screen.getByText('No Data')).toBeInTheDocument()
    expect(screen.getByText('Nothing to display')).toBeInTheDocument()
  })

  it('renders action button when actionLabel and onAction are provided', () => {
    const onAction = vi.fn()
    render(
      <EmptyState
        title="No Items"
        message="Add some items"
        actionLabel="Add Item"
        onAction={onAction}
      />
    )

    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument()
  })

  it('does not render action button when actionLabel is not provided', () => {
    const onAction = vi.fn()
    render(
      <EmptyState
        title="No Items"
        message="Add some items"
        onAction={onAction}
      />
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onAction when button is clicked', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <EmptyState
        title="No Items"
        message="Add some items"
        actionLabel="Add Item"
        onAction={onAction}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Add Item' }))

    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('renders different icon types', () => {
    const { rerender } = render(
      <EmptyState title="Test" message="Test" icon="inbox" />
    )
    expect(document.querySelector('svg')).toBeInTheDocument()

    rerender(<EmptyState title="Test" message="Test" icon="search" />)
    expect(document.querySelector('svg')).toBeInTheDocument()

    rerender(<EmptyState title="Test" message="Test" icon="document" />)
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <EmptyState
        title="Empty Title"
        message="Empty Message"
        className="custom-empty-class"
      />
    )

    // The className is applied to a div that contains the title
    expect(screen.getByText('Empty Title').closest('div.custom-empty-class')).toBeInTheDocument()
  })
})
