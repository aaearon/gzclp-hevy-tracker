# Research: GZCLP Hevy Tracker

**Date**: 2026-01-02
**Branch**: `001-gzclp-hevy-tracker`

## 1. Hevy API Integration

### Decision: Use Official Hevy v1 API with api-key Header

**Rationale**: Official v1 API is the recommended approach for production. Requires Hevy Pro subscription but provides stable endpoints with documentation.

**Alternatives Considered**:
- Unofficial/Web API with session tokens - Rejected: Less stable, may change without notice
- Backend proxy - Rejected: Adds complexity; test CORS first

### Authentication

- **Base URL**: `https://api.hevyapp.com/v1/`
- **Header**: `api-key: YOUR_API_KEY`
- **Key Location**: Users obtain from https://hevy.com/settings?developer
- **Requirement**: Hevy Pro subscription required for API access

### Endpoints Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/workouts` | GET | Fetch completed workouts (descending date order) |
| `/v1/workouts/count` | GET | Get total workout count |
| `/v1/exercise-templates` | GET | List available exercises for selection |
| `/v1/routines` | GET | List existing routines |
| `/v1/routines` | POST | Create new GZCLP routines |
| `/v1/routines/{id}` | PUT | Update routine with new weights/schemes |

### Rate Limiting

- **Status**: No documented limits, but standard REST practices apply
- **Implementation**: Implement exponential backoff on 429 responses
- **Headers to Monitor**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

### CORS Considerations

- **Status**: CORS support not explicitly documented
- **Action**: Test preflight request before full implementation
- **Fallback**: If CORS blocked, consider using hevy-sdk library or service worker proxy

### Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Process response |
| 400 | Validation error | Show user-friendly message |
| 401 | Invalid API key | Prompt to re-enter key |
| 429 | Rate limited | Retry with backoff |
| 5xx | Server error | Show offline mode, retry later |

---

## 2. React localStorage Patterns

### Decision: Custom useLocalStorage Hook with usehooks-ts Patterns

**Rationale**: Lightweight, TypeScript-friendly, no external dependencies needed. Patterns well-documented and battle-tested.

**Alternatives Considered**:
- Zustand with persist middleware - Rejected: Violates minimal dependencies principle
- Redux Persist - Rejected: Overkill for single-user localStorage app

### Hook Implementation Pattern

```typescript
// Signature
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void]
```

**Key Features**:
- Lazy initialization (only read localStorage once)
- JSON serialization/deserialization with error handling
- Cross-tab sync via `storage` event listener
- SSR-safe (defer localStorage access to useEffect)

### JSON Safety Rules

1. Always wrap `JSON.parse()` in try-catch
2. Fallback to initial value on parse errors
3. Validate data structure after parsing
4. Avoid storing: class instances, functions, Date objects, Sets, Maps

### State Versioning Strategy

**Format**:
```typescript
interface PersistedState {
  version: number;  // Increment on schema changes
  data: GZCLPState;
}
```

**Migration Pattern**:
1. Check stored version vs current version
2. If mismatch, run migration function
3. Update stored version after successful migration
4. Provide defaults for new fields

---

## 3. React 18 Considerations

### Decision: Standard React 18 Patterns with StrictMode Awareness

**Rationale**: React 18's double-rendering in StrictMode is development-only. Structure hooks to be idempotent.

### StrictMode Double-Render Handling

- Effects run: setup → cleanup → setup (in dev only)
- Hooks must be idempotent (safe to run multiple times)
- Production builds unaffected
- No special handling needed if following React Rules

### Concurrent Mode Compatibility

- `createRoot()` enables concurrent rendering by default
- Components must be resilient to effects mounting/unmounting multiple times
- Proper effect cleanup prevents memory leaks

---

## 4. Data Export/Import

### Decision: JSON File Download/Upload with Version Tagging

**Rationale**: Simple, portable, human-readable. Matches localStorage format naturally.

### Export Pattern

1. Serialize state to JSON with formatting
2. Create Blob with application/json type
3. Generate download via temporary anchor element
4. Include version number in export root

### Import Pattern

1. File input with `accept=".json"`
2. Read via FileReader API
3. Parse and validate JSON structure
4. Check version and run migrations if needed
5. Confirm with user before overwriting existing data

### Security Considerations

- API key included in export (warn user about sharing)
- Validate imported data structure before applying
- Prevent injection via malformed JSON

---

## 5. Testing Strategy

### Decision: Vitest for Unit and Integration Tests

**Rationale**: Fast, Vite-native, TypeScript-first. Matches build tooling.

**Alternatives Considered**:
- Jest - Rejected: Slower, requires more configuration with Vite
- Playwright - Will use for E2E, but unit tests need Vitest

### Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| Unit | `tests/unit/` | Progression logic, pure functions |
| Integration | `tests/integration/` | API mocking, component integration |

### Progression Logic Tests (Critical)

Per Constitution Principle VI (GZCLP Fidelity), all progression rules must be tested:
- T1 stage transitions: 5x3+ → 6x2+ → 10x1+ → Deload
- T2 stage transitions: 3x10 → 3x8 → 3x6 → Deload
- T3 total rep threshold (25+)
- Deload calculation (85% rounded to 2.5kg)
- Weight increments (5kg lower, 2.5kg upper)

---

## Sources

- [Hevy API Swagger Documentation](https://api.hevyapp.com/docs/)
- [Hevy API Settings](https://hevy.com/settings?developer)
- [hevy-sdk TypeScript Library](https://github.com/JackEcuyer/hevy-sdk)
- [usehooks-ts useLocalStorage](https://usehooks-ts.com/react-hook/use-local-storage)
- [React 18 StrictMode Documentation](https://react.dev/reference/react/StrictMode)
- [Vitest Documentation](https://vitest.dev/)
