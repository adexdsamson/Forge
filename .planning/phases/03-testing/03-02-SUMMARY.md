---
phase: 03-testing
plan: "02"
subsystem: test-suite
tags: [vitest, integration-tests, validateField, useFieldArray, usePersist, useForgeValues, CORR-02]
dependency_graph:
  requires: [03-01]
  provides: [web-mode-test-coverage, validateField-rule-tests, useFieldArray-tests, usePersist-tests, useForgeValues-tests]
  affects:
    - src/test-utils.tsx
    - src/Forge/Forge.errors.test.tsx
    - src/validateField.test.ts
    - src/useFieldArray/useFieldArray.test.tsx
    - src/usePersist/usePersist.test.tsx
    - src/useForgeValues/useForgeValues.test.tsx
    - src/useForge/useForge.tsx
tech_stack:
  added: []
  patterns:
    - vitest-integration-test
    - react-testing-library-userEvent
    - validateField-direct-function-call
    - captured-ref-pattern-for-hook-extraction
    - pattern-d-usepersist-initial-mount-drain
decisions:
  - "Set ref.value on HTMLInputElement to match formValues so validateField isEmpty check is not falsely triggered (jsdom default ref.value is always empty)"
  - "Rule 1 fix: forward getValues/setValue/handleSubmit/getFieldState onto control via Object.assign in useForge so ctx.getValues() works inside useFormContext consumers"
  - "useForgeValues test uses ValuesCapture child component inside Forge tree (not at TestForm level) to ensure FormProvider context is available"
  - "Import path for test-utils is ../test-utils (one level up from subdirectory), not ../../test-utils"
key_files:
  created:
    - src/test-utils.tsx
    - src/Forge/Forge.errors.test.tsx
    - src/validateField.test.ts
    - src/useFieldArray/useFieldArray.test.tsx
    - src/usePersist/usePersist.test.tsx
    - src/useForgeValues/useForgeValues.test.tsx
  modified:
    - src/useForge/useForge.tsx
    - .gitignore
metrics:
  duration: ~10min
  completed: "2026-05-31"
  tasks_completed: 2
  files_modified: 7
---

# Phase 3 Plan 2: Web-Mode Test Files Summary

Web-mode integration test suite built: 6 new test files covering CORR-02 regression, validateField web rules (6 rules), useFieldArray append/remove, usePersist subscription handler, and useForgeValues get/set/throws. 17 total tests pass (3 existing + 14 new). Includes one Rule 1 bug fix in useForge.tsx that made useForgeValues.getValue functional via FormProvider context.

## What Changed

### src/test-utils.tsx (new)
- Named export `TextInput` forwardRef helper — the standard `HTMLInputElement` wrapper used by all web-mode test files.
- Excluded from coverage via existing `vitest.config.ts` exclusion list (added in Plan 01 Task 2).

### src/Forge/Forge.errors.test.tsx (new)
- CORR-02 regression test: 2 tests that verify `<Forger name="myField">` with two children throws errors matching `/Forger/` and `/myField/`.
- Uses `ThrowingForm` component pattern (not inline JSX) to avoid React 18 reconciler edge cases.
- `console.error` suppressed during render to avoid test output noise from React's error boundary.

### src/validateField.test.ts (new)
- 6 tests, all direct async function calls (no React render needed).
- Tests: required (error), minLength, maxLength, pattern, custom validate, required (pass).
- Implementation note: `ref.value` must be set to match the `formValues` being tested. The `isEmpty` check in `validateField.ts` includes `isHTMLElement(ref) && ref.value === ""` — jsdom's `document.createElement("input").value` is always `""` by default. Failing to set `ref.value` causes minLength/maxLength/pattern tests to return empty errors (not-empty path never reached) and causes the required-pass test to falsely fail (treated as empty).

### src/useFieldArray/useFieldArray.test.tsx (new)
- 2 integration tests using a `DynamicForm` component that renders `<Forge>` with `useFieldArray` wired to `"items"`.
- Test 1: append adds a field (1 → 2 Remove buttons).
- Test 2: remove deletes a field by index (2 → 1 Remove buttons).

### src/usePersist/usePersist.test.tsx (new)
- 1 integration test following Pattern D (initial-mount drain + mockClear + type + assert).
- Asserts handler called with `{ name: stringContaining("a") }` and `{ isDirty: true }` after `userEvent.type`.

### src/useForgeValues/useForgeValues.test.tsx (new)
- 3 integration tests using a `ValuesCapture` inner component that calls `useForgeValues` inside the `<Forge>` tree.
- Test 1: `getValue("email")` returns `"test@example.com"` from defaultValues.
- Test 2: `getValue("nonexistent")` throws matching `/useForgeValues\.getValue.*nonexistent.*not registered/`.
- Test 3: `setValue("email", "new@example.com")` updates; `getValue` returns new value.

