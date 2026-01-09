/**
 * Integration Tests: Import Wizard Progression Analysis
 *
 * Tests the complete import wizard flow with intelligent progression analysis.
 * Verifies the flow from routine import through analysis display and completion.
 *
 * @see docs/009-intelligent-import-progression.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImportReviewStep } from '@/components/SetupWizard/ImportReviewStep'
import { ExerciseAnalysisCard } from '@/components/SetupWizard/ExerciseAnalysisCard'
import { DayReviewPanel } from '@/components/SetupWizard/DayReviewPanel'
import { ImportExplanationBanner } from '@/components/SetupWizard/ImportExplanationBanner'
import type {
  ImportResult,
  ImportedExercise,
  DayImportData,
  GZCLPDay,
} from '@/types/state'
import type { ImportAnalysis, ProgressionSuggestion, WorkoutPerformance } from '@/types/import'

// =============================================================================
// Mock useOnlineStatus to always return online/available
// =============================================================================

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

function createWorkoutPerformance(
  overrides: Partial<WorkoutPerformance> = {}
): WorkoutPerformance {
  return {
    workoutId: 'workout-1',
    workoutDate: '2026-01-05T10:00:00Z',
    weight: 100,
    reps: [3, 3, 3, 3, 5],
    totalSets: 5,
    ...overrides,
  }
}

function createProgressionSuggestion(
  overrides: Partial<ProgressionSuggestion> = {}
): ProgressionSuggestion {
  return {
    type: 'progress',
    suggestedWeight: 105,
    suggestedStage: 0,
    newScheme: '5x3+',
    reason: 'Completed all sets with 5 AMRAP reps. Add 5kg.',
    success: true,
    amrapReps: 5,
    ...overrides,
  }
}

function createImportAnalysis(
  overrides: Partial<ImportAnalysis> = {}
): ImportAnalysis {
  return {
    performance: createWorkoutPerformance(),
    suggestion: createProgressionSuggestion(),
    hasWorkoutData: true,
    tier: 'T1',
    ...overrides,
  }
}

function createMockExercise(
  overrides: Partial<ImportedExercise> = {}
): ImportedExercise {
  return {
    role: 'squat',
    templateId: 'template-squat',
    name: 'Squat',
    detectedWeight: 100,
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
      originalRepScheme: '3x10',
    }),
    t3s: [],
    ...overrides,
  }
}

function createMockImportResult(
  byDayOverrides?: Partial<Record<GZCLPDay, Partial<DayImportData>>>
): ImportResult {
  const days: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']
  const byDay = {} as Record<GZCLPDay, DayImportData>

  for (const day of days) {
    const override = byDayOverrides?.[day] ?? {}
    byDay[day] = createMockDayData(day, override)
  }

  return {
    byDay,
    warnings: [],
    routineIds: { A1: 'r1', B1: 'r2', A2: 'r3', B2: 'r4' },
  }
}

// =============================================================================
// Tests: Import Wizard with Progression Analysis
// =============================================================================

describe('Import Wizard with Progression Analysis', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // Analysis Display Tests
  // ===========================================================================

  describe('Analysis Display', () => {
    it('shows progression suggestions for exercises with workout data', async () => {
      const successAnalysis = createImportAnalysis({
        performance: createWorkoutPerformance({
          weight: 100,
          reps: [3, 3, 3, 3, 5],
        }),
        suggestion: createProgressionSuggestion({
          type: 'progress',
          suggestedWeight: 105,
          reason: 'Completed all sets with 5 AMRAP reps. Add 5kg.',
          success: true,
        }),
        hasWorkoutData: true,
      })

      const result = createMockImportResult({
        A1: {
          t1: createMockExercise({
            name: 'Squat',
            detectedWeight: 100,
            analysis: successAnalysis,
          }),
        },
      })

      render(
        <ImportReviewStep
          importResult={result}
          onDayExerciseUpdate={vi.fn()}
          onDayT3Remove={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
          unit="kg"
        />
      )

      await waitFor(() => {
        // Should show the exercise name
        expect(screen.getByText('Squat')).toBeInTheDocument()
        // Should show workout date source
        expect(screen.getByText(/jan.*2026/i)).toBeInTheDocument()
        // Should show the reason/suggestion (may appear twice in different contexts)
        expect(screen.getAllByText(/completed all sets/i).length).toBeGreaterThanOrEqual(1)
        // Should show SUCCESS badge for successful workout
        expect(screen.getByText('SUCCESS')).toBeInTheDocument()
      })
    })

    it('shows appropriate message for exercises without workout data', async () => {
      const noDataAnalysis = createImportAnalysis({
        performance: null,
        suggestion: null,
        hasWorkoutData: false,
      })

      // Test directly with ExerciseAnalysisCard component for clearer assertion
      const exercise = createMockExercise({
        name: 'Squat',
        detectedWeight: 60,
        analysis: noDataAnalysis,
      })

      render(
        <ExerciseAnalysisCard
          exercise={exercise}
          tier="T1"
          onWeightChange={vi.fn()}
          onStageChange={vi.fn()}
          unit="kg"
        />
      )

      // Should indicate no workout data found
      expect(screen.getByText(/no recent workout data found/i)).toBeInTheDocument()
      // Should show "No workout data" in the source section (badge is only shown for exercises with workout data)
      expect(screen.getByText(/no workout data/i)).toBeInTheDocument()
      // The card should have gray styling (no_data visual state)
      const card = screen.getByRole('article')
      expect(card).toHaveClass('border-gray-300')
      expect(card).toHaveClass('bg-gray-50')
    })

    it('displays correct visual state for success (progress)', async () => {
      const exercise = createMockExercise({
        name: 'Squat',
        detectedWeight: 100,
        analysis: createImportAnalysis({
          suggestion: createProgressionSuggestion({
            type: 'progress',
            success: true,
          }),
        }),
      })

      render(
        <ExerciseAnalysisCard
          exercise={exercise}
          tier="T1"
          onWeightChange={vi.fn()}
          onStageChange={vi.fn()}
          unit="kg"
        />
      )

      // Progress type should show green border
      const card = screen.getByRole('article')
      expect(card).toHaveClass('border-green-500')
      expect(card).toHaveClass('bg-green-50')
      expect(screen.getByText('SUCCESS')).toBeInTheDocument()
    })

    it('displays correct visual state for failure (stage change)', async () => {
      const exercise = createMockExercise({
        name: 'Squat',
        detectedWeight: 100,
        analysis: createImportAnalysis({
          suggestion: createProgressionSuggestion({
            type: 'stage_change',
            suggestedStage: 1,
            newScheme: '6x2+',
            reason: 'Failed to complete 5x3. Moving to Stage B.',
            success: false,
          }),
        }),
      })

      render(
        <ExerciseAnalysisCard
          exercise={exercise}
          tier="T1"
          onWeightChange={vi.fn()}
          onStageChange={vi.fn()}
          unit="kg"
        />
      )

      // Stage change should show amber border
      const card = screen.getByRole('article')
      expect(card).toHaveClass('border-amber-500')
      expect(card).toHaveClass('bg-amber-50')
      expect(screen.getByText('FAIL')).toBeInTheDocument()
    })

    it('displays correct visual state for deload', async () => {
      const exercise = createMockExercise({
        name: 'Squat',
        detectedWeight: 100,
        analysis: createImportAnalysis({
          suggestion: createProgressionSuggestion({
            type: 'deload',
            suggestedWeight: 85,
            suggestedStage: 0,
            reason: 'Failed at Stage C. Deloading 15% and returning to Stage A.',
            success: false,
          }),
        }),
      })

      render(
        <ExerciseAnalysisCard
          exercise={exercise}
          tier="T1"
          onWeightChange={vi.fn()}
          onStageChange={vi.fn()}
          unit="kg"
        />
      )

      // Deload should show red border
      const card = screen.getByRole('article')
      expect(card).toHaveClass('border-red-500')
      expect(card).toHaveClass('bg-red-50')
      expect(screen.getByText('FAIL')).toBeInTheDocument()
    })

    it('displays repeat state correctly', async () => {
      const exercise = createMockExercise({
        name: 'Squat',
        detectedWeight: 100,
        analysis: createImportAnalysis({
          suggestion: createProgressionSuggestion({
            type: 'repeat',
            suggestedWeight: 100,
            reason: 'Completed minimum reps. Repeat weight.',
            success: true,
          }),
        }),
      })

      render(
        <ExerciseAnalysisCard
          exercise={exercise}
          tier="T1"
          onWeightChange={vi.fn()}
          onStageChange={vi.fn()}
          unit="kg"
        />
      )

      // Repeat should show blue border (success variant)
      const card = screen.getByRole('article')
      expect(card).toHaveClass('border-blue-500')
      expect(card).toHaveClass('bg-blue-50')
      expect(screen.getByText('SUCCESS')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // User Overrides Tests
  // ===========================================================================

  describe('User Overrides', () => {
    it('allows user to override suggested weights', async () => {
      const onWeightChange = vi.fn()
      const exercise = createMockExercise({
        name: 'Squat',
        detectedWeight: 100,
        analysis: createImportAnalysis({
          suggestion: createProgressionSuggestion({
            suggestedWeight: 105,
          }),
        }),
      })

      render(
        <ExerciseAnalysisCard
          exercise={exercise}
          tier="T1"
          onWeightChange={onWeightChange}
          onStageChange={vi.fn()}
          unit="kg"
        />
      )

      // Find weight input
      const weightInput = screen.getByLabelText(/next target/i)
      expect(weightInput).toHaveValue(105)

      // Clear and type new value
      await user.clear(weightInput)
      await user.type(weightInput, '110')

      expect(onWeightChange).toHaveBeenCalled()
    })

    it('allows user to override suggested stages', async () => {
      const onStageChange = vi.fn()
      const exercise = createMockExercise({
        name: 'Squat',
        detectedWeight: 100,
        analysis: createImportAnalysis({
          suggestion: createProgressionSuggestion({
            type: 'stage_change',
            suggestedStage: 1,
            newScheme: '6x2+',
          }),
        }),
      })

      render(
        <ExerciseAnalysisCard
          exercise={exercise}
          tier="T1"
          onWeightChange={vi.fn()}
          onStageChange={onStageChange}
          unit="kg"
        />
      )

      // Should show stage dropdown for stage_change type
      const stageSelect = screen.getByLabelText(/new scheme/i)
      expect(stageSelect).toBeInTheDocument()

      // Change stage
      await user.selectOptions(stageSelect, '2')

      expect(onStageChange).toHaveBeenCalledWith(2)
    })

    it('preserves user overrides when switching tabs', async () => {
      const onDayExerciseUpdate = vi.fn()

      // Create result with analysis on A1
      const result = createMockImportResult({
        A1: {
          t1: createMockExercise({
            name: 'Squat',
            detectedWeight: 100,
            userWeight: 115, // User already overrode weight
            analysis: createImportAnalysis({
              suggestion: createProgressionSuggestion({
                suggestedWeight: 105,
              }),
            }),
          }),
        },
      })

      render(
        <ImportReviewStep
          importResult={result}
          onDayExerciseUpdate={onDayExerciseUpdate}
          onDayT3Remove={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
          unit="kg"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Squat')).toBeInTheDocument()
      })

      // Switch to B1 tab
      const b1Tab = screen.getByRole('tab', { name: /day b1/i })
      fireEvent.click(b1Tab)

      await waitFor(() => {
        expect(screen.getByText('Ohp')).toBeInTheDocument()
      })

      // Switch back to A1 tab
      const a1Tab = screen.getByRole('tab', { name: /day a1/i })
      fireEvent.click(a1Tab)

      await waitFor(() => {
        expect(screen.getByText('Squat')).toBeInTheDocument()
        // The input should still show the user override (115), not the suggestion (105)
        const weightInput = screen.getByLabelText(/next target/i)
        expect(weightInput).toHaveValue(115)
      })
    })

    it('calls update callback when user changes T1 weight', async () => {
      const onDayExerciseUpdate = vi.fn()

      const result = createMockImportResult({
        A1: {
          t1: createMockExercise({
            name: 'Squat',
            detectedWeight: 100,
            analysis: createImportAnalysis({
              suggestion: createProgressionSuggestion({
                suggestedWeight: 105,
              }),
            }),
          }),
        },
      })

      render(
        <ImportReviewStep
          importResult={result}
          onDayExerciseUpdate={onDayExerciseUpdate}
          onDayT3Remove={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
          unit="kg"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Squat')).toBeInTheDocument()
      })

      const weightInput = screen.getByLabelText(/next target/i)
      await user.clear(weightInput)
      await user.type(weightInput, '110')

      expect(onDayExerciseUpdate).toHaveBeenCalledWith('A1', 'T1', expect.objectContaining({
        userWeight: expect.any(Number),
      }))
    })
  })

  // ===========================================================================
  // Completion Tests
  // ===========================================================================

  describe('Completion', () => {
    it('saves progressed weights on completion', async () => {
      const onNext = vi.fn()

      const result = createMockImportResult({
        A1: {
          t1: createMockExercise({
            name: 'Squat',
            detectedWeight: 100,
            analysis: createImportAnalysis({
              suggestion: createProgressionSuggestion({
                type: 'progress',
                suggestedWeight: 105,
              }),
            }),
          }),
          t2: createMockExercise({
            name: 'Bench',
            role: 'bench',
            templateId: 'tmpl-bench',
            detectedWeight: 60,
            originalRepScheme: '3x10',
            analysis: createImportAnalysis({
              tier: 'T2',
              suggestion: createProgressionSuggestion({
                type: 'progress',
                suggestedWeight: 62.5,
              }),
            }),
          }),
        },
      })

      render(
        <ImportReviewStep
          importResult={result}
          onDayExerciseUpdate={vi.fn()}
          onDayT3Remove={vi.fn()}
          onNext={onNext}
          onBack={vi.fn()}
          unit="kg"
        />
      )

      await waitFor(() => {
        const continueBtn = screen.getByRole('button', { name: /continue/i })
        expect(continueBtn).not.toBeDisabled()
      })

      fireEvent.click(screen.getByRole('button', { name: /continue/i }))

      expect(onNext).toHaveBeenCalled()
    })

    it('saves user overrides on completion', async () => {
      const onNext = vi.fn()

      const result = createMockImportResult({
        A1: {
          t1: createMockExercise({
            name: 'Squat',
            detectedWeight: 100,
            userWeight: 120, // User override
            analysis: createImportAnalysis({
              suggestion: createProgressionSuggestion({
                suggestedWeight: 105,
              }),
            }),
          }),
        },
      })

      render(
        <ImportReviewStep
          importResult={result}
          onDayExerciseUpdate={vi.fn()}
          onDayT3Remove={vi.fn()}
          onNext={onNext}
          onBack={vi.fn()}
          unit="kg"
        />
      )

      await waitFor(() => {
        const continueBtn = screen.getByRole('button', { name: /continue/i })
        expect(continueBtn).not.toBeDisabled()
      })

      fireEvent.click(screen.getByRole('button', { name: /continue/i }))

      expect(onNext).toHaveBeenCalled()
    })

    it('handles mixed success/failure across exercises', async () => {
      const result = createMockImportResult({
        A1: {
          t1: createMockExercise({
            name: 'Squat',
            detectedWeight: 100,
            analysis: createImportAnalysis({
              suggestion: createProgressionSuggestion({
                type: 'progress',
                success: true,
              }),
            }),
          }),
          t2: createMockExercise({
            name: 'Bench',
            role: 'bench',
            templateId: 'tmpl-bench',
            detectedWeight: 60,
            originalRepScheme: '3x10',
            analysis: createImportAnalysis({
              tier: 'T2',
              suggestion: createProgressionSuggestion({
                type: 'stage_change',
                success: false,
              }),
            }),
          }),
        },
      })

      render(
        <ImportReviewStep
          importResult={result}
          onDayExerciseUpdate={vi.fn()}
          onDayT3Remove={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
          unit="kg"
        />
      )

      await waitFor(() => {
        // Should show both SUCCESS and FAIL badges
        const successBadges = screen.getAllByText('SUCCESS')
        const failBadges = screen.getAllByText('FAIL')
        expect(successBadges.length).toBeGreaterThanOrEqual(1)
        expect(failBadges.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  // ===========================================================================
  // Explanation Banner Tests
  // ===========================================================================

  describe('Explanation Banner', () => {
    it('shows explanation banner above day tabs', () => {
      const routineSummary = [
        { day: 'A1', workoutDate: '2026-01-05T10:00:00Z' },
        { day: 'B1', workoutDate: '2026-01-03T10:00:00Z' },
        { day: 'A2', workoutDate: '2026-01-01T10:00:00Z' },
        { day: 'B2', workoutDate: null },
      ]

      render(<ImportExplanationBanner routineSummary={routineSummary} />)

      // Should show the banner title
      expect(screen.getByText('How Import Works')).toBeInTheDocument()
      // Should show explanation content
      expect(screen.getByText(/pulled data from your most recent workout/i)).toBeInTheDocument()
    })

    it('displays routine mapping summary', () => {
      const routineSummary = [
        { day: 'A1', workoutDate: '2026-01-05T10:00:00Z' },
        { day: 'B1', workoutDate: '2026-01-03T10:00:00Z' },
        { day: 'A2', workoutDate: null },
        { day: 'B2', workoutDate: null },
      ]

      render(<ImportExplanationBanner routineSummary={routineSummary} />)

      // Should show routine mapping section
      expect(screen.getByText(/routine mapping/i)).toBeInTheDocument()
      // Should show day labels
      expect(screen.getByText(/A1:/)).toBeInTheDocument()
      expect(screen.getByText(/B1:/)).toBeInTheDocument()
      // Days without workout data should show "No workout data"
      expect(screen.getAllByText(/no workout data/i).length).toBeGreaterThanOrEqual(1)
    })

    it('can be collapsed and expanded', async () => {
      const routineSummary = [
        { day: 'A1', workoutDate: '2026-01-05T10:00:00Z' },
      ]

      render(<ImportExplanationBanner routineSummary={routineSummary} />)

      // Initially expanded
      const toggleButton = screen.getByRole('button', { name: /how import works/i })
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText(/pulled data/i)).toBeInTheDocument()

      // Click to collapse
      await user.click(toggleButton)
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(/pulled data/i)).not.toBeInTheDocument()

      // Click to expand again
      await user.click(toggleButton)
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText(/pulled data/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // DayReviewPanel Integration with Analysis
  // ===========================================================================

  describe('DayReviewPanel with Analysis', () => {
    it('uses ExerciseAnalysisCard when exercise has analysis data', () => {
      const dayData: DayImportData = {
        day: 'A1',
        t1: createMockExercise({
          name: 'Squat',
          analysis: createImportAnalysis(),
        }),
        t2: createMockExercise({
          name: 'Bench',
          role: 'bench',
          templateId: 'tmpl-bench',
          originalRepScheme: '3x10',
          analysis: createImportAnalysis({ tier: 'T2' }),
        }),
        t3s: [],
      }

      render(
        <DayReviewPanel
          dayData={dayData}
          onT1Update={vi.fn()}
          onT2Update={vi.fn()}
          onT3Remove={vi.fn()}
          unit="kg"
        />
      )

      // Should render with analysis card style (has article role)
      const articles = screen.getAllByRole('article')
      expect(articles).toHaveLength(2)
    })

    it('uses TierCard when exercise has no analysis data', () => {
      const dayData: DayImportData = {
        day: 'A1',
        t1: createMockExercise({
          name: 'Squat',
          // No analysis property
        }),
        t2: createMockExercise({
          name: 'Bench',
          role: 'bench',
          templateId: 'tmpl-bench',
          originalRepScheme: '3x10',
          // No analysis property
        }),
        t3s: [],
      }

      render(
        <DayReviewPanel
          dayData={dayData}
          onT1Update={vi.fn()}
          onT2Update={vi.fn()}
          onT3Remove={vi.fn()}
          unit="kg"
        />
      )

      // Should NOT have article role (TierCard doesn't use article)
      expect(screen.queryAllByRole('article')).toHaveLength(0)
      // Should still show the exercises
      expect(screen.getByText('Squat')).toBeInTheDocument()
      expect(screen.getByText('Bench')).toBeInTheDocument()
    })

    it('shows T3 exercises with analysis cards when analysis is present', () => {
      const dayData: DayImportData = {
        day: 'A1',
        t1: createMockExercise({ name: 'Squat' }),
        t2: createMockExercise({ name: 'Bench', role: 'bench', templateId: 'tmpl-bench' }),
        t3s: [
          createMockExercise({
            name: 'Lat Pulldown',
            role: 't3',
            templateId: 'tmpl-lat',
            analysis: createImportAnalysis({
              tier: 'T3',
              suggestion: createProgressionSuggestion({
                type: 'repeat',
                suggestedWeight: 40,
              }),
            }),
          }),
        ],
      }

      render(
        <DayReviewPanel
          dayData={dayData}
          onT1Update={vi.fn()}
          onT2Update={vi.fn()}
          onT3Remove={vi.fn()}
          unit="kg"
        />
      )

      // T3 with analysis should have analysis card
      expect(screen.getByText('Lat Pulldown')).toBeInTheDocument()
      // Should have article role for T3 analysis card
      const articles = screen.getAllByRole('article')
      expect(articles.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ===========================================================================
  // Weight Unit Handling
  // ===========================================================================

  describe('Weight Unit Handling', () => {
    it('displays weights in kg when unit is kg', async () => {
      const result = createMockImportResult({
        A1: {
          t1: createMockExercise({
            name: 'Squat',
            detectedWeight: 100,
            analysis: createImportAnalysis({
              suggestion: createProgressionSuggestion({
                suggestedWeight: 105,
              }),
            }),
          }),
        },
      })

      render(
        <ImportReviewStep
          importResult={result}
          onDayExerciseUpdate={vi.fn()}
          onDayT3Remove={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
          unit="kg"
        />
      )

      await waitFor(() => {
        expect(screen.getAllByText('kg').length).toBeGreaterThan(0)
      })
    })

    it('displays weights in lbs when unit is lbs', async () => {
      const result = createMockImportResult({
        A1: {
          t1: createMockExercise({
            name: 'Squat',
            detectedWeight: 225,
            analysis: createImportAnalysis({
              suggestion: createProgressionSuggestion({
                suggestedWeight: 230,
              }),
            }),
          }),
        },
      })

      render(
        <ImportReviewStep
          importResult={result}
          onDayExerciseUpdate={vi.fn()}
          onDayT3Remove={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
          unit="lbs"
        />
      )

      await waitFor(() => {
        expect(screen.getAllByText('lbs').length).toBeGreaterThan(0)
      })
    })
  })

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles exercise with workout data but no suggestion', async () => {
      const partialAnalysis = createImportAnalysis({
        performance: createWorkoutPerformance(),
        suggestion: null, // No suggestion calculated
        hasWorkoutData: true,
      })

      const result = createMockImportResult({
        A1: {
          t1: createMockExercise({
            name: 'Squat',
            detectedWeight: 100,
            analysis: partialAnalysis,
          }),
        },
      })

      render(
        <ImportReviewStep
          importResult={result}
          onDayExerciseUpdate={vi.fn()}
          onDayT3Remove={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
          unit="kg"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Squat')).toBeInTheDocument()
        // Should still show the exercise
        expect(screen.getByText('NO DATA')).toBeInTheDocument()
      })
    })

    it('shows stage dropdown only for stage_change type', async () => {
      // Exercise with progress type (no stage change)
      const progressExercise = createMockExercise({
        name: 'Squat',
        analysis: createImportAnalysis({
          suggestion: createProgressionSuggestion({
            type: 'progress', // NOT stage_change
            suggestedStage: 0,
          }),
        }),
      })

      const { rerender } = render(
        <ExerciseAnalysisCard
          exercise={progressExercise}
          tier="T1"
          onWeightChange={vi.fn()}
          onStageChange={vi.fn()}
          unit="kg"
        />
      )

      // Should NOT show stage dropdown for progress type
      expect(screen.queryByLabelText(/new scheme/i)).not.toBeInTheDocument()

      // Exercise with stage_change type
      const stageChangeExercise = createMockExercise({
        name: 'Squat',
        analysis: createImportAnalysis({
          suggestion: createProgressionSuggestion({
            type: 'stage_change',
            suggestedStage: 1,
          }),
        }),
      })

      rerender(
        <ExerciseAnalysisCard
          exercise={stageChangeExercise}
          tier="T1"
          onWeightChange={vi.fn()}
          onStageChange={vi.fn()}
          unit="kg"
        />
      )

      // Should show stage dropdown for stage_change type
      expect(screen.getByLabelText(/new scheme/i)).toBeInTheDocument()
    })

    it('shows correct stage options based on tier', async () => {
      // T1 exercise
      const t1Exercise = createMockExercise({
        name: 'Squat',
        analysis: createImportAnalysis({
          tier: 'T1',
          suggestion: createProgressionSuggestion({
            type: 'stage_change',
            suggestedStage: 1,
          }),
        }),
      })

      const { rerender } = render(
        <ExerciseAnalysisCard
          exercise={t1Exercise}
          tier="T1"
          onWeightChange={vi.fn()}
          onStageChange={vi.fn()}
          unit="kg"
        />
      )

      // T1 stage options
      expect(screen.getByText('Stage A (5x3+)')).toBeInTheDocument()
      expect(screen.getByText('Stage B (6x2+)')).toBeInTheDocument()
      expect(screen.getByText('Stage C (10x1+)')).toBeInTheDocument()

      // T2 exercise
      const t2Exercise = createMockExercise({
        name: 'Bench',
        originalRepScheme: '3x10',
        analysis: createImportAnalysis({
          tier: 'T2',
          suggestion: createProgressionSuggestion({
            type: 'stage_change',
            suggestedStage: 1,
          }),
        }),
      })

      rerender(
        <ExerciseAnalysisCard
          exercise={t2Exercise}
          tier="T2"
          onWeightChange={vi.fn()}
          onStageChange={vi.fn()}
          unit="kg"
        />
      )

      // T2 stage options
      expect(screen.getByText('Stage A (3x10)')).toBeInTheDocument()
      expect(screen.getByText('Stage B (3x8)')).toBeInTheDocument()
      expect(screen.getByText('Stage C (3x6)')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('has accessible labels for all inputs', async () => {
      const exercise = createMockExercise({
        name: 'Squat',
        analysis: createImportAnalysis({
          suggestion: createProgressionSuggestion({
            type: 'stage_change',
          }),
        }),
      })

      render(
        <ExerciseAnalysisCard
          exercise={exercise}
          tier="T1"
          onWeightChange={vi.fn()}
          onStageChange={vi.fn()}
          unit="kg"
        />
      )

      // Weight input should be labeled
      expect(screen.getByLabelText(/next target/i)).toBeInTheDocument()
      // Stage select should be labeled
      expect(screen.getByLabelText(/new scheme/i)).toBeInTheDocument()
    })

    it('analysis card has accessible aria-label', () => {
      const exercise = createMockExercise({
        name: 'Squat',
        analysis: createImportAnalysis(),
      })

      render(
        <ExerciseAnalysisCard
          exercise={exercise}
          tier="T1"
          onWeightChange={vi.fn()}
          onStageChange={vi.fn()}
          unit="kg"
        />
      )

      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-label', 'Analysis for Squat')
    })

    it('explanation banner has proper aria attributes', () => {
      render(<ImportExplanationBanner routineSummary={[]} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-expanded')
      expect(button).toHaveAttribute('aria-controls', 'import-explanation-content')
    })
  })
})
