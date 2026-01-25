/**
 * useDataMaintenance Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDataMaintenance } from '@/hooks/useDataMaintenance'
import * as hevyClient from '@/lib/hevy-client'
import * as historyImporter from '@/lib/history-importer'

// Mock the modules
vi.mock('@/lib/hevy-client')
vi.mock('@/lib/history-importer')

describe('useDataMaintenance', () => {
  const mockSetProgressionHistory = vi.fn()
  const mockUpdateProgressionBatch = vi.fn()

  const defaultProps = {
    apiKey: 'test-api-key',
    exercises: {
      'ex-1': {
        id: 'ex-1',
        name: 'Squat',
        hevyTemplateId: 'template-1',
        role: 'squat' as const,
      },
    },
    progression: {
      'squat-T1': {
        exerciseId: 'ex-1',
        currentWeight: 100,
        stage: 0 as const,
        baseWeight: 100,
        amrapRecord: 0,
      },
    },
    progressionHistory: {},
    hevyRoutineIds: {
      A1: 'routine-1',
      B1: 'routine-2',
      A2: null,
      B2: null,
    } as const,
    setProgressionHistory: mockSetProgressionHistory,
    updateProgressionBatch: mockUpdateProgressionBatch,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(hevyClient.createHevyClient).mockReturnValue({} as any)
    vi.mocked(historyImporter.importProgressionHistory).mockResolvedValue({
      history: {},
      entryCount: 0,
    })
    vi.mocked(historyImporter.backfillAmrapRecords).mockResolvedValue({
      records: [],
    })
    vi.mocked(historyImporter.applyAmrapBackfill).mockReturnValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not run when apiKey is null', () => {
    renderHook(() =>
      useDataMaintenance({
        ...defaultProps,
        apiKey: null,
      })
    )

    expect(hevyClient.createHevyClient).not.toHaveBeenCalled()
  })

  it('should create Hevy client when apiKey is provided', () => {
    renderHook(() => useDataMaintenance(defaultProps))

    expect(hevyClient.createHevyClient).toHaveBeenCalledWith('test-api-key')
  })

  it('should not import history when exercises are empty', () => {
    renderHook(() =>
      useDataMaintenance({
        ...defaultProps,
        exercises: {},
      })
    )

    expect(historyImporter.importProgressionHistory).not.toHaveBeenCalled()
  })

  it('should not import history when routines are not configured', () => {
    renderHook(() =>
      useDataMaintenance({
        ...defaultProps,
        hevyRoutineIds: {
          A1: null,
          B1: null,
          A2: null,
          B2: null,
        },
      })
    )

    expect(historyImporter.importProgressionHistory).not.toHaveBeenCalled()
  })

  it('should not import history when progressionHistory already exists', () => {
    renderHook(() =>
      useDataMaintenance({
        ...defaultProps,
        progressionHistory: {
          'squat-T1': { entries: [] },
        },
      })
    )

    expect(historyImporter.importProgressionHistory).not.toHaveBeenCalled()
  })

  it('should import history when conditions are met', async () => {
    vi.mocked(historyImporter.importProgressionHistory).mockResolvedValue({
      history: { 'squat-T1': { entries: [] } },
      entryCount: 5,
    })

    renderHook(() => useDataMaintenance(defaultProps))

    await waitFor(() => {
      expect(historyImporter.importProgressionHistory).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockSetProgressionHistory).toHaveBeenCalledWith({
        'squat-T1': { entries: [] },
      })
    })
  })

  it('should not set history when entryCount is 0', async () => {
    vi.mocked(historyImporter.importProgressionHistory).mockResolvedValue({
      history: {},
      entryCount: 0,
    })

    renderHook(() => useDataMaintenance(defaultProps))

    await waitFor(() => {
      expect(historyImporter.importProgressionHistory).toHaveBeenCalled()
    })

    // Wait a bit to ensure callback was not called
    await new Promise((r) => setTimeout(r, 50))
    expect(mockSetProgressionHistory).not.toHaveBeenCalled()
  })

  it('should handle import errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(historyImporter.importProgressionHistory).mockRejectedValue(
      new Error('Network error')
    )

    renderHook(() => useDataMaintenance(defaultProps))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        '[useDataMaintenance] Failed to import progression history:',
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })

  it('should not backfill AMRAP when progression has no records needing backfill', () => {
    renderHook(() =>
      useDataMaintenance({
        ...defaultProps,
        progression: {
          'squat-T1': {
            ...defaultProps.progression['squat-T1'],
            amrapRecord: 0, // No AMRAP record
          },
        },
      })
    )

    expect(historyImporter.backfillAmrapRecords).not.toHaveBeenCalled()
  })

  it('should backfill AMRAP when record exists but date is missing', async () => {
    vi.mocked(historyImporter.backfillAmrapRecords).mockResolvedValue({
      records: [{ progressionKey: 'squat-T1', date: '2026-01-01' }],
    })
    vi.mocked(historyImporter.applyAmrapBackfill).mockReturnValue({
      'squat-T1': {
        ...defaultProps.progression['squat-T1'],
        amrapRecordDate: '2026-01-01',
      },
    })

    renderHook(() =>
      useDataMaintenance({
        ...defaultProps,
        progression: {
          'squat-T1': {
            ...defaultProps.progression['squat-T1'],
            amrapRecord: 10, // Has AMRAP record but no date
          },
        },
      })
    )

    await waitFor(() => {
      expect(historyImporter.backfillAmrapRecords).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockUpdateProgressionBatch).toHaveBeenCalled()
    })
  })

  it('should only run migrations once', async () => {
    vi.mocked(historyImporter.importProgressionHistory).mockResolvedValue({
      history: { 'squat-T1': { entries: [] } },
      entryCount: 5,
    })

    const { rerender } = renderHook(() => useDataMaintenance(defaultProps))

    await waitFor(() => {
      expect(historyImporter.importProgressionHistory).toHaveBeenCalledTimes(1)
    })

    // Rerender should not trigger another import
    rerender()

    await new Promise((r) => setTimeout(r, 50))
    expect(historyImporter.importProgressionHistory).toHaveBeenCalledTimes(1)
  })
})
