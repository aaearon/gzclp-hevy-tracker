# Quickstart: Exercise Classification System

**Feature**: 003-exercise-classification
**Date**: 2026-01-03
**Status**: Implementation Complete

## Overview

This feature adds exercise classification beyond GZCLP tiers. Users classify exercises into six categories during import: T1, T2, T3 (GZCLP-managed) or Warmup, Cooldown, Supplemental (non-GZCLP).

## Key Files

### New Files Created

| File | Purpose |
|------|---------|
| `src/types/classification.ts` | Re-exports types from contracts |
| `src/lib/classification-store.ts` | localStorage CRUD for classifications |
| `src/lib/sync-queue.ts` | Offline sync queue with retry logic |
| `src/hooks/useExerciseClassifications.ts` | React hook: `{ classifications, classify, reclassify, checkConflict }` |
| `src/components/common/CollapsibleSection.tsx` | Native details/summary wrapper |
| `src/components/common/CategoryDropdown.tsx` | Six-category selector dropdown |
| `src/components/common/SupplementalBadge.tsx` | Visual marker for supplemental exercises |
| `src/components/Settings/ExerciseManager.tsx` | Reclassification UI in settings |
| `src/components/SetupWizard/ConflictResolutionModal.tsx` | Keep/update conflict resolution |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/state.ts` | Added optional `category` field to `ExerciseConfig` |
| `src/components/SetupWizard/index.tsx` | Wired `exerciseCategories` state to child components |
| `src/components/SetupWizard/ImportReviewStep.tsx` | Category dropdown per exercise, validation, conflict detection |
| `src/components/Dashboard/index.tsx` | Category grouping with collapsible warmup/cooldown sections |
| `src/components/Settings/index.tsx` | Added ExerciseManager component |
| `src/App.tsx` | Sync queue processing on online status change |

## Test Files

| Test File | Coverage |
|-----------|----------|
| `tests/unit/classification-store.test.ts` | CRUD, localStorage persistence |
| `tests/unit/sync-queue.test.ts` | Queue add/remove/retry, max retry limit |
| `tests/unit/useExerciseClassifications.test.ts` | Hook state, conflict detection, `isGZCLPCategory` |
| `tests/unit/collapsible-section.test.tsx` | Expand/collapse behavior |
| `tests/unit/supplemental-badge.test.tsx` | Badge rendering |
| `tests/unit/exercise-manager.test.tsx` | Reclassification UI |
| `tests/integration/exercise-classification-flow.test.tsx` | Import flow, validation |
| `tests/integration/conflict-resolution.test.tsx` | Keep/update conflict handling |
| `tests/integration/dashboard-category-grouping.test.tsx` | Category sections rendering |

## API Reference

### Classification Store (`src/lib/classification-store.ts`)

```typescript
getClassifications(): ClassificationStore
setClassification(classification: ExerciseClassification): void
getClassification(hevyTemplateId: string): ExerciseClassification | undefined
hasClassification(hevyTemplateId: string): boolean
```

### Sync Queue (`src/lib/sync-queue.ts`)

```typescript
getQueueItems(): SyncQueueItem[]
addToQueue(item: SyncQueueItem): void
removeFromQueue(id: string): void
incrementRetryCount(id: string, error: string): void
clearQueue(): void
processQueue(syncFn: (item: SyncQueueItem) => Promise<void>): Promise<void>
```

### Hook (`src/hooks/useExerciseClassifications.ts`)

```typescript
useExerciseClassifications(): {
  classifications: ExerciseClassification[]
  classify: (hevyTemplateId: string, name: string, category: ExerciseCategory) => void
  reclassify: (hevyTemplateId: string, newCategory: ExerciseCategory) => void
  checkConflict: (hevyTemplateId: string, proposedCategory: ExerciseCategory) => ClassificationConflict | null
}
```

## Quick Commands

```bash
# Run all tests
npm test

# Run classification tests only
npm test -- classification

# Type check
npm run typecheck

# Start dev server
npm run dev
```

## localStorage Keys

| Key | Content |
|-----|---------|
| `gzclp_state` | Existing app state (unchanged) |
| `gzclp_classifications` | Exercise category mappings |
| `gzclp_sync_queue` | Pending Hevy sync operations |

## Category Reference

| Category | GZCLP | Progression | Display |
|----------|-------|-------------|---------|
| T1 | Yes | Automated | Main section |
| T2 | Yes | Automated | Main section |
| T3 | Yes | Automated | Main section |
| Warmup | No | Manual | Collapsible top |
| Cooldown | No | Manual | Collapsible bottom |
| Supplemental | No | Manual | Main section + badge |
