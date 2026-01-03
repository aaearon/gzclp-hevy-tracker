# Design Decisions: Exercise Classification System

**Date**: 2026-01-03
**Context**: Implementation of T023-T027 (Dashboard Category Grouping)

## Clarifying Questions & Decisions

### Q1: Where should non-GZCLP exercises (Warmup/Cooldown/Supplemental) be stored?

**Options considered:**
- A) Add them to `state.exercises` with a new `category` field alongside `tier`
- B) Keep them only in the classification store, separate from `state.exercises`
- C) Create a new separate collection in state (e.g., `state.auxiliaryExercises`)

**Decision: Option A**

**Rationale**: The classification store is for lookups by `hevyTemplateId`, but the Dashboard iterates over `state.exercises`. Adding a `category` field to `ExerciseConfig` and including all imported exercises there provides a single source of truth for what exercises exist in the user's program.

**Implementation notes**:
- Add `category: ExerciseCategory` to `ExerciseConfig`
- Make `tier` and `slot` optional (only required for GZCLP categories T1/T2/T3)
- Non-GZCLP exercises (Warmup/Cooldown/Supplemental) won't have `tier` or `slot`

---

### Q2: When a user reclassifies an exercise from T1 to Supplemental in Settings, what should happen?

**Options considered:**
- A) Update the classification store only; Dashboard reads from classification store to determine display
- B) Update both classification store AND `state.exercises` to keep them in sync
- C) Update classification store and remove the exercise from `state.exercises`

**Decision: Option B**

**Rationale**: Both stores should stay in sync. The classification store is the canonical source for category, but `state.exercises` determines what appears in the Dashboard. Reclassifying to Supplemental should keep the exercise visible but change how it's displayed (with badge, no progression).

---

### Q3: For the current phase (T023-T027), what's the minimum viable scope?

**Options considered:**
- A) Full implementation: extend state.exercises to support all categories, update import flow, update Dashboard
- B) Infrastructure only: add CollapsibleSection/Badge placeholders in Dashboard, but don't change data model
- C) Display-only: use classification store to look up categories for existing exercises, show badges for reclassified ones

**Decision: Option A (simplified)**

**Rationale**: Since we have **zero users**, there are no backward compatibility concerns. We can directly extend `ExerciseConfig` to add the `category` field and update the Dashboard to group by category.

---

## Backward Compatibility

**Decision**: No backward compatibility measures needed.

**Rationale**: The project currently has zero users. We can freely modify the data model without migrations or compatibility shims.
