# Feature: Unified Weight Reconciliation

**Goal**: Replace `DiscrepancyAlert` + `PushConfirmDialog` with single "Weight Reconciliation" screen showing all 3 weight sources.

**Architectural Impact**: HIGH - Core sync flow refactor
**Risk Level**: MEDIUM-HIGH (manageable with mitigations)
**Status**: APPROVED with critical refinements required

## User Requirements
- Confusing UX & code complexity are pain points
- Must keep "wrong weight lifted" detection (critical)
- Open to large refactor

## Architectural Review Summary

**Strengths**:
- 3-way comparison (Local/Routine/Workout) is the correct abstraction
- Unified mental model reduces cognitive load vs current fragmented system
- Type design is well-structured and exhaustive
- Smart defaults reduce user friction

**Critical Issues** (must address before implementation):
1. Transaction atomicity - API/local state sync requires two-phase commit
2. Orchestration layer - Logic must stay in hook, not Dashboard component
3. Skip action persistence - Must integrate with existing `AcknowledgedDiscrepancy`
4. Missing type fields - Add `workoutId`, `isAcknowledged`, `previousWeight`

**External Validation**: Gemini 3 Pro independently identified same top 3 critical issues

## Frontend/UX Review Summary

**Strengths**:
- Unified flow (single Sync button) is a significant UX improvement
- Smart defaults reduce user decisions
- Consistent action model across all exercises

**Critical UX Issues** (must address):

| Priority | Issue | Recommendation |
|----------|-------|----------------|
| **High** | Mobile layout breaks | Stack weight columns vertically on <640px screens |
| **High** | Missing accessibility | Add focus trap + ARIA roles for modal and action selector |
| **Medium** | Silent modal close | Show success state with checkmark before closing |
| **Medium** | Too many action buttons | Show only relevant actions per status type |
| **Medium** | Spinner loading | Use skeleton placeholders instead |
| **Low** | No undo | Add timed toast with "Undo" after applying changes |

**Contextual Action Buttons** (reduce cognitive load):
```
Status: match         → No buttons (just checkmark)
Status: local_differs → [Push to Hevy] [Skip]
Status: workout_differs → [Keep Local] [Use Workout Weight] [Skip]
Status: routine_differs → [Keep Local] [Pull from Hevy] [Skip]
Status: mixed         → All 4 options (rare case)
```

---

## Design: Three-Way Weight Comparison

### Weight Sources
| Source | Description | Current Location |
|--------|-------------|------------------|
| **Local** | App's progression state | `progression[key].currentWeight` |
| **Routine** | Hevy routine template | Fetched via `getRoutine()` |
| **Workout** | What user actually lifted | From `analyzeWorkout()` |

### Status Detection
```
All match       → No action needed (green checkmark)
Local differs   → User progressed, needs to push (normal)
Routine differs → Template out of sync with local
Workout differs → User lifted wrong weight (CRITICAL - yellow warning)
Mixed           → All three different (needs manual review)
```

### Actions Per Exercise
- **Accept Local**: Push local weight to Hevy routine
- **Accept Routine**: Pull Hevy routine weight to local
- **Accept Workout**: Use workout weight for both (rare)
- **Skip**: No change

---

## Implementation Plan

### Phase 1: Core Types & Logic

**Create `src/lib/reconciliation.ts`**

**CRITICAL**: This module must be pure logic with NO React hooks or API calls. All side effects belong in `useReconciliation`.

