# GZCLP Hevy Integration Web Application

## Technical Specification v1.0

---

## 1. Overview

### 1.1 Purpose
A web application implementing GZCLP (GZCL Linear Progression) as the primary training tracker, integrating with Hevy via API to manage routines and track workout progression automatically.

### 1.2 Problem Statement
Hevy lacks built-in linear progression and automatic deload functionality. This application fills that gap by:
- Tracking GZCLP progression state
- Reading completed workouts from Hevy to detect success/failure
- Calculating and suggesting weight/rep changes
- Updating Hevy routines after user confirmation

### 1.3 Key Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Storage | localStorage | Simple, no backend needed, user owns data |
| Failure Detection | Auto-detect from Hevy | Reduces manual input, single source of truth |
| Session Tracking | Read actual sessions from Hevy | Hevy is the workout logger |
| AMRAP | All tiers (T1/T2/T3 final sets) | Core to GZCLP progression |
| Rest Timers | Include recommendations per tier | Supports proper recovery |
| UI | Simple table-based dashboard | Fast to implement, functional |
| Responsive | Mobile-first with desktop support | Gym usage on phone |

---

## 2. GZCLP Program Rules

### 2.1 Program Structure
- **Format**: Standard 3-day rotation
- **Weekly Pattern**: A/B/A one week, B/A/B the next
- **Days**: User-configurable (e.g., Mon/Wed/Fri)

### 2.2 Workout Templates

**Day A**
| Tier | Exercise | Sets x Reps |
|------|----------|-------------|
| T1 | Squat (customizable) | 5x3+ |
| T2 | Bench Press (customizable) | 3x10 |
| T3 | Lat Pulldown (customizable) | 3x15+ |

**Day B**
| Tier | Exercise | Sets x Reps |
|------|----------|-------------|
| T1 | OHP (customizable) | 5x3+ |
| T2 | Deadlift (customizable) | 3x10 |
| T3 | Dumbbell Row (customizable) | 3x15+ |

**Day C** (Alternative B)
| Tier | Exercise | Sets x Reps |
|------|----------|-------------|
| T1 | Bench Press (customizable) | 5x3+ |
| T2 | Squat (customizable) | 3x10 |
| T3 | Lat Pulldown (customizable) | 3x15+ |

**Day D** (Alternative A)
| Tier | Exercise | Sets x Reps |
|------|----------|-------------|
| T1 | Deadlift (customizable) | 5x3+ |
| T2 | OHP (customizable) | 3x10 |
| T3 | Dumbbell Row (customizable) | 3x15+ |

### 2.3 Progression Rules

#### T1 (Main Lifts)
```
Stage 0: 5x3+ (5 sets of 3 reps, last set AMRAP)
  ✅ Success: Hit 3+ reps on all sets → Add weight, stay at 5x3+
  ❌ Failure: Cannot complete 3 reps on any set → Move to Stage 1

Stage 1: 6x2+ (6 sets of 2 reps, last set AMRAP)
  ✅ Success: Hit 2+ reps on all sets → Add weight, stay at 6x2+
  ❌ Failure: Cannot complete 2 reps on any set → Move to Stage 2

Stage 2: 10x1+ (10 singles, last set AMRAP)
  ✅ Success: Hit all singles → Add weight, stay at 10x1+
  ❌ Failure: Cannot complete singles → DELOAD

DELOAD: Reset to 85% of failed weight, restart at Stage 0 (5x3+)
```

#### T2 (Secondary Lifts)
```
Stage 0: 3x10 (3 sets of 10 reps)
  ✅ Success: Hit 10 reps on all sets → Add weight, stay at 3x10
  ❌ Failure: Cannot complete 10 reps → Move to Stage 1

Stage 1: 3x8 (3 sets of 8 reps)
  ✅ Success: Hit 8 reps on all sets → Add weight, stay at 3x8
  ❌ Failure: Cannot complete 8 reps → Move to Stage 2

Stage 2: 3x6 (3 sets of 6 reps)
  ✅ Success: Hit 6 reps on all sets → Add weight, stay at 3x6
  ❌ Failure: Cannot complete 6 reps → DELOAD

DELOAD: Reset to 85% of failed weight, restart at Stage 0 (3x10)
```

#### T3 (Accessories)
```
Scheme: 3x15+ (3 sets of 15 reps, last set AMRAP)
  ✅ Success: Hit 25+ total reps across all sets → Add weight
  ❌ Failure: Under 25 total reps → Repeat same weight

No stage progression for T3, just weight increases.
```

