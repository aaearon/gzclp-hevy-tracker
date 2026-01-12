# Task Plan: Visual Feedback for Dashboard Sync & Progression

**Created:** 2026-01-12
**Status:** In Progress

## Goal
Implement visual feedback for the Dashboard when a fetch completes and progression is applied from a recently completed workout, making the sync-to-progression flow visible and satisfying.

## Current Phase
Phase 1

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand current sync flow architecture
- [x] Analyze existing visual feedback components
- [x] Document findings in findings.md
- [x] Investigate B1→A2 progression bug
- **Status:** complete

### Phase 2: Design & Planning
- [ ] Define visual feedback states and transitions
- [ ] Design component structure
- [ ] Get second opinion from Gemini
- [ ] Finalize approach
- **Status:** in_progress

### Phase 3: Implementation
- [ ] Create SyncFeedback component(s)
- [ ] Integrate with useSyncFlow hook
- [ ] Add success/celebration feedback for applied changes
- [ ] Write tests
- **Status:** pending

### Phase 4: Testing & Verification
- [ ] Run test suite (npm test)
- [ ] Manual testing of sync flow
- [ ] Verify progression bug is fixed
- **Status:** pending

### Phase 5: Documentation & Delivery
- [ ] Update ARCHITECTURE.md if needed
- [ ] Archive plan to docs/archive/
- **Status:** pending

## Key Questions

1. What visual feedback states are needed?
   - Syncing (already exists - spinner)
   - New workout detected (NEEDED) → "Found 3 exercises to progress"
   - No new workouts (NEEDED) → "All caught up!"
   - Changes applied successfully (NEEDED) → "Updated! Next: A2"

2. Where should feedback appear?
   - Toast notifications (using existing ToastContext)
   - NOT toast for "syncing..." (use spinner)

3. What information should be shown?
   - Count of exercises found
   - "Review" action button on toast
   - Success confirmation with next day

4. B1→A2 Bug: ROOT CAUSE IDENTIFIED
   - Sync pending changes NOT persisted to localStorage!
   - Need to add effect to persist `syncPendingChanges` to storage
   - This explains why charts show data (history persisted) but no pending button

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use toast-style notifications | Non-intrusive, standard UX pattern |
| Show workout detection + progression summary | User needs to know what happened |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | - | - |

## Notes
- Current flow: auto-sync on mount → pending changes generated → user reviews → applies
- Missing: "New workout found" notification, "Changes applied" confirmation
- Bug: B1 workout not triggering A2 progression - investigate routine ID matching
