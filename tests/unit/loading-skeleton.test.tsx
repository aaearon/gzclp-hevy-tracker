/**
 * LoadingSkeleton Component Tests
 *
 * Tests for skeleton loading state components.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  Skeleton,
  TextSkeleton,
  CardSkeleton,
  ButtonSkeleton,
  ListItemSkeleton,
  DashboardSkeleton,
  SettingsSkeleton,
} from '@/components/common/LoadingSkeleton'

describe('Skeleton', () => {
  it('renders with aria-hidden for accessibility', () => {
    render(<Skeleton />)

    const skeleton = document.querySelector('[aria-hidden="true"]')
    expect(skeleton).toBeInTheDocument()
  })

  it('applies animate-pulse class for shimmer effect', () => {
    render(<Skeleton />)

    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Skeleton className="custom-skeleton" />)

    const skeleton = document.querySelector('.custom-skeleton')
    expect(skeleton).toBeInTheDocument()
  })
})

describe('TextSkeleton', () => {
  it('renders full width by default', () => {
    render(<TextSkeleton />)

    const skeleton = document.querySelector('.w-full')
    expect(skeleton).toBeInTheDocument()
  })

  it('renders half width when specified', () => {
    render(<TextSkeleton width="half" />)

    const skeleton = document.querySelector('.w-1\\/2')
    expect(skeleton).toBeInTheDocument()
  })

  it('renders third width when specified', () => {
    render(<TextSkeleton width="third" />)

    const skeleton = document.querySelector('.w-1\\/3')
    expect(skeleton).toBeInTheDocument()
  })

  it('renders quarter width when specified', () => {
    render(<TextSkeleton width="quarter" />)

    const skeleton = document.querySelector('.w-1\\/4')
    expect(skeleton).toBeInTheDocument()
  })

  it('applies h-4 height for text line', () => {
    render(<TextSkeleton />)

    const skeleton = document.querySelector('.h-4')
    expect(skeleton).toBeInTheDocument()
  })
})

describe('CardSkeleton', () => {
  it('renders with card styling', () => {
    render(<CardSkeleton />)

    const card = document.querySelector('.bg-white.rounded-lg.shadow')
    expect(card).toBeInTheDocument()
  })

  it('contains multiple skeleton elements for card content', () => {
    render(<CardSkeleton />)

    // Should have avatar placeholder, and text lines
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(1)
  })
})

describe('ButtonSkeleton', () => {
  it('renders with button dimensions', () => {
    render(<ButtonSkeleton />)

    const skeleton = document.querySelector('.h-11.w-28')
    expect(skeleton).toBeInTheDocument()
  })

  it('applies rounded-lg styling', () => {
    render(<ButtonSkeleton />)

    const skeleton = document.querySelector('.rounded-lg')
    expect(skeleton).toBeInTheDocument()
  })
})

describe('ListItemSkeleton', () => {
  it('renders with flex layout', () => {
    render(<ListItemSkeleton />)

    const container = document.querySelector('.flex.items-center')
    expect(container).toBeInTheDocument()
  })

  it('contains icon placeholder and text lines', () => {
    render(<ListItemSkeleton />)

    // Should have icon placeholder (h-10 w-10)
    const iconPlaceholder = document.querySelector('.h-10.w-10')
    expect(iconPlaceholder).toBeInTheDocument()
  })
})

describe('DashboardSkeleton', () => {
  it('renders header skeleton', () => {
    render(<DashboardSkeleton />)

    // Should have header with text and button
    const buttons = document.querySelectorAll('.h-11')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders stats grid', () => {
    render(<DashboardSkeleton />)

    const grid = document.querySelector('.grid.grid-cols-2')
    expect(grid).toBeInTheDocument()
  })

  it('renders exercise list with multiple items', () => {
    render(<DashboardSkeleton />)

    // Should have list items
    const listItems = document.querySelectorAll('.flex.items-center.gap-3.py-3')
    expect(listItems.length).toBeGreaterThan(0)
  })
})

describe('SettingsSkeleton', () => {
  it('renders section cards', () => {
    render(<SettingsSkeleton />)

    const cards = document.querySelectorAll('.bg-white.rounded-lg.shadow')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('renders button group skeleton', () => {
    render(<SettingsSkeleton />)

    // Should have multiple button skeletons
    const buttons = document.querySelectorAll('.h-11')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
