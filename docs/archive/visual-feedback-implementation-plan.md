# Implementation Plan: Visual Feedback for Sync & Progression

**Created:** 2026-01-12
**Status:** Ready for Implementation

## Summary

Add visual feedback when syncing with Hevy and applying progression changes. Also fix the bug where sync-generated pending changes are not persisted to localStorage.

## Changes Required

### 1. Fix: Persist Sync Pending Changes (Bug Fix)

**File:** `src/components/Dashboard/index.tsx`

Add an effect to persist new sync-generated changes to localStorage:

```typescript
// After the existing merge effect, add persistence
useEffect(() => {
  // Persist new sync changes to localStorage
  const newChanges = syncPendingChanges.filter(
    (c) => !storedPendingChanges.some((s) => s.id === c.id)
  )
  if (newChanges.length > 0) {
    // Use progressionStorage.addPendingChange or batch update
    for (const change of newChanges) {
      // Persist to storage
    }
  }
}, [syncPendingChanges, storedPendingChanges])
```

**Problem Solved:** Pending changes survive page refresh

### 2. Toast: New Workout Detected

**File:** `src/components/Dashboard/index.tsx`

Add toast notification when sync finds new changes:

```typescript
import { useToast } from '@/contexts/ToastContext'

// Inside Dashboard component
const { showToast } = useToast()

// Effect to show toast when new changes detected
useEffect(() => {
  const newItems = syncPendingChanges.filter(
    (c) => !previousChangeIds.current.has(c.id)
  )
  if (newItems.length > 0) {
    showToast({
      type: 'info',
      message: `Found ${newItems.length} exercise${newItems.length > 1 ? 's' : ''} to progress`,
      action: {
        label: 'Review',
        onClick: () => setIsReviewModalOpen(true),
      },
    })
  }
}, [syncPendingChanges])
```

### 3. Toast: All Caught Up

**File:** `src/hooks/useSyncFlow.ts` or `src/components/Dashboard/index.tsx`

Add state to track sync completion and show feedback:

```typescript
// Track sync result state
const [syncResult, setSyncResult] = useState<'idle' | 'no_changes' | 'has_changes'>('idle')

// After sync completes
if (syncPendingChanges.length === 0 && !isSyncing && hasAutoSynced.current) {
  showToast({
    type: 'success',
    message: 'All caught up! No new workouts found.',
  })
}
```

### 4. Toast: Changes Applied Successfully

**File:** `src/components/Dashboard/index.tsx`

Wrap `applyAllChanges` to show success toast:

```typescript
const handleApplyAllWithFeedback = useCallback(() => {
  const nextDay = DAY_CYCLE[program.currentDay]
  applyAllChanges()
  showToast({
    type: 'success',
    message: `Changes applied! Next workout: ${nextDay}`,
  })
  setIsReviewModalOpen(false)
}, [applyAllChanges, program.currentDay, showToast])

// Pass to ReviewModal
<ReviewModal
  onApplyAll={handleApplyAllWithFeedback}
  // ...
/>
```

### 5. Optional: Row Highlight on Apply

**Files:** `src/components/Dashboard/MainLiftCard.tsx`, `ExerciseCard.tsx`

Add transient highlight animation when weights update:

```typescript
// Track recently updated exercises
const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set())

// Add CSS class for brief flash
className={`${recentlyUpdated.has(exerciseId) ? 'animate-highlight' : ''}`}
```

Add CSS animation in `src/index.css`:

```css
@keyframes highlight-flash {
  0% { background-color: rgb(134, 239, 172); }
  100% { background-color: transparent; }
}
.animate-highlight {
  animation: highlight-flash 1s ease-out;
}
```

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/Dashboard/index.tsx` | Modify | Add toast integration, persist sync changes |
| `src/contexts/ToastContext.tsx` | None | Already exists, use as-is |
| `src/hooks/useSyncFlow.ts` | Modify | Add sync result tracking |
| `src/components/ReviewModal/index.tsx` | None | Already has onApplyAll prop |
| `src/index.css` | Modify | Add highlight animation (optional) |

## Testing Plan

1. **Unit Tests:**
   - Toast shown when new changes detected
   - Toast shown when changes applied
   - Pending changes persisted to localStorage

2. **Integration Tests:**
   - Full sync → review → apply flow
   - Page refresh preserves pending changes
   - "All caught up" shown when no new workouts

3. **Manual Testing:**
   - Complete workout in Hevy, open app, verify toast appears
   - Apply changes, verify success toast
   - Refresh page, verify pending changes persist

## Implementation Order

1. **Fix persistence bug first** (highest priority - fixes user's issue)
2. Add "new workout detected" toast
3. Add "changes applied" success toast
4. Add "all caught up" feedback
5. Optional: Add row highlight animation
6. Write tests

## Notes

- Gemini's recommendation: Don't toast for "Syncing..." to avoid notification fatigue
- Keep toast messages minimal, use Review action to open modal
- Existing ToastContext supports action buttons
