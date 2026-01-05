# GZCLP Setup Wizard & Dashboard Bug Fixes

## Issues Summary

| # | Issue | Root Cause | Priority |
|---|-------|------------|----------|
| 1 | Weight unit asked multiple times | UnitSelector in both WelcomeStep AND WeightSetupStep (line 101-104) | High |
| 2 | Main lift weights asked twice | MainLiftVerification + DayReviewPanel both show weight inputs | High |
| 3 | "Warm up" detected as T1 | Position-based detection (position 0 = T1) ignores set type | High |
| 4 | T3 starting weights not collected | Import path T3s are read-only in DayReviewPanel | Medium |
| 5 | Discrepancy messages unclear | Doesn't show which tier (T1/T2) the discrepancy applies to | Medium |
| 6 | Main lift boxes empty after import | Progression keys not created with role-tier format | Critical |

---

## Phase 1: TDD - Write Failing Tests

### Task 1.1: Unit Selector Test
**File:** `tests/unit/weight-setup-step-unit.test.tsx` (new)
- Test: WeightSetupStep should NOT render UnitSelector
- Test: WeightSetupStep should display unit from props (read-only)

### Task 1.2: Import Flow Weight Test
**File:** `tests/integration/import-weight-entry.test.tsx` (new)
- Test: ImportReviewStep should NOT render MainLiftVerification
- Test: DayReviewPanel is the only source for weight entry

### Task 1.3: Warmup Detection Test
**File:** `tests/unit/routine-importer.test.ts` (extend)
- Test: `extractDayExercises` skips warmup-only exercise at position 0
- Test: First exercise with normal sets becomes T1
- Test: All-warmup routine returns `t1: null` with warning

### Task 1.4: T3 Weight Input Test
**File:** `tests/unit/day-review-panel.test.tsx` (extend)
- Test: T3ListItem renders weight input field
- Test: T3 weight change triggers `onT3WeightUpdate` callback

### Task 1.5: Discrepancy Tier Display Test
**File:** `tests/unit/discrepancy-alert.test.tsx` (new)
- Test: DiscrepancyAlert shows tier in format "Lift Name (T1)" or "Lift Name (T2)"

### Task 1.6: Progression Key Test
**File:** `tests/integration/import-progression-keys.test.tsx` (new)
- Test: After import, progression has `"squat-T1"`, `"squat-T2"` keys
- Test: MainLiftCard displays correct weights after import

---

## Phase 2: Fix Unit Selector Duplication (Issue 1)

**File:** `src/components/SetupWizard/WeightSetupStep.tsx`

**Changes:**
1. Remove `UnitSelector` import (line 11)
2. Remove `onUnitChange` prop from interface (line 32)
3. Remove UnitSelector JSX block (lines 101-104)
4. Keep unit display as read-only label

---

## Phase 3: Remove Duplicate Weight Inputs (Issue 2)

**File:** `src/components/SetupWizard/ImportReviewStep.tsx`

**Changes:**
1. Remove `MainLiftVerification` import (line 22)
2. Remove `mainLiftWeights` and `onMainLiftWeightsUpdate` props (lines 36-39)
3. Remove MainLiftVerification JSX block (lines 201-207)

**File:** `src/components/SetupWizard/index.tsx`

**Changes:**
1. Remove `mainLiftWeights` and `onMainLiftWeightsUpdate` props from ImportReviewStep call
2. Update `handleNextWorkoutComplete` to source weights from `byDay` structure

---

## Phase 4: Fix Warmup Detection (Issue 3)

**File:** `src/lib/routine-importer.ts`

**Changes:**
1. Add helper function:
```typescript
function isWarmupOnlyExercise(exercise: RoutineExerciseRead): boolean {
  if (exercise.sets.length === 0) return false
  return exercise.sets.every(set => set.type === 'warmup')
}
```

2. Update `extractDayExercises` to find first non-warmup exercise:
```typescript
// Find first exercise with normal sets for T1
let t1Index = 0
while (t1Index < routine.exercises.length && isWarmupOnlyExercise(routine.exercises[t1Index])) {
  t1Index++
}
const t1Exercise = routine.exercises[t1Index] ?? null
// Adjust t2Index and t3 start index accordingly
```

