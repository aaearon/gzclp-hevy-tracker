# Research: Routine Selection Wizard

**Date**: 2026-01-03
**Branch**: `002-routine-selection-wizard`

## Research Questions

### 1. Stage Detection Algorithm

**Question**: How to reliably detect T1/T2 stages from routine set configurations, especially handling AMRAP sets?

**Research Findings**:

The Hevy API provides sets with `type`, `weight_kg`, and `reps` fields. Key observations:

1. **Set Types**: Filter to `type === 'normal'` to exclude warmup, dropset, failure sets
2. **AMRAP Handling**: The final set in GZCLP is "as many reps as possible", so actual logged reps may exceed target
3. **Detection Strategy**: Use set count + rep count from non-final sets

**Decision**: Use modal rep count (most common value) from all normal sets, with fallback to first set's reps

**Rationale**:
- AMRAP set may exceed target, but other sets maintain the prescribed reps
- If all sets vary (user did different reps each set), prompt for manual selection
- Modal value handles edge cases like one set being logged incorrectly

**Algorithm**:
```typescript
function detectStage(normalSets: Set[]): Stage | null {
  const setCount = normalSets.length;
  const repCounts = normalSets.map(s => s.reps ?? 0);
  const modalReps = getMode(repCounts);

  // T1 detection
  if (setCount === 5 && modalReps === 3) return 0;  // 5x3+
  if (setCount === 6 && modalReps === 2) return 1;  // 6x2+
  if (setCount === 10 && modalReps === 1) return 2; // 10x1+

  // T2 detection
  if (setCount === 3 && modalReps === 10) return 0; // 3x10
  if (setCount === 3 && modalReps === 8) return 1;  // 3x8
  if (setCount === 3 && modalReps === 6) return 2;  // 3x6

  return null; // No match - prompt manual selection
}
```

**Alternatives Considered**:
- Min/median reps: Less reliable than mode for detecting intended rep scheme
- Only check first set: Fails if first set was logged wrong
- Check all sets match exactly: Too strict, fails on AMRAP

**Stage Numbering Note**: Data model uses `0 | 1 | 2` internally, spec uses "Stage 1, 2, 3" for display. Map as: Stage 1 = 0, Stage 2 = 1, Stage 3 = 2.

---

### 2. T3 Exercise Extraction Strategy

**Question**: Should T3 exercises be extracted from A1 only, or merged from all routines?

**Research Findings**:

Analyzed standard GZCLP program structure:
- T1/T2 exercises are day-specific (Squat on A1, OHP on B1, etc.)
- T3 exercises are typically shared across all days (same accessories every workout)
- However, some users customize with different T3s per day

**Decision**: Extract T3s from A1 routine as canonical, with user review opportunity

**Rationale**:
1. **Simplicity**: GZCLP standard has same T3s all days
2. **Spec Alignment**: FR-009 explicitly specifies A1 as source
3. **User Control**: Review step (FR-012) allows modification before finalizing
4. **Edge Case Handling**: If user has different T3s per day, they can adjust in review

**Alternative Considered** (from Gemini review):
- Merge T3s from all routines, deduplicate, let user select if >3
- Rejected because: Adds complexity, unclear which weight/stage to use for duplicates, and review step already provides modification capability

---

### 3. Mobile UX for Routine Selection

**Question**: Best patterns for selecting from 50+ routines on mobile?

**Research Findings**:

FR-007 requires search/filter for >10 routines. Mobile UX best practices:

1. **Full-screen modal** instead of native dropdown (native dropdowns are terrible on mobile with many items)
2. **Sticky search bar** at top for immediate filtering
3. **Rich list items** showing routine name + first 2-3 exercise names
4. **Sort by recent** (modification date) as default
5. **Minimum tap target** 44x44px (per constitution)

**Decision**: Implement `RoutineSelector` component as full-screen modal with:
- Search input (filters by routine title)
- Sorted by `updated_at` descending
- Each item shows: title, exercise count, first 2 exercise names
- Tap selects and closes modal

**Implementation Note**: Use existing Tailwind patterns from `ExerciseSelector` component as reference.

---

### 4. Wizard Flow Edge Cases

**Question**: How to handle routines with non-standard structures?

**Research Findings**:

Edge cases from spec:
- Routine with <2 exercises: Can't extract T2, show warning
- Routine with 0 normal sets: Can't detect stage, prompt manual
- Same routine for multiple days: Allow with warning (user might have a single "GZCLP" routine)
- Partial assignment: Allow proceeding, unassigned days need manual config

**Decision**: Implement defensive extraction with clear error states

**Error Handling Matrix**:
| Condition | User Experience |
|-----------|-----------------|
| Routine has <2 exercises | Warning: "No T2 found. Assign manually in review." |
| No normal sets for exercise | Warning: "Stage could not be detected. Please select." |
| Weight is null | Use 0, display as "Bodyweight" |
| Same routine for 2+ days | Warning badge: "Same routine selected for multiple days" |

---

### 5. Weight Extraction

**Question**: How to extract current working weight from routine?

**Research Findings**:

Hevy routines store sets with `weight_kg` (nullable). Approach:

1. Filter to normal sets
2. Take the weight from the first normal set (or max weight across sets)
3. Convert to user's preferred unit if needed

**Decision**: Use maximum weight from normal sets

**Rationale**:
- If sets have varying weights (e.g., ramp up), max weight is likely the working weight
- Handles edge case of ascending pyramid sets
- Weight conversion handled by existing `UserSettings.weightUnit`

---

## Technology Best Practices

### React Component Patterns

**For Multi-Step Wizard**:
- State machine pattern for step transitions (already in place)
- Lift extraction logic to `lib/` for testability
- Use custom hook (`useRoutineImport`) for import workflow state

### Testing Strategy

Per constitution (TDD mandatory):
1. Unit tests for `stage-detector.ts` covering all rep schemes
2. Unit tests for `routine-importer.ts` covering extraction logic
3. Integration tests for wizard flow
4. Test edge cases: AMRAP detection, missing data, weight conversion

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stage detection incorrect | Medium | High | Modal rep detection + manual override |
| T3 mismatch for users with per-day T3s | Low | Medium | Review step allows modification |
| Mobile UX poor for many routines | Low | Medium | Full-screen modal with search |
| Weight extraction wrong | Low | Medium | User can edit in review step |

---

## Decisions Summary

| Topic | Decision | Confidence |
|-------|----------|------------|
| Stage detection | Modal reps + set count matching | High |
| AMRAP handling | Use mode of all normal set reps | High |
| T3 extraction | A1 only, with review opportunity | High |
| Routine selector | Full-screen modal with search | High |
| Weight extraction | Max weight from normal sets | Medium |
| Stage numbering | Internal 0/1/2, display as Stage 1/2/3 | High |
