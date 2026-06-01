---
phase: 260601-bp5
plan: 01
subsystem: Forge/RN
tags: [react-native, submit, forgeSubmit, onPress, form-wiring]
dependency_graph:
  requires: []
  provides: [forgeSubmit-marker, RN-onPress-auto-wiring]
  affects: [src/utils.ts, src/Forge/Forge.tsx, src/types.ts]
tech_stack:
  added: []
  patterns: [createElement-vs-cloneElement-for-prop-stripping, forgeSubmit-marker-pattern]
key_files:
  created:
    - src/Forge/Forge.rn-submit.test.tsx
  modified:
    - src/utils.ts
    - src/Forge/Forge.tsx
    - src/types.ts
    - ReadMe.md
    - examples/ReactNativeExample.md
    - docs/API.md
decisions:
  - "Use createElement (not cloneElement) in RN submit branch to prevent forgeSubmit leaking to host — cloneElement shallow-merges new props OVER original element props, so omitting forgeSubmit from the new object still leaves it from the original element"
  - "Second arg to onSubmit is undefined (not an event object) when onPress called without DOM event — test assertions updated to match undefined rather than expect.anything()"
metrics:
  duration: ~25min
  completed_date: 2026-06-01
  tasks: 3
  files: 6
---

# Phase 260601-bp5 Plan 01: RN Submit Button Parity Summary

**One-liner:** Forge RN submit parity via `forgeSubmit` marker — auto-wires `onPress` to `handleSubmit` and strips the prop before it reaches the host component.

## Objective

Fix React Native submit-button parity in Forge: when a user marks an RN button with
`forgeSubmit={true}`, Forge auto-wires its `onPress` handler to `control.handleSubmit`,
eliminating the redundant manual `onPress={handleSubmit(onSubmit)}` call. Mirrors the
existing `data-wizard-nav` marker pattern.

## Changes Made

### src/utils.ts
- Extended `isButtonSubmitSlot` to match `child.props.forgeSubmit === true` in addition to `type === 'submit'`

### src/Forge/Forge.tsx
- Fixed RN submit branch: replaced `onClick` with `onPress` (RN buttons fire onPress, not onClick)
- Switched from `cloneElement` to `createElement` to prevent `forgeSubmit` prop from leaking to host component
- Added destructure `const { forgeSubmit: _fg, ...restProps } = childProps` to strip the marker prop

### src/types.ts
- Added `ForgeSubmitButtonProps` interface export: `{ forgeSubmit?: boolean }` for TS consumers

### src/Forge/Forge.rn-submit.test.tsx (new)
- Test 1: `forgeSubmit={true}` button receives `onPress` injected by Forge; `forgeSubmit` prop is `undefined` on the host; invoking `onPress()` fires the `onSubmit` spy with form values
- Test 2 (regression): classic `type="submit"` marker still receives `onPress` in RN mode

### ReadMe.md
- RN section prose updated to mention `forgeSubmit` pattern
- `SignupFormRN` example: removed `handleSubmit` from destructure; button now uses `forgeSubmit` shorthand

### examples/ReactNativeExample.md
- Removed `handleSubmit` from `useForge` destructure
- Submit button changed from `onPress={handleSubmit(onSubmit)}` to `forgeSubmit` prop

### docs/API.md
- Updated "React Native mode" behavior bullet to mention `forgeSubmit` and `onPress`
- Added new `forgeSubmit (on child button)` bullet describing the marker, prop stripping, and backward compatibility

## Test Results

```
Test Files  9 passed (9)
     Tests  23 passed (23)   (+2 new: Forge.rn-submit.test.tsx)
```

Prior baseline: 8 files / 21 tests. After: 9 files / 23 tests.

## Gate Results

| Gate | Result |
|------|--------|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 (0 errors, 105 pre-existing warnings) |
| `npm test` | 23/23 passed |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] cloneElement carries original props — forgeSubmit not stripped**

- **Found during:** Task 2 (test run revealed `capturedSubmitProps.forgeSubmit` was still `true`)
- **Issue:** Plan action specified `cloneElement(el, { ...restProps, onPress })`. React's `cloneElement` shallow-merges new props OVER the original element's existing props — omitting `forgeSubmit` from the new object does NOT remove it from the result, because the original element still carries it.
- **Fix:** Switched to `createElement(el.type, { ...restProps, onPress })`. Unlike `cloneElement`, `createElement` starts with a clean prop slate — only what you explicitly pass is included.
- **Files modified:** `src/Forge/Forge.tsx`
- **Commit:** f068ce8

**2. [Rule 1 - Bug] Test assertion `expect.anything()` fails for `undefined` second arg**

- **Found during:** Task 2 (first test run showed `expect.anything()` failing)
- **Issue:** RHF's `handleSubmit` calls `onSubmit(data, event)`. When `onPress()` is invoked without a DOM event (as in direct `act()` invocation), `event` is `undefined`. `expect.anything()` rejects `undefined`.
- **Fix:** Changed assertion to `expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({...}), undefined)`.
- **Files modified:** `src/Forge/Forge.rn-submit.test.tsx`
- **Commit:** f068ce8

**3. [Rule 1 - Bug] `capturedTextInputProps` renamed to `_capturedTextInputProps` but beforeEach still used old name**

- **Found during:** Task 2 second test run (`ReferenceError: capturedTextInputProps is not defined`)
- **Issue:** After renaming the variable to satisfy the no-unused-vars lint rule, the `beforeEach` reset was not updated.
- **Fix:** Updated `beforeEach` to use `_capturedTextInputProps`.
- **Files modified:** `src/Forge/Forge.rn-submit.test.tsx`
- **Commit:** f068ce8

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: prop-leak | src/Forge/Forge.tsx | Mitigated (T-bp5-02): forgeSubmit stripped via createElement; verified by test assertion capturedSubmitProps.forgeSubmit === undefined |

## Commits

| Hash | Message |
|------|---------|
| 43a62e3 | feat(260601-bp5-01): extend isButtonSubmitSlot + fix RN submit handler + type forgeSubmit |
| f068ce8 | test(260601-bp5-01): add RN submit auto-wiring tests + prettier fix on Forge.tsx |
| 50e48e8 | docs(260601-bp5-01): update RN quickstart + API docs to use forgeSubmit pattern |

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/Forge/Forge.rn-submit.test.tsx exists | FOUND |
| src/utils.ts exists | FOUND |
| src/types.ts exists | FOUND |
| src/Forge/Forge.tsx exists | FOUND |
| Commit 43a62e3 exists | FOUND |
| Commit f068ce8 exists | FOUND |
| Commit 50e48e8 exists | FOUND |