### 2.4 Weight Increments
| Exercise Type | Increment |
|---------------|-----------|
| Upper Body (Bench, OHP, Rows) | 2.5 kg |
| Lower Body (Squat, Deadlift) | 5 kg |
| T3 Accessories | 2.5 kg or smallest available |

### 2.5 Rest Timer Recommendations
| Tier | Rest Between Sets | Rationale |
|------|-------------------|-----------|
| T1 | 3-5 minutes | Heavy load, CNS recovery |
| T2 | 2-3 minutes | Moderate load |
| T3 | 60-90 seconds | Light load, pump work |

---

## 3. Technical Architecture

### 3.1 Stack
```
┌─────────────────────────────────────────────────────┐
│                 React + TypeScript                  │
│              (Vite, Tailwind CSS)                   │
├─────────────────────────────────────────────────────┤
│                   localStorage                      │
│           (Program state, settings)                 │
├─────────────────────────────────────────────────────┤
│                  Hevy REST API                      │
│    (Exercises, Workouts, Routines read/write)       │
└─────────────────────────────────────────────────────┘
```

### 3.2 No Backend Required
- All state stored in browser localStorage
- Direct API calls to Hevy from frontend
- API key stored locally (user responsibility)
- Exportable/importable JSON for backup

### 3.3 Deployment Options
| Option | Setup |
|--------|-------|
| Local | `npm run dev` |
| Self-hosted | Static files on any web server |
| Cloud | Vercel, Netlify, GitHub Pages |

---

## 4. Hevy API Integration

### 4.1 Authentication
```
Base URL: https://api.hevyapp.com
Header: api-key: {user_api_key}
```

API key obtained from: https://hevy.com/settings?developer

### 4.2 Required Endpoints

#### Read Operations
```javascript
// Fetch available exercises
GET /v1/exercise_templates?page={n}&pageSize=10
Response: { page, page_count, exercise_templates[] }

// Fetch completed workouts
GET /v1/workouts?page={n}&pageSize=10
Response: { page, page_count, workouts[] }

// Fetch exercise history (for specific exercise analysis)
GET /v1/exercise_history/{exerciseTemplateId}
Response: { exercise_history[] }

// Fetch current routines
GET /v1/routines?page={n}&pageSize=10
Response: { page, page_count, routines[] }

// Fetch routine folders
GET /v1/routine_folders?page={n}&pageSize=10
Response: { page, page_count, routine_folders[] }
```

#### Write Operations
```javascript
// Create routine folder
POST /v1/routine_folders
Body: {
  "routine_folder": {
    "title": "GZCLP Program 🏋️"
  }
}

// Create routine
POST /v1/routines
Body: {
  "routine": {
    "title": "GZCLP Day A",
    "folder_id": null,
    "notes": "T1: Squat 5x3+, T2: Bench 3x10, T3: Lat Pulldown 3x15+",
    "exercises": [...]
  }
}

// Update routine (for progression updates)
PUT /v1/routines/{routineId}
Body: { "routine": {...} }
```

### 4.3 Data Structures

#### Exercise in Routine (Write)
```javascript
{
  "exercise_template_id": "D04AC939",
  "superset_id": null,
  "rest_seconds": 180,  // T1 = 180-300, T2 = 120-180, T3 = 60-90
  "notes": "T1 - Stage 0 (5x3+) - Week 3",
  "sets": [
    { "type": "normal", "weight_kg": 100, "reps": 3 },
    { "type": "normal", "weight_kg": 100, "reps": 3 },
    { "type": "normal", "weight_kg": 100, "reps": 3 },
    { "type": "normal", "weight_kg": 100, "reps": 3 },
    { "type": "normal", "weight_kg": 100, "reps": 3 }  // AMRAP set
  ]
}
```

#### Workout Analysis (Read)
```javascript
// From GET /v1/workouts response
{
  "id": "uuid",
  "title": "GZCLP Day A",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:15:00Z",
  "exercises": [
    {
      "exercise_template_id": "D04AC939",
      "title": "Squat (Barbell)",
      "sets": [
        { "weight_kg": 100, "reps": 3, "type": "normal" },
        { "weight_kg": 100, "reps": 3, "type": "normal" },
        { "weight_kg": 100, "reps": 3, "type": "normal" },
        { "weight_kg": 100, "reps": 3, "type": "normal" },
        { "weight_kg": 100, "reps": 5, "type": "normal" }  // AMRAP result
      ]
    }
  ]
}
```

