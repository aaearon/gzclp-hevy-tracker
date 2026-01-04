# Quickstart: Separate T1 and T2 Progression Tracking

**Feature**: 005-t1-t2-progression
**Date**: 2026-01-03

## Overview

This document provides a step-by-step guide for implementing the T1/T2 progression tracking feature using TDD.

## Prerequisites

- Node.js 18+
- pnpm (package manager)
- Existing GZCLP Hevy Tracker codebase

## Implementation Order

Follow this order strictly. Each step follows TDD: write failing test → implement → refactor.

### Phase 1: Core Progression Key System

**Goal**: Change how progression state is keyed without breaking existing functionality.

#### Step 1.1: Add getProgressionKey Helper

**Test file**: `tests/unit/progression-keys.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { getProgressionKey } from '@/lib/role-utils'

describe('getProgressionKey', () => {
  it('returns role-T1 for main lift with T1 tier', () => {
    expect(getProgressionKey('uuid-123', 'squat', 'T1')).toBe('squat-T1')
  })

  it('returns role-T2 for main lift with T2 tier', () => {
    expect(getProgressionKey('uuid-123', 'squat', 'T2')).toBe('squat-T2')
  })

  it('returns exerciseId for T3 role', () => {
    expect(getProgressionKey('uuid-789', 't3', 'T3')).toBe('uuid-789')
  })

  it('returns exerciseId for undefined role', () => {
    expect(getProgressionKey('uuid-000', undefined, 'T3')).toBe('uuid-000')
  })

  it('returns exerciseId for warmup role', () => {
    expect(getProgressionKey('uuid-111', 'warmup', 'T3')).toBe('uuid-111')
  })

  it('returns exerciseId for main lift with T3 tier', () => {
    // Edge case: main lift role but T3 context (shouldn't happen, but handle it)
    expect(getProgressionKey('uuid-222', 'squat', 'T3')).toBe('uuid-222')
  })
})
```

**Implementation file**: `src/lib/role-utils.ts`

Add after existing functions:

```typescript
export function getProgressionKey(
  exerciseId: string,
  role: ExerciseRole | undefined,
  tier: Tier
): string {
  if (role && isMainLiftRole(role) && (tier === 'T1' || tier === 'T2')) {
    return `${role}-${tier}`
  }
  return exerciseId
}
```

#### Step 1.2: Update Workout Analysis

**Test file**: `tests/unit/progression-independence.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { analyzeWorkout } from '@/lib/workout-analysis'
import type { Workout } from '@/types/hevy'
import type { ExerciseConfig, ProgressionState } from '@/types/state'

describe('T1/T2 progression independence', () => {
  const mockSquatExercise: ExerciseConfig = {
    id: 'squat-uuid',
    hevyTemplateId: 'hevy-squat',
    name: 'Squat',
    role: 'squat',
  }

  it('looks up T1 progression using squat-T1 key on A1 day', () => {
    const exercises = { 'squat-uuid': mockSquatExercise }
    const progression: Record<string, ProgressionState> = {
      'squat-T1': {
        exerciseId: 'squat',
        currentWeight: 100,
        stage: 0,
        baseWeight: 60,
        lastWorkoutId: null,
        lastWorkoutDate: null,
        amrapRecord: 0,
      },
      'squat-T2': {
        exerciseId: 'squat',
        currentWeight: 70,
        stage: 0,
        baseWeight: 42,
        lastWorkoutId: null,
        lastWorkoutDate: null,
        amrapRecord: 0,
      },
    }

    const workout: Workout = {
      id: 'workout-1',
      start_time: '2026-01-03T10:00:00Z',
      exercises: [
        {
          exercise_template_id: 'hevy-squat',
          sets: [
            { type: 'normal', weight_kg: 100, reps: 3 },
            // ... more sets
          ],
        },
      ],
    } as Workout

    const results = analyzeWorkout(workout, exercises, progression, 'A1')

    // Should detect T1 context and find discrepancy against squat-T1 weight
    expect(results[0].tier).toBe('T1')
    // Discrepancy check uses squat-T1 weight (100), not squat-T2 (70)
    expect(results[0].discrepancy).toBeUndefined()
  })

  it('looks up T2 progression using squat-T2 key on A2 day', () => {
    // Similar test but with A2 day where squat is T2
    // ...
  })
})
```

**Implementation**: Update `src/lib/workout-analysis.ts`

```typescript
// Import getProgressionKey
import { getTierForDay, isMainLiftRole, getProgressionKey } from './role-utils'

// In analyzeWorkout function, change line 133:
// OLD: const storedProgression = progression[exerciseId]
// NEW:
const tier = deriveTier(exerciseConfig.role, day)
const progressionKey = getProgressionKey(exerciseId, exerciseConfig.role, tier)
const storedProgression = progression[progressionKey]
```

### Phase 2: Import Path T1/T2 Detection

