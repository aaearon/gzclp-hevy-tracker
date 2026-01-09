/**
 * Tests for routine-notes.ts
 *
 * Tests the generation of routine update descriptions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateRoutineNotes,
  formatWeightChange,
  type RoutineUpdateInfo,
} from '@/lib/routine-notes'
import type { SelectableExerciseDiff } from '@/lib/push-preview'

describe('routine-notes', () => {
  beforeEach(() => {
    // Mock Date to get consistent timestamps
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-09T14:30:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatWeightChange', () => {
    it('formats weight increase correctly', () => {
      const result = formatWeightChange('Squat', 60, 62.5, 'kg')
      expect(result).toBe('Squat: 60kg → 62.5kg')
    })

    it('formats weight decrease correctly', () => {
      const result = formatWeightChange('Bench Press', 50, 45, 'lbs')
      expect(result).toBe('Bench Press: 50lbs → 45lbs')
    })

    it('formats new exercise (null old weight)', () => {
      const result = formatWeightChange('Deadlift', null, 100, 'kg')
      expect(result).toBe('Deadlift: (new) → 100kg')
    })

    it('handles decimal weights', () => {
      const result = formatWeightChange('OHP', 27.5, 30, 'kg')
      expect(result).toBe('OHP: 27.5kg → 30kg')
    })
  })

  describe('generateRoutineNotes', () => {
    it('generates notes with timestamp and changes', () => {
      const updates: RoutineUpdateInfo[] = [
        { exerciseName: 'Squat', oldWeight: 60, newWeight: 62.5 },
        { exerciseName: 'Bench Press', oldWeight: 45, newWeight: 47.5 },
      ]

      const result = generateRoutineNotes(updates, 'kg')

      expect(result).toContain('Updated: 2026-01-09')
      expect(result).toContain('Squat: 60kg → 62.5kg')
      expect(result).toContain('Bench Press: 45kg → 47.5kg')
    })

    it('generates notes for single exercise', () => {
      const updates: RoutineUpdateInfo[] = [
        { exerciseName: 'Deadlift', oldWeight: 100, newWeight: 105 },
      ]

      const result = generateRoutineNotes(updates, 'kg')

      expect(result).toContain('Updated: 2026-01-09')
      expect(result).toContain('Deadlift: 100kg → 105kg')
    })

    it('generates notes for new routine (null old weights)', () => {
      const updates: RoutineUpdateInfo[] = [
        { exerciseName: 'Squat', oldWeight: null, newWeight: 60 },
        { exerciseName: 'Bench Press', oldWeight: null, newWeight: 45 },
      ]

      const result = generateRoutineNotes(updates, 'kg')

      expect(result).toContain('Updated: 2026-01-09')
      expect(result).toContain('Squat: (new) → 60kg')
      expect(result).toContain('Bench Press: (new) → 45kg')
    })

    it('handles lbs unit correctly', () => {
      const updates: RoutineUpdateInfo[] = [
        { exerciseName: 'Squat', oldWeight: 135, newWeight: 140 },
      ]

      const result = generateRoutineNotes(updates, 'lbs')

      expect(result).toContain('Squat: 135lbs → 140lbs')
    })

    it('returns empty string when no updates provided', () => {
      const result = generateRoutineNotes([], 'kg')
      expect(result).toBe('')
    })

    it('formats notes with proper line breaks', () => {
      const updates: RoutineUpdateInfo[] = [
        { exerciseName: 'Squat', oldWeight: 60, newWeight: 62.5 },
        { exerciseName: 'Bench', oldWeight: 45, newWeight: 47.5 },
      ]

      const result = generateRoutineNotes(updates, 'kg')
      const lines = result.split('\n').filter(l => l.trim())

      expect(lines.length).toBeGreaterThanOrEqual(3) // Header + at least 2 changes
    })

    it('generates notes from SelectableExerciseDiff with push action', () => {
      const diffs: SelectableExerciseDiff[] = [
        {
          exerciseId: 'squat',
          name: 'Squat',
          tier: 'T1',
          oldWeight: 60,
          newWeight: 62.5,
          stage: 'A',
          isChanged: true,
          progressionKey: 't1_squat',
          action: 'push',
        },
        {
          exerciseId: 'bench',
          name: 'Bench Press',
          tier: 'T2',
          oldWeight: 45,
          newWeight: 47.5,
          stage: 'A',
          isChanged: true,
          progressionKey: 't2_bench',
          action: 'push',
        },
        {
          exerciseId: 'row',
          name: 'Barbell Row',
          tier: 'T3',
          oldWeight: 30,
          newWeight: 32.5,
          stage: null,
          isChanged: true,
          progressionKey: 't3_row',
          action: 'skip', // Should be excluded
        },
      ]

      const updates = diffs
        .filter(d => d.action === 'push')
        .map(d => ({
          exerciseName: d.name,
          oldWeight: d.oldWeight,
          newWeight: d.newWeight,
        }))

      const result = generateRoutineNotes(updates, 'kg')

      expect(result).toContain('Squat: 60kg → 62.5kg')
      expect(result).toContain('Bench Press: 45kg → 47.5kg')
      expect(result).not.toContain('Barbell Row')
    })
  })
})