---

## 5. Application State

### 5.1 localStorage Schema

```typescript
interface GZCLPState {
  version: string;  // For migration support
  apiKey: string;   // Hevy API key (encrypted or plain)

  program: {
    name: string;
    createdAt: string;
    hevyFolderId: number | null;
    routineIds: {
      dayA: string | null;
      dayB: string | null;
      dayC: string | null;
      dayD: string | null;
    };
  };

  exercises: {
    [slot: string]: ExerciseConfig;  // e.g., "t1_squat", "t2_bench"
  };

  progression: {
    [exerciseId: string]: ProgressionState;
  };

  settings: {
    weightUnit: 'kg' | 'lbs';
    upperIncrement: number;
    lowerIncrement: number;
    restTimers: {
      t1: number;
      t2: number;
      t3: number;
    };
  };

  lastSync: string | null;
}

interface ExerciseConfig {
  hevyTemplateId: string;
  name: string;
  tier: 'T1' | 'T2' | 'T3';
  muscleGroup: 'upper' | 'lower';
  day: 'A' | 'B' | 'C' | 'D';
}

interface ProgressionState {
  currentWeight: number;
  stage: number;           // 0, 1, or 2
  baseWeight: number;      // For deload calculation
  lastWorkoutId: string | null;
  lastWorkoutDate: string | null;
  consecutiveFailures: number;
  totalDeloads: number;
  amrapRecord: number;     // Best AMRAP for this weight
}
```

### 5.2 State Operations

```typescript
// Load state
function loadState(): GZCLPState | null {
  const raw = localStorage.getItem('gzclp_state');
  return raw ? JSON.parse(raw) : null;
}

// Save state
function saveState(state: GZCLPState): void {
  localStorage.setItem('gzclp_state', JSON.stringify(state));
}

// Export for backup
function exportState(): string {
  return JSON.stringify(loadState(), null, 2);
}

// Import from backup
function importState(json: string): void {
  const state = JSON.parse(json);
  // Validate structure
  saveState(state);
}
```

---

## 6. Core Logic

### 6.1 Workout Analysis

```typescript
interface WorkoutAnalysis {
  exerciseId: string;
  tier: 'T1' | 'T2' | 'T3';
  targetWeight: number;
  targetReps: number;
  targetSets: number;
  actualSets: SetResult[];
  success: boolean;
  amrapReps: number | null;
  totalReps: number;
}

interface SetResult {
  weight: number;
  reps: number;
  completed: boolean;  // Met target reps?
}

function analyzeWorkout(
  workout: HevyWorkout,
  programState: GZCLPState
): WorkoutAnalysis[] {
  const analyses: WorkoutAnalysis[] = [];

  for (const exercise of workout.exercises) {
    const config = findExerciseConfig(exercise.exercise_template_id, programState);
    if (!config) continue;  // Not a tracked exercise

    const progression = programState.progression[exercise.exercise_template_id];
    const target = getTargetForStage(config.tier, progression.stage);

    const setResults = exercise.sets.map((set, idx) => ({
      weight: set.weight_kg,
      reps: set.reps,
      completed: set.reps >= target.repsPerSet
    }));

    const totalReps = setResults.reduce((sum, s) => sum + s.reps, 0);
    const allSetsCompleted = setResults.every(s => s.completed);
    const amrapReps = setResults[setResults.length - 1]?.reps || null;

    // Success criteria varies by tier
    let success: boolean;
    if (config.tier === 'T3') {
      success = totalReps >= 25;  // T3 uses total rep threshold
    } else {
      success = allSetsCompleted;
    }

    analyses.push({
      exerciseId: exercise.exercise_template_id,
      tier: config.tier,
      targetWeight: progression.currentWeight,
      targetReps: target.repsPerSet,
      targetSets: target.sets,
      actualSets: setResults,
      success,
      amrapReps,
      totalReps
    });
  }

  return analyses;
}
```

### 6.2 Progression Calculator