```typescript
interface WeightSources {
  /** All weights in USER'S preferred unit (kg or lbs) - converted during build */
  local: number | null
  routine: number | null
  workout: number | null
}

type SourceStatus =
  | 'match' | 'local_differs' | 'routine_differs'
  | 'workout_differs' | 'mixed'

type ReconcileAction =
  | 'accept_local' | 'accept_routine'
  | 'accept_workout' | 'skip'

interface ReconcileItem {
  exerciseId: string
  exerciseName: string
  tier: Tier
  progressionKey: string
  day: GZCLPDay
  sources: WeightSources
  status: SourceStatus
  action: ReconcileAction

  // ADDED: Required for UI and persistence
  workoutDate: string | null
  workoutId: string | null        // For AcknowledgedDiscrepancy integration
  previousWeight?: number          // For "65kg → 67.5kg" diff display
  isAcknowledged: boolean          // Marks previously skipped conflicts
}

interface ReconciliationPreview {
  days: ReconcileDayGroup[]
  matchCount: number
  conflictCount: number

  // ADDED: Action counts for summary
  pushCount: number
  pullCount: number
  skipCount: number

  // ADDED: Error handling
  hasErrors: boolean
  errors: Array<{ exerciseId: string; message: string }>
}
```

**Functions:**

1. **`buildReconciliationPreview()`** - 3-way comparison builder
   - Accepts `acknowledgedDiscrepancies` to filter out previously skipped conflicts
   - Normalizes ALL weights to user's preferred unit before comparison
   - Returns complete preview with smart defaults

2. **`determineStatus(sources: WeightSources): SourceStatus`**
   - Uses epsilon comparison (< 0.01) for float equality
   - Exhaustive mapping of all 5 status types
   - **TEST REQUIREMENT**: 100% coverage with all combinations + null handling

3. **`getDefaultAction(status: SourceStatus): ReconcileAction`**
   - `match` → `skip`
   - `local_differs` → `accept_local` (push to Hevy)
   - `routine_differs` → `accept_local` (local is source of truth)
   - `workout_differs` → `accept_local` (treat workout as mistake)
   - `mixed` → `accept_local` (local is source of truth)

4. **`updatePreviewAction(preview, progressionKey, newAction)`**
   - Returns new preview with updated counts
   - Immutable update (no mutations)

### Phase 2: UI Components

**Create `src/components/Dashboard/WeightReconciliation/`**

**SIMPLIFIED STRUCTURE** (start with 3 files, split later if needed):
```
index.tsx         - Main modal + summary footer (orchestration)
ExerciseRow.tsx   - Single exercise row with 3 weights, badges, and action selector
types.ts          - Local component types (re-export from reconciliation.ts)
```

**Component Responsibilities**:

- `index.tsx`: Modal shell, day grouping, summary counts, Apply/Cancel actions, loading/success states
- `ExerciseRow.tsx`: Display sources, status badge, **contextual** action selector (only relevant options per status)
- NO business logic in components - purely presentational (`view(state) -> action`)

**Contextual Action Rendering** (in `ExerciseRow.tsx`):
```typescript
function getActionsForStatus(status: SourceStatus): ReconcileAction[] {
  switch (status) {
    case 'match': return []  // No actions, just checkmark
    case 'local_differs': return ['accept_local', 'skip']
    case 'workout_differs': return ['accept_local', 'accept_workout', 'skip']
    case 'routine_differs': return ['accept_local', 'accept_routine', 'skip']
    case 'mixed': return ['accept_local', 'accept_routine', 'accept_workout', 'skip']
  }
}
```

**UI Layout (Desktop - ≥640px):**
```
┌─────────────────────────────────────────────────┐
│  Weight Reconciliation                      [X] │
├─────────────────────────────────────────────────┤
│  Day A1                           2 conflicts   │
├─────────────────────────────────────────────────┤
│  [T1] Squat                         ⚠ DIFFERS   │
│  ─────────────────────────────────────────────  │
│  │ Your progression │  65.0 kg  │ ← current    │
│  │ Hevy routine     │  62.5 kg  │              │
│  │ Last workout     │  62.5 kg  │ ⚠ mismatch   │
│  ─────────────────────────────────────────────  │
│  ( ) Push 65kg to Hevy (recommended)            │
│  ( ) Use workout weight (62.5kg)                │
│  (x) Skip for now                               │
├─────────────────────────────────────────────────┤
│  [T2] Bench Press                     ✓ synced  │
│  (collapsed - all weights match)                │
├─────────────────────────────────────────────────┤
│  Summary: 1 push | 0 pull | 1 skip              │
│                        [Cancel] [Apply Changes] │
└─────────────────────────────────────────────────┘
```

