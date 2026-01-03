# Implementation Plan: Routine Selection Wizard

**Branch**: `002-routine-selection-wizard` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-routine-selection-wizard/spec.md`

## Summary

Add a routine selection step to the setup wizard (after API key validation) that allows users to either create new GZCLP routines from scratch or import existing Hevy routines. For existing routines, extract exercises based on position (T1/T2/T3), detect progression stages from set/rep configs, and allow review before finalizing. User specifies which workout day (A1/B1/A2/B2) to do next.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode enabled)
**Primary Dependencies**: React 18.3, Vite 5.4, Tailwind CSS 4.1
**Storage**: Browser localStorage (key: `gzclp_state`)
**Testing**: Vitest 3.2 + Testing Library (React)
**Target Platform**: Web (mobile-first responsive SPA, no backend)
**Project Type**: Single-page web application (frontend only)
**Performance Goals**: Bundle size <200KB gzipped, Mobile network optimized
**Constraints**: Offline-capable (cached data), No server-side storage, API rate limits

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Compliance Status |
|-----------|-------------|-------------------|
| I. TDD (NON-NEGOTIABLE) | Tests before implementation, Red-Green-Refactor cycle | **WILL COMPLY** - All progression detection logic requires unit tests first |
| II. User Data Sovereignty | localStorage only, no analytics, API key local only | **COMPLIANT** - No changes to storage approach |
| III. Mobile-First Design | Touch-friendly (44x44px targets), responsive, <2 taps critical actions | **WILL COMPLY** - Routine selector needs search/filter for mobile UX |
| IV. Hevy as Source of Truth | Read/write via API, no manual workout logging | **COMPLIANT** - Import reads from Hevy routines, stores routine IDs for updates |
| V. Minimal Dependencies | Core stack only, every dep justified | **COMPLIANT** - No new dependencies needed |
| VI. GZCLP Fidelity | Exact protocol (5x3, 6x2, 10x1 for T1, etc.) | **COMPLIANT** - Stage detection uses official rep schemes |

**Security Requirements**:
- No command injection: N/A (no shell commands)
- No XSS: User inputs (search) sanitized by React
- No API key exposure: Key stays in localStorage, passed only to Hevy API
- HTTPS only: Hevy API is HTTPS

**Gate Status**: ✅ PASSED - No violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/002-routine-selection-wizard/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── SetupWizard/
│   │   ├── index.tsx              # Main wizard (MODIFY: add routine-source step)
│   │   ├── ApiKeyStep.tsx         # Existing
│   │   ├── RoutineSourceStep.tsx  # NEW: "Create New" vs "Use Existing"
│   │   ├── RoutineAssignmentStep.tsx  # NEW: Map routines to A1/B1/A2/B2
│   │   ├── ImportReviewStep.tsx   # NEW: Review extracted exercises/stages
│   │   ├── NextWorkoutStep.tsx    # NEW: Select next day in rotation
│   │   ├── SlotAssignment.tsx     # Existing (for create-new path)
│   │   ├── WeightSetupStep.tsx    # Existing
│   │   └── SetupComplete.tsx      # Existing
│   └── common/
│       └── RoutineSelector.tsx    # NEW: Searchable dropdown for routines
├── lib/
│   ├── routine-importer.ts        # NEW: Extract exercises, detect stages
│   ├── stage-detector.ts          # NEW: Detect T1/T2 stage from sets
│   ├── routine-manager.ts         # Existing (may need minor updates)
│   └── constants.ts               # Existing (add slot mapping constants)
├── types/
│   ├── state.ts                   # Existing (add import-related types)
│   └── hevy.ts                    # Existing
└── hooks/
    └── useRoutineImport.ts        # NEW: Hook for import workflow state

tests/
├── unit/
│   ├── stage-detector.test.ts     # NEW: Stage detection logic
│   └── routine-importer.test.ts   # NEW: Exercise extraction logic
└── integration/
    └── setup-wizard-import.test.tsx  # NEW: Import flow integration tests
```

**Structure Decision**: Extends existing single-project structure. New components added to SetupWizard directory following established patterns. Core logic extracted to lib/ for testability.

## Complexity Tracking

No violations requiring justification. Feature aligns with all constitution principles.

## Phase 0: Research Summary

See [research.md](./research.md) for detailed findings.

## Phase 1: Design Artifacts

- [data-model.md](./data-model.md) - New entities and type extensions
- [contracts/](./contracts/) - Internal interfaces (no new API endpoints)
- [quickstart.md](./quickstart.md) - Implementation guide
