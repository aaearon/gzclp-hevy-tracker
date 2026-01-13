/**
 * Badge Components Tests
 *
 * Tests for TierBadge, StageBadge, and DayBadge components.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TierBadge } from '@/components/common/TierBadge'
import { StageBadge } from '@/components/common/StageBadge'
import { DayBadge } from '@/components/common/DayBadge'
import { TIER_COLORS, STAGE_COLORS, DAY_COLORS } from '@/lib/tier-colors'

describe('tier-colors', () => {
  it('exports TIER_COLORS for all tiers', () => {
    expect(TIER_COLORS.T1).toBeDefined()
    expect(TIER_COLORS.T2).toBeDefined()
    expect(TIER_COLORS.T3).toBeDefined()
  })

  it('exports STAGE_COLORS for all stages', () => {
    expect(STAGE_COLORS[0]).toBeDefined()
    expect(STAGE_COLORS[1]).toBeDefined()
    expect(STAGE_COLORS[2]).toBeDefined()
  })

  it('exports DAY_COLORS for all days', () => {
    expect(DAY_COLORS.A1).toBeDefined()
    expect(DAY_COLORS.A2).toBeDefined()
    expect(DAY_COLORS.B1).toBeDefined()
    expect(DAY_COLORS.B2).toBeDefined()
  })

  it('TIER_COLORS have correct color scheme', () => {
    expect(TIER_COLORS.T1).toContain('red')
    expect(TIER_COLORS.T2).toContain('blue')
    expect(TIER_COLORS.T3).toContain('green')
  })

  it('STAGE_COLORS have correct color scheme', () => {
    expect(STAGE_COLORS[0]).toContain('green')
    expect(STAGE_COLORS[1]).toContain('yellow')
    expect(STAGE_COLORS[2]).toContain('red')
  })
})

describe('TierBadge', () => {
  it('renders T1 badge', () => {
    render(<TierBadge tier="T1" />)
    expect(screen.getByText('T1')).toBeInTheDocument()
  })

  it('renders T2 badge', () => {
    render(<TierBadge tier="T2" />)
    expect(screen.getByText('T2')).toBeInTheDocument()
  })

  it('renders T3 badge', () => {
    render(<TierBadge tier="T3" />)
    expect(screen.getByText('T3')).toBeInTheDocument()
  })

  it('applies tier-specific colors', () => {
    const { rerender } = render(<TierBadge tier="T1" />)
    expect(screen.getByText('T1')).toHaveClass('bg-red-100')

    rerender(<TierBadge tier="T2" />)
    expect(screen.getByText('T2')).toHaveClass('bg-blue-100')

    rerender(<TierBadge tier="T3" />)
    expect(screen.getByText('T3')).toHaveClass('bg-green-100')
  })

  it('has consistent base styling', () => {
    render(<TierBadge tier="T1" />)
    const badge = screen.getByText('T1')
    expect(badge).toHaveClass('rounded')
    expect(badge).toHaveClass('border')
    expect(badge).toHaveClass('px-2')
    expect(badge).toHaveClass('py-0.5')
    expect(badge).toHaveClass('text-xs')
    expect(badge).toHaveClass('font-semibold')
  })

  it('accepts additional className', () => {
    render(<TierBadge tier="T1" className="ml-2" />)
    expect(screen.getByText('T1')).toHaveClass('ml-2')
  })
})

describe('StageBadge', () => {
  it('renders stage 0 badge with label', () => {
    render(<StageBadge stage={0} />)
    expect(screen.getByText('Stage 1')).toBeInTheDocument()
  })

  it('renders stage 1 badge with label', () => {
    render(<StageBadge stage={1} />)
    expect(screen.getByText('Stage 2')).toBeInTheDocument()
  })

  it('renders stage 2 badge with label', () => {
    render(<StageBadge stage={2} />)
    expect(screen.getByText('Stage 3')).toBeInTheDocument()
  })

  it('renders short label when showLabel is false', () => {
    render(<StageBadge stage={0} showLabel={false} />)
    expect(screen.getByText('S0')).toBeInTheDocument()
  })

  it('applies stage-specific colors', () => {
    const { rerender } = render(<StageBadge stage={0} />)
    expect(screen.getByText('Stage 1')).toHaveClass('bg-green-100')

    rerender(<StageBadge stage={1} />)
    expect(screen.getByText('Stage 2')).toHaveClass('bg-yellow-100')

    rerender(<StageBadge stage={2} />)
    expect(screen.getByText('Stage 3')).toHaveClass('bg-red-100')
  })

  it('has consistent base styling', () => {
    render(<StageBadge stage={0} />)
    const badge = screen.getByText('Stage 1')
    expect(badge).toHaveClass('rounded')
    expect(badge).toHaveClass('px-2')
    expect(badge).toHaveClass('py-0.5')
    expect(badge).toHaveClass('text-xs')
    expect(badge).toHaveClass('font-medium')
  })

  it('accepts additional className', () => {
    render(<StageBadge stage={0} className="ml-2" />)
    expect(screen.getByText('Stage 1')).toHaveClass('ml-2')
  })
})

describe('DayBadge', () => {
  it('renders A1 badge', () => {
    render(<DayBadge day="A1" />)
    expect(screen.getByText('A1')).toBeInTheDocument()
  })

  it('renders A2 badge', () => {
    render(<DayBadge day="A2" />)
    expect(screen.getByText('A2')).toBeInTheDocument()
  })

  it('renders B1 badge', () => {
    render(<DayBadge day="B1" />)
    expect(screen.getByText('B1')).toBeInTheDocument()
  })

  it('renders B2 badge', () => {
    render(<DayBadge day="B2" />)
    expect(screen.getByText('B2')).toBeInTheDocument()
  })

  it('applies day-specific colors', () => {
    const { rerender } = render(<DayBadge day="A1" />)
    expect(screen.getByText('A1')).toHaveClass('bg-indigo-100')

    rerender(<DayBadge day="B1" />)
    expect(screen.getByText('B1')).toHaveClass('bg-purple-100')
  })

  it('A days share indigo color', () => {
    const { rerender } = render(<DayBadge day="A1" />)
    const a1Classes = screen.getByText('A1').className

    rerender(<DayBadge day="A2" />)
    const a2Classes = screen.getByText('A2').className

    expect(a1Classes).toBe(a2Classes)
  })

  it('B days share purple color', () => {
    const { rerender } = render(<DayBadge day="B1" />)
    const b1Classes = screen.getByText('B1').className

    rerender(<DayBadge day="B2" />)
    const b2Classes = screen.getByText('B2').className

    expect(b1Classes).toBe(b2Classes)
  })

  it('has consistent base styling', () => {
    render(<DayBadge day="A1" />)
    const badge = screen.getByText('A1')
    expect(badge).toHaveClass('rounded')
    expect(badge).toHaveClass('px-2')
    expect(badge).toHaveClass('py-0.5')
    expect(badge).toHaveClass('text-xs')
    expect(badge).toHaveClass('font-medium')
  })

  it('accepts additional className', () => {
    render(<DayBadge day="A1" className="ml-2" />)
    expect(screen.getByText('A1')).toHaveClass('ml-2')
  })
})
