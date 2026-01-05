# LLM Implementation Prompt - GZCLP Gap Analysis Tasks

> **Copy this entire prompt when starting a new implementation session.**

---

## Context

You are implementing features for **GZCLP Hevy Tracker**, a React/TypeScript web app that tracks GZCLP workout progression using the Hevy API.

**Tech Stack:** React 18.3, TypeScript 5.9 (strict), Vite 5.4, Tailwind CSS 4.1, Vitest

**Your Mission:** Implement tasks from the gap analysis implementation plan, one or two at a time.

---

## Before You Start

1. **Read the implementation plan:**
   ```
   docs/gap-analysis-implementation-plan.md
   ```

2. **Check the Implementation Progress Tracker (Section 4)** to find the next incomplete task.

3. **Read the task's full section** including:
   - Problem description
   - Files to Modify
   - Implementation code
   - Acceptance Criteria

4. **Read ALL files listed in "Files to Modify"** before making any changes.

---

## Implementation Workflow

For each task, follow this exact workflow:

### Step 1: Announce the Task
```
I am implementing Task X.Y: [Task Name]
Gap: GAP-XX
Requirements: REQ-XXX-NNN
```

### Step 2: Read Required Files
Read every file listed in the task's "Files to Modify" section.

### Step 3: Implement Incrementally
- Make changes to one file at a time
- Follow existing code patterns and style
- Use the provided code snippets as guidance (adapt if needed)

### Step 4: Verify
Run these commands after implementation:
```bash
npm run build    # Must pass - no TypeScript errors
npm test         # Must pass - all tests
npm run lint     # Must pass - no linting errors
```

### Step 5: Update Progress Tracker
In `docs/gap-analysis-implementation-plan.md`, update the task status:
- Change `⬜` to `✅` in the progress tracker table
- Update the "Completed" count in the Overall Status table

### Step 6: Verify Acceptance Criteria
Go through each acceptance criterion and verify it's met AND MARK THEM AS MET!

---

## Task Selection Rules

1. **Follow Phase Order:** Complete Phase 1 before Phase 2, etc.
2. **Check Dependencies:** Some tasks depend on others (see dependency graph in plan)
3. **Priority:** Within a phase, prioritize 🔴 CRITICAL > 🟡 HIGH > 🟢 MEDIUM > 🔵 LOW

---

## Critical Reminders

- **DO NOT** modify files not listed in "Files to Modify"
- **DO NOT** add features beyond what's specified
- **DO NOT** refactor surrounding code unless required
- **DO NOT** skip running tests
- **ALWAYS** match existing code style (imports, formatting, naming)
- **ALWAYS** verify TypeScript compiles before marking complete

---

## If You Get Stuck

1. Check the spec document: `docs/GZCLP-Functional-Requirements-v2.md`
2. Look at existing similar patterns in the codebase
3. Prefer simpler implementations over complex ones
4. ASK! Ask questions in the form of multiple-choice questions. Give a suggested answer and provide your rationale
5. Document any assumptions made

---

## Session Handoff

At the end of each session, provide:

1. **Tasks Completed:** List task IDs completed this session
2. **Current State:** What's working, what's tested
3. **Next Task:** The next task to implement
4. **Blockers (if any):** Issues that need resolution
5. **Hand-off prompt:** A prompt that can be passed on to a LLM to continue the plan

---

## Quick Reference: Key Files

| Purpose | File |
|---------|------|
| Constants | `src/lib/constants.ts` |
| Progression Logic | `src/lib/progression.ts` |
| Routine Builder | `src/lib/routine-builder.ts` |
| Role Utilities | `src/lib/role-utils.ts` |
| State Types | `src/types/state.ts` |
| Hevy Types | `src/types/hevy.ts` |
| Dashboard | `src/components/Dashboard/index.tsx` |
| Setup Wizard | `src/components/SetupWizard/index.tsx` |
| Progression Hook | `src/hooks/useProgression.ts` |
| Pending Changes | `src/hooks/usePendingChanges.ts` |

---

## Start Here

**Your first action should be:**

1. Read `docs/gap-analysis-implementation-plan.md`
2. Check Section 4 (Progress Tracker) for the next incomplete task
3. Read the full task section and all files in "Files to Modify"
4. Begin implementation

**What task would you like to implement?** (Or I can suggest the next one based on the progress tracker.)
