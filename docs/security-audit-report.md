# Security Audit Report: GZCLP Hevy Tracker

**Audit Date:** 2026-01-11 (Updated)
**Application:** gzclp-hevy-tracker
**Version:** 2.2.0
**Auditor:** Security Audit (DevSecOps)

---

## Executive Summary

This security audit examined the GZCLP Hevy Tracker, a React/TypeScript fitness tracking application that integrates with the Hevy API. The application stores data in localStorage and communicates with an external API using user-provided API keys.

**Overall Security Posture:** GOOD

The application demonstrates several security best practices and has addressed previous concerns. Key areas for improvement remain around Content Security Policy implementation and production build configuration.

### Risk Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | - |
| High | 1 | Missing CSP |
| Medium | 3 | Recommended fixes |
| Low | 4 | Informational |

---

## Table of Contents

1. [High-Priority Findings](#high-priority-findings)
2. [Medium-Priority Findings](#medium-priority-findings)
3. [Low-Priority Findings](#low-priority-findings)
4. [Positive Security Practices](#positive-security-practices)
5. [Recommendations Summary](#recommendations-summary)
6. [Previously Resolved Issues](#previously-resolved-issues)

---

## High-Priority Findings

### H1: Missing Content Security Policy (CSP)

**Location:** `/index.html`

**Description:** The application lacks Content Security Policy headers or meta tags. CSP is a critical defense-in-depth mechanism against XSS attacks.

**Evidence:**
```html
<!-- index.html - No CSP meta tag present -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- Missing: <meta http-equiv="Content-Security-Policy" content="..."> -->
```

**Risk Level:** HIGH

**Impact:** Without CSP, if any XSS vulnerability is introduced, attackers have more freedom to execute malicious scripts, exfiltrate data, or modify the DOM.

**Recommendation:**
Add a Content Security Policy meta tag or configure via server headers:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.hevyapp.com;
  img-src 'self' data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
">
```

---

## Medium-Priority Findings

### M1: Error Message Information Leakage

**Location:** `/src/components/ErrorBoundary.tsx:76-84`

**Description:** The error boundary displays raw error messages to users, which could potentially leak implementation details.

**Evidence:**
```tsx
{this.state.error && (
  <details className="mb-4 text-left">
    <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
      Error details
    </summary>
    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs text-red-600 overflow-auto max-h-32">
      {this.state.error.message}
    </pre>
  </details>
)}
```

**Risk Level:** MEDIUM

**Impact:** Stack traces or detailed error messages could reveal internal implementation details to attackers.

**Recommendation:**
1. Only show detailed errors in development mode
2. Log detailed errors to a monitoring service
3. Show generic error messages to users in production

---

### M2: Console Logging in Production Code

**Location:** Multiple files

**Description:** The application logs warnings and errors to the console, which remains visible in production builds.

**Evidence:**
```
src/hooks/useLocalStorage.ts:55,64,94,117,139,147,178,186 - console.warn calls
src/components/ErrorBoundary.tsx:32 - console.error call
src/hooks/useDataMaintenance.ts:83,121 - console.warn calls
```

**Risk Level:** MEDIUM

**Impact:** Console logs can leak information about application internals, error states, and potentially sensitive data paths to anyone with browser developer tools access.

**Recommendation:**
1. Configure build process to strip console statements in production
2. Use a logging abstraction that can be disabled in production
3. Consider a logging service for production error tracking

---

### M3: Sourcemaps Enabled in Production Build

**Location:** `/vite.config.ts:16`

**Description:** Source maps are enabled in the production build configuration.

**Evidence:**
```typescript
build: {
  target: 'es2020',
  outDir: 'dist',
  sourcemap: true,  // Enabled for production
},
```

**Risk Level:** MEDIUM

**Impact:** Source maps expose the original source code structure, making it easier for attackers to understand the application logic and find vulnerabilities.

**Recommendation:**
1. Disable source maps in production: `sourcemap: false`
2. Or use hidden source maps: `sourcemap: 'hidden'` (for error monitoring services only)

---

## Low-Priority Findings

### L1: API Key Stored in localStorage

**Location:** `/src/hooks/useConfigStorage.ts`, `/src/types/storage.ts`

**Description:** The Hevy API key is stored in localStorage under the `gzclp_config` key. While this is the only viable option for a client-side app, it carries inherent risks.

**Evidence:**
```typescript
// src/types/storage.ts:37
apiKey: string
```

**Risk Level:** LOW (Acceptable for use case)

**Current Mitigations:**
- API key is excluded from exports (`/src/lib/data-export.ts:29-33`)
- No XSS vectors found in codebase
- Input properly handled with React's JSX escaping

**Residual Risk:** XSS from browser extensions or compromised dependencies could extract the key.

**Recommendation:**
Document this limitation for users. Consider adding a warning about browser extension security.

---

### L2: localStorage Quota Management

**Location:** `/src/lib/storage-monitor.ts`

**Description:** While the application monitors localStorage usage, it doesn't actively prevent quota exceeded errors or implement automatic data pruning.

**Evidence:**
```typescript
// Constants show awareness of limits
export const STORAGE_WARNING_THRESHOLD_BYTES = 4 * 1024 * 1024
export const MAX_HISTORY_ENTRIES_PER_EXERCISE = 200
```

**Risk Level:** LOW

**Impact:** Users with extensive workout history could potentially hit localStorage limits, causing data loss or application errors.

**Recommendation:**
1. Implement automatic pruning of oldest history entries
2. Add user notification when approaching storage limits
3. Consider migration to IndexedDB for larger datasets

---

### L3: No HTTP Security Headers Configuration

**Location:** No server configuration files found

**Description:** No netlify.toml, vercel.json, or similar deployment configuration was found for setting security headers.

**Risk Level:** LOW

**Impact:** Missing headers like X-Frame-Options, X-Content-Type-Options could leave the application vulnerable to clickjacking or MIME sniffing attacks.

**Recommendation:**
Create appropriate deployment configuration, for example `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
```

---

### L4: No Client-Side Rate Limiting

**Location:** `/src/lib/hevy-client.ts`

**Description:** While the Hevy API implements rate limiting (handled via 429 response), the client has no proactive rate limiting. Rapid user actions could trigger rate limits.

**Current Handling:**
```typescript
// Lines 146-149
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After')
  throw new HevyRateLimitError(retryAfter ? parseInt(retryAfter, 10) : null)
}
```

**Risk Level:** LOW

**Recommendation:** Consider implementing client-side debouncing or request queuing for user-triggered sync operations.

---

## Positive Security Practices

The following security practices are properly implemented:

### P1: API Key Properly Excluded from Exports

**Location:** `/src/lib/data-export.ts:29-37`

```typescript
// SECURITY: Excludes apiKey from export to prevent credential exposure.
export function serializeState(state: GZCLPState): string {
  const { apiKey: _excluded, ...stateWithoutApiKey } = state
  // ...
  apiKey: '', // Empty placeholder for schema compatibility
}
```

### P2: Strong Input Validation with Zod

**Location:** `/src/lib/data-import.ts`

The application uses Zod for schema validation of imported data, providing type-safe validation:
```typescript
const ImportStateSchema = z.object({
  version: z.string().regex(SEMVER_REGEX, 'Invalid version format'),
  apiKey: z.string(),
  program: ProgramConfigSchema,
  // ... comprehensive nested validation
})
```

### P3: No XSS Vectors Found

**Search Results:**
- No `dangerouslySetInnerHTML` usage
- No `innerHTML` or `outerHTML` assignments
- No `eval()` or `Function()` constructors
- React's JSX escaping provides baseline XSS protection

### P4: Password-Style API Key Input

**Location:** `/src/components/SetupWizard/WelcomeStep.tsx:149-181`

The API key input uses password masking with a toggle option:
```tsx
<input
  type={showApiKey ? 'text' : 'password'}
  // Show/hide toggle button available
/>
```

### P5: Secure External API Communication

**Location:** `/src/lib/hevy-client.ts`

- HTTPS only (Line 25: `https://api.hevyapp.com/v1`)
- Request timeouts implemented (30 second default)
- Proper error handling for auth failures (401) and rate limits (429)
- API key sent via header (not URL parameter)

### P6: Import File Size Limits

**Location:** `/src/lib/data-import.ts:14`

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024  // 5MB limit
```
Prevents DoS via oversized import files.

### P7: localStorage Type Guards

**Location:** `/src/types/storage.ts:92-132`

Type guards validate data structure when hydrating from localStorage:
```typescript
export function isConfigState(obj: unknown): obj is ConfigState {
  if (!obj || typeof obj !== 'object') return false
  // ... field validation
}
```

### P8: API Key Format Validation

**Location:** `/src/utils/validation.ts:20-33`

API keys are validated to match UUID format before being sent to the API:
```typescript
export function isValidApiKey(apiKey: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(trimmed)
}
```

### P9: Input Sanitization Function Available

**Location:** `/src/utils/validation.ts:67-78`

```typescript
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim()
}
```

### P10: External Links Use noopener noreferrer

**Location:** `/src/components/SetupWizard/WelcomeStep.tsx:237-244`

```tsx
<a
  href="https://hevy.com/settings?developer"
  target="_blank"
  rel="noopener noreferrer"  // Correctly implemented
>
```

---

## Recommendations Summary

### Immediate Actions (High Priority)

| ID | Finding | Recommendation | Effort |
|----|---------|----------------|--------|
| H1 | Missing CSP | Add Content-Security-Policy meta tag | Low |

### Short-Term Actions (Medium Priority)

| ID | Finding | Recommendation | Effort |
|----|---------|----------------|--------|
| M1 | Error Information Leakage | Conditional error display for production | Low |
| M2 | Console Logging | Strip console statements in production build | Low |
| M3 | Source Maps in Production | Disable or hide source maps | Low |

### Long-Term Actions (Low Priority)

| ID | Finding | Recommendation | Effort |
|----|---------|----------------|--------|
| L1 | API Key Storage | Document limitation for users | Low |
| L2 | localStorage Quota | Implement automatic pruning | Medium |
| L3 | Missing Security Headers | Create deployment configuration | Low |
| L4 | No Rate Limiting | Add client-side debouncing | Low |

---

## Previously Resolved Issues

The following issues from previous audits have been addressed:

### Resolved: Undeclared Zod Dependency

**Previous Issue:** Zod was used but not declared in package.json
**Resolution:** Zod is now properly declared in dependencies:
```json
"zod": "^4.3.5"
```

### Resolved: API Key Input Visibility

**Previous Issue:** API key was displayed in plain text
**Resolution:** API key input now uses `type="password"` with a toggle button for visibility

---

## OWASP Top 10 (2021) Mapping

| OWASP Category | Status | Notes |
|----------------|--------|-------|
| A01: Broken Access Control | N/A | No server-side access control |
| A02: Cryptographic Failures | ACCEPTABLE | API key in localStorage (client-side limitation) |
| A03: Injection | GOOD | No injection vectors; React handles DOM safely |
| A04: Insecure Design | GOOD | Split storage, validation, separation of concerns |
| A05: Security Misconfiguration | NEEDS WORK | Missing CSP, security headers |
| A06: Vulnerable Components | MONITOR | Run `npm audit` regularly |
| A07: Auth Failures | N/A | Uses external API authentication |
| A08: Integrity Failures | GOOD | Import validation with Zod |
| A09: Logging Failures | PARTIAL | Console logging, no centralized monitoring |
| A10: SSRF | N/A | Client-side only application |

---

## Dependency Security

Run the following command to check for known vulnerabilities:
```bash
npm audit
```

Current production dependencies appear secure as of audit date.

---

## Conclusion

The GZCLP Hevy Tracker demonstrates a **good security posture** for a client-side fitness tracking application. The most significant finding relates to the missing Content Security Policy, which should be implemented as a defense-in-depth measure.

The application correctly implements many security best practices including:
- Input validation with Zod schemas
- API key exclusion from exports
- Type guards for localStorage hydration
- HTTPS enforcement for API communication
- Password-style API key input

Production build configuration (source maps, console logging) should be reviewed before deployment to production environments.

---

**End of Security Audit Report**
