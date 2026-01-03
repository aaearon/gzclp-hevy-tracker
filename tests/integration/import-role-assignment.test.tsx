/**
 * Integration Test: Import Role Assignment Flow
 *
 * Tests the complete flow of assigning roles to imported exercises.
 * TDD: Written BEFORE implementation.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImportReviewStep } from '@/components/SetupWizard/ImportReviewStep'
import type { ImportedExercise, ImportResult, ExerciseRole } from '@/types/state'

// Mock useOnlineStatus to always return online/available (synchronously for testing)
vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => ({
    isOnline: true,
    isHevyReachable: true,
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
  exercises: ImportedExercise[] = []
): ImportResult {
  return {
    exercises,
    warnings: [],
    routineIds: { A1: 'r1', B1: null, A2: null, B2: null },
  }
}

// =============================================================================
// Integration Tests
// =============================================================================

describe('Import Role Assignment Flow', () => {
  describe('role assignment', () => {
    it('renders role dropdown for each exercise', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1' }),
        createMockExercise({ name: 'Bench Press', templateId: 'bench-1' }),
      ])

      render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      // Should have 2 role dropdowns
      const roleDropdowns = screen.getAllByLabelText(/role/i)
      expect(roleDropdowns).toHaveLength(2)
    })

    it('calls onExerciseUpdate with role when role is selected', () => {
      const onExerciseUpdate = vi.fn()
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1' }),
      ])

      render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={onExerciseUpdate}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      const roleDropdown = screen.getByLabelText(/role/i)
      fireEvent.change(roleDropdown, { target: { value: 'squat' } })

      expect(onExerciseUpdate).toHaveBeenCalledWith(0, { role: 'squat' })
    })

    it('displays selected role in dropdown', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1', role: 'squat' }),
      ])

      render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      const roleDropdown = screen.getByLabelText(/role/i)
      expect(roleDropdown.value).toBe('squat')
    })
  })

  describe('main lift exclusivity', () => {
    it('disables main lift role in dropdown when already assigned to another exercise', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1', role: 'squat' }),
        createMockExercise({ name: 'Front Squat', templateId: 'fsquat-1', role: undefined }),
      ])

      render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      const roleDropdowns = screen.getAllByLabelText(/role/i)
      const secondDropdown = roleDropdowns[1] as HTMLSelectElement

      // Find the squat option in the second dropdown
      const squatOption = Array.from(secondDropdown.options).find(
        opt => opt.value === 'squat'
      )

      expect(squatOption?.disabled).toBe(true)
    })

    it('allows same main lift role to be reassigned when unassigning from first exercise', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1', role: 'squat' }),
        createMockExercise({ name: 'Front Squat', templateId: 'fsquat-1', role: undefined }),
      ])

      const onExerciseUpdate = vi.fn((index, updates) => {
        // Simulate state update
        if (index === 0 && updates.role !== 'squat') {
          result.exercises[0].role = updates.role as ExerciseRole
        }
      })

      const { rerender } = render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={onExerciseUpdate}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      // Change first exercise to t3
      const firstDropdown = screen.getAllByLabelText(/role/i)[0]
      fireEvent.change(firstDropdown, { target: { value: 't3' } })

      // Rerender with updated state
      const updatedResult = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1', role: 't3' }),
        createMockExercise({ name: 'Front Squat', templateId: 'fsquat-1', role: undefined }),
      ])

      rerender(
        <ImportReviewStep
          importResult={updatedResult}
          onExerciseUpdate={onExerciseUpdate}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      // Now squat should be available for second exercise
      const secondDropdown = screen.getAllByLabelText(/role/i)[1] as HTMLSelectElement
      const squatOption = Array.from(secondDropdown.options).find(
        opt => opt.value === 'squat'
      )

      expect(squatOption?.disabled).toBe(false)
    })

    it('allows multiple exercises to have t3, warmup, or cooldown roles', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Lat Pulldown', templateId: 'lat-1', role: 't3' }),
        createMockExercise({ name: 'Cable Rows', templateId: 'rows-1', role: 't3' }),
      ])

      render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      // Both should have t3 selected and enabled
      const roleDropdowns = screen.getAllByLabelText(/role/i)

      expect(roleDropdowns[0].value).toBe('t3')
      expect(roleDropdowns[1].value).toBe('t3')

      // t3 should be enabled in both dropdowns
      const t3Options = roleDropdowns.map(dropdown =>
        Array.from(dropdown.options).find(opt => opt.value === 't3')
      )

      t3Options.forEach(option => {
        expect(option?.disabled).toBe(false)
      })
    })

    it('disables all four main lift roles when each is assigned', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1', role: 'squat' }),
        createMockExercise({ name: 'Bench', templateId: 'bench-1', role: 'bench' }),
        createMockExercise({ name: 'OHP', templateId: 'ohp-1', role: 'ohp' }),
        createMockExercise({ name: 'Deadlift', templateId: 'dead-1', role: 'deadlift' }),
        createMockExercise({ name: 'Lat Pulldown', templateId: 'lat-1', role: undefined }),
      ])

      render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      // Last dropdown should have all main lifts disabled
      const lastDropdown = screen.getAllByLabelText(/role/i)[4] as HTMLSelectElement
      const mainLiftOptions = ['squat', 'bench', 'ohp', 'deadlift'].map(role =>
        Array.from(lastDropdown.options).find(opt => opt.value === role)
      )

      mainLiftOptions.forEach(option => {
        expect(option?.disabled).toBe(true)
      })
    })
  })

  describe('validation', () => {
    it('disables Continue button when not all exercises have roles', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1', role: 'squat' }),
        createMockExercise({ name: 'Bench', templateId: 'bench-1', role: undefined }),
      ])

      render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).toBeDisabled()
    })

    it('enables Continue button when all exercises have roles', async () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1', role: 'squat' }),
        createMockExercise({ name: 'Bench', templateId: 'bench-1', role: 'bench' }),
      ])

      render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      // Wait for the API check to complete
      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue/i })
        expect(continueButton).not.toBeDisabled()
      })
    })

    it('shows validation message when not all roles assigned', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1', role: undefined }),
      ])

      render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      expect(screen.getByText(/all exercises must have a role/i)).toBeInTheDocument()
    })

    it('hides validation message when all roles assigned', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1', role: 'squat' }),
      ])

      render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      expect(screen.queryByText(/all exercises must have a role/i)).not.toBeInTheDocument()
    })
  })

  describe('weight input visibility', () => {
    it('shows weight input for main lift roles (squat, bench, ohp, deadlift)', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Squat', templateId: 'squat-1', role: 'squat' }),
        createMockExercise({ name: 'Bench', templateId: 'bench-1', role: 'bench' }),
        createMockExercise({ name: 'OHP', templateId: 'ohp-1', role: 'ohp' }),
        createMockExercise({ name: 'Deadlift', templateId: 'dead-1', role: 'deadlift' }),
      ])

      render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      const weightInputs = screen.getAllByLabelText(/weight/i)
      expect(weightInputs).toHaveLength(4)
    })

    it('hides weight input for non-main lift roles (t3, warmup, cooldown)', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Lat Pulldown', templateId: 'lat-1', role: 't3' }),
        createMockExercise({ name: 'Stretching', templateId: 'stretch-1', role: 'warmup' }),
        createMockExercise({ name: 'Cool Down', templateId: 'cool-1', role: 'cooldown' }),
      ])

      render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      const weightInputs = screen.queryAllByLabelText(/weight/i)
      expect(weightInputs).toHaveLength(0)
    })

    it('hides weight input when no role is assigned yet', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Unknown', templateId: 'unknown-1', role: undefined }),
      ])

      render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      const weightInputs = screen.queryAllByLabelText(/weight/i)
      expect(weightInputs).toHaveLength(0)
    })

    it('shows weight input when role changes from t3 to main lift', () => {
      const result = createMockImportResult([
        createMockExercise({ name: 'Exercise', templateId: 'ex-1', role: 't3' }),
      ])

      const { rerender } = render(
        <ImportReviewStep
          importResult={result}
          onExerciseUpdate={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      // Initially no weight input (t3 role)
      expect(screen.queryAllByLabelText(/weight/i)).toHaveLength(0)

      // Update to main lift role
      const updatedResult = createMockImportResult([
        createMockExercise({ name: 'Exercise', templateId: 'ex-1', role: 'squat' }),
      ])

      rerender(
        <ImportReviewStep
          importResult={updatedResult}
          onExerciseUpdate={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      )

      // Now should show weight input
      expect(screen.getAllByLabelText(/weight/i)).toHaveLength(1)
    })
  })
})