**UI Layout (Mobile - <640px):**
```
┌───────────────────────────────┐
│  Weight Reconciliation    [X] │
├───────────────────────────────┤
│  Day A1            2 conflicts│
├───────────────────────────────┤
│  [T1] Squat        ⚠ DIFFERS  │
│  ───────────────────────────  │
│  Your progression:   65.0 kg  │
│  Hevy routine:       62.5 kg  │
│  Last workout:       62.5 kg  │
│  ───────────────────────────  │
│  ┌─────────────────────────┐  │
│  │ ( ) Push 65kg to Hevy   │  │
│  │ ( ) Use 62.5kg          │  │
│  │ (x) Skip                │  │
│  └─────────────────────────┘  │
├───────────────────────────────┤
│  1 push | 0 pull | 1 skip     │
│  [Cancel]    [Apply Changes]  │
└───────────────────────────────┘
```

**Accessibility Requirements:**
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="reconciliation-title"`
- Focus trap: Use `@headlessui/react` Dialog or implement manually
- Action selector: `role="radiogroup"` with `role="radio"` options
- Keyboard: `Escape` closes, `Tab` cycles, `Enter` selects
- Screen reader: `aria-live="polite"` for summary count updates
- Touch targets: `min-h-[44px]` for all interactive elements (WCAG 2.2)

**Loading State (Skeleton):**
```tsx
{isLoading && (
  <div className="animate-pulse space-y-3">
    <div className="h-16 bg-gray-200 rounded" />
    <div className="h-16 bg-gray-200 rounded" />
    <div className="h-16 bg-gray-200 rounded" />
  </div>
)}
```

**Success State (before auto-close):**
```tsx
{applySuccess && (
  <div className="text-center py-8">
    <CheckIcon className="h-12 w-12 text-green-500 mx-auto" />
    <p className="mt-2 text-gray-700">All weights synced!</p>
    {/* Auto-close after 1.5s */}
  </div>
)}
```

### Phase 3: Hook & Integration

**Create `src/hooks/useReconciliation.ts`**

**CRITICAL**: ALL orchestration logic belongs here. Dashboard should only call `sync()` and receive state.

```typescript
interface ReconciliationConfig {
  apiKey: string
  exercises: Record<string, ExerciseConfig>
  progression: Record<string, ProgressionState>
  hevyRoutineIds: Record<GZCLPDay, string | null>
  t3Schedule: Record<GZCLPDay, string[]>
  weightUnit: WeightUnit
  acknowledgedDiscrepancies: AcknowledgedDiscrepancy[]
  isOnline: boolean
  isHevyReachable: boolean
}

function useReconciliation(config: ReconciliationConfig) {
  return {
    // Data (derived from fetches + comparison)
    isLoading: boolean
    error: string | null
    preview: ReconciliationPreview | null
    hasConflicts: boolean
    isModalOpen: boolean  // Managed internally, auto-opens if conflicts

    // Actions (encapsulate ALL side effects)
    sync: () => Promise<void>                                    // Fetches + builds preview
    updateAction: (progressionKey: string, action: ReconcileAction) => void
    applyChanges: () => Promise<ApplyResult>                     // Two-phase commit
    dismiss: () => void
  }
}
```

**Responsibilities**:

1. **Data Fetching** (in `sync()`):
   - Validate online status
   - Fetch workouts + routine templates in parallel
   - Build 3-way comparison using `buildReconciliationPreview()`
   - Auto-open modal if `hasConflicts`

2. **Transaction Safety** (in `applyChanges()`):
   - **Two-Phase Commit** pattern:
     ```typescript
     async function applyChanges() {
       // Phase 1: External writes (can fail, safe to abort)
       try {
         await updateHevyRoutines(pushActions)
       } catch (error) {
         return { success: false, error }
       }

       // Phase 2: Local writes (only after Hevy succeeds)
       updateLocalProgression(pullActions)
       updateLocalProgression(pushActions)  // Sync local with what we pushed

       // Phase 3: Persist skip actions
       for (const skipAction of skipActions.filter(a => a.status === 'workout_differs')) {
         acknowledgeDiscrepancy(skipAction.exerciseId, skipAction.sources.workout, skipAction.tier)
       }

       return { success: true }
     }
     ```

3. **Skip Action Persistence**:
   - When user skips a `workout_differs` conflict, persist to `AcknowledgedDiscrepancy`
   - Filter acknowledged discrepancies from preview to prevent re-showing

**Modify `src/components/Dashboard/index.tsx`**

**CRITICAL**: Dashboard stays presentational. Remove all reconciliation logic.

```typescript
// Dashboard usage (SIMPLE):
const { isLoading, preview, hasConflicts, sync, applyChanges, isModalOpen } = useReconciliation({
  apiKey, exercises, progression, hevyRoutineIds, t3Schedule, weightUnit,
  acknowledgedDiscrepancies, isOnline, isHevyReachable
})

