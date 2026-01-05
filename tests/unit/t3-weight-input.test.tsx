/**
 * Unit Tests: T3 Weight Input in Import Flow
 *
 * Bug fix: T3 starting weights should be editable in the import flow.
 * Currently T3s are read-only in DayReviewPanel.
 *
 * @see docs/006-setup-wizard-bugfixes-plan.md - Issue 4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DayReviewPanel } from '@/components/SetupWizard/DayReviewPanel'
import type { DayImportData, ImportedExercise } from '@/types/state'

// Helper to create a mock imported exercise
function createMockExercise(overrides: Partial<ImportedExercise> = {}): ImportedExercise {
  return {
    templateId: 'template-123',
    name: 'Test Exercise',
    detectedWeight: 60,
    detectedStage: 0,
    stageConfidence: 'high',
    originalSetCount: 5,
    originalRepScheme: '5x3+',
    ...overrides,
  }
}

// Helper to create mock day data with T3s
function createMockDayDataWithT3s(): DayImportData {
  return {
    day: 'A1',
    t1: createMockExercise({ name: 'Squat', role: 'squat', detectedWeight: 100 }),
    t2: createMockExercise({ name: 'Bench Press', role: 'bench', detectedWeight: 60 }),
    t3s: [
      createMockExercise({
        templateId: 'template-lat',
        name: 'Lat Pulldown',
        role: 't3',
        detectedWeight: 40,
        originalRepScheme: '3x15+',
      }),
      createMockExercise({
        templateId: 'template-row',
        name: 'Cable Row',
        role: 't3',
        detectedWeight: 35,
        originalRepScheme: '3x15+',
      }),
    ],
  }
}

describe('DayReviewPanel - T3 Weight Input Bug Fix', () => {
  const defaultProps = {
    dayData: createMockDayDataWithT3s(),
    onT1Update: vi.fn(),
    onT2Update: vi.fn(),
    onT3Remove: vi.fn(),
    onT3WeightUpdate: vi.fn(),
    unit: 'kg' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('T3 weight inputs', () => {
    it('renders weight input field for each T3 exercise', () => {
      render(<DayReviewPanel {...defaultProps} />)

      // Each T3 should have a weight input
      const t3WeightInputs = screen.getAllByRole('spinbutton', { name: /lat pulldown.*weight|cable row.*weight/i })
      expect(t3WeightInputs.length).toBeGreaterThanOrEqual(2)
    })

    it('T3 weight input displays detected weight', () => {
      render(<DayReviewPanel {...defaultProps} />)

      // Find the Lat Pulldown weight input and check its value
      const latPulldownInput = screen.getByLabelText(/lat pulldown.*weight/i)
      expect(latPulldownInput).toHaveValue(40)
    })

    it('calls onT3WeightUpdate when T3 weight changes', () => {
      const onT3WeightUpdate = vi.fn()
      render(<DayReviewPanel {...defaultProps} onT3WeightUpdate={onT3WeightUpdate} />)

      const latPulldownInput = screen.getByLabelText(/lat pulldown.*weight/i)

      // Use fireEvent to set a new value directly
      fireEvent.change(latPulldownInput, { target: { value: '45' } })

      expect(onT3WeightUpdate).toHaveBeenCalledWith('template-lat', 45)
    })

    it('T3 weight input has accessible label', () => {
      render(<DayReviewPanel {...defaultProps} />)

      // Should be able to find inputs by accessible label
      expect(screen.getByLabelText(/lat pulldown.*weight/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/cable row.*weight/i)).toBeInTheDocument()
    })

    it('T3 weight input shows unit suffix', () => {
      render(<DayReviewPanel {...defaultProps} unit="kg" />)

      // The unit should be displayed next to T3 weight inputs
      const unitLabels = screen.getAllByText('kg')
      // Should have at least 2 for T3s (plus T1/T2 units)
      expect(unitLabels.length).toBeGreaterThanOrEqual(4) // 2 T3s + T1 + T2
    })
  })

  describe('T3ListItem with weight input', () => {
    it('T3ListItem shows both name and weight input', () => {
      render(<DayReviewPanel {...defaultProps} />)

      // T3 name should be visible
      expect(screen.getByText('Lat Pulldown')).toBeInTheDocument()

      // Weight input should be next to it
      const weightInput = screen.getByLabelText(/lat pulldown.*weight/i)
      expect(weightInput).toBeInTheDocument()
    })

    it('T3 weight input works alongside remove button', async () => {
      const onT3Remove = vi.fn()
      const onT3WeightUpdate = vi.fn()

      render(
        <DayReviewPanel
          {...defaultProps}
          onT3Remove={onT3Remove}
          onT3WeightUpdate={onT3WeightUpdate}
        />
      )

      // Both remove button and weight input should be functional
      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      await userEvent.click(removeButtons[0])
      expect(onT3Remove).toHaveBeenCalledWith(0)

      // Weight update should still work (use fireEvent for reliable testing)
      const cableRowInput = screen.getByLabelText(/cable row.*weight/i)
      fireEvent.change(cableRowInput, { target: { value: '50' } })
      expect(onT3WeightUpdate).toHaveBeenCalledWith('template-row', 50)
    })
  })
})

describe('ImportReviewStep - T3 Weight Deduplication', () => {
  // These tests are for the ImportReviewStep which should show deduplicated T3 weights
  // Same T3 across multiple days should only show one weight input

  it.skip('shows deduplicated T3 weight section below day tabs', () => {
    // This test will be implemented when we add the T3 weight section
    // to ImportReviewStep
  })

  it.skip('shows days indicator for T3s appearing on multiple days', () => {
    // Example: "Lat Pulldown (A1, B1)" if it appears on both days
  })

  it.skip('updating T3 weight applies to all days where that T3 appears', () => {
    // Weight change should propagate to all occurrences
  })
})
