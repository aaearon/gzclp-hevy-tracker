/**
 * Integration Tests: Import Flow Weight Entry Bug
 *
 * Bug fix: ImportReviewStep should NOT render MainLiftVerification.
 * Main lift weights should ONLY be entered in DayReviewPanel tabs.
 *
 * @see docs/006-setup-wizard-bugfixes-plan.md - Issue 2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ImportReviewStep } from '@/components/SetupWizard/ImportReviewStep'
import type { ImportResult, MainLiftWeights, ImportedExercise, DayImportData } from '@/types/state'

// Mock useOnlineStatus hook
vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => ({
    isOnline: true,
    isHevyReachable: true,
    checkHevyConnection: vi.fn().mockResolvedValue(true),
  }),
}))

describe('ImportReviewStep - Duplicate Weight Input Bug Fix', () => {
  // Helper to create mock imported exercise
  const createMockExercise = (name: string, role: string): ImportedExercise => ({
    templateId: `template-${name.toLowerCase().replace(' ', '-')}`,
    name,
    role: role as ImportedExercise['role'],
    detectedWeight: 60,
    detectedStage: 0,
    stageConfidence: 'high',
    originalSetCount: 5,
    originalRepScheme: '5x3+',
  })

  const createMockDayData = (day: string): DayImportData => ({
    day: day as DayImportData['day'],
    t1: createMockExercise('Squat', 'squat'),
    t2: createMockExercise('Bench Press', 'bench'),
    t3s: [createMockExercise('Lat Pulldown', 't3')],
  })

  const mockImportResult: ImportResult = {
    byDay: {
      A1: createMockDayData('A1'),
      B1: createMockDayData('B1'),
      A2: createMockDayData('A2'),
      B2: createMockDayData('B2'),
    },
    warnings: [],
    routineIds: { A1: 'r1', B1: 'r2', A2: 'r3', B2: 'r4' },
  }

  const mockMainLiftWeights: MainLiftWeights[] = [
    {
      role: 'squat',
      t1: { weight: 100, source: 'A1, position 1', stage: 0 },
      t2: { weight: 70, source: 'A2, position 2', stage: 0 },
      hasWarning: false,
    },
    {
      role: 'bench',
      t1: { weight: 60, source: 'B1, position 1', stage: 0 },
      t2: { weight: 42.5, source: 'B2, position 2', stage: 0 },
      hasWarning: false,
    },
    {
      role: 'ohp',
      t1: { weight: 40, source: 'B1, position 1', stage: 0 },
      t2: { weight: 27.5, source: 'B2, position 2', stage: 0 },
      hasWarning: false,
    },
    {
      role: 'deadlift',
      t1: { weight: 100, source: 'B1, position 1', stage: 0 },
      t2: { weight: 70, source: 'A1, position 2', stage: 0 },
      hasWarning: false,
    },
  ]

  const defaultProps = {
    importResult: mockImportResult,
    onDayExerciseUpdate: vi.fn(),
    onDayT3Remove: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
    apiKey: 'test-api-key',
    unit: 'kg' as const,
    mainLiftWeights: mockMainLiftWeights,
    onMainLiftWeightsUpdate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should NOT render MainLiftVerification component', () => {
    render(<ImportReviewStep {...defaultProps} />)

    // MainLiftVerification has a heading "Main Lift Weights" - this should not be present
    expect(screen.queryByRole('heading', { name: /main lift weights/i })).not.toBeInTheDocument()

    // MainLiftVerification renders swap buttons - these should not be present
    expect(screen.queryByRole('button', { name: /swap.*t1.*t2/i })).not.toBeInTheDocument()
  })

  it('should NOT render duplicate weight inputs for T1/T2 verification', () => {
    render(<ImportReviewStep {...defaultProps} />)

    // The MainLiftVerification component shows inputs like "Squat T1 weight" -
    // These should NOT be present as separate inputs outside DayReviewPanel
    expect(screen.queryByLabelText(/squat t1 weight/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/bench t1 weight/i)).not.toBeInTheDocument()
  })

  it('DayReviewPanel should be the ONLY source for weight entry', () => {
    render(<ImportReviewStep {...defaultProps} />)

    // DayReviewPanel is rendered and shows T1/T2 weight inputs
    // These are the ONLY weight inputs that should be present
    expect(screen.getByLabelText(/T1.*weight/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/T2.*weight/i)).toBeInTheDocument()
  })

  it('should not accept mainLiftWeights prop (to be removed)', () => {
    // After the fix, the component should not use mainLiftWeights prop
    // This test documents the expected behavior
    const propsWithoutMainLiftWeights = {
      ...defaultProps,
      mainLiftWeights: undefined,
      onMainLiftWeightsUpdate: undefined,
    }

    // Should render without errors
    render(<ImportReviewStep {...propsWithoutMainLiftWeights} />)

    // Should still show the day review panel with weight inputs
    expect(screen.getByLabelText(/T1.*weight/i)).toBeInTheDocument()
  })
})
