# Contextual Sync Button Implementation Plan

## Goal
Replace two separate buttons ("Fetch Workouts" + "Push to Hevy") with a single contextual button that changes label and action based on state, following GitHub Desktop's pattern.

## Design Decision

**Chosen Pattern**: Split button with contextual primary action + dropdown for secondary:
- Primary area shows contextual action based on state
- Dropdown arrow reveals the alternative action

**Visual:**
```
┌────────────────┬───┐
│  Push to Hevy  │ ▼ │  ← When needsPush=true
└────────────────┴───┘
         │
         ▼ dropdown
    ┌─────────────┐
    │ Fetch       │
    └─────────────┘

┌────────────────┬───┐
│     Fetch      │ ▼ │  ← When needsPush=false
└────────────────┴───┘
         │
         ▼ dropdown
    ┌─────────────┐
    │ Push to Hevy│
    └─────────────┘
```

**Rationale**:
- GitHub Desktop's key insight: "if you have nothing to push, there's no need to show a push button"
- Gemini review raised critical concern: hiding "Fetch" behind "Push" prevents users from updating local view if they have pending changes
- Split button provides escape hatch while keeping primary action prominent

## Gemini Review Feedback (Incorporated)

**Risks Identified:**
1. **HIGH**: Hiding "Fetch" prevents users from resolving conflicts when they have local changes but remote data also changed
2. **MEDIUM**: "Sync" label for receive-only operation is ambiguous

**Recommendations Applied:**
1. Use Split Button pattern - primary click = contextual action, dropdown = alternative
2. Preserve amber "ping" dot indicator from UpdateHevyButton
3. Use explicit labels: "Fetch" and "Push to Hevy" (not ambiguous "Sync")

## Phases

### Phase 1: Create Split Button Component
- **Status**: `complete`
- **Files**: `src/components/Dashboard/SyncButton.tsx`
- **Tasks**:
  - [ ] Refactor existing `SyncButton.tsx` into a split button
  - [ ] Add dropdown menu with click-outside-to-close behavior
  - [ ] Add `needsPush` prop to control primary action
  - [ ] Add `onSync` and `onPush` callbacks
  - [ ] Implement state-based primary button (label, icon, action)
  - [ ] Implement dropdown with alternative action
  - [ ] Preserve amber dot indicator for push state
  - [ ] Handle loading states (hide dropdown when loading)
  - [ ] Ensure proper ARIA attributes for accessibility

### Phase 2: Update DashboardHeader
- **Status**: `complete`
- **Files**: `src/components/Dashboard/DashboardHeader.tsx`
- **Tasks**:
  - [ ] Remove `UpdateHevyButton` import and usage
  - [ ] Update `SyncButton` props to include push-related callbacks
  - [ ] Simplify prop interface (combine `onSync` and `onOpenPushDialog`)

### Phase 3: Update Dashboard Component
- **Status**: `complete`
- **Files**: `src/components/Dashboard/index.tsx`
- **Tasks**:
  - [ ] Verify props passed to DashboardHeader are correct
  - [ ] No major changes expected (already passes `needsPush`)

### Phase 4: Clean Up
- **Status**: `complete`
- **Files**: `src/components/Dashboard/UpdateHevyButton.tsx`
- **Tasks**:
  - [ ] Delete `UpdateHevyButton.tsx` (functionality merged into SyncButton)
  - [ ] Remove any unused exports from `index.tsx`

### Phase 5: Update Tests
- **Status**: `complete`
- **Files**: `tests/unit/dashboard-header.test.tsx`, potentially new test file
- **Tasks**:
  - [ ] Update existing DashboardHeader tests
  - [ ] Add tests for contextual button states
  - [ ] Test state transitions (sync → push, push → sync)

### Phase 6: Documentation
- **Status**: `complete`
- **Files**: `docs/ARCHITECTURE.md`
- **Tasks**:
  - [ ] Update component documentation if needed
  - [ ] Note the design pattern used

## State Logic Table

| Condition | Primary Label | Primary Action | Dropdown Option |
|-----------|--------------|----------------|-----------------|
| `needsPush=true` | "Push to Hevy" (+ amber dot) | `onPush()` | "Fetch" |
| `needsPush=false` | "Fetch" | `onSync()` | "Push to Hevy" (disabled if nothing to push) |
| `isSyncing=true` | "Fetching..." | disabled | hidden |
| `isUpdating=true` | "Pushing..." | disabled | hidden |

## Files Changed Summary

| File | Action |
|------|--------|
| `src/components/Dashboard/SyncButton.tsx` | Modify (add contextual logic) |
| `src/components/Dashboard/DashboardHeader.tsx` | Modify (remove UpdateHevyButton) |
| `src/components/Dashboard/UpdateHevyButton.tsx` | Delete |
| `src/components/Dashboard/index.tsx` | Modify (remove export) |
| `tests/unit/dashboard-header.test.tsx` | Modify |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | | |

## Notes

- Auto-sync on mount already handles initial fetch
- Push dialog already fetches current Hevy state for preview
- Edge case (fetch while having local changes) handled by push dialog preview
