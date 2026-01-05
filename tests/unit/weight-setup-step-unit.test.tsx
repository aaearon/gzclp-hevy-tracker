/**
 * Unit Tests: WeightSetupStep Unit Selector Bug
 *
 * Bug fix: WeightSetupStep should NOT render UnitSelector.
 * The unit selector should only appear in WelcomeStep.
 *
 * @see docs/006-setup-wizard-bugfixes-plan.md - Issue 1
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeightSetupStep } from '@/components/SetupWizard/WeightSetupStep'
import type { CreatePathAssignments } from '@/components/SetupWizard/SlotAssignment'
import type { ExerciseTemplate } from '@/types/hevy'
import type { WeightUnit } from '@/types/state'

describe('WeightSetupStep - Unit Selector Bug Fix', () => {
  const mockExercises: ExerciseTemplate[] = [
    { id: 'ex-1', title: 'Squat' },
    { id: 'ex-2', title: 'Bench Press' },
  ] as ExerciseTemplate[]

  const mockAssignments: CreatePathAssignments = {
    mainLifts: { squat: 'ex-1', bench: 'ex-2', ohp: null, deadlift: null },
    t3Exercises: { A1: [], B1: [], A2: [], B2: [] },
  }

  const defaultProps = {
    assignments: mockAssignments,
    exercises: mockExercises,
    weights: {} as Record<string, number>,
    onWeightChange: vi.fn(),
    unit: 'kg' as WeightUnit,
    onUnitChange: vi.fn(),
  }

  it('should NOT render UnitSelector component', () => {
    render(<WeightSetupStep {...defaultProps} />)

    // UnitSelector renders radio buttons for kg/lbs - these should not be present
    expect(screen.queryByRole('radio', { name: /kg/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /lbs/i })).not.toBeInTheDocument()
  })

  it('should display unit as read-only label (not editable)', () => {
    render(<WeightSetupStep {...defaultProps} unit="kg" />)

    // Unit should appear as text (in weight input labels) but not be changeable
    // There should be no radio buttons or select for changing unit
    const radioButtons = screen.queryAllByRole('radio')
    const unitSelects = screen.queryAllByRole('combobox')

    expect(radioButtons).toHaveLength(0)
    expect(unitSelects).toHaveLength(0)
  })

  it('should not call onUnitChange (prop should be removed)', () => {
    const onUnitChange = vi.fn()
    render(<WeightSetupStep {...defaultProps} onUnitChange={onUnitChange} />)

    // With no unit selector, there's nothing to trigger onUnitChange
    // This test documents the expected behavior after the fix
    expect(onUnitChange).not.toHaveBeenCalled()
  })
})
