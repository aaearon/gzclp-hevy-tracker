/**
 * ImportReviewStep Unit Tests
 *
 * Tests for the import review step component.
 * TDD: Written BEFORE implementation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ImportReviewStep } from '@/components/SetupWizard/ImportReviewStep'
import type { ImportedExercise, ImportWarning, ImportResult, GZCLPSlot } from '@/types/state'

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockExercise(
  overrides: Partial<ImportedExercise> = {}
): ImportedExercise {
  return {
    slot: 't1_squat',
    templateId: 'template-squat',
    name: 'Squat',
    detectedWeight: 60,
    detectedStage: 0,
    stageConfidence: 'high',
    originalSetCount: 5,
    originalRepScheme: '5x3+',
    ...overrides,
  }
}

function createMockImportResult(
  exercises: ImportedExercise[] = [],
  warnings: ImportWarning[] = []
): ImportResult {
  return {
    exercises,
    warnings,
    routineIds: { A1: 'r1', B1: null, A2: null, B2: null },
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('ImportReviewStep', () => {
  const defaultProps = {
    importResult: createMockImportResult([
      createMockExercise({ slot: 't1_squat', name: 'Squat', detectedWeight: 60, detectedStage: 0 }),
      createMockExercise({ slot: 't2_bench', name: 'Bench Press', detectedWeight: 40, detectedStage: 0 }),
      createMockExercise({ slot: 't3_1', name: 'Lat Pulldown', detectedWeight: 30, detectedStage: 0 }),
    ]),
    onExerciseUpdate: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // T027: Display exercises with slot, weight, stage
  // ===========================================================================

  describe('T027: exercise display', () => {
    it('renders a table with exercise data', () => {
      render(<ImportReviewStep {...defaultProps} />)

      // Check for table or list structure
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('displays exercise name for each imported exercise', () => {
      render(<ImportReviewStep {...defaultProps} />)

      expect(screen.getByText('Squat')).toBeInTheDocument()
      expect(screen.getByText('Bench Press')).toBeInTheDocument()
      expect(screen.getByText('Lat Pulldown')).toBeInTheDocument()
    })

    it('displays slot/tier for each exercise', () => {
      render(<ImportReviewStep {...defaultProps} />)

      // Should show tier badges (using getAllByText since multiple elements match)
      const t1Badges = screen.getAllByText(/^T1$/)
      const t2Badges = screen.getAllByText(/^T2$/)
      const t3Badges = screen.getAllByText(/^T3$/)

      expect(t1Badges.length).toBeGreaterThan(0)
      expect(t2Badges.length).toBeGreaterThan(0)
      expect(t3Badges.length).toBeGreaterThan(0)
    })

    it('displays detected weight for each exercise', () => {
      render(<ImportReviewStep {...defaultProps} />)

      // Weights are in input fields
      const weightInputs = screen.getAllByRole('spinbutton', { name: /weight/i })
      expect(weightInputs).toHaveLength(3)
      expect(weightInputs[0]).toHaveValue(60)
      expect(weightInputs[1]).toHaveValue(40)
      expect(weightInputs[2]).toHaveValue(30)
    })

    it('displays detected stage for T1/T2 exercises', () => {
      const result = createMockImportResult([
        createMockExercise({ slot: 't1_squat', detectedStage: 0 }),
        createMockExercise({ slot: 't2_bench', detectedStage: 1 }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      // Stage 0 displays as "Stage 1", Stage 1 as "Stage 2"
      expect(screen.getByText(/Stage 1/)).toBeInTheDocument()
      expect(screen.getByText(/Stage 2/)).toBeInTheDocument()
    })

    it('displays original rep scheme from routine', () => {
      const result = createMockImportResult([
        createMockExercise({ originalRepScheme: '5x3+' }),
        createMockExercise({ slot: 't2_bench', originalRepScheme: '3x10' }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      expect(screen.getByText(/5x3\+/)).toBeInTheDocument()
      expect(screen.getByText(/3x10/)).toBeInTheDocument()
    })

    it('shows user-overridden values when present', () => {
      const result = createMockImportResult([
        createMockExercise({
          detectedWeight: 60,
          userWeight: 70,
          detectedStage: 0,
          userStage: 1,
        }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      // Should show user values, not detected
      expect(screen.getByDisplayValue('70')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // T028: Stage override for 'manual' confidence items
  // ===========================================================================

  describe('T028: stage override for manual confidence', () => {
    it('shows stage dropdown for exercises with manual confidence', () => {
      const result = createMockImportResult([
        createMockExercise({
          slot: 't1_squat',
          stageConfidence: 'manual',
          detectedStage: 0,
        }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      // Should have a stage selector/dropdown
      const stageSelect = screen.getByRole('combobox', { name: /stage/i })
      expect(stageSelect).toBeInTheDocument()
    })

    it('shows read-only stage display for high confidence exercises', () => {
      const result = createMockImportResult([
        createMockExercise({
          slot: 't1_squat',
          stageConfidence: 'high',
          detectedStage: 0,
        }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      // Should show stage but as text, not editable dropdown
      expect(screen.getByText(/Stage 1/)).toBeInTheDocument()
      // Should NOT have a dropdown for this exercise
      expect(screen.queryByRole('combobox', { name: /stage/i })).not.toBeInTheDocument()
    })

    it('calls onExerciseUpdate when stage is changed', () => {
      const onExerciseUpdate = vi.fn()
      const result = createMockImportResult([
        createMockExercise({
          slot: 't1_squat',
          stageConfidence: 'manual',
          detectedStage: 0,
        }),
      ])

      render(
        <ImportReviewStep
          {...defaultProps}
          importResult={result}
          onExerciseUpdate={onExerciseUpdate}
        />
      )

      const stageSelect = screen.getByRole('combobox', { name: /stage/i })
      fireEvent.change(stageSelect, { target: { value: '2' } })

      expect(onExerciseUpdate).toHaveBeenCalledWith(0, { userStage: 2 })
    })

    it('stage dropdown shows all three stage options', () => {
      const result = createMockImportResult([
        createMockExercise({
          slot: 't1_squat',
          stageConfidence: 'manual',
        }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      const stageSelect = screen.getByRole('combobox', { name: /stage/i })
      const options = within(stageSelect).getAllByRole('option')

      expect(options).toHaveLength(3)
      expect(options[0]).toHaveTextContent('Stage 1')
      expect(options[1]).toHaveTextContent('Stage 2')
      expect(options[2]).toHaveTextContent('Stage 3')
    })

    it('highlights manual confidence exercises visually', () => {
      const result = createMockImportResult([
        createMockExercise({
          slot: 't1_squat',
          name: 'Squat',
          stageConfidence: 'manual',
        }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      // Row should have a visual indicator (e.g., warning color or icon)
      const row = screen.getByText('Squat').closest('tr')
      expect(row).toHaveClass('bg-amber-50')
    })
  })

  // ===========================================================================
  // T029: Warnings displayed prominently at top
  // ===========================================================================

  describe('T029: warnings display', () => {
    it('displays warnings section at the top when warnings exist', () => {
      const warnings: ImportWarning[] = [
        { type: 'no_t2', day: 'A1', message: 'A1: No T2 exercise found.' },
      ]
      const result = createMockImportResult([], warnings)

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      const warningsSection = screen.getByRole('alert')
      expect(warningsSection).toBeInTheDocument()
    })

    it('displays warning message text', () => {
      const warnings: ImportWarning[] = [
        { type: 'no_t2', day: 'A1', message: 'A1: No T2 exercise found.' },
      ]
      const result = createMockImportResult([], warnings)

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      expect(screen.getByText('A1: No T2 exercise found.')).toBeInTheDocument()
    })

    it('displays multiple warnings', () => {
      const warnings: ImportWarning[] = [
        { type: 'no_t2', day: 'A1', message: 'A1: No T2 exercise found.' },
        { type: 'stage_unknown', slot: 't1_squat', message: 'Squat: Could not detect stage.' },
        { type: 'duplicate_routine', message: 'Same routine selected for A1 and A2.' },
      ]
      const result = createMockImportResult([], warnings)

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      expect(screen.getByText('A1: No T2 exercise found.')).toBeInTheDocument()
      expect(screen.getByText('Squat: Could not detect stage.')).toBeInTheDocument()
      expect(screen.getByText('Same routine selected for A1 and A2.')).toBeInTheDocument()
    })

    it('does not show warnings section when no warnings', () => {
      const result = createMockImportResult([createMockExercise()], [])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('shows warning icon for each warning', () => {
      const warnings: ImportWarning[] = [
        { type: 'weight_null', slot: 't3_1', message: 'Lat Pulldown: No weight found.' },
      ]
      const result = createMockImportResult([], warnings)

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      // Should have a warning icon (could be SVG, emoji, or text indicator)
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // T032: Weight editing input
  // ===========================================================================

  describe('T032: weight editing', () => {
    it('renders weight input for each exercise', () => {
      const result = createMockImportResult([
        createMockExercise({ slot: 't1_squat', detectedWeight: 60 }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      expect(weightInput).toBeInTheDocument()
      expect(weightInput).toHaveValue(60)
    })

    it('calls onExerciseUpdate when weight is changed', () => {
      const onExerciseUpdate = vi.fn()
      const result = createMockImportResult([
        createMockExercise({ detectedWeight: 60 }),
      ])

      render(
        <ImportReviewStep
          {...defaultProps}
          importResult={result}
          onExerciseUpdate={onExerciseUpdate}
        />
      )

      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      fireEvent.change(weightInput, { target: { value: '65' } })

      expect(onExerciseUpdate).toHaveBeenCalledWith(0, { userWeight: 65 })
    })

    it('shows userWeight when set, otherwise detectedWeight', () => {
      const result = createMockImportResult([
        createMockExercise({ detectedWeight: 60, userWeight: 70 }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      expect(weightInput).toHaveValue(70)
    })

    it('weight input accepts decimal values', () => {
      const result = createMockImportResult([
        createMockExercise({ detectedWeight: 62.5 }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      expect(weightInput).toHaveValue(62.5)
    })
  })

  // ===========================================================================
  // T032b: Slot reassignment dropdown
  // ===========================================================================

  describe('T032b: slot reassignment', () => {
    it('renders slot dropdown for each exercise', () => {
      const result = createMockImportResult([
        createMockExercise({ slot: 't1_squat' }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      const slotSelect = screen.getByRole('combobox', { name: /slot/i })
      expect(slotSelect).toBeInTheDocument()
    })

    it('shows current slot as selected', () => {
      const result = createMockImportResult([
        createMockExercise({ slot: 't2_bench' }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      const slotSelect = screen.getByRole('combobox', { name: /slot/i })
      expect(slotSelect).toHaveValue('t2_bench')
    })

    it('calls onExerciseUpdate when slot is changed', () => {
      const onExerciseUpdate = vi.fn()
      const result = createMockImportResult([
        createMockExercise({ slot: 't1_squat' }),
      ])

      render(
        <ImportReviewStep
          {...defaultProps}
          importResult={result}
          onExerciseUpdate={onExerciseUpdate}
        />
      )

      const slotSelect = screen.getByRole('combobox', { name: /slot/i })
      fireEvent.change(slotSelect, { target: { value: 't1_bench' } })

      expect(onExerciseUpdate).toHaveBeenCalledWith(0, { userSlot: 't1_bench' })
    })

    it('shows userSlot when set, otherwise detected slot', () => {
      const result = createMockImportResult([
        createMockExercise({ slot: 't1_squat', userSlot: 't1_bench' }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      const slotSelect = screen.getByRole('combobox', { name: /slot/i })
      expect(slotSelect).toHaveValue('t1_bench')
    })
  })

  // ===========================================================================
  // Navigation
  // ===========================================================================

  describe('navigation', () => {
    it('renders Next button', () => {
      render(<ImportReviewStep {...defaultProps} />)

      expect(screen.getByRole('button', { name: /next|confirm|continue/i })).toBeInTheDocument()
    })

    it('renders Back button', () => {
      render(<ImportReviewStep {...defaultProps} />)

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })

    it('calls onNext when Next is clicked', () => {
      const onNext = vi.fn()
      render(<ImportReviewStep {...defaultProps} onNext={onNext} />)

      fireEvent.click(screen.getByRole('button', { name: /next|confirm|continue/i }))

      expect(onNext).toHaveBeenCalled()
    })

    it('calls onBack when Back is clicked', () => {
      const onBack = vi.fn()
      render(<ImportReviewStep {...defaultProps} onBack={onBack} />)

      fireEvent.click(screen.getByRole('button', { name: /back/i }))

      expect(onBack).toHaveBeenCalled()
    })

    it('disables Next when there are no exercises', () => {
      const result = createMockImportResult([], [])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      const nextButton = screen.getByRole('button', { name: /next|confirm|continue/i })
      expect(nextButton).toBeDisabled()
    })
  })

  // ===========================================================================
  // Accessibility
  // ===========================================================================

  describe('accessibility', () => {
    it('has minimum 44x44px touch targets for buttons', () => {
      render(<ImportReviewStep {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toHaveClass('min-h-[44px]')
      })
    })

    it('inputs have associated labels', () => {
      const result = createMockImportResult([
        createMockExercise({ stageConfidence: 'manual' }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      // Weight input should be labelled
      expect(screen.getByRole('spinbutton', { name: /weight/i })).toBeInTheDocument()
      // Stage select should be labelled
      expect(screen.getByRole('combobox', { name: /stage/i })).toBeInTheDocument()
      // Slot select should be labelled
      expect(screen.getByRole('combobox', { name: /slot/i })).toBeInTheDocument()
    })

    it('table has proper headers', () => {
      render(<ImportReviewStep {...defaultProps} />)

      expect(screen.getByRole('columnheader', { name: /exercise/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /slot/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /weight/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /stage/i })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Empty State
  // ===========================================================================

  describe('empty state', () => {
    it('shows message when no exercises to review', () => {
      const result = createMockImportResult([], [])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      expect(screen.getByText(/no exercises/i)).toBeInTheDocument()
    })
  })
})
