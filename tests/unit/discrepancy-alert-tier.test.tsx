/**
 * Unit Tests: Discrepancy Alert Tier Display
 *
 * Bug fix: Discrepancy alerts should show tier (T1/T2) in the format
 * "Lift Name (T1)" or "Lift Name (T2)" to clarify which tier is affected.
 *
 * @see docs/006-setup-wizard-bugfixes-plan.md - Issue 5
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiscrepancyAlert } from '@/components/Dashboard/DiscrepancyAlert'
import type { Tier } from '@/types/state'

// Extended DiscrepancyInfo with tier field
interface DiscrepancyInfoWithTier {
  exerciseId: string
  exerciseName: string
  tier: Tier
  storedWeight: number
  actualWeight: number
  workoutId: string
  workoutDate: string
}

describe('DiscrepancyAlert - Tier Display Bug Fix', () => {
  const createDiscrepancy = (
    name: string,
    tier: Tier,
    stored: number,
    actual: number
  ): DiscrepancyInfoWithTier => ({
    exerciseId: `ex-${name.toLowerCase().replace(' ', '-')}-${tier.toLowerCase()}`,
    exerciseName: name,
    tier,
    storedWeight: stored,
    actualWeight: actual,
    workoutId: 'workout-1',
    workoutDate: '2024-01-15',
  })

  const defaultProps = {
    discrepancies: [] as DiscrepancyInfoWithTier[],
    unit: 'kg' as const,
    onUseActualWeight: vi.fn(),
    onKeepStoredWeight: vi.fn(),
    onDismiss: vi.fn(),
  }

  it('displays tier in format "Lift Name (T1)"', () => {
    const discrepancies = [
      createDiscrepancy('Squat', 'T1', 100, 105),
    ]

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    // Should show "Squat (T1)" not just "Squat"
    expect(screen.getByText(/Squat \(T1\)/)).toBeInTheDocument()
  })

  it('displays tier in format "Lift Name (T2)"', () => {
    const discrepancies = [
      createDiscrepancy('Bench Press', 'T2', 60, 65),
    ]

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    // Should show "Bench Press (T2)" not just "Bench Press"
    expect(screen.getByText(/Bench Press \(T2\)/)).toBeInTheDocument()
  })

  it('distinguishes between T1 and T2 discrepancies for same exercise', () => {
    const discrepancies = [
      createDiscrepancy('Squat', 'T1', 100, 105),
      createDiscrepancy('Squat', 'T2', 70, 75),
    ]

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    // Should show both clearly distinguished
    expect(screen.getByText(/Squat \(T1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Squat \(T2\)/)).toBeInTheDocument()

    // Should show different expected weights for each (in new format)
    expect(screen.getAllByText(/we expected/).length).toBe(2)
  })

  it('shows tier for T3 exercises as "Exercise Name (T3)"', () => {
    const discrepancies = [
      createDiscrepancy('Lat Pulldown', 'T3', 40, 45),
    ]

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    expect(screen.getByText(/Lat Pulldown \(T3\)/)).toBeInTheDocument()
  })

  it('tier display is visible in the exercise name section', () => {
    const discrepancies = [
      createDiscrepancy('Overhead Press', 'T1', 40, 42.5),
    ]

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    // The tier should be part of the exercise name display, styled appropriately
    const exerciseNameElement = screen.getByText(/Overhead Press \(T1\)/)
    expect(exerciseNameElement).toHaveClass('font-medium')
  })

  it('handles multiple different exercises with different tiers', () => {
    const discrepancies = [
      createDiscrepancy('Squat', 'T1', 100, 105),
      createDiscrepancy('Bench Press', 'T2', 60, 62.5),
      createDiscrepancy('Deadlift', 'T1', 120, 125),
      createDiscrepancy('Overhead Press', 'T2', 40, 42.5),
    ]

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    expect(screen.getByText(/Squat \(T1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Bench Press \(T2\)/)).toBeInTheDocument()
    expect(screen.getByText(/Deadlift \(T1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Overhead Press \(T2\)/)).toBeInTheDocument()
  })
})

describe('useProgression - DiscrepancyInfo with Tier', () => {
  // These tests document the expected type changes

  it.skip('DiscrepancyInfo type includes tier field', () => {
    // After the fix, DiscrepancyInfo should include:
    // tier: Tier
    // This is a type-level test documented in the interface
  })

  it.skip('analyzeWorkout populates tier in discrepancy', () => {
    // When generating discrepancies, the tier should be determined
    // from the progression key (e.g., "squat-T1" -> tier: "T1")
  })
})

describe('DiscrepancyAlert - Enhanced UI', () => {
  const createDiscrepancy = (
    name: string,
    tier: Tier,
    stored: number,
    actual: number,
    workoutDate = '2024-01-15T10:00:00Z'
  ) => ({
    exerciseId: `ex-${name.toLowerCase().replace(' ', '-')}`,
    exerciseName: name,
    tier,
    storedWeight: stored,
    actualWeight: actual,
    workoutId: 'workout-1',
    workoutDate,
  })

  const defaultProps = {
    discrepancies: [] as ReturnType<typeof createDiscrepancy>[],
    unit: 'kg' as const,
    onUseActualWeight: vi.fn(),
    onKeepStoredWeight: vi.fn(),
    onDismiss: vi.fn(),
  }

  it('displays workout date in format "from Jan 15"', () => {
    const discrepancies = [createDiscrepancy('Squat', 'T1', 100, 105, '2024-01-15T10:00:00Z')]

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    expect(screen.getByText(/from Jan 15/)).toBeInTheDocument()
  })

  it('shows up arrow when actual weight is higher than stored', () => {
    const discrepancies = [createDiscrepancy('Squat', 'T1', 100, 105)] // actual > stored

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    // Should contain up arrow unicode character
    expect(screen.getByText(/\u2191/)).toBeInTheDocument()
  })

  it('shows down arrow when actual weight is lower than stored', () => {
    const discrepancies = [createDiscrepancy('Squat', 'T1', 100, 95)] // actual < stored

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    // Should contain down arrow unicode character
    expect(screen.getByText(/\u2193/)).toBeInTheDocument()
  })

  it('applies green color class when actual weight is higher', () => {
    const discrepancies = [createDiscrepancy('Squat', 'T1', 100, 105)]

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    // The actual weight span contains the arrow and weight
    const actualSpan = screen.getByText(/\u2191 105/)
    expect(actualSpan).toHaveClass('text-green-600')
  })

  it('applies amber color class when actual weight is lower', () => {
    const discrepancies = [createDiscrepancy('Squat', 'T1', 100, 95)]

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    // The actual weight span contains the arrow and weight
    const actualSpan = screen.getByText(/\u2193 95/)
    expect(actualSpan).toHaveClass('text-amber-600')
  })

  it('shows impact text "Update progression" under Use button', () => {
    const discrepancies = [createDiscrepancy('Squat', 'T1', 100, 105)]

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    expect(screen.getByText(/Update progression/)).toBeInTheDocument()
  })

  it('shows impact text "Keep current value" under Keep button', () => {
    const discrepancies = [createDiscrepancy('Squat', 'T1', 100, 105)]

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    expect(screen.getByText(/Keep current value/)).toBeInTheDocument()
  })

  it('shows "Hevy shows" in the message', () => {
    const discrepancies = [createDiscrepancy('Squat', 'T1', 100, 105)]

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    expect(screen.getByText(/Hevy shows/)).toBeInTheDocument()
  })

  it('shows "but we expected" in the message', () => {
    const discrepancies = [createDiscrepancy('Squat', 'T1', 100, 105)]

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    expect(screen.getByText(/but we expected/)).toBeInTheDocument()
  })

  it('shows "based on saved progression" in the message', () => {
    const discrepancies = [createDiscrepancy('Squat', 'T1', 100, 105)]

    render(<DiscrepancyAlert {...defaultProps} discrepancies={discrepancies} />)

    expect(screen.getByText(/based on saved progression/)).toBeInTheDocument()
  })
})