### src/useForge/useForge.tsx (modified — Rule 1 auto-fix)
- Added `getValues`, `setValue`, `handleSubmit`, `getFieldState` to the `forgeProps` assigned to `control` via `Object.assign`.
- Root cause: `<Forge>` spreads `control` (not the full `methods`) into RHF's `FormProvider`. RHF's `FormProvider` provides the spread object as the `useFormContext()` return value. Since `methods.control` does not have `getValues` as a direct property (only the full `methods` object does), `useFormContext().getValues` was `undefined` — breaking `useForgeValues.getValue()`.
- Fix: forward the public `methods.getValues` and related functions onto `control` via `Object.assign` in `useForge`, alongside the existing wizard props.
- This fix is consistent with the existing D-11 pattern (augment control in-place) and does not introduce any `_*` access.

### .gitignore (modified)
- Added `coverage/` to prevent generated coverage artifacts from being tracked.

## Test Count Summary

| File | Tests | Status |
|------|-------|--------|
| `src/Forge/Forge.submit.test.tsx` (existing) | 3 | GREEN |
| `src/Forge/Forge.errors.test.tsx` (new) | 2 | GREEN |
| `src/validateField.test.ts` (new) | 6 | GREEN |
| `src/useFieldArray/useFieldArray.test.tsx` (new) | 2 | GREEN |
| `src/usePersist/usePersist.test.tsx` (new) | 1 | GREEN |
| `src/useForgeValues/useForgeValues.test.tsx` (new) | 3 | GREEN |
| **Total** | **17** | **ALL PASS** |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] useForgeValues.getValue: ctx.getValues is not a function**
- **Found during:** Task 2 — writing useForgeValues tests
- **Issue:** `useForgeValues` calls `useFormContext().getValues()`, but `<Forge>` provides `control` (not the full `methods`) to `FormProvider`. `methods.control` in RHF 7.x does NOT have `getValues` as a direct property — it exists only on the `methods` return value of `useForm()`. Result: `ctx.getValues is not a function` at runtime.
- **Fix:** In `useForge.tsx`, added `getValues`, `setValue`, `handleSubmit`, and `getFieldState` to the `forgeProps` object passed to `Object.assign(methods.control, forgeProps)`. This makes them available on `control` so `useFormContext()` consumers inside `<Forge>` can access them.
- **Files modified:** `src/useForge/useForge.tsx`
- **Commit:** 02d3d9c

**2. [Rule 1 - Bug] validateField isEmpty false-positive with jsdom HTMLInputElement**
- **Found during:** Task 1 — writing validateField tests
- **Issue:** `validateField.ts` checks `isEmpty` via `isHTMLElement(ref) && ref.value === ""`. In jsdom, `document.createElement("input").value` is always `""` by default. Tests for minLength/maxLength/pattern always got empty results because the `!isEmpty` guard blocked them. The required-pass test falsely failed because the field appeared empty.
- **Fix:** Set `ref.value = <test-value>` in the test's `beforeEach`/test setup when the field has a non-empty value. This is a test pattern fix, not a source code fix.
- **Files modified:** `src/validateField.test.ts`
- **Commit:** d677e51

**3. [Rule 1 - Bug] Import path error: ../../test-utils vs ../test-utils**
- **Found during:** Task 2 first run
- **Issue:** Test files in `src/useFieldArray/`, `src/usePersist/`, and `src/useForgeValues/` used `../../test-utils` but `src/test-utils.tsx` is one level up (at `src/`), not two.
- **Fix:** Corrected to `../test-utils` in all three files.
- **Commit:** 02d3d9c

**4. [Rule 2 - Missing functionality] coverage/ directory not gitignored**
- **Found during:** Post-task git status check
- **Issue:** `vitest run --coverage` generates a `coverage/` directory that was untracked.
- **Fix:** Added `coverage/` to `.gitignore`.
- **Commit:** (included in final metadata commit)

## Known Stubs

None — this plan adds test files and a bug fix only. No runtime stubs.

## Threat Flags

None — this plan adds test files only. No new public API surface. The `useForge.tsx` change is additive (forwards existing public `methods` functions onto `control`); it does not introduce new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

- [x] `src/test-utils.tsx` exists and exports `TextInput`
- [x] `src/Forge/Forge.errors.test.tsx` exists; 2 tests pass
- [x] `src/validateField.test.ts` exists; 6 tests pass
- [x] `src/useFieldArray/useFieldArray.test.tsx` exists; 2 tests pass
- [x] `src/usePersist/usePersist.test.tsx` exists; 1 test passes
- [x] `src/useForgeValues/useForgeValues.test.tsx` exists; 3 tests pass
- [x] All 17 tests pass: `npx vitest run` exits 0
- [x] Commits d677e51 and 02d3d9c exist in git log
- [x] No hard `react-native` import in any new file