return (
  <>
    <SyncButton onClick={sync} isLoading={isLoading} />
    {isModalOpen && (
      <WeightReconciliation preview={preview} onApply={applyChanges} onDismiss={dismiss} />
    )}
  </>
)
```

**Changes**:
- Remove `UpdateHevyButton` entirely
- Remove `PushConfirmDialog` state management
- Remove discrepancy handling logic (now in hook)
- Single "Sync" button handles everything

### Phase 4: Cleanup

**CRITICAL**: Do NOT delete old components until Phase 3 is fully integration-tested.

**Migration Safety**:
1. During Phase 3, keep old components but comment them out
2. Run integration tests comparing old vs new behavior
3. Only delete after verifying all 5 status scenarios work correctly

**Delete:**
- `src/components/Dashboard/DiscrepancyAlert.tsx` (186 lines)
- `src/components/Dashboard/PushConfirmDialog.tsx` (449 lines)
- `src/components/Dashboard/UpdateHevyButton.tsx` (~100 lines)
- `src/lib/discrepancy-utils.ts` (if exists)
- `tests/unit/discrepancy-utils.test.ts`
- `tests/unit/discrepancy-alert-tier.test.tsx`
- `tests/unit/discrepancy-acknowledgment.test.ts`
- `tests/unit/push-confirm-dialog.test.tsx`

**Reuse from `src/lib/push-preview.ts`**:
- `fetchCurrentHevyState()` - Already does parallel routine fetching
- `extractWorkingWeight()` - Logic for finding heaviest set
- Type definitions: `HevyRoutineState`, `SyncAction`
- Keep file, reconciliation.ts will import from it

**Simplify Dashboard**:
- Remove ~50 lines of discrepancy state management
- Remove ~30 lines of push dialog state management
- Net reduction: ~200 lines from Dashboard

---

## Files Summary

### Create (6 files - simplified from 10)
| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/lib/reconciliation.ts` | Pure 3-way comparison logic (no hooks/API) | ~200 |
| `src/hooks/useReconciliation.ts` | Data orchestration + transaction safety | ~250 |
| `src/components/.../WeightReconciliation/index.tsx` | Main modal + summary | ~150 |
| `src/components/.../WeightReconciliation/ExerciseRow.tsx` | Row + badges + actions | ~100 |
| `tests/unit/reconciliation.test.ts` | Logic tests (100% coverage) | ~300 |
| `tests/unit/weight-reconciliation.test.tsx` | Component + integration tests | ~200 |

**Total New Code**: ~1,200 lines

### Modify (2 files)
| File | Changes | Est. Lines Changed |
|------|---------|-------------------|
| `src/components/Dashboard/index.tsx` | Remove old state, integrate hook | -200, +20 |
| `src/lib/push-preview.ts` | No changes (reused by reconciliation.ts) | 0 |

