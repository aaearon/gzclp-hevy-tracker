# Research: Exercise Classification System

**Feature**: 003-exercise-classification
**Date**: 2026-01-03

## Research Tasks Completed

### 1. Existing State Management Pattern

**Question**: How does the existing codebase manage state and localStorage?

**Findings**:
- `useLocalStorage` hook in `src/hooks/useLocalStorage.ts` handles persistence
- Root state stored under key `gzclp_state` as `GZCLPState` interface
- Cross-tab sync via `StorageEvent`
- State includes: `exercises: Record<string, ExerciseConfig>` with `tier: Tier` field

**Decision**: Extend `ExerciseConfig.tier` to support new category type, or add separate classifications store
**Rationale**: Separate store is cleaner - avoids modifying existing progression logic that depends on `Tier` type
**Alternative Rejected**: Extending `Tier` type would require changes throughout progression logic

### 2. Hevy Exercise Identification

**Question**: How are exercises identified from Hevy API?

**Findings**:
- `ExerciseConfig` has `hevyTemplateId: string` field (from `src/types/state.ts:58`)
- Hevy API returns `exercise_template_id` on routine exercises
- Existing import uses `templateId` for matching (see `ImportedExercise` type)

**Decision**: Use `hevyTemplateId` as the canonical identifier for classification matching
**Rationale**: Already established pattern; unique per exercise in Hevy
**Alternative Rejected**: Using exercise name would cause false matches for similarly named exercises

### 3. Collapsible Section Implementation

**Question**: Best approach for collapsible warmup/cooldown sections in React?

**Findings**:
- User specified: "native HTML details/summary or simple React state toggle"
- Constitution requires mobile-first with 44x44px tap targets
- Existing codebase uses simple React state (no animation libraries)

**Decision**: Use native `<details>/<summary>` with Tailwind styling
**Rationale**: Zero JS overhead, accessible by default, works without React hydration
**Alternative Rejected**: React state toggle adds unnecessary complexity for disclosure pattern

### 4. Offline Sync Queue Pattern

**Question**: How to implement queue-and-retry for failed Hevy syncs?

**Findings**:
- Existing `HevyClient` handles errors but no queue mechanism
- `useOnlineStatus` hook exists in `src/hooks/useOnlineStatus.ts`
- Constitution: "Graceful degradation MUST be implemented for API failures"

**Decision**: New `sync-queue.ts` module with localStorage-backed queue
**Rationale**: Persist queue across sessions; retry on online status change
**Alternative Rejected**: In-memory queue would lose pending syncs on page reload

### 5. Import Flow Integration Point

**Question**: Where in the setup wizard should classification happen?

**Findings**:
- Current flow: `RoutineSourceStep` → `RoutineAssignmentStep` → `ImportReviewStep` → ...
- `ImportReviewStep` shows exercises with weight/stage review
- `ImportedExercise` type already has `slot: GZCLPSlot` assigned

**Decision**: Add classification dropdown in `ImportReviewStep`, block completion until all classified
**Rationale**: Users already reviewing exercises here; natural integration point
**Alternative Rejected**: Separate step would add friction; inline is more efficient

### 6. Supplemental Display Position

**Question**: Where should supplemental exercises appear in workout view?

**Findings**:
- Spec says "inline with visual marker/badge" (FR-014)
- Current `TierSection` component groups by T1/T2/T3
- GZCLP exercises should remain prominent

**Decision**: Display supplemental after T3 section with distinct badge, not in collapsible
**Rationale**: Supplemental is active workout content (unlike warmup prep/cooldown recovery)
**Alternative Rejected**: Collapsible would hide potentially important work

## Summary of Decisions

| Area | Decision | Impact |
|------|----------|--------|
| State Storage | Separate `classifications` store in localStorage | Low - additive |
| Exercise Matching | Use `hevyTemplateId` as key | None - existing pattern |
| Collapsible UI | Native `<details>/<summary>` | Low - simple implementation |
| Sync Queue | localStorage-backed with online detection | Medium - new module |
| Import Integration | Extend `ImportReviewStep` | Medium - modify existing |
| Supplemental Display | After T3 with badge, not collapsible | Low - UI only |

## Outstanding Questions

None. All technical decisions resolved.