```typescript
interface ProgressionRecommendation {
  exerciseId: string;
  exerciseName: string;
  tier: 'T1' | 'T2' | 'T3';
  currentWeight: number;
  currentStage: number;
  recommendation: 'progress' | 'stage_change' | 'deload' | 'repeat';
  newWeight: number;
  newStage: number;
  newScheme: string;  // e.g., "5x3+", "6x2+", "3x10"
  reason: string;
}

function calculateProgression(
  analysis: WorkoutAnalysis,
  currentState: ProgressionState,
  config: ExerciseConfig,
  settings: Settings
): ProgressionRecommendation {
  const increment = config.muscleGroup === 'upper'
    ? settings.upperIncrement
    : settings.lowerIncrement;

  if (analysis.success) {
    // SUCCESS: Add weight, keep stage
    return {
      exerciseId: analysis.exerciseId,
      exerciseName: config.name,
      tier: config.tier,
      currentWeight: currentState.currentWeight,
      currentStage: currentState.stage,
      recommendation: 'progress',
      newWeight: currentState.currentWeight + increment,
      newStage: currentState.stage,
      newScheme: getSchemeString(config.tier, currentState.stage),
      reason: `Completed all sets. Adding ${increment}kg.`
    };
  }

  // FAILURE for T1/T2: Check stage advancement
  if (config.tier !== 'T3') {
    if (currentState.stage < 2) {
      // Move to next stage
      const newStage = currentState.stage + 1;
      return {
        exerciseId: analysis.exerciseId,
        exerciseName: config.name,
        tier: config.tier,
        currentWeight: currentState.currentWeight,
        currentStage: currentState.stage,
        recommendation: 'stage_change',
        newWeight: currentState.currentWeight,
        newStage: newStage,
        newScheme: getSchemeString(config.tier, newStage),
        reason: `Failed ${getSchemeString(config.tier, currentState.stage)}. Moving to ${getSchemeString(config.tier, newStage)}.`
      };
    } else {
      // At final stage, need deload
      const deloadWeight = Math.round(currentState.baseWeight * 0.85 / 2.5) * 2.5;
      return {
        exerciseId: analysis.exerciseId,
        exerciseName: config.name,
        tier: config.tier,
        currentWeight: currentState.currentWeight,
        currentStage: currentState.stage,
        recommendation: 'deload',
        newWeight: deloadWeight,
        newStage: 0,
        newScheme: getSchemeString(config.tier, 0),
        reason: `Failed final stage. Deloading to ${deloadWeight}kg and restarting at ${getSchemeString(config.tier, 0)}.`
      };
    }
  }

  // T3 FAILURE: Just repeat
  return {
    exerciseId: analysis.exerciseId,
    exerciseName: config.name,
    tier: config.tier,
    currentWeight: currentState.currentWeight,
    currentStage: 0,
    recommendation: 'repeat',
    newWeight: currentState.currentWeight,
    newStage: 0,
    newScheme: '3x15+',
    reason: `Only ${analysis.totalReps} total reps (need 25+). Repeating weight.`
  };
}

function getSchemeString(tier: 'T1' | 'T2' | 'T3', stage: number): string {
  if (tier === 'T1') {
    return ['5x3+', '6x2+', '10x1+'][stage];
  }
  if (tier === 'T2') {
    return ['3x10', '3x8', '3x6'][stage];
  }
  return '3x15+';
}

function getTargetForStage(tier: 'T1' | 'T2' | 'T3', stage: number): { sets: number; repsPerSet: number } {
  if (tier === 'T1') {
    return [
      { sets: 5, repsPerSet: 3 },
      { sets: 6, repsPerSet: 2 },
      { sets: 10, repsPerSet: 1 }
    ][stage];
  }
  if (tier === 'T2') {
    return [
      { sets: 3, repsPerSet: 10 },
      { sets: 3, repsPerSet: 8 },
      { sets: 3, repsPerSet: 6 }
    ][stage];
  }
  return { sets: 3, repsPerSet: 15 };
}
```

### 6.3 Hevy Routine Builder

