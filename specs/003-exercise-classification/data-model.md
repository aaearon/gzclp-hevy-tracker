# Data Model: Exercise Classification System

**Feature**: 003-exercise-classification
**Date**: 2026-01-03

## Type Definitions

### ExerciseCategory

New union type extending beyond GZCLP tiers:

```typescript
/**
 * All possible exercise categories.
 * - T1, T2, T3: GZCLP-managed with automated progression
 * - Warmup, Cooldown, Supplemental: Non-GZCLP, manual tracking only
 */
export type ExerciseCategory = 'T1' | 'T2' | 'T3' | 'Warmup' | 'Cooldown' | 'Supplemental'

/**
 * Helper type for GZCLP-only categories (for progression logic).
 */
export type GZCLPCategory = 'T1' | 'T2' | 'T3'

/**
 * Helper type for non-GZCLP categories.
 */
export type NonGZCLPCategory = 'Warmup' | 'Cooldown' | 'Supplemental'

/**
 * Type guard: Is this a GZCLP category?
 */
export function isGZCLPCategory(category: ExerciseCategory): category is GZCLPCategory {
  return category === 'T1' || category === 'T2' || category === 'T3'
}
```

### ExerciseClassification

Classification record for a single exercise:

```typescript
/**
 * Classification of an exercise from Hevy.
 * Stored globally - same classification applies across all routines.
 */
export interface ExerciseClassification {
  /** Hevy exercise template ID (unique identifier) */
  hevyTemplateId: string

  /** Display name from Hevy */
  name: string

  /** User-assigned category */
  category: ExerciseCategory

  /** ISO timestamp when classification was set/last modified */
  classifiedAt: string
}
```

### ClassificationStore

Root storage structure:

```typescript
/**
 * localStorage structure for exercise classifications.
 * Key: 'gzclp_classifications'
 */
export interface ClassificationStore {
  /** Schema version for migrations */
  version: string

  /** Map of hevyTemplateId -> classification */
  classifications: Record<string, ExerciseClassification>
}
```

### SyncQueueItem

For offline sync retry:

```typescript
/**
 * Queued sync operation for retry when offline.
 */
export interface SyncQueueItem {
  id: string
  type: 'update_routine'
  payload: {
    routineId: string
    exercises: Array<{
      hevyTemplateId: string
      /** Updated weight/reps to sync */
      sets: Array<{ weight_kg: number; reps: number }>
    }>
  }
  createdAt: string
  retryCount: number
  lastError?: string
}

/**
 * localStorage structure for sync queue.
 * Key: 'gzclp_sync_queue'
 */
export interface SyncQueue {
  items: SyncQueueItem[]
}
```

### WorkoutHistoryEntry (Extended)

Add classification snapshot to history:

```typescript
/**
 * Extended workout history entry with classification context.
 */
export interface WorkoutHistoryEntry {
  // ... existing fields ...

  /** Category at time of workout (for historical context) */
  categoryAtTime: ExerciseCategory
}
```

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                     Hevy API                                │
│  ┌─────────────────┐      ┌─────────────────┐              │
│  │ ExerciseTemplate│      │     Routine     │              │
│  │ (id, name)      │◄────►│ (exercises[])   │              │
│  └────────┬────────┘      └─────────────────┘              │
└───────────┼─────────────────────────────────────────────────┘
            │ hevyTemplateId
            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Local Storage                             │
│                                                             │
│  ┌─────────────────────────┐   ┌─────────────────────────┐ │
│  │   ClassificationStore   │   │      GZCLPState         │ │
│  │   (gzclp_classifications)│   │    (gzclp_state)        │ │
│  │                         │   │                         │ │
│  │ hevyTemplateId ──────────────► exercises[].hevyTemplateId│
│  │ category               │   │ progression[].exerciseId │ │
│  │ name                   │   │ pendingChanges[]         │ │
│  └─────────────────────────┘   └─────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────┐                               │
│  │      SyncQueue          │                               │
│  │   (gzclp_sync_queue)    │                               │
│  │                         │                               │
│  │ items[] (pending syncs) │                               │
│  └─────────────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

## State Transitions

### Classification Lifecycle

```
                    ┌──────────────┐
                    │  Unclassified │
                    │  (not in store)│
                    └───────┬───────┘
                            │ User selects category
                            │ during import
                            ▼
                    ┌──────────────┐
        ┌──────────►│  Classified   │◄──────────┐
        │           │              │           │
        │           └───────┬──────┘           │
        │                   │                  │
        │ User reclassifies │ User reclassifies│
        │ to GZCLP         │ to non-GZCLP     │
        │                   │                  │
        ▼                   ▼                  ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ GZCLP (T1/T2/T3)│   │   Warmup      │   │ Supplemental  │
│               │   │   Cooldown    │   │               │
│ → Progression │   │               │   │               │
│   rules apply │   │ → No prog.    │   │ → No prog.    │
└───────────────┘   │ → Collapsible │   │ → Badge shown │
                    └───────────────┘   └───────────────┘
```

### Sync Queue Lifecycle

```
┌─────────┐  API call fails   ┌─────────┐  Online detected  ┌─────────┐
│ Pending │─────────────────►│ Queued  │─────────────────►│ Retrying│
└─────────┘                   └─────────┘                   └────┬────┘
                                   ▲                              │
                                   │ Retry fails (< max)          │
                                   └──────────────────────────────┘
                                                                  │
                                              Success or max      │
                                              retries reached     ▼
                                                            ┌─────────┐
                                                            │ Removed │
                                                            └─────────┘
```

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `hevyTemplateId` | Non-empty string | "Exercise ID is required" |
| `category` | One of 6 valid values | "Invalid category" |
| `classifiedAt` | Valid ISO timestamp | "Invalid timestamp" |
| `SyncQueueItem.retryCount` | 0-5 max | Auto-removed after 5 |

## Storage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `gzclp_state` | `GZCLPState` | Existing app state (unchanged) |
| `gzclp_classifications` | `ClassificationStore` | NEW: Exercise categories |
| `gzclp_sync_queue` | `SyncQueue` | NEW: Offline sync queue |

## Migration Notes

- No migration needed for `gzclp_state` - existing exercises continue to work
- New `gzclp_classifications` store created on first classification
- Existing T1/T2/T3 exercises in `gzclp_state` remain source of truth for GZCLP slots
- Classification store is supplementary metadata layer
