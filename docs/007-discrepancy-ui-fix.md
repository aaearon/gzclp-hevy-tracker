# Fix Weight Discrepancy UI

## Problem Summary

The "Weight Discrepancy Detected" alert has two issues:
1. **Same exercise+tier listed multiple times** - syncing multiple workouts creates duplicate entries
2. **Missing context** - no workout date, direction indicator, or impact explanation

## Solution

### 1. Deduplicate Discrepancies

Create utility to deduplicate by `exerciseId+tier`, keeping only the most recent entry.

**New file**: `src/lib/discrepancy-utils.ts`
```typescript
export function deduplicateDiscrepancies(discrepancies: DiscrepancyInfo[]): DiscrepancyInfo[]
// Groups by `${exerciseId}-${tier}`, keeps entry with most recent workoutDate
```

**Modify**: `src/hooks/useProgression.ts` (line ~128)
- Import and apply `deduplicateDiscrepancies()` before `setDiscrepancies()`

### 2. Enhance UI Display

**Modify**: `src/components/Dashboard/DiscrepancyAlert.tsx`

Add:
- **Workout date**: "from Jan 3" after exercise name
- **Direction indicator**: Up/down arrow + color (green for higher, amber for lower)
- **Impact text**: Brief explanation under each button

Updated layout:
```
Squat (T1) - from Jan 3
Stored: 100kg vs [up arrow] Actual: 105kg (green)

[Use 105kg]          [Keep 100kg]
 Update progression   Keep current value
```

## Files to Change

| File | Action |
|------|--------|
| `src/lib/discrepancy-utils.ts` | CREATE |
| `tests/unit/discrepancy-utils.test.ts` | CREATE |
| `src/hooks/useProgression.ts` | MODIFY (line ~128) |
| `src/components/Dashboard/DiscrepancyAlert.tsx` | MODIFY |
| `tests/unit/discrepancy-alert-tier.test.tsx` | MODIFY |

## Implementation Order (TDD)

1. Write tests for `deduplicateDiscrepancies()` utility
2. Implement `deduplicateDiscrepancies()` utility
3. Write tests for enhanced UI (date, direction, impact text)
4. Modify `useProgression.ts` to apply deduplication
5. Modify `DiscrepancyAlert.tsx` with UI enhancements
6. Run all tests, verify passing

## Test Cases

**Deduplication:**
- Returns empty array when given empty array
- Returns single item unchanged
- Deduplicates by exerciseId+tier, keeping most recent
- Handles same exercise with different tiers separately
- Handles ISO date strings correctly

**UI:**
- Displays workout date in format "from Jan 3"
- Shows up arrow and green when actual > stored
- Shows down arrow and amber when actual < stored
- Shows impact text under each button
