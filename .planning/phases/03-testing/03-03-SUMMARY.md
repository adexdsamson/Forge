---
phase: 03-testing
plan: "03"
subsystem: test-suite
tags: [vitest, react-native, vi.mock, hoisted-mock, isReactNative, Forger, validateField, TEST-03]
dependency_graph:
  requires:
    - phase: 03-01
      provides: vitest config, jsdom environment, coverage scaffolding
    - phase: 03-02
      provides: web-mode test suite (17 tests), test-utils.tsx helper
  provides:
    - rn-branch-test-coverage
    - Forger-onChangeText-onValueChange-wiring-tests
    - validateField-setNativeProps-path-tests
  affects:
    - src/Forger/Forger.rn.test.tsx
    - src/validateField.rn.test.ts
tech_stack:
  added: []
  patterns:
    - hoisted-vi.mock-rn-platform-override
    - closure-aware-mock-function-overrides
    - capturing-component-for-rn-prop-assertion
    - act-direct-prop-invocation-for-rn-handlers
    - direct-function-call-rn-branch-testing
decisions:
  - "Override isTextInput/isSwitch/isPicker/isSlider in vi.mock factory alongside isReactNative — these functions close over the module-level constant and return wrong values if only isReactNative is overridden in the spread"
  - "Use capturing component pattern (closure let variable) for RN prop assertions — jsdom does not fire onChangeText as a DOM event; userEvent.type cannot trigger RN handlers"
  - "Invoke onChangeText/onValueChange directly via act() to verify they are callable without crash — sufficient smoke test for the handler wiring"

key-files:
  created:
    - src/Forger/Forger.rn.test.tsx
    - src/validateField.rn.test.ts
  modified: []

requirements-completed:
  - TEST-03

# Metrics
duration: ~8min
completed: "2026-05-31"
---

# Phase 3 Plan 3: RN Branch Tests Summary

**Two RN-mode test files covering Forger onChangeText/onValueChange wiring and validateField setNativeProps path, using hoisted vi.mock with function-level constant overrides to force isReactNative=true under jsdom.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-31T14:10:00Z
- **Completed:** 2026-05-31T14:20:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- RN event-handler wiring test: Forger injects `onChangeText` for TextInput-displayName component and `onValueChange` for Switch-displayName component when `isReactNative=true`
- validateField RN branch test: `setNativeProps({ error: "Required" })` called when `shouldUseNativeValidation=true`; NOT called when guard is omitted
- Identified and resolved RISK-T1 closure issue: `isSwitch`/`isPicker`/`isSlider`/`isTextInput` close over the module-level constant and must be re-declared in the vi.mock factory, not just spread from the original
- Full suite green: 21 tests pass (19 prior + 2 new Forger RN + 2 new validateField RN) with file-scoped mocks causing no cross-file leakage

## Test Count Summary

| File | Tests | Status |
|------|-------|--------|
| `src/Forge/Forge.submit.test.tsx` (existing) | 3 | GREEN |
| `src/Forge/Forge.errors.test.tsx` (prior plan) | 2 | GREEN |
| `src/validateField.test.ts` (prior plan) | 6 | GREEN |
| `src/useFieldArray/useFieldArray.test.tsx` (prior plan) | 2 | GREEN |
| `src/usePersist/usePersist.test.tsx` (prior plan) | 1 | GREEN |
| `src/useForgeValues/useForgeValues.test.tsx` (prior plan) | 3 | GREEN |
| `src/Forger/Forger.rn.test.tsx` (new) | 2 | GREEN |
| `src/validateField.rn.test.ts` (new) | 2 | GREEN |
| **Total** | **21** | **ALL PASS** |

## Task Commits