```typescript
function buildRoutinePayload(
  day: 'A' | 'B' | 'C' | 'D',
  exercises: ExerciseConfig[],
  progressions: Record<string, ProgressionState>,
  settings: Settings
): HevyRoutinePayload {
  const dayExercises = exercises.filter(e => e.day === day);

  return {
    routine: {
      title: `GZCLP Day ${day} 🏋️`,
      folder_id: null,
      notes: generateRoutineNotes(dayExercises, progressions),
      exercises: dayExercises.map(ex => {
        const prog = progressions[ex.hevyTemplateId];
        const target = getTargetForStage(ex.tier, prog.stage);
        const restSeconds = getRestSeconds(ex.tier, settings);

        return {
          exercise_template_id: ex.hevyTemplateId,
          superset_id: null,
          rest_seconds: restSeconds,
          notes: `${ex.tier} - ${getSchemeString(ex.tier, prog.stage)}`,
          sets: Array(target.sets).fill(null).map(() => ({
            type: 'normal',
            weight_kg: prog.currentWeight,
            reps: target.repsPerSet
          }))
        };
      })
    }
  };
}

function getRestSeconds(tier: 'T1' | 'T2' | 'T3', settings: Settings): number {
  return {
    T1: settings.restTimers.t1,
    T2: settings.restTimers.t2,
    T3: settings.restTimers.t3
  }[tier];
}
```

---

## 7. User Interface

### 7.1 Application Structure

```
┌─────────────────────────────────────────────────────────────┐
│  GZCLP Tracker                          [Sync] [Settings]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Next Workout: Day A          Last Sync: 2 hours ago │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ EXERCISE        │ WEIGHT │ SCHEME │ STATUS │ ACTION │   │
│  ├─────────────────┼────────┼────────┼────────┼────────┤   │
│  │ T1 Squat        │ 100 kg │ 5x3+   │   ✅   │ [View] │   │
│  │ T2 Bench Press  │  60 kg │ 3x10   │   ⚠️   │ [View] │   │
│  │ T3 Lat Pulldown │  45 kg │ 3x15+  │   ✅   │ [View] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pending Changes (2)                    [Review All] │   │
│  │ • Squat: 100kg → 105kg (progress)                   │   │
│  │ • Bench: 3x10 → 3x8 (stage change)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Pages/Views

| View | Purpose |
|------|---------|
| **Dashboard** | Main view with exercise table and pending changes |
| **Setup Wizard** | Initial program configuration (API key, exercises, weights) |
| **Exercise Detail** | History and progression for single exercise |
| **Review Modal** | Confirm/reject pending progression changes |
| **Settings** | Weight units, increments, rest timers, export/import |

### 7.3 Component Hierarchy

```
App
├── Header
│   ├── Logo/Title
│   ├── SyncButton
│   └── SettingsButton
├── Dashboard (main view)
│   ├── NextWorkoutCard
│   ├── ExerciseTable
│   │   └── ExerciseRow (×n)
│   └── PendingChangesCard
│       └── ChangeItem (×n)
├── SetupWizard (first run)
│   ├── ApiKeyStep
│   ├── ExerciseSelectionStep
│   └── StartingWeightsStep
├── ReviewModal
│   └── RecommendationCard (×n)
└── SettingsPanel
    ├── UnitsSelector
    ├── IncrementsInput
    ├── RestTimersInput
    └── ExportImportButtons
```

### 7.4 Status Indicators

| Icon | Meaning |
|------|---------|
| ✅ | Progressing normally |
| ⚠️ | Stage change pending |
| 🔄 | Deload recommended |
| ❓ | No recent data |
| 🔒 | Awaiting confirmation |

---

## 8. User Flows

### 8.1 Initial Setup

```
1. Open app → Detect no saved state
2. Show Setup Wizard
3. Step 1: Enter Hevy API key
   - Validate key with test API call
   - Store in localStorage
4. Step 2: Select exercises for each slot
   - Fetch exercise templates from Hevy
   - Allow search/filter
   - Assign to T1/T2/T3 slots for each day
5. Step 3: Enter starting weights
   - Input current working weight per exercise
   - Set as both currentWeight and baseWeight
6. Step 4: Configure settings
   - Weight unit (kg/lbs)
   - Increments
   - Rest timers (pre-filled with defaults)
7. Create routines in Hevy (with confirmation)
8. Save state → Show Dashboard
```

### 8.2 Regular Sync Flow

```
1. User clicks "Sync from Hevy"
2. Fetch recent workouts from Hevy API
3. Identify workouts matching program routines
4. For each new workout:
   a. Analyze sets/reps vs targets
   b. Calculate progression recommendations
   c. Add to pending changes
5. Display pending changes on Dashboard
6. User clicks "Review All"
7. Show ReviewModal with each recommendation
8. User confirms or rejects each change
9. For confirmed changes:
   a. Update local progression state
   b. Update Hevy routine via API