### Delete (8 files - Phase 4 only)
| File | Lines Removed |
|------|---------------|
| `src/components/Dashboard/DiscrepancyAlert.tsx` | 165 |
| `src/components/Dashboard/PushConfirmDialog.tsx` | 449 |
| `src/components/Dashboard/UpdateHevyButton.tsx` | ~100 |
| `src/lib/discrepancy-utils.ts` | ~50 |
| `tests/unit/discrepancy-utils.test.ts` | ~100 |
| `tests/unit/discrepancy-alert-tier.test.tsx` | ~150 |
| `tests/unit/discrepancy-acknowledgment.test.ts` | ~100 |
| `tests/unit/push-confirm-dialog.test.tsx` | ~150 |

**Total Deleted**: ~1,264 lines

**Net Change**: -64 lines (code reduction) with significantly improved architecture

---

## Key Behaviors

1. **Auto-open**: After sync, if any conflicts exist, modal opens automatically
2. **Smart defaults**:
   - `match` → skip
   - `local_differs` → accept_local (push)
   - `workout_differs` → accept_local (treat as mistake)
3. **"Wrong weight" highlight**: Yellow warning badge when workout differs from both
4. **One-click resolve**: "Apply Changes" handles both Hevy update AND local state

---

## Edge Cases & Error Handling

### Transaction Failure Scenarios

| Scenario | Behavior | Recovery |
|----------|----------|----------|
| Hevy API fails before any writes | Abort, show error, no state change | User retries |
| Hevy API fails after partial writes | **CRITICAL**: Could leave inconsistent state | Two-phase commit prevents this |
| localStorage quota exceeded | Fail gracefully, show storage error | User clears data or uses smaller preview |
| Network timeout during push | Abort transaction, rollback optimistic UI | User retries |

### Data Consistency Edge Cases

**Scenario 1: Exercise removed from routine but still in local**
```
Local: 62.5kg
Routine: (exercise doesn't exist)
Workout: null
```
**Solution**: Filter out orphaned exercises from preview

**Scenario 2: Routine template changed externally (via Hevy app)**
```
Local: 65kg (user progressed last week)
Routine: 70kg (user manually updated in Hevy app)
Workout: 65kg (completed at expected weight)
```
**Status**: `routine_differs` (routine > local = workout)
**Default Action**: `accept_local` (local is source of truth for this app)
**User Option**: Can select `accept_routine` to pull Hevy changes

**Scenario 3: User completes workout at wrong weight, then syncs twice**
```
First Sync:
  Local: 62.5kg
  Workout: 60kg
  User selects: Skip

Second Sync (same workout):
  Should NOT show conflict again (filtered by AcknowledgedDiscrepancy)
```

**Scenario 4: Multi-device usage (same Hevy account, different devices)**
```
Device A: Local=65kg, pushed to Hevy
Device B: Local=62.5kg (stale), syncs

Expected: Device B sees routine_differs (65 > 62.5)
Action: User pulls 65kg to local on Device B
```

### Offline Handling

**Sync Attempt While Offline**:
- Validate `isOnline && isHevyReachable` before API calls
- Show error: "Cannot sync while offline"
- Disable sync button

**Apply Changes While Offline** (user goes offline between sync and apply):
- API call will fail
- Two-phase commit ensures no local state change
- Show error: "Network error, please try again"

### Unit Conversion Edge Cases

**Mixed Unit History**:
```
User switches from lbs to kg mid-program:
  Old progression: 145 lbs
  New unit: kg
  Hevy routine: 65.77 kg (equivalent)

Expected: Status = match (after conversion)
```

**Floating Point Precision**:
```
Local: 65.0 kg
Routine: 65.00000001 kg (rounding error)

Expected: Status = match (epsilon < 0.01)
```

---

## Architectural Decision Rationale

### Why 3-Way Comparison?

**Problem with Current 2-Way Systems**:
- `DiscrepancyAlert`: Only compares Workout vs Local (misses routine drift)
- `PushConfirmDialog`: Only compares Local vs Routine (misses workout mistakes)

**3-Way Solution**:
- Captures ALL possible states of truth
- Prevents silent data loss (e.g., user progresses locally but routine never updated)
- Detects user errors (lifted wrong weight)

### Why Two-Phase Commit?

