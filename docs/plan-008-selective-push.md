# Feature 008: Selective Push to Hevy

## Summary

Enhance the Push to Hevy functionality to give users per-exercise control:
1. **Selective Push**: Choose which exercise weight changes to push (not all-or-nothing)
2. **Pull from Hevy**: Accept Hevy's weight as correct and update local state instead

## Current State

- `PushConfirmDialog` shows all changes but only allows confirm ALL or cancel
- `ExerciseRow` displays diff but has no action controls
- Push updates entire routines via `ensureGZCLPRoutines()`

## Design

### Action Model

Each exercise with a weight difference can have one of three actions:
- **Push** (default): Update Hevy with local weight
- **Pull**: Accept Hevy weight, update local state (do not push)
- **Skip**: Keep both unchanged (neither push nor pull)

### UI Approach

Add a 3-way toggle to each `ExerciseRow`:
```
[Push ->] [Skip -] [<- Pull]
```
- Push: Blue/indigo highlight, right arrow
- Skip: Gray, dash
- Pull: Green highlight, left arrow
- Disabled for unchanged exercises (only Skip available)

Footer shows: `Push: 3 | Pull: 1 | Skip: 2`

## Files to Modify

### 1. `src/lib/push-preview.ts`
- Add `progressionKey` field to `ExerciseDiff` interface
- Add `SelectableExerciseDiff` type with `action: 'push' | 'pull' | 'skip'`
- Add `SelectablePushPreview` type with action counts
- Add `buildSelectablePushPreview()` wrapper function

### 2. `src/components/Dashboard/PushConfirmDialog.tsx`
- Add `ExerciseActionSelector` sub-component (3-way toggle)
- Add local state for action selections
- Update props to include `onActionChange` callback
- Update footer to show push/pull/skip counts
- Update confirm button label based on actions

### 3. `src/lib/routine-builder.ts`
- Add `buildSelectiveRoutinePayload()` that accepts weight overrides
- Exercises marked skip/pull use Hevy's current weight instead of local

### 4. `src/lib/routine-manager.ts`
- Add `syncGZCLPRoutines()` orchestrator function
- Processes push/pull/skip actions per exercise
- Returns `pullUpdates` for exercises that need local state update

### 5. `src/components/Dashboard/index.tsx`
- Store `hevyState` for use during confirm
- Add `handleActionChange` callback
- Update `handleConfirmPush` to use `syncGZCLPRoutines()`
- Apply pull updates to local progression state

## Implementation Tasks

### Phase 1: Types & Preview (parallelizable)
1. Add `progressionKey` to `ExerciseDiff` in `push-preview.ts`
2. Add `SyncAction`, `SelectableExerciseDiff`, `SelectablePushPreview` types
3. Add `buildSelectablePushPreview()` function

### Phase 2: Selective Builder (parallelizable)
1. Add `SelectiveExerciseOverride` type to `routine-builder.ts`
2. Add `buildSelectiveRoutinePayload()` function
3. Add `syncGZCLPRoutines()` to `routine-manager.ts`

### Phase 3: UI Components
1. Create `ExerciseActionSelector` component
2. Update `ExerciseRow` to include action selector
3. Update `PushConfirmDialog` with selection state and callbacks

### Phase 4: Dashboard Integration
1. Store `hevyState` in Dashboard state
2. Wire up action change handler
3. Update confirm handler to use selective sync
4. Apply pull updates to local progression

### Phase 5: Tests (parallelizable)
1. Unit tests for `buildSelectablePushPreview()`
2. Unit tests for `buildSelectiveRoutinePayload()`
3. Unit tests for `syncGZCLPRoutines()`
4. Component tests for `PushConfirmDialog` with selections

### Phase 6: Documentation
1. Update feature docs

## Edge Cases

1. **New routines**: Disable Pull option when `oldWeight` is null (no Hevy weight to pull)
2. **All skipped**: Show warning if no actions selected, disable confirm button
3. **Stage on pull**: Preserve current stage, but reset `baseWeight` to pulled weight
4. **Same exercise T1/T2**: Uses `progressionKey` (e.g., `squat-T1` vs `squat-T2`) so they're independent