10. Save state → Refresh Dashboard
```

### 8.3 Manual Override Flow

```
1. User clicks exercise row → Exercise Detail view
2. Can manually adjust:
   - Current weight
   - Current stage
   - Mark as needing deload
3. Changes create pending update
4. Follow confirmation flow as normal
```

---

## 9. Error Handling

### 9.1 API Errors

| Error | User Message | Recovery |
|-------|--------------|----------|
| 401 Unauthorized | "API key invalid or expired" | Prompt to re-enter key |
| 429 Rate Limited | "Too many requests. Wait and retry." | Auto-retry with backoff |
| 500 Server Error | "Hevy is temporarily unavailable" | Allow offline viewing |
| Network Error | "No internet connection" | Queue changes for later |

### 9.2 Data Validation

- Validate all user inputs before saving
- Validate API responses match expected schema
- Graceful fallback for missing/malformed data
- Version field in state for future migrations

---

## 10. Security Considerations

### 10.1 API Key Storage
- Stored in localStorage (browser-only)
- User is responsible for device security
- Option to clear on logout
- Never transmitted except to Hevy API

### 10.2 Data Privacy
- All data stored locally
- No external analytics or tracking
- Export feature for user data portability
- Clear all data option in settings

---

## 11. Implementation Phases

### Phase 1: Core MVP
- [ ] Project setup (Vite + React + TypeScript + Tailwind)
- [ ] localStorage state management
- [ ] Hevy API client (read operations)
- [ ] Setup wizard (API key + exercise selection)
- [ ] Basic dashboard with exercise table
- [ ] Manual weight entry

### Phase 2: Progression Engine
- [ ] Workout analysis logic
- [ ] Progression calculator
- [ ] Pending changes display
- [ ] Review/confirmation modal
- [ ] Hevy routine updates (write operations)

### Phase 3: Polish
- [ ] Mobile responsive design
- [ ] Exercise detail view
- [ ] Settings panel
- [ ] Export/import functionality
- [ ] Error handling improvements
- [ ] Loading states and feedback

### Phase 4: Enhancements
- [ ] AMRAP tracking and display
- [ ] Progression history per exercise
- [ ] Rest timer integration
- [ ] PWA support for offline access
- [ ] Unit tests for progression logic

---

## 12. File Structure

```
gzclp-hevy-tracker/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ExerciseTable.tsx
│   │   ├── ExerciseRow.tsx
│   │   ├── PendingChanges.tsx
│   │   ├── ReviewModal.tsx
│   │   ├── SetupWizard/
│   │   │   ├── index.tsx
│   │   │   ├── ApiKeyStep.tsx
│   │   │   ├── ExerciseStep.tsx
│   │   │   └── WeightsStep.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   └── useHevyApi.ts
│   ├── lib/
│   │   ├── hevy-client.ts
│   │   ├── progression.ts
│   │   ├── workout-analysis.ts
│   │   └── routine-builder.ts
│   ├── types/
│   │   ├── state.ts
│   │   └── hevy.ts
│   └── utils/
│       ├── validation.ts
│       └── formatting.ts
└── README.md
```

---

## 13. Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

Minimal dependencies for maintainability. No state management library needed (localStorage + React state is sufficient).

---

## Appendix A: GZCLP Quick Reference

| Tier | Purpose | Starting Scheme | Progression | Failure Path |
|------|---------|-----------------|-------------|--------------|
| T1 | Strength | 5x3+ | +5kg lower / +2.5kg upper | 5x3 → 6x2 → 10x1 → Deload |
| T2 | Volume | 3x10 | +5kg lower / +2.5kg upper | 3x10 → 3x8 → 3x6 → Deload |
| T3 | Accessories | 3x15+ | +2.5kg when 25+ total reps | Repeat weight |

---

## Appendix B: Hevy API Reference

Base URL: `https://api.hevyapp.com`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/exercise_templates` | GET | List available exercises |
| `/v1/workouts` | GET | Fetch completed workouts |
| `/v1/exercise_history/{id}` | GET | Exercise-specific history |
| `/v1/routines` | GET | List user's routines |
| `/v1/routines` | POST | Create new routine |
| `/v1/routines/{id}` | PUT | Update existing routine |
| `/v1/routine_folders` | GET | List routine folders |
| `/v1/routine_folders` | POST | Create routine folder |

Full documentation: https://api.hevyapp.com/docs/