**Alternative Considered**: Optimistic UI with rollback
```typescript
// Update local first (instant feedback)
updateLocal()
try {
  await updateHevy()
} catch {
  rollbackLocal()  // Problem: complex state snapshots
}
```

**Why Rejected**: Rollback complexity
- Need to snapshot entire progression state
- Hard to test all rollback scenarios
- Risk of corrupted state if rollback fails

**Two-Phase Commit Benefits**:
- Simpler: Only commit local after Hevy succeeds
- Safer: No partial state to rollback
- Testable: Easy to verify "Hevy success → local update" invariant

**Tradeoff**: Slightly slower UX (user waits for API), but more reliable

### Why Unified Modal vs Separate Flows?

**Alternative Considered**: Keep separate discrepancy alert + push dialog

**Why Rejected**:
- Confusing UX: User sees multiple prompts for same data
- Inconsistent: Different action names (Use/Keep vs Push/Pull)
- Incomplete: Never shows all 3 sources together

**Unified Modal Benefits**:
- Single source of truth
- Consistent action model
- Easier to understand "what's different"

### Why Hook-Based Architecture?

**Alternative Considered**: Redux/Zustand for global reconciliation state

**Why Rejected**:
- Reconciliation is transient (modal-only state)
- No need for global access (only used by Dashboard)
- Hook keeps logic colocated with usage

**Benefits**:
- Easier to test (just test hook, not entire store)
- No global state pollution
- Simpler refactoring (contained to hook + components)

---

## Testing Strategy

**TEST REQUIREMENT**: All critical paths must have 100% coverage before Phase 4 cleanup.

### 1. Unit Tests (`reconciliation.test.ts`)

**Status Determination** (exhaustive coverage):
```typescript
describe('determineStatus', () => {
  it('returns match when all equal')
  it('returns local_differs when local > routine = workout')
  it('returns routine_differs when routine > local = workout')
  it('returns workout_differs when workout > local = routine')
  it('returns mixed when all three different')
  it('handles null routine (routine not created yet)')
  it('handles null workout (exercise not in recent workouts)')
  it('handles null local (orphaned exercise)')
  it('uses epsilon comparison for float equality')
})
```

**Default Action Logic**:
```typescript
describe('getDefaultAction', () => {
  it('returns skip for match')
  it('returns accept_local for local_differs')
  it('returns accept_local for routine_differs (local is truth)')
  it('returns accept_local for workout_differs (treat as mistake)')
  it('returns accept_local for mixed')
})
```

**Unit Conversion**:
```typescript
describe('buildReconciliationPreview', () => {
  it('converts all weights to user preferred unit before comparison')
  it('treats 145 lbs = 65.77 kg as match (within epsilon)')
})
```

**Acknowledged Discrepancy Filtering**:
```typescript
it('filters out previously acknowledged workout discrepancies')
it('does not filter acknowledged discrepancies if workout changed')
```

### 2. Hook Tests (`useReconciliation.test.ts`)

**Transaction Safety**:
```typescript
describe('applyChanges', () => {
  it('should rollback local state if Hevy API fails')
  it('should only update local after Hevy succeeds')
  it('should persist skip actions to AcknowledgedDiscrepancy')
  it('should not persist skip for match status')
})
```

**Offline Behavior**:
```typescript
it('should disable sync when offline')
it('should disable sync when Hevy unreachable')
it('should show error message for offline sync attempt')
```

**Skip Action Persistence**:
```typescript
it('should not show skipped conflicts on re-sync')
it('should show conflict again if workout weight changes')
```

### 3. Component Tests (`weight-reconciliation.test.tsx`)

**Rendering**:
```typescript
it('renders all exercise rows grouped by day')
it('shows correct status badge for each status type')
it('disables Apply button when no actions selected')
it('collapses matched exercises (no action buttons)')
it('shows skeleton loading state while fetching')
it('shows success state after apply completes')
```

**Action Selection**:
```typescript
it('updates action when user selects different option')
it('updates summary counts when action changes')
it('calls onApply with updated preview')
it('shows only relevant actions per status type')
```

