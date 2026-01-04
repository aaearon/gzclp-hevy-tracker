# Research: Separate T1 and T2 Progression Tracking

**Feature**: 005-t1-t2-progression
**Date**: 2026-01-03

## Problem Analysis

### Current State

The progression tracking system has a fundamental bug: it uses `exerciseId` as the key for `ProgressionState`, meaning each exercise has exactly ONE progression state. However, in GZCLP:

- Each main lift (squat, bench, ohp, deadlift) appears on TWO different days
- On one day it's trained as T1 (heavy: 5x3→6x2→10x1)
- On another day it's trained as T2 (lighter: 3x10→3x8→3x6)

**Example**: Squat is T1 on Day A1 and T2 on Day A2. When the user fails T1 Squat and moves to stage 1, the T2 Squat (completely different weight and rep scheme) is incorrectly affected.

### Code Locations

| File | Current Behavior | Issue |
|------|------------------|-------|
| `src/types/state.ts:140` | `progression: Record<string, ProgressionState>` | Key is `exerciseId` |
| `src/lib/workout-analysis.ts:133` | `const storedProgression = progression[exerciseId]` | Looks up by `exerciseId` only |
| `src/lib/progression.ts` | All progression calculations use `exerciseId` | No tier distinction |

### Current Role System

The codebase already has a role-based system (`src/lib/role-utils.ts`) with:
- `T1_MAPPING`: Which role is T1 on each day (A1→squat, B1→ohp, A2→bench, B2→deadlift)
- `T2_MAPPING`: Which role is T2 on each day (A1→bench, B1→deadlift, A2→squat, B2→ohp)
- `getTierForDay(role, day)`: Returns 'T1' | 'T2' | 'T3' | null

This tier derivation is correct but not used for progression storage.

## Solution Design

### Decision: Composite Key for Progression State

**Chosen Approach**: Use `role-tier` composite key for main lifts (e.g., "squat-T1", "squat-T2")

**Rationale**:
1. Role already identifies the exercise uniquely for main lifts
2. Tier distinguishes T1 vs T2 context
3. T3 exercises continue to use `exerciseId` (no tier distinction needed)
4. Minimal change to ProgressionState structure itself

**Alternatives Considered**:

| Alternative | Rejected Because |
|-------------|------------------|
| Nested structure `{[role]: {T1: state, T2: state}}` | Breaks existing patterns, requires restructuring all lookups |
| Separate `t1Progression` and `t2Progression` records | Duplicates logic, harder to maintain |
| Add `tier` field to ProgressionState | Doesn't solve the key collision problem |

### Key Format Specification

```typescript
type ProgressionKey = `${MainLiftRole}-T1` | `${MainLiftRole}-T2` | string

// Main lifts: "squat-T1", "squat-T2", "bench-T1", "bench-T2", etc.
// T3 exercises: Use exerciseId directly (no tier suffix)
```

### Helper Function

```typescript
function getProgressionKey(
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

## Impact Analysis

### Files Requiring Modification

| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/role-utils.ts` | ADD | `getProgressionKey()` helper function |
| `src/types/state.ts` | ADD | `ProgressionKey` type alias |
| `src/lib/workout-analysis.ts` | MODIFY | Use `getProgressionKey()` for lookup (line 133) |
| `src/lib/progression.ts` | MODIFY | All progression lookups use new key format |
| `src/hooks/useProgression.ts` | MODIFY | Pass tier context to analysis functions |
| `src/lib/routine-importer.ts` | MODIFY | Detect and store T1/T2 weights separately during import |
| `src/components/SetupWizard/WeightSetupStep.tsx` | MODIFY | Collect 8 weights instead of 4 |
| `src/components/SetupWizard/ImportReviewStep.tsx` | MODIFY | Add T1/T2 verification UI |
| `src/components/Dashboard/` | MODIFY | Display T1/T2 rows separately |

### Data Model Changes

**Before** (4 progression entries for main lifts):
```json
{
  "progression": {
    "exercise-uuid-squat": { "currentWeight": 100, "stage": 0 },
    "exercise-uuid-bench": { "currentWeight": 60, "stage": 0 },
    "exercise-uuid-ohp": { "currentWeight": 40, "stage": 0 },
    "exercise-uuid-deadlift": { "currentWeight": 120, "stage": 0 }
  }
}
```

**After** (8 progression entries for main lifts):
```json
{
  "progression": {
    "squat-T1": { "currentWeight": 100, "stage": 0 },
    "squat-T2": { "currentWeight": 70, "stage": 0 },
    "bench-T1": { "currentWeight": 60, "stage": 0 },
    "bench-T2": { "currentWeight": 42, "stage": 0 },
    "ohp-T1": { "currentWeight": 40, "stage": 0 },
    "ohp-T2": { "currentWeight": 28, "stage": 0 },
    "deadlift-T1": { "currentWeight": 120, "stage": 0 },
    "deadlift-T2": { "currentWeight": 84, "stage": 0 }
  }
}
```