3. Add warning if warmup exercises were skipped

---

## Phase 5: Add T3 Weight Input (Issue 4)

**Approach:** Deduplicated T3 weights (one weight per unique T3 exercise, shared across days)

**File:** `src/components/SetupWizard/ImportReviewStep.tsx`

**Changes:**
1. Add a new "T3 Accessories" section below DayReviewPanel
2. Deduplicate T3s by templateId across all days
3. Show one weight input per unique T3 with days indicator (e.g., "Lat Pulldown (A1, B1)")
4. Add `onT3WeightUpdate: (templateId: string, weight: number) => void` prop

**File:** `src/components/SetupWizard/index.tsx`

**Changes:**
1. Add `handleT3WeightUpdate` handler that updates all occurrences of that T3 across days
2. Pass to ImportReviewStep

**Note:** This matches the create path behavior where T3 weights are deduplicated.

---

## Phase 6: Improve Discrepancy Display (Issue 5)

**File:** `src/hooks/useProgression.ts`

**Changes to DiscrepancyInfo type:**
```typescript
export interface DiscrepancyInfo {
  exerciseId: string
  exerciseName: string
  tier: Tier  // ADD THIS
  storedWeight: number
  actualWeight: number
  workoutId: string
  workoutDate: string
}
```

**File:** `src/components/Dashboard/index.tsx` (or DiscrepancyAlert if separate)

**Changes:**
```tsx
<span className="font-medium">
  {discrepancy.exerciseName} ({discrepancy.tier})
</span>
```

---

## Phase 7: Fix Progression Key Storage (Issue 6)

**Scope:** Fix new imports only (no migration for existing users)

**File:** `src/components/SetupWizard/index.tsx`

**Changes in `handleNextWorkoutComplete`:**

After creating exercises, use role-tier keys for progression:
```typescript
// For each day's T1 and T2:
if (dayData.t1?.role && isMainLiftRole(dayData.t1.role)) {
  const progressionKey = `${dayData.t1.role}-T1`  // e.g., "squat-T1"
  const weight = dayData.t1.userWeight ?? dayData.t1.detectedWeight
  program.setProgressionState(progressionKey, {
    exerciseId,
    currentWeight: weight,
    baseWeight: weight,
    stage: dayData.t1.userStage ?? dayData.t1.detectedStage ?? 0,
    ...
  })
}
// Similar for T2
```

---

## Parallelization Strategy

```
Phase 1 (All tests in parallel)
         |
         v
+--------+--------+
|        |        |
v        v        v
Phase 2  Phase 3  Phase 4  (Independent - parallel)
         |
         v
      Phase 5  (Depends on Phase 3 callbacks)
         |
         v
      Phase 6  (Independent)
         |
         v
      Phase 7  (Depends on Phase 3 weight source)
```

---

## Critical Files

| File | Changes |
|------|---------|
| `src/components/SetupWizard/WeightSetupStep.tsx` | Remove UnitSelector |
| `src/components/SetupWizard/ImportReviewStep.tsx` | Remove MainLiftVerification |
| `src/components/SetupWizard/DayReviewPanel.tsx` | Add T3 weight input |
| `src/lib/routine-importer.ts` | Skip warmup-only exercises |
| `src/hooks/useProgression.ts` | Add tier to DiscrepancyInfo |
| `src/components/SetupWizard/index.tsx` | Fix progression keys, wire callbacks |
| `src/components/Dashboard/index.tsx` | Show tier in discrepancy alerts |

---

## Verification Checklist

- [ ] Unit selector appears ONLY in WelcomeStep
- [ ] Main lift weight inputs appear ONLY in DayReviewPanel tabs (A1/B1/A2/B2)
- [ ] "Warm up" exercises at position 0 are skipped, first normal exercise = T1
- [ ] T3 starting weights are editable (deduplicated section below day tabs)
- [ ] Discrepancy alerts show "Squat (T1)" or "Squat (T2)" format
- [ ] MainLiftCard shows correct weights after import setup completes
- [ ] All tests pass (`npm test`)

---

## User Decisions

1. **T3 Weights:** Deduplicated (one weight per unique T3, shared across days)
2. **Migration:** Fix new imports only, no migration for existing users