**Accessibility**:
```typescript
it('traps focus within modal when open')
it('closes on Escape key press')
it('has correct ARIA attributes on modal')
it('action selector has role="radiogroup"')
it('announces summary changes to screen readers')
```

**Responsive Layout**:
```typescript
it('stacks weight columns vertically on mobile (<640px)')
it('shows horizontal layout on desktop (≥640px)')
```

### 4. Integration Tests

**Full Flow Validation**:
```typescript
describe('Reconciliation Flow', () => {
  it('sync → modal → apply → verify state', async () => {
    // 1. Setup: local=65, routine=62.5, workout=62.5
    // 2. Click sync
    // 3. Modal opens showing local_differs
    // 4. Default action: accept_local (push)
    // 5. Click Apply
    // 6. Verify: Hevy routine updated to 65
    // 7. Verify: local still 65
    // 8. Verify: modal closed
  })

  it('handles transaction failure gracefully', async () => {
    // Mock Hevy API to fail
    // Verify local state unchanged
    // Verify error message shown
  })

  it('persists skip actions for workout discrepancies', async () => {
    // Setup: workout_differs
    // User selects skip
    // Apply changes
    // Re-sync
    // Verify: conflict doesn't reappear
  })
})
```

**Comparison with Old System**:
```typescript
it('handles same scenarios as old DiscrepancyAlert + PushConfirmDialog')
```

### Test Coverage Targets

| Module | Coverage | Rationale |
|--------|----------|-----------|
| `reconciliation.ts` | 100% | Core business logic, must be bulletproof |
| `useReconciliation.ts` | 90%+ | Transaction safety is critical |
| `WeightReconciliation/` | 80%+ | UI components, less critical |
| Integration tests | All 5 status types + transaction failures | Ensures no regression |

---

## Performance Considerations

### API Call Overhead

**Current System**:
- `DiscrepancyAlert`: 1 API call (fetch recent workouts)
- `PushConfirmDialog`: 4 API calls (fetch routine templates for A1, B1, A2, B2)
- Total: 5 calls across two separate flows

**New System**:
- Single "Sync" flow: 5 API calls (workouts + 4 routines) in parallel
- Total: Same 5 calls, but in ONE user action

**Performance Impact**: NEUTRAL (same number of calls, better UX)

**Optimization Opportunity** (future enhancement):
- Cache routine templates in localStorage with 5-minute TTL
- Only fetch if cache expired or force-refresh
- Reduces to 1 API call for most syncs

### UI Rendering Performance

**Estimated Max Rows**: 16 exercises (4 days × 4 exercises per day)
**Component Structure**: Simple list (no virtualization needed)
**Re-render Triggers**: Action selection only re-renders affected row

**Assessment**: No performance concerns

### localStorage Usage

**Existing State**: ~50KB (progression history, exercises, settings)
**New Addition**: `AcknowledgedDiscrepancy[]` - negligible (~1KB max)

**Assessment**: No storage concerns

---

## Migration Timeline

### Phase 1: Core Logic (2-3 days)

**Tasks**:
- Implement `reconciliation.ts` with all functions
- Write 100% test coverage for `determineStatus()`
- Write tests for `buildReconciliationPreview()`
- Write tests for unit conversion logic

**Deliverable**: Pure logic module with full test coverage

**Risk**: LOW (no UI or state changes)

### Phase 2: UI Components (2-3 days)

**Tasks**:
- Create `WeightReconciliation/index.tsx` modal shell with focus trap
- Create `WeightReconciliation/ExerciseRow.tsx` with badges + contextual actions
- Implement responsive layout (desktop horizontal, mobile stacked)
- Add skeleton loading and success states
- Implement ARIA attributes for accessibility
- Write component tests (rendering, action selection, accessibility, responsive)
- Storybook stories for manual QA (optional)

**Deliverable**: Isolated components with tests, accessible and responsive

**Risk**: LOW (not integrated yet)

### Phase 3: Hook & Integration (3-4 days)

