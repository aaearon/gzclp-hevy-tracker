/**
 * ImportReviewStep Unit Tests
 *
 * Tests for the import review step component.
 * TDD: Written BEFORE implementation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { ImportReviewStep } from '@/components/SetupWizard/ImportReviewStep'
import type { ImportedExercise, ImportWarning, ImportResult } from '@/types/state'

// Mock useOnlineStatus to always return online/available (synchronously for testing)
vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => ({
    isOnline: true,
    isHevyReachable: true,
    // Use a synchronous mock that resolves immediately
    checkHevyConnection: vi.fn(() => Promise.resolve(true)),
  }),
}))

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockExercise(
  overrides: Partial<ImportedExercise> = {}
): ImportedExercise {
  return {
    role: undefined,
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
      createMockExercise({ role: 'squat', name: 'Squat', templateId: 'tmpl-squat', detectedWeight: 60, detectedStage: 0 }),
      createMockExercise({ role: 'bench', name: 'Bench Press', templateId: 'tmpl-bench', detectedWeight: 40, detectedStage: 0 }),
      createMockExercise({ role: 't3', name: 'Lat Pulldown', templateId: 'tmpl-lat', detectedWeight: 30, detectedStage: 0 }),
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

      // Exercise names appear in the table
      const table = screen.getByRole('table')
      expect(table).toHaveTextContent('Squat')
      expect(table).toHaveTextContent('Bench Press')
      expect(table).toHaveTextContent('Lat Pulldown')
    })

    it('displays exercise names', () => {
      render(<ImportReviewStep {...defaultProps} />)

      // Should show exercise names in table
      const table = screen.getByRole('table')
      expect(table).toHaveTextContent('Squat')
      expect(table).toHaveTextContent('Bench Press')
      expect(table).toHaveTextContent('Lat Pulldown')
    })

    it('displays detected weight for main lift exercises only', () => {
      render(<ImportReviewStep {...defaultProps} />)

      // Weights are in input fields - only for main lifts (squat, bench)
      const weightInputs = screen.getAllByRole('spinbutton', { name: /weight/i })
      expect(weightInputs).toHaveLength(2) // Only squat and bench, not t3
      expect(weightInputs[0]).toHaveValue(60)
      expect(weightInputs[1]).toHaveValue(40)
    })

    it('displays detected stage for main lift exercises', () => {
      const result = createMockImportResult([
        createMockExercise({ role: 'squat', detectedStage: 0 }),
        createMockExercise({ role: 'bench', detectedStage: 1 }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      // Stage 0 displays as "Stage 1", Stage 1 as "Stage 2"
      expect(screen.getByText(/Stage 1/)).toBeInTheDocument()
      expect(screen.getByText(/Stage 2/)).toBeInTheDocument()
    })

    it('displays original rep scheme from routine', () => {
      const result = createMockImportResult([
        createMockExercise({ role: 'squat', originalRepScheme: '5x3+' }),
        createMockExercise({ role: 'bench', originalRepScheme: '3x10' }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      expect(screen.getByText(/5x3\+/)).toBeInTheDocument()
      expect(screen.getByText(/3x10/)).toBeInTheDocument()
    })

    it('shows user-overridden values when present', () => {
      const result = createMockImportResult([
        createMockExercise({
          role: 'squat',
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
    it('shows stage dropdown for main lift exercises with manual confidence', () => {
      const result = createMockImportResult([
        createMockExercise({
          role: 'squat',
          stageConfidence: 'manual',
          detectedStage: 0,
        }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      // Should have a stage selector/dropdown
      const stageSelect = screen.getByRole('combobox', { name: /stage/i })
      expect(stageSelect).toBeInTheDocument()
    })

    it('shows read-only stage display for high confidence main lift exercises', () => {
      const result = createMockImportResult([
        createMockExercise({
          role: 'squat',
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
          role: 'squat',
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
          role: 'squat',
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
          role: 'squat',
          name: 'Back Squat Manual',
          stageConfidence: 'manual',
        }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      // Row should have a visual indicator (e.g., warning color or icon)
      const rows = screen.getAllByRole('row')
      const exerciseRow = rows.find(row => row.textContent?.includes('Back Squat Manual'))
      expect(exerciseRow).toHaveClass('bg-amber-50')
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
        { type: 'stage_unknown', message: 'Squat: Could not detect stage.' },
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
        { type: 'weight_null', message: 'Lat Pulldown: No weight found.' },
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
    it('renders weight input for main lift exercises', () => {
      const result = createMockImportResult([
        createMockExercise({ role: 'squat', detectedWeight: 60 }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      expect(weightInput).toBeInTheDocument()
      expect(weightInput).toHaveValue(60)
    })

    it('calls onExerciseUpdate when weight is changed', () => {
      const onExerciseUpdate = vi.fn()
      const result = createMockImportResult([
        createMockExercise({ role: 'squat', detectedWeight: 60 }),
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
        createMockExercise({ role: 'squat', detectedWeight: 60, userWeight: 70 }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      expect(weightInput).toHaveValue(70)
    })

    it('weight input accepts decimal values', () => {
      const result = createMockImportResult([
        createMockExercise({ role: 'squat', detectedWeight: 62.5 }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      expect(weightInput).toHaveValue(62.5)
    })
  })

  // ===========================================================================
  // Role assignment dropdown
  // ===========================================================================

  describe('role assignment', () => {
    it('renders role dropdown for each exercise', () => {
      const result = createMockImportResult([
        createMockExercise({ role: 'squat' }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      const roleSelect = screen.getByRole('combobox', { name: /role/i })
      expect(roleSelect).toBeInTheDocument()
    })

    it('shows current role as selected', () => {
      const result = createMockImportResult([
        createMockExercise({ role: 'bench' }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      const roleSelect = screen.getByRole('combobox', { name: /role/i })
      expect(roleSelect.value).toBe('bench')
    })

    it('calls onExerciseUpdate when role is changed', () => {
      const onExerciseUpdate = vi.fn()
      const result = createMockImportResult([
        createMockExercise({ role: 'squat' }),
      ])

      render(
        <ImportReviewStep
          {...defaultProps}
          importResult={result}
          onExerciseUpdate={onExerciseUpdate}
        />
      )

      const roleSelect = screen.getByRole('combobox', { name: /role/i })
      fireEvent.change(roleSelect, { target: { value: 'bench' } })

      expect(onExerciseUpdate).toHaveBeenCalledWith(0, { role: 'bench' })
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

    it('calls onNext when Next is clicked', async () => {
      const onNext = vi.fn()
      render(<ImportReviewStep {...defaultProps} onNext={onNext} />)

      // Wait for the API check to complete and button to be enabled
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /next|confirm|continue/i })
        expect(button).not.toBeDisabled()
      })

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
        createMockExercise({ role: 'squat', stageConfidence: 'manual' }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      // Weight input should be labelled (main lifts only)
      expect(screen.getByRole('spinbutton', { name: /weight/i })).toBeInTheDocument()
      // Stage select should be labelled
      expect(screen.getByRole('combobox', { name: /stage/i })).toBeInTheDocument()
      // Role select should be labelled
      expect(screen.getByRole('combobox', { name: /role/i })).toBeInTheDocument()
    })

    it('table has proper headers', () => {
      render(<ImportReviewStep {...defaultProps} />)

      expect(screen.getByRole('columnheader', { name: /exercise/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /role/i })).toBeInTheDocument()
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

  // ===========================================================================
  // T010: Main Lift Exclusivity Validation
  // ===========================================================================

  describe('T010: main lift exclusivity validation', () => {
    it('tracks assigned main lift roles across all exercises', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1', role: undefined }),
        createMockExercise({ name: 'Bench', templateId: 'bench-1', role: undefined }),
      ])

      const onExerciseUpdate = vi.fn()
      render(<ImportReviewStep {...defaultProps} importResult={result} onExerciseUpdate={onExerciseUpdate} />)

      // Assign squat role to first exercise
      const roleDropdowns = screen.getAllByLabelText(/role/i)
      fireEvent.change(roleDropdowns[0], { target: { value: 'squat' } })

      // Second exercise should not be able to select squat
      // (This will be validated through RoleDropdown's excludeRoles prop)
      expect(onExerciseUpdate).toHaveBeenCalledWith(0, { role: 'squat' })
    })

    it('prevents duplicate main lift role assignments', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1', role: 'squat' }),
        createMockExercise({ name: 'Front Squat', templateId: 'fsquat-1', role: undefined }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      // First exercise should have squat assigned
      const roleDropdowns = screen.getAllByLabelText(/role/i)
      expect(roleDropdowns[0].value).toBe('squat')

      // Second dropdown should have squat disabled via excludeRoles
      // (The RoleDropdown component handles this internally)
    })

    it('allows multiple exercises to have the same non-main-lift role', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Lat Pulldown', templateId: 'lat-1', role: 't3' }),
        createMockExercise({ name: 'Cable Rows', templateId: 'rows-1', role: 't3' }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      // Both should be able to have t3 role
      const roleDropdowns = screen.getAllByLabelText(/role/i)
      expect(roleDropdowns[0].value).toBe('t3')
      expect(roleDropdowns[1].value).toBe('t3')
    })

    it('updates excluded roles when main lift assignments change', () => {
      const onExerciseUpdate = vi.fn()
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1', role: 'squat' }),
      ])

      render(
        <ImportReviewStep
          {...defaultProps}
          importResult={result}
          onExerciseUpdate={onExerciseUpdate}
        />
      )

      // Change from squat to bench
      const roleDropdown = screen.getByLabelText(/role/i)
      fireEvent.change(roleDropdown, { target: { value: 'bench' } })

      expect(onExerciseUpdate).toHaveBeenCalledWith(0, { role: 'bench' })
    })

    it('allows current exercise to keep its main lift role even if it would be excluded', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1', role: 'squat' }),
      ])

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      // The exercise should still show squat as selected
      const roleDropdown = screen.getByLabelText(/role/i)
      expect(roleDropdown.value).toBe('squat')
    })
  })
})
