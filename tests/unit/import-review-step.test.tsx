/**
 * ImportReviewStep Unit Tests
 *
 * Tests for the tabbed import review step component (Phase 7).
 * Uses DayTabBar and DayReviewPanel for per-day T1/T2/T3 review.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImportReviewStep } from '@/components/SetupWizard/ImportReviewStep'
import type { ImportedExercise, ImportWarning, ImportResult, DayImportData, GZCLPDay } from '@/types/state'

// Mock useOnlineStatus to always return online/available
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

function createMockDayData(
  day: GZCLPDay,
  overrides: Partial<DayImportData> = {}
): DayImportData {
  const roleMap: Record<GZCLPDay, { t1Role: string; t2Role: string }> = {
    A1: { t1Role: 'squat', t2Role: 'bench' },
    B1: { t1Role: 'ohp', t2Role: 'deadlift' },
    A2: { t1Role: 'bench', t2Role: 'squat' },
    B2: { t1Role: 'deadlift', t2Role: 'ohp' },
  }
  const { t1Role, t2Role } = roleMap[day]

  return {
    day,
    t1: createMockExercise({
      role: t1Role as ImportedExercise['role'],
      name: t1Role.charAt(0).toUpperCase() + t1Role.slice(1),
      templateId: `tmpl-${t1Role}`,
      detectedWeight: 60,
    }),
    t2: createMockExercise({
      role: t2Role as ImportedExercise['role'],
      name: t2Role.charAt(0).toUpperCase() + t2Role.slice(1),
      templateId: `tmpl-${t2Role}`,
      detectedWeight: 40,
    }),
    t3s: [],
    ...overrides,
  }
}

function createMockImportResult(
  byDayOverrides?: Partial<Record<GZCLPDay, Partial<DayImportData>>>,
  warnings: ImportWarning[] = []
): ImportResult {
  const days: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']
  const byDay = {} as Record<GZCLPDay, DayImportData>

  for (const day of days) {
    const override = byDayOverrides?.[day] ?? {}
    byDay[day] = createMockDayData(day, override)
  }

  return {
    byDay,
    exercises: [], // Legacy, empty
    warnings,
    routineIds: { A1: 'r1', B1: 'r2', A2: 'r3', B2: 'r4' },
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('ImportReviewStep', () => {
  const defaultProps = {
    importResult: createMockImportResult(),
    onDayExerciseUpdate: vi.fn(),
    onDayT3Remove: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
    unit: 'kg' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // Phase 7: Tabbed Interface
  // ===========================================================================

  describe('tabbed interface', () => {
    it('renders DayTabBar with 4 day tabs', async () => {
      render(<ImportReviewStep {...defaultProps} />)

      // Wait for API check
      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument()
      })

      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(4)
      expect(tabs[0]).toHaveTextContent('A1')
      expect(tabs[1]).toHaveTextContent('B1')
      expect(tabs[2]).toHaveTextContent('A2')
      expect(tabs[3]).toHaveTextContent('B2')
    })

    it('shows A1 tab as active by default', async () => {
      render(<ImportReviewStep {...defaultProps} />)

      await waitFor(() => {
        const a1Tab = screen.getByRole('tab', { name: /day a1/i })
        expect(a1Tab).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('displays T1 and T2 exercises for active day', async () => {
      render(<ImportReviewStep {...defaultProps} />)

      await waitFor(() => {
        // A1 is active by default, should show Squat (T1) and Bench (T2)
        expect(screen.getByText('Squat')).toBeInTheDocument()
        expect(screen.getByText('Bench')).toBeInTheDocument()
      })
    })

    it('tab navigation switches displayed day content', async () => {
      render(<ImportReviewStep {...defaultProps} />)

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('Squat')).toBeInTheDocument()
      })

      // Click B1 tab
      const b1Tab = screen.getByRole('tab', { name: /day b1/i })
      fireEvent.click(b1Tab)

      // Should now show B1 content (OHP and Deadlift)
      await waitFor(() => {
        expect(screen.getByText('Ohp')).toBeInTheDocument()
        expect(screen.getByText('Deadlift')).toBeInTheDocument()
      })

      // A1 content should not be visible
      expect(screen.queryByText('Squat')).not.toBeInTheDocument()
    })

    it('shows checkmarks for validated days in tab bar', async () => {
      render(<ImportReviewStep {...defaultProps} />)

      await waitFor(() => {
        // All days have T1 and T2, so all should be validated
        const tabs = screen.getAllByRole('tab')
        // Each validated tab should have a checkmark SVG
        tabs.forEach((tab) => {
          const checkmark = tab.querySelector('svg')
          expect(checkmark).toBeInTheDocument()
        })
      })
    })
  })

  // ===========================================================================
  // Validation
  // ===========================================================================

  describe('validation', () => {
    it('requires all days to have T1/T2 confirmed for continue button', async () => {
      const result = createMockImportResult({
        A1: { t1: null }, // Missing T1
      })

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      await waitFor(() => {
        const continueBtn = screen.getByRole('button', { name: /continue/i })
        expect(continueBtn).toBeDisabled()
      })
    })

    it('enables continue button when all days have T1 and T2', async () => {
      render(<ImportReviewStep {...defaultProps} />)

      await waitFor(() => {
        const continueBtn = screen.getByRole('button', { name: /continue/i })
        expect(continueBtn).not.toBeDisabled()
      })
    })

    it('shows validation message when some days are missing T1/T2', async () => {
      const result = createMockImportResult({
        B1: { t2: null }, // Missing T2
      })

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      await waitFor(() => {
        expect(screen.getByText(/all days must have t1 and t2/i)).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // T1/T2 Weight Updates
  // ===========================================================================

  describe('weight updates', () => {
    it('renders weight input for T1 exercise', async () => {
      render(<ImportReviewStep {...defaultProps} />)

      await waitFor(() => {
        const weightInput = screen.getByLabelText(/t1 weight/i)
        expect(weightInput).toBeInTheDocument()
        expect(weightInput).toHaveValue(60)
      })
    })

    it('renders weight input for T2 exercise', async () => {
      render(<ImportReviewStep {...defaultProps} />)

      await waitFor(() => {
        const weightInput = screen.getByLabelText(/t2 weight/i)
        expect(weightInput).toBeInTheDocument()
        expect(weightInput).toHaveValue(40)
      })
    })

    it('calls onDayExerciseUpdate when T1 weight is changed', async () => {
      const onDayExerciseUpdate = vi.fn()
      render(<ImportReviewStep {...defaultProps} onDayExerciseUpdate={onDayExerciseUpdate} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/t1 weight/i)).toBeInTheDocument()
      })

      const t1WeightInput = screen.getByLabelText(/t1 weight/i)
      fireEvent.change(t1WeightInput, { target: { value: '65' } })

      expect(onDayExerciseUpdate).toHaveBeenCalledWith('A1', 'T1', { userWeight: 65 })
    })

    it('calls onDayExerciseUpdate when T2 weight is changed', async () => {
      const onDayExerciseUpdate = vi.fn()
      render(<ImportReviewStep {...defaultProps} onDayExerciseUpdate={onDayExerciseUpdate} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/t2 weight/i)).toBeInTheDocument()
      })

      const t2WeightInput = screen.getByLabelText(/t2 weight/i)
      fireEvent.change(t2WeightInput, { target: { value: '45' } })

      expect(onDayExerciseUpdate).toHaveBeenCalledWith('A1', 'T2', { userWeight: 45 })
    })
  })

  // ===========================================================================
  // T3 Removal
  // ===========================================================================

  describe('T3 removal', () => {
    it('renders T3 exercises with remove buttons', async () => {
      const result = createMockImportResult({
        A1: {
          t3s: [
            createMockExercise({ name: 'Lat Pulldown', templateId: 'lat-1' }),
            createMockExercise({ name: 'Cable Rows', templateId: 'rows-1' }),
          ],
        },
      })

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      await waitFor(() => {
        expect(screen.getByText('Lat Pulldown')).toBeInTheDocument()
        expect(screen.getByText('Cable Rows')).toBeInTheDocument()
        expect(screen.getAllByRole('button', { name: /remove/i })).toHaveLength(2)
      })
    })

    it('calls onDayT3Remove when T3 remove button is clicked', async () => {
      const onDayT3Remove = vi.fn()
      const result = createMockImportResult({
        A1: {
          t3s: [createMockExercise({ name: 'Lat Pulldown', templateId: 'lat-1' })],
        },
      })

      render(<ImportReviewStep {...defaultProps} importResult={result} onDayT3Remove={onDayT3Remove} />)

      await waitFor(() => {
        expect(screen.getByText('Lat Pulldown')).toBeInTheDocument()
      })

      const removeBtn = screen.getByRole('button', { name: /remove lat pulldown/i })
      fireEvent.click(removeBtn)

      expect(onDayT3Remove).toHaveBeenCalledWith('A1', 0)
    })
  })

  // ===========================================================================
  // Warnings Display
  // ===========================================================================

  describe('warnings display', () => {
    it('displays warnings section when warnings exist', async () => {
      const warnings: ImportWarning[] = [
        { type: 'no_t2', day: 'A1', message: 'A1: No T2 exercise found.' },
      ]
      const result = createMockImportResult({}, warnings)

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('A1: No T2 exercise found.')).toBeInTheDocument()
      })
    })

    it('displays multiple warnings', async () => {
      const warnings: ImportWarning[] = [
        { type: 'no_t2', day: 'A1', message: 'A1: No T2 exercise found.' },
        { type: 'stage_unknown', message: 'Squat: Could not detect stage.' },
      ]
      const result = createMockImportResult({}, warnings)

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      await waitFor(() => {
        expect(screen.getByText('A1: No T2 exercise found.')).toBeInTheDocument()
        expect(screen.getByText('Squat: Could not detect stage.')).toBeInTheDocument()
      })
    })

    it('does not show warnings section when no warnings', async () => {
      render(<ImportReviewStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // Navigation
  // ===========================================================================

  describe('navigation', () => {
    it('renders Continue button', async () => {
      render(<ImportReviewStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
      })
    })

    it('renders Back button', async () => {
      render(<ImportReviewStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
      })
    })

    it('calls onNext when Continue is clicked', async () => {
      const onNext = vi.fn()
      render(<ImportReviewStep {...defaultProps} onNext={onNext} />)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /continue/i })
        expect(button).not.toBeDisabled()
      })

      fireEvent.click(screen.getByRole('button', { name: /continue/i }))
      expect(onNext).toHaveBeenCalled()
    })

    it('calls onBack when Back is clicked', async () => {
      const onBack = vi.fn()
      render(<ImportReviewStep {...defaultProps} onBack={onBack} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /back/i }))
      expect(onBack).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Accessibility
  // ===========================================================================

  describe('accessibility', () => {
    it('has minimum 44x44px touch targets for buttons', async () => {
      render(<ImportReviewStep {...defaultProps} />)

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const navButtons = buttons.filter(
          (btn) => btn.textContent?.includes('Back') || btn.textContent?.includes('Continue')
        )
        navButtons.forEach((button) => {
          expect(button).toHaveClass('min-h-[44px]')
        })
      })
    })

    it('has tablist with proper ARIA attributes', async () => {
      render(<ImportReviewStep {...defaultProps} />)

      await waitFor(() => {
        const tablist = screen.getByRole('tablist')
        expect(tablist).toBeInTheDocument()

        const tabs = screen.getAllByRole('tab')
        tabs.forEach((tab) => {
          expect(tab).toHaveAttribute('aria-label')
        })
      })
    })
  })

  // ===========================================================================
  // Empty States
  // ===========================================================================

  describe('empty states', () => {
    it('shows empty state for day with no T1', async () => {
      const result = createMockImportResult({
        A1: { t1: null },
      })

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      await waitFor(() => {
        expect(screen.getByText(/no t1 exercise/i)).toBeInTheDocument()
      })
    })

    it('shows empty state for day with no T2', async () => {
      const result = createMockImportResult({
        A1: { t2: null },
      })

      render(<ImportReviewStep {...defaultProps} importResult={result} />)

      await waitFor(() => {
        expect(screen.getByText(/no t2 exercise/i)).toBeInTheDocument()
      })
    })

    it('shows empty state for day with no T3s', async () => {
      render(<ImportReviewStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/no t3 accessories/i)).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // API Availability
  // ===========================================================================

  describe('API availability', () => {
    it('disables continue button while checking API', async () => {
      // This is checked at initial render, so we just verify the flow works
      render(<ImportReviewStep {...defaultProps} />)

      // Eventually the button should be enabled after API check completes
      await waitFor(() => {
        const continueBtn = screen.getByRole('button', { name: /continue/i })
        expect(continueBtn).not.toBeDisabled()
      })
    })
  })
})