**Tasks**:
- Implement `useReconciliation` hook with two-phase commit
- Write hook tests (transaction safety, offline, skip persistence)
- Integrate into Dashboard (replace old state)
- Comment out old components (keep as fallback)
- Write integration tests (full flow validation)
- Manual QA testing all 5 status scenarios

**Deliverable**: Working new system with old system as commented backup

**Risk**: MEDIUM-HIGH (core sync flow change)

**Mitigation**: Keep old components until Phase 4

### Phase 4: Cleanup (1 day)

**Tasks**:
- Run regression tests comparing old vs new behavior
- Delete old components and tests (8 files, ~1,264 lines)
- Remove commented code from Dashboard
- Update documentation (README, architecture diagrams)

**Deliverable**: Clean codebase with unified reconciliation

**Risk**: LOW (already validated in Phase 3)

**Total Timeline**: 9-11 days (includes accessibility & responsive work)

---

## Success Criteria

### Functional Requirements

- [ ] All 5 status types correctly detected (`determineStatus` tests pass)
- [ ] Smart defaults reduce user decisions (90%+ conflicts auto-resolved)
- [ ] Transaction safety prevents inconsistent state (two-phase commit tests pass)
- [ ] Skip actions persist across syncs (no frustration loop)
- [ ] Offline mode gracefully handled (error messages, disabled buttons)
- [ ] Unit conversion works across kg/lbs (epsilon comparison tests pass)

### Non-Functional Requirements

- [ ] 100% test coverage for `reconciliation.ts`
- [ ] 90%+ test coverage for `useReconciliation.ts`
- [ ] Integration tests cover all edge cases
- [ ] No performance regression (API calls same or fewer)
- [ ] Code reduction: ~64 lines net decrease
- [ ] Complexity reduction: 2 flows → 1 unified flow

### User Experience

- [ ] Single modal replaces two separate prompts
- [ ] Consistent action model (Push/Pull/Skip vs Use/Keep)
- [ ] Clear visual indication of all 3 weight sources
- [ ] "Wrong weight" detection preserved (yellow badge for `workout_differs`)
- [ ] No re-showing of acknowledged discrepancies

### Accessibility & Responsiveness

- [ ] Focus trapped within modal when open
- [ ] Keyboard navigation works (Tab, Escape, Enter)
- [ ] Action selector has proper ARIA roles (`radiogroup`/`radio`)
- [ ] Touch targets ≥44px for mobile (WCAG 2.2)
- [ ] Stacked layout on mobile (<640px)
- [ ] Screen reader announces summary count changes

### Loading & Feedback States

- [ ] Skeleton loading instead of spinner
- [ ] Success state shown before modal auto-closes (1.5s delay)
- [ ] Error messages distinguish network vs auth vs data errors
- [ ] Contextual action buttons (only relevant options per status)

---

## Open Questions

**Q1**: Should we add a "Refresh Routines" button for manual cache busting?
**A**: Not in MVP - auto-fetch on every sync is sufficient. Consider for future enhancement.

**Q2**: Should we show a diff view for weight changes (e.g., "62.5kg → 65kg")?
**A**: YES - add `previousWeight` field to `ReconcileItem` for this.

**Q3**: Should we allow batch actions (e.g., "Push all" button)?
**A**: Not in MVP - smart defaults already pre-select 90%+ actions. User can click Apply immediately.

**Q4**: Should we persist the reconciliation preview for offline review?
**A**: NO - preview is transient. If user goes offline, modal closes and sync must be retried.

**Q5**: Should we add telemetry to track which status types are most common?
**A**: Optional - add if product analytics already exist. Helps prioritize future UX improvements.

**Q6**: Should we add an "Undo" button after applying changes?
**A**: LOW PRIORITY - Consider for v2. Would require snapshotting state before apply, adds complexity. Current two-phase commit is safe enough.

**Q7**: Should matched exercises be collapsible or hidden entirely?
**A**: COLLAPSIBLE - Show as single line with checkmark. User may want to verify "all synced" state. Don't hide completely.
