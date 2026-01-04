# Implementation Plan: Separate T1 and T2 Progression Tracking

**Branch**: `005-t1-t2-progression` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-t1-t2-progression/spec.md`

## Summary

Refactor the progression tracking system to maintain independent state for T1 and T2 variants of each main lift. Currently, progression is keyed by exerciseId (one entry per exercise), but main lifts act as both T1 and T2 on different days. The fix requires keying progression by role+tier composite key (e.g., "squat-T1", "squat-T2") so that failing T1 Squat does not affect T2 Squat progression.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode enabled)
**Primary Dependencies**: React 18.3, Vite 5.4, Tailwind CSS 4.1
**Storage**: Browser localStorage (key: `gzclp_state`)
**Testing**: Vitest + React Testing Library
**Target Platform**: Mobile-first responsive web (PWA-ready)
**Project Type**: Single-page web application (frontend only)
**Performance Goals**: Initial load <200KB gzipped, interaction response <100ms
**Constraints**: Offline-capable, no external state management, no backward compatibility/migration
**Scale/Scope**: Single user, ~50-100 exercises max, 4 GZCLP routines, 8 progression states (4 lifts × 2 tiers)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-Driven Development | PASS | TDD workflow required; tests before implementation for all progression logic |
| II. User Data Sovereignty | PASS | All data in localStorage; no external services added |
| III. Mobile-First Design | PASS | Weight verification UI must have 44x44px touch targets; 8-weight form optimized for mobile |
| IV. Hevy as Source of Truth | PASS | T1/T2 weight detection reads from Hevy routines; classifications are app-side metadata |
| V. Minimal Dependencies | PASS | No new npm packages; using existing React + localStorage patterns |
| VI. GZCLP Fidelity | PASS | T1 (5x3→6x2→10x1) and T2 (3x10→3x8→3x6) rules unchanged; now correctly independent |

**Result**: All gates pass. Proceeding to Phase 0.

### Post-Design Re-check (Phase 1 Complete)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-Driven Development | PASS | Test files defined in quickstart.md; TDD order specified per phase |
| II. User Data Sovereignty | PASS | No new external services; data stays in localStorage |
| III. Mobile-First Design | PASS | 8-weight form uses grouped layout; WeightInput component touch-optimized |
| IV. Hevy as Source of Truth | PASS | Detection reads from Hevy routines; progression is app-side overlay |
| V. Minimal Dependencies | PASS | No new npm packages; contracts use existing TypeScript types |
| VI. GZCLP Fidelity | PASS | Progression rules unchanged; key format change fixes tier independence |

**Post-Design Result**: All gates pass. Ready for `/speckit.tasks`.

## Project Structure

### Documentation (this feature)

```text
specs/005-t1-t2-progression/
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
│   ├── Dashboard/                    # MODIFY: Show T1/T2 rows per lift
│   ├── SetupWizard/                  # MODIFY: 8-weight collection, T1/T2 verification
│   │   ├── WeightSetupStep.tsx       # MODIFY: Expand from 4 to 8 inputs
│   │   └── ImportReviewStep.tsx      # MODIFY: Add T1/T2 verification UI
│   └── common/
│       └── WeightInput.tsx           # NEW: Reusable weight input with validation
├── hooks/
│   ├── useProgression.ts             # MODIFY: Use role+tier keys
│   └── usePendingChanges.ts          # MODIFY: Tier-specific labels
├── lib/
│   ├── progression.ts                # MODIFY: Lookup by role+tier key
│   ├── role-utils.ts                 # MODIFY: Add getProgressionKey()
│   ├── routine-importer.ts           # MODIFY: Detect T1/T2 weights separately
│   └── workout-analysis.ts           # MODIFY: Write to correct tier key
├── types/
│   └── state.ts                      # MODIFY: Add ProgressionKey type
└── utils/
    └── validation.ts                 # MODIFY: Add weight validation

tests/
├── unit/
│   ├── progression-keys.test.ts      # NEW: Composite key generation
│   ├── progression-independence.test.ts  # NEW: T1/T2 isolation
│   ├── weight-validation.test.ts     # NEW: Inline validation
│   ├── weight-input.test.ts          # NEW: WeightInput component (FR-024)
│   ├── weight-setup-step.test.ts     # NEW: 8-weight form submission
│   └── t1-t2-detection.test.ts       # NEW: Import path detection
└── integration/
    ├── import-verification-flow.test.ts  # NEW: Full import with T1/T2 verify
    └── tier-progression.test.ts      # NEW: End-to-end tier independence
```

**Structure Decision**: Extend existing single-project frontend structure. Modifications to existing files; new test files for comprehensive coverage. No architectural changes needed.

## Complexity Tracking

> No constitution violations. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
