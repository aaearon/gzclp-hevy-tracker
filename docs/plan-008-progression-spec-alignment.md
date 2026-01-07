# Plan: Fix T3 Progression and Update Spec Documentation

## Summary

After comparing the functional spec (`docs/GZCLP-Progression-Spec.md`) against the codebase, we identified discrepancies and resolved them with user input:

| Area | Spec Says | Code Does | Resolution |
|------|-----------|-----------|------------|
| T1/T2 Success | Sum total reps vs volume base | Per-set minimum check | **Keep code** - update spec |
| T2 Reset | Last Stage 1 weight + 15-20 lb | 85% of current weight | **Keep code** - update spec |
| T3 Progression | AMRAP set >= 25 reps | Total reps >= 25 | **Fix code** - match spec |

## Tasks

### Task 1: Fix T3 Success Logic (Code Change)
**File:** `src/lib/progression.ts`

Change `isT3Success()` to check only the AMRAP (last) set for 25+ reps instead of summing all sets.

**Current (lines 306-309):**
```typescript
export function isT3Success(reps: number[]): boolean {
  const totalReps = reps.reduce((sum, r) => sum + r, 0)
  return totalReps >= T3_SUCCESS_THRESHOLD
}
```

**New:**
```typescript
export function isT3Success(reps: number[]): boolean {
  if (reps.length === 0) return false
  const amrapReps = reps[reps.length - 1] ?? 0
  return amrapReps >= T3_SUCCESS_THRESHOLD
}
```

Also update `calculateT3Progression()` reason messages to reference AMRAP reps instead of total reps.

### Task 2: Update T3 Tests
**File:** `tests/unit/progression-t3.test.ts`

Update tests to match new AMRAP-only behavior:
- `[15, 10, 5]` (30 total, AMRAP=5) → **FAILURE** (was success)
- `[10, 10, 25]` (45 total, AMRAP=25) → **SUCCESS**
- `[15, 15, 25]` (55 total, AMRAP=25) → **SUCCESS**
- `[8, 8, 24]` (40 total, AMRAP=24) → **FAILURE**

Key test updates:
- Change success detection tests to use AMRAP-based examples
- Update failure cases that now pass (high total but low AMRAP)
- Fix edge case tests for empty arrays

### Task 3: Update Spec Documentation
**File:** `docs/GZCLP-Progression-Spec.md`

Update these sections to match implementation:

1. **Section 2.2 (T1 Success Criteria):** Clarify that each set must individually meet the rep target (not just total volume)

2. **Section 3.2 (T2 Success Criteria):** Same clarification - per-set check

3. **Section 8.3 (Partial Set Completion):** Remove/revise the "sum total reps" guidance since we use per-set checks

4. **Section 3.5 (T2 Reset Protocol):** Change from "last Stage 1 weight + 15-20 lb" to "85% of current weight" to match T1 reset and code behavior

## Files to Modify

1. `src/lib/progression.ts` - Fix `isT3Success()` and `calculateT3Progression()` reason
2. `tests/unit/progression-t3.test.ts` - Update all T3 tests for AMRAP-only behavior
3. `docs/GZCLP-Progression-Spec.md` - Update spec to match code for T1/T2, clarify T3

## Test Plan

1. Run existing tests (expect T3 tests to fail)
2. Update T3 tests for new behavior
3. Run `npm test` to verify all tests pass
4. Manual verification: T3 with [15,15,9] should now be FAILURE (AMRAP=9 < 25)