**Goal**: Detect T1 and T2 weights separately during routine import.

#### Step 2.1: T1/T2 Weight Detection

**Test file**: `tests/unit/t1-t2-detection.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { detectMainLiftWeights } from '@/lib/routine-importer'

describe('detectMainLiftWeights', () => {
  it('detects T1 squat weight from A1 position 1', () => {
    const routines = {
      A1: {
        exercises: [
          { templateId: 'squat', weight: 100 }, // Position 1 = T1
          { templateId: 'bench', weight: 50 },  // Position 2 = T2
        ],
      },
      A2: {
        exercises: [
          { templateId: 'bench', weight: 60 },  // Position 1 = T1
          { templateId: 'squat', weight: 70 },  // Position 2 = T2
        ],
      },
      // B1, B2 with OHP and Deadlift...
    }

    const result = detectMainLiftWeights(routines)
    const squat = result.mainLifts.find(m => m.role === 'squat')

    expect(squat?.t1.weight).toBe(100)
    expect(squat?.t1.source).toBe('Day A1, position 1')
    expect(squat?.t2.weight).toBe(70)
    expect(squat?.t2.source).toBe('Day A2, position 2')
  })

  it('flags warning when only T1 data available', () => {
    // Test partial data scenario
  })
})
```

### Phase 3: Create Path Weight Setup

**Goal**: Collect 8 weights (T1+T2 per lift) with validation.

#### Step 3.1: Weight Validation

**Test file**: `tests/unit/weight-validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { validateWeight } from '@/utils/validation'

describe('validateWeight', () => {
  it('returns error for empty value', () => {
    expect(validateWeight('', 'kg')).toEqual({
      isValid: false,
      error: 'Weight is required',
    })
  })

  it('returns error for non-numeric value', () => {
    expect(validateWeight('abc', 'kg')).toEqual({
      isValid: false,
      error: 'Must be a number',
    })
  })

  it('returns error for zero', () => {
    expect(validateWeight('0', 'kg')).toEqual({
      isValid: false,
      error: 'Must be greater than 0',
    })
  })

  it('returns error for negative value', () => {
    expect(validateWeight('-10', 'kg')).toEqual({
      isValid: false,
      error: 'Must be greater than 0',
    })
  })

  it('returns valid for positive number', () => {
    expect(validateWeight('100', 'kg')).toEqual({
      isValid: true,
      error: null,
    })
  })
})
```

### Phase 4: Dashboard Display

**Goal**: Show T1 and T2 rows separately per main lift.

#### Step 4.1: Main Lift Display Data

```typescript
// In Dashboard component, iterate over main lifts and show:
// - Lift name
// - T1 row: weight, stage indicator, scheme
// - T2 row: weight, stage indicator, scheme
```

### Phase 5: Pending Changes

**Goal**: Generate tier-specific labels.

#### Step 5.1: Tier-Specific Labels

```typescript
// When generating pending changes:
// OLD: exerciseName = "Squat"
// NEW: exerciseName = "T1 Squat" or "T2 Squat"
```

## File Checklist

### New Files

- [ ] `tests/unit/progression-keys.test.ts`
- [ ] `tests/unit/progression-independence.test.ts`
- [ ] `tests/unit/weight-validation.test.ts`
- [ ] `tests/unit/t1-t2-detection.test.ts`
- [ ] `tests/integration/import-verification-flow.test.ts`
- [ ] `tests/integration/tier-progression.test.ts`
- [ ] `src/components/common/WeightInput.tsx`

### Modified Files

- [ ] `src/lib/role-utils.ts` - Add `getProgressionKey()`
- [ ] `src/types/state.ts` - Add `ProgressionKey` type
- [ ] `src/lib/workout-analysis.ts` - Use `getProgressionKey()` for lookup
- [ ] `src/lib/progression.ts` - All lookups use new key format
- [ ] `src/hooks/useProgression.ts` - Pass tier context
- [ ] `src/lib/routine-importer.ts` - Detect T1/T2 weights separately
- [ ] `src/components/SetupWizard/WeightSetupStep.tsx` - 8 weight inputs
- [ ] `src/components/SetupWizard/ImportReviewStep.tsx` - T1/T2 verification UI
- [ ] `src/components/Dashboard/` - T1/T2 rows per lift
- [ ] `src/utils/validation.ts` - Weight validation function

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- progression-keys

# Run with coverage
npm test -- --coverage
```

## Verification Checklist

After implementation, verify:

- [ ] `npm test` passes (all 477+ tests)
- [ ] `npm run lint` passes
- [ ] Creating a new program stores 8 progression entries
- [ ] Failing T1 Squat does NOT affect T2 Squat
- [ ] Dashboard shows T1 and T2 rows per lift
- [ ] Pending changes show tier prefix (T1/T2)
- [ ] Import path detects and verifies T1/T2 weights
