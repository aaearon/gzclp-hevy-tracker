/**
 * PageSkeleton Component Tests
 *
 * Tests for the page-level loading skeleton.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PageSkeleton } from '@/components/common/PageSkeleton'

describe('PageSkeleton', () => {
  it('renders with full height', () => {
    render(<PageSkeleton />)

    const skeleton = document.querySelector('.min-h-screen')
    expect(skeleton).toBeInTheDocument()
  })

  it('renders with background color', () => {
    render(<PageSkeleton />)

    const skeleton = document.querySelector('.bg-gray-50')
    expect(skeleton).toBeInTheDocument()
  })

  it('renders with animate-pulse for loading effect', () => {
    render(<PageSkeleton />)

    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('renders header placeholder', () => {
    render(<PageSkeleton />)

    // Header is h-16
    const header = document.querySelector('.h-16')
    expect(header).toBeInTheDocument()
  })

  it('renders content placeholders', () => {
    render(<PageSkeleton />)

    // Content blocks with rounded-lg
    const contentBlocks = document.querySelectorAll('.rounded-lg')
    expect(contentBlocks.length).toBeGreaterThan(0)
  })

  it('renders container with padding', () => {
    render(<PageSkeleton />)

    const container = document.querySelector('.container.mx-auto.px-4.py-8')
    expect(container).toBeInTheDocument()
  })
})