## Import Path: T1/T2 Weight Detection

### Detection Strategy

When importing routines, detect T1 and T2 weights from their respective days:

| Main Lift | T1 Day | T2 Day |
|-----------|--------|--------|
| Squat | A1 (position 1) | A2 (position 2) |
| Bench | A2 (position 1) | A1 (position 2) |
| OHP | B1 (position 1) | B2 (position 2) |
| Deadlift | B2 (position 1) | B1 (position 2) |

### ImportedExercise Extension

```typescript
interface MainLiftImportData {
  role: MainLiftRole
  t1Weight: number
  t1Source: string  // e.g., "Day A1, position 1"
  t2Weight: number
  t2Source: string  // e.g., "Day A2, position 2"
  hasWarning: boolean  // True if only one tier detected
}
```

### Verification UI Flow

1. Show detected T1/T2 weights per lift with source indicators
2. Allow swap (if detection reversed T1/T2)
3. Allow manual edit of either weight
4. Validate: T1 weight typically > T2 weight (warn if reversed)
5. Confirm to finalize

## Create Path: 8-Weight Collection

### UI Layout (Mobile-First)

```
Squat
├── T1 (5x3+): [____] kg
└── T2 (3x10): [____] kg (auto-suggests 70% of T1)

Bench Press
├── T1 (5x3+): [____] kg
└── T2 (3x10): [____] kg (auto-suggests 70% of T1)

Overhead Press
├── T1 (5x3+): [____] kg
└── T2 (3x10): [____] kg (auto-suggests 70% of T1)

Deadlift
├── T1 (5x3+): [____] kg
└── T2 (3x10): [____] kg (auto-suggests 70% of T1)
```

### Auto-Suggestion Logic

```typescript
function suggestT2Weight(t1Weight: number, unit: WeightUnit): number {
  const t2Weight = t1Weight * 0.7
  return roundWeight(t2Weight, unit)  // Existing roundWeight function
}
```

## Validation Rules

### Weight Input Validation

| Rule | Error Message |
|------|---------------|
| Empty | "Weight is required" |
| Non-numeric | "Must be a number" |
| Zero | "Must be greater than 0" |
| Negative | "Must be greater than 0" |
| Exceeds 500kg | "Weight seems too high" |

### T1/T2 Relationship Validation (Warning only)

- If T2 ≥ T1: "T2 is usually lighter than T1 - please verify"
- If T2 < T1 × 0.5: "T2 seems very light compared to T1 - please verify"

## Test Strategy

### Unit Tests (TDD First)

1. `progression-keys.test.ts`
   - `getProgressionKey()` returns correct key format
   - Main lifts get role-tier key
   - T3 exercises get exerciseId key

2. `progression-independence.test.ts`
   - T1 failure does not affect T2 state
   - T2 failure does not affect T1 state
   - Success on T1 updates only T1

3. `weight-validation.test.ts`
   - Real-time validation catches all error cases
   - Valid inputs pass validation

4. `t1-t2-detection.test.ts`
   - Detection from standard GZCLP routine order
   - Handling of missing tier data
   - Source string generation

### Integration Tests

1. `import-verification-flow.test.ts`
   - Full import with T1/T2 verification step
   - Swap functionality
   - Manual edit functionality

2. `tier-progression.test.ts`
   - End-to-end: complete T1 workout → only T1 progression changes
   - End-to-end: fail T2 workout → only T2 stage advances

## Implementation Order

Based on priority and dependencies:

1. **P1: Core Progression Independence**
   - Add `getProgressionKey()` to role-utils.ts
   - Update workout-analysis.ts to use new key
   - Update progression.ts calculations
   - Write unit tests for key generation and independence

2. **P2: Import Path**
   - Modify routine-importer.ts for T1/T2 detection
   - Add verification step UI to ImportReviewStep
   - Write detection and verification tests

3. **P2: Create Path**
   - Modify WeightSetupStep for 8 inputs
   - Add auto-suggestion logic
   - Add real-time validation
   - Write validation tests

4. **P3: Dashboard Display**
   - Update Dashboard to show T1/T2 rows per lift
   - Show tier-specific weight and scheme

5. **P3: Pending Changes**
   - Update pending change labels with tier prefix
   - Ensure approval affects only correct tier

## Dependencies

- No new npm packages required
- Existing patterns: React hooks, localStorage, Tailwind CSS
- Existing utilities: roundWeight(), validation patterns
