---
phase: 03-testing
plan: "01"
subsystem: test-infrastructure
tags: [vitest, coverage, devDependency, config]
dependency_graph:
  requires: []
  provides: [coverage-infrastructure, npm-test-coverage-flag]
  affects: [vitest.config.ts, package.json, package-lock.json]
tech_stack:
  added: ["@vitest/coverage-v8@4.1.7"]
  patterns: [vitest-coverage-v8, coverage-thresholds-placeholder]
key_files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - vitest.config.ts
decisions:
  - "Thresholds set to 0 as placeholder per RISK-T2; Plan 04 sets real values after measuring coverage with all test files present"
  - "src/test-utils.tsx added to coverage exclude list proactively (Plan 02 creates it as test helper with no runtime code)"
metrics:
  duration: ~10min
  completed: "2026-05-31"
  tasks_completed: 2
  files_modified: 3
---

# Phase 3 Plan 1: Coverage Infrastructure Summary

Coverage infrastructure installed: @vitest/coverage-v8 wired into vitest.config.ts and npm test script, with placeholder 0 thresholds. Plans 02 and 03 can now write test files without triggering threshold violations; Plan 04 will measure and lock real thresholds.

## What Changed

### package.json
- `scripts.test` updated from `"vitest run"` to `"vitest run --coverage"` — satisfies TEST-04 requirement that `npm test` enforces coverage threshold on every run
- `devDependencies` gained `"@vitest/coverage-v8": "^4.1.7"` — matches installed vitest version (4.1.7); peer mismatch would print spurious warnings

### package-lock.json
- Updated by `npm install` with @vitest/coverage-v8 resolved at 4.1.7

### vitest.config.ts
- Added `coverage` block inside `test: {}`:
  - `provider: "v8"` — uses V8-native instrumentation (zero transform overhead, accurate branch detection)
  - `thresholds: { lines: 0, functions: 0, statements: 0, branches: 0 }` — placeholder; Plan 04 sets real values after measuring with all test files present (RISK-T2 / TEST-04 / D-05)
  - `exclude` list: `**/index.ts`, `src/types.ts`, `**/*.test.*`, `**/*.test.tsx`, `rollup.config.mjs`, `src/test-utils.tsx`
  - Comment documents the deferred threshold task
- All other settings (`environment`, `globals`, `setupFiles`) unchanged

## Coverage Baseline (3 existing tests — Forge.submit.test.tsx)

| File | % Statements | % Branches | % Functions | % Lines |
|------|-------------|-----------|------------|--------|
| `reactNative.ts` | 14.7% | 0% | 0% | 18.18% |
| `utils.ts` | 35.54% | 20.15% | 23.63% | 37.05% |
| `Forge.tsx` | 60.75% | 60.91% | 44.44% | 60.75% |
| `Forger.tsx` | 62.26% | 37.5% | 53.33% | 66.66% |
| `useForge.tsx` | 87.5% | 57.14% | 60% | 87.5% |
| **All files** | **42.15%** | **27.13%** | **28.57%** | **44.81%** |

Note: `useFieldArray.tsx`, `usePersist.tsx`, `useForgeValues.tsx`, `validateField.ts` are not yet imported by any test — they do not appear in the report and contribute 0% at this baseline. Adding tests for them in Plans 02 and 03 will move the numbers substantially.

## Observations for Plan 04 Threshold-Setting

1. **Lines baseline is 44.81%** with only 5 of the expected 12+ source files touched by tests. The D-05 target band (60–70%) is achievable once the 4 currently-untested hooks and `validateField` are covered.

2. **Branch coverage is the weak metric (27.13%)**. RHF-driven branches (e.g., wizard navigation, error states) are harder to exercise. Plan 04 should set a lower branch threshold (~40–50%) than line/function/statement (~65%).

3. **`reactNative.ts` is the lowest-covered file (14.7% statements, 0% branches)**. The RN mock tests in Plan 02 (Forger.rn.test.tsx) will push this significantly, but it may remain the coverage floor given platform-branching complexity.

4. **`useForge.tsx` is the best-covered file (87.5% lines)** — already exercised transitively by all submit tests. No dedicated test file needed for it.

5. **Threshold must be set conservatively below measured values** — at least 5 percentage points below to absorb test variation without causing spurious CI failures (RESEARCH.md RISK-T2 guidance).

## Verification

- `npm test` (vitest run --coverage) exits 0 — thresholds all 0, no violations
- All 3 existing Forge.submit.test.tsx tests pass (green)
- `npm ls @vitest/coverage-v8 --depth=0` shows `@vitest/coverage-v8@4.1.7`
- Coverage report generates successfully for the 5 covered source files

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1: Install @vitest/coverage-v8 and wire --coverage | 02e6a02 | package.json, package-lock.json |
| 2: Add coverage block to vitest.config.ts | 2d4a73d | vitest.config.ts |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan only modifies configuration files. No runtime code or UI was created.

## Threat Flags

None — this plan touches only devDependencies and test configuration. No new runtime attack surface introduced. The published package artifact (dist/) is unaffected.

## Self-Check: PASSED

- [x] `vitest.config.ts` exists and contains `coverage` block with `provider: "v8"` and 0 thresholds
- [x] `package.json` devDependencies contains `@vitest/coverage-v8: ^4.1.7`
- [x] `package.json` scripts.test equals `"vitest run --coverage"`
- [x] Commits 02e6a02 and 2d4a73d exist in git log
- [x] `npm test` exits 0 with 3 tests passing and coverage report generated
