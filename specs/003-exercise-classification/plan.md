# Implementation Plan: Exercise Classification System

**Branch**: `003-exercise-classification` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-exercise-classification/spec.md`

## Summary

Extend the GZCLP Hevy Tracker to support exercise classification beyond T1/T2/T3. Users will classify exercises imported from Hevy into six categories (T1, T2, T3, Warmup, Cooldown, Supplemental) during routine import. Non-GZCLP categories bypass progression logic and display in collapsible sections. Classifications are global per exercise (matched by Hevy ID) and persist to localStorage.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode enabled)
**Primary Dependencies**: React 18.3, Vite 5.4, Tailwind CSS 4.1
**Storage**: Browser localStorage (key: `gzclp_state`, extended with classifications store)
**Testing**: Vitest + React Testing Library
**Target Platform**: Mobile-first responsive web (PWA-ready)
**Project Type**: Single-page web application (frontend only)
**Performance Goals**: Initial load <200KB gzipped, interaction response <100ms
**Constraints**: Offline-capable (queue failed Hevy syncs), no external state management
**Scale/Scope**: Single user, ~50-100 exercises max, 4 GZCLP routines

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-Driven Development | PASS | TDD workflow required; tests before implementation |
| II. User Data Sovereignty | PASS | All data in localStorage; no external tracking |
| III. Mobile-First Design | PASS | Collapsible sections, touch-friendly dropdowns |
| IV. Hevy as Source of Truth | PASS | Exercises come from Hevy; classifications are app-side metadata |
| V. Minimal Dependencies | PASS | Using existing React state + localStorage; no new deps |
| VI. GZCLP Fidelity | PASS | T1/T2/T3 logic unchanged; new categories bypass progression |

**Result**: All gates pass. Proceeding to Phase 0.

### Post-Design Re-check (Phase 1 Complete)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-Driven Development | PASS | Test files defined in quickstart; TDD order specified |
| II. User Data Sovereignty | PASS | Two new localStorage keys; no external services |
| III. Mobile-First Design | PASS | Native details/summary for collapsible; touch-friendly |
| IV. Hevy as Source of Truth | PASS | Classification is metadata overlay; Hevy remains source |
| V. Minimal Dependencies | PASS | No new npm packages; uses existing stack |
| VI. GZCLP Fidelity | PASS | Progression logic untouched; type guards separate concerns |

**Post-Design Result**: All gates pass. Ready for `/speckit.tasks`.

## Project Structure

### Documentation (this feature)

```text
specs/003-exercise-classification/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal types only)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Dashboard/           # Existing - update TierSection for new categories
│   ├── SetupWizard/         # Existing - extend ImportReviewStep for classification
│   │   # Classification added via CategoryDropdown in ImportReviewStep.tsx
│   ├── Settings/            # Existing - add reclassification UI
│   │   └── ExerciseManager.tsx             # NEW: View/edit all classifications
│   └── common/
│       └── CollapsibleSection.tsx          # NEW: Warmup/Cooldown wrapper
├── hooks/
│   └── useExerciseClassifications.ts       # NEW: Classification state management
├── lib/
│   ├── classification-store.ts             # NEW: localStorage CRUD for classifications
│   └── sync-queue.ts                       # NEW: Offline sync queue for Hevy
├── types/
│   └── state.ts                            # MODIFY: Add ExerciseCategory type
└── utils/

tests/
├── unit/
│   ├── classification-store.test.ts        # NEW
│   ├── sync-queue.test.ts                  # NEW
│   └── useExerciseClassifications.test.ts  # NEW
└── integration/
    ├── exercise-classification-flow.test.ts # NEW
    └── conflict-resolution.test.ts          # NEW
```

**Structure Decision**: Extend existing single-project frontend structure. New files integrate with existing patterns (hooks, lib, components). No architectural changes needed.

## Complexity Tracking

> No constitution violations. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