1. **Task 1: Forger RN event-handler wiring test** - `5a73898` (test)
2. **Task 2: validateField RN branch test** - `d93fef2` (test)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/Forger/Forger.rn.test.tsx` - RN event-handler wiring tests: onChangeText for TextInput, onValueChange for Switch
- `src/validateField.rn.test.ts` - validateField RN branch tests: setNativeProps called/not-called based on shouldUseNativeValidation guard

## Decisions Made

1. **Override component-type checkers in vi.mock factory** — `isTextInput`, `isSwitch`, `isPicker`, `isSlider` in `utils.ts` all guard on `if (!isReactNative) return false` using the module-level constant captured at import time. When `importOriginal` spread is used, these functions retain the closed-over `isReactNative=false` value (jsdom). Simply overriding the exported `isReactNative: true` constant does not retroactively fix closures in the spread functions. The fix is to re-declare these four functions inline in the mock factory using the correct RN logic.

2. **Capturing component pattern for RN prop assertions** — jsdom does not fire `onChangeText` as a browser event; `userEvent.type` interacts with DOM events only. The resolution from RESEARCH.md Open Question 2: define a `forwardRef` component that captures `props` into a closure variable on each render. After `render(<TestForm />)`, assert `capturedProps.onChangeText` is defined, then invoke it directly inside `act()` for a smoke test.

3. **`onChange` is a no-op function (not undefined) for RN TextInput** — Forger.tsx line 52 sets `handlers.onChange = () => {}` when injecting `onChangeText`. The test asserts `onChange` is `any(Function)` (callable) to be accurate about the actual behavior, not `toBeUndefined`. The meaningful handler is `onChangeText`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.mock closure issue: isSwitch/isPicker/isSlider/isTextInput returned false despite isReactNative=true override**
- **Found during:** Task 1 — first test run (Test 2 for Switch failed with `onValueChange` being undefined)
- **Issue:** `isSwitch` in utils.ts: `if (!isReactNative) return false` uses the module-level `isReactNative` constant captured at module evaluation time. Spreading the original module via `importOriginal` copies the function references, not the constant. Those function references still close over the original `isReactNative=false`. Overriding only the exported `isReactNative` property does not affect existing closures.
- **Fix:** Added explicit overrides for `isTextInput`, `isSwitch`, `isPicker`, `isSlider` in the vi.mock factory — each re-implemented inline to check `displayName`/`type` directly (equivalent to the RN branch of each function).
- **Files modified:** `src/Forger/Forger.rn.test.tsx`
- **Verification:** Test 2 (Switch/onValueChange) passes after the fix; full suite still 21/21 green.
- **Committed in:** `5a73898` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test's mock setup)
**Impact on plan:** Auto-fix was essential for the Switch test to exercise the intended code path. No scope creep; the fix is contained to the test file's vi.mock factory.

## RN Coverage Delta (branches now covered)

### Forger.tsx
- Line 48: `if (isReactNative)` branch — NOW COVERED (was uncovered in jsdom)
- Line 50: `if (isTextInput(component) || component.displayName === 'TextInput')` → true branch — NOW COVERED
- Line 51: `handlers.onChangeText = ...` assignment — NOW COVERED
- Line 52: `handlers.onChange = () => {}` (no-op assignment) — NOW COVERED
- Line 53: `else if (isSwitch(component) || isPicker(component) || isSlider(component))` → true branch — NOW COVERED
- Line 55: `handlers.onValueChange = ...` assignment — NOW COVERED

### validateField.ts
- Line 155: `if (shouldUseNativeValidation)` → true branch — NOW COVERED (was covered partially by web tests)
- Line 159: `else if (isReactNative && inputRef?.setNativeProps)` → true branch — NOW COVERED
- Lines 160-163: `inputRef.setNativeProps({ error: ... })` call — NOW COVERED
- Guard test (Test 2): `if (shouldUseNativeValidation)` → false branch — NOW COVERED

### Remaining uncovered RN branches
- `isReactNative` true branch in `Forge.tsx` (RN-mode form rendering) — not tested (would require mocking for Forge.tsx separately)
- `isTextInput(element) && isWeb` false branch in `utils.ts` for web HTMLInput detection (low priority)
- Plan 04 can set thresholds after measuring the total coverage with all 21 tests.

## Known Stubs

None — this plan adds test files only. No runtime stubs.

## Threat Flags

None — this plan adds test files only. The vi.mock scope is file-local (per Vitest's module registry isolation). Production `utils.ts` is unmodified.

## Self-Check: PASSED

- [x] `src/Forger/Forger.rn.test.tsx` exists with 2 passing tests
- [x] `src/validateField.rn.test.ts` exists with 2 passing tests
- [x] `onChangeText` asserted as `any(Function)` in Test 1 (Forger RN)
- [x] `onValueChange` asserted as `any(Function)` in Test 2 (Forger RN)
- [x] `setNativeProps` called with `{ error: "Required" }` in Test 1 (validateField RN)
- [x] `setNativeProps` NOT called in Test 2 (validateField RN guard)
- [x] No hard `react-native` import in either new file
- [x] Full suite: 21 tests, all pass (`npx vitest run` exits 0)
- [x] Commits `5a73898` and `d93fef2` exist in git log
