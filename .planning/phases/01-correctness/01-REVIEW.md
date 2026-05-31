---
phase: 01-correctness
reviewed: 2026-05-31T08:47:42Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/Forge/Forge.tsx
  - src/Forger/Forger.tsx
  - src/logic/updateFieldArrayRootError.ts
  - src/types.ts
  - src/utils.ts
findings:
  critical: 1
  warning: 3
  info: 3
  total: 7
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-31T08:47:42Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Re-review after gap-closure plan 01-03 (commits `6587da2` and `fb91ad9`). I verified each of the six advertised fixes against the actual diff from base `62b6225`.

Verdict on the advertised fixes:
- **CR-01 (wizard submit guard):** Correctly implemented. `onFormSubmit` now intercepts intermediate-step submits, calls `e.preventDefault()`, and advances via `handleNext` instead of firing `safeOnSubmit` with partial data. Last-step / non-wizard delegates to `control.handleSubmit`. Sound.
- **WR-01 (last-step button fallback):** Correct. The nav-button last-step branch falls back to `control.handleSubmit` when `handleWizardSubmit` is absent.
- **WR-02 / IN-01 (imperative handle + memoization):** Mostly correct, but the last-step predicate diverges between code paths and the `safeOnSubmit` memoization is a hooks-lint smell (see WR-01/WR-02 below).
- **WR-03 (compact instead of convertToArrayPayload):** **Introduces a correctness regression.** `compact` collapses sparse arrays, misaligning index-based field-array errors. This is the BLOCKER below.
- **WR-04 (dead import removed):** Verified — `FieldErrors` is no longer imported in `utils.ts`. Clean.
- **WR-05 (string -> unknown widening):** Correct and internally consistent in `Forger.tsx` and `types.ts`. One residual type inconsistency noted (IN-03).

`tsc --noEmit` passes clean.

## Critical Issues

### CR-01: `compact` misaligns index-based field-array errors (WR-03 fix is a regression)

**File:** `src/logic/updateFieldArrayRootError.ts:12`
**Issue:** The WR-03 fix replaced `convertToArrayPayload(get(errors, name))` with `compact(get(errors, name))`. While this does fix the `[undefined]` phantom-leading-element case the comment describes, `compact` (`src/utils.ts:132` — `value.filter(Boolean)`) **removes every falsy hole from the array, not just a leading one.**

react-hook-form field-array errors are **index-aligned**: `errors[name][i]` corresponds to row `i` of the field array, and rows without errors are stored as `undefined` holes. A realistic errors slot for a 3-row array where only rows 0 and 2 are invalid looks like:

```js
[ { message: "row0 bad" }, undefined, { message: "row2 bad" } ]
```

- `convertToArrayPayload(...)` (old) returns this array unchanged — row 2's error stays at index 2.
- `compact(...)` (new) returns `[ { message: "row0 bad" }, { message: "row2 bad" } ]` — **row 2's error silently shifts to index 1.** A consumer rendering `errors.myArray[2]` now sees no error, and `errors.myArray[1]` shows the wrong row's message.

This is invoked from both `useFieldArray` (`src/useFieldArray/useFieldArray.tsx:248`) and `useForgeValues` (`src/useForgeValues/useForgeValues.tsx:306`) — the two hottest validation paths. The fix traded a cosmetic phantom-empty-array bug for silent error/row misalignment, which is a worse, harder-to-detect data-correctness defect.

**Fix:** Do not use a falsy-stripping filter on an index-aligned array. Normalize only the uninitialized case while preserving holes:

```ts
import { FieldError, FieldErrors, FieldValues, InternalFieldName } from "react-hook-form";
import { get, set } from "../utils";

export default <T extends FieldValues = FieldValues>(
  errors: FieldErrors<T>,
  error: Partial<Record<string, FieldError>>,
  name: InternalFieldName,
): FieldErrors<T> => {
  const existing = get(errors, name);
  // Preserve index alignment: only synthesize a fresh array when the slot is
  // uninitialized. Never strip undefined holes from a populated error array.
  const fieldArrayErrors = Array.isArray(existing) ? existing : [];
  set(fieldArrayErrors, 'root', error[name]);
  set(errors, name, fieldArrayErrors);
  return errors;
};
```

The `Array.isArray` guard eliminates the `[undefined]` phantom (which only arose because `convertToArrayPayload(undefined)` returned `[undefined]`) without disturbing populated arrays. Add a regression test covering a sparse error array (rows 0 and 2 invalid) asserting `errors[name][2]` is preserved after the root error is attached.

## Warnings

### WR-01: Last-step predicate diverges between code paths (two sources of truth)

**File:** `src/Forge/Forge.tsx:121` vs `src/Forge/Forge.tsx:246` and `:271`
**Issue:** The in-tree nav button computes the last-step condition as `currentStep === totalSteps - 1` (line 121), while the imperative handle (line 246) and `onFormSubmit` (line 271) gate on the destructured `isLastStep`. These are two different sources of truth. For a control produced by `useForge` they agree, but a hand-built `ForgeControl` (the types make every wizard field optional, `src/types.ts:24-31`) can supply `currentStep`/`totalSteps` with a stale or inconsistent `isLastStep`, causing programmatic submit and button submit to disagree about whether to advance or submit.
**Fix:** Derive one predicate near the top and reuse it everywhere:
```ts
const onLastStep = isWizard && currentStep === totalSteps - 1;
```
Use `onLastStep` in the nav button, `onFormSubmit`, and the imperative handle so all three agree.

### WR-02: Half-applied memoization strategy between `safeOnSubmit` and `onFormSubmit`

**File:** `src/Forge/Forge.tsx:42, 270`
**Issue:** `safeOnSubmit` was wrapped in `useCallback` (line 42) for referential stability into `useImperativeHandle`, yet `onFormSubmit` (line 270) — which also captures `safeOnSubmit` and is passed to the `<form onSubmit>` — is a plain function recreated every render. Functionally `onFormSubmit` being fresh each render is correct (it always reads current `handleNext`/`isLastStep`), but the asymmetry signals the memoization rationale is only half-applied and invites future confusion about which handlers are stable.
**Fix:** Pick one direction. Either memoize `onFormSubmit` with `useCallback(..., [isWizard, isLastStep, handleNext, control, safeOnSubmit])`, or drop the `useCallback` on `safeOnSubmit` (the empty fallback is cheap) and document that handlers are intentionally non-memoized.

### WR-03: Last-step submit path differs between `onFormSubmit` and the nav button

**File:** `src/Forge/Forge.tsx:124-126` vs `:276`
**Issue:** On the final wizard step the nav button submits via `control.handleWizardSubmit(safeOnSubmit)` (with `handleSubmit` fallback), but `onFormSubmit` (Enter-key / implicit submit) always uses `control.handleSubmit(safeOnSubmit)` and never `handleWizardSubmit`. In today's `useForge`, `handleWizardSubmit` is just `methods.handleSubmit(...)`, so they coincide — but `ForgeControl.handleWizardSubmit` is consumer-overridable (`src/types.ts:31`). A custom `handleWizardSubmit` that performs extra final-step work would run on button click but be silently skipped on Enter-key submit.
**Fix:** Route the last-step branch of `onFormSubmit` through the same predicate as the nav button:
```ts
return control.handleWizardSubmit
  ? control.handleWizardSubmit(safeOnSubmit)(e as any)
  : control.handleSubmit(safeOnSubmit)(e as any);
```

## Info

### IN-01: `useCallback` with an inline function expression as the first argument

**File:** `src/Forge/Forge.tsx:42`
**Issue:** `useCallback(onSubmit ?? (() => {}), [onSubmit])` passes the result of an expression rather than a stable function literal. It works, but `react-hooks/exhaustive-deps` cannot statically verify it and will typically warn. It also obscures intent — readers may think the arrow is being memoized when `onSubmit` (when present) is returned as-is.
**Fix:** Make the memoized function explicit:
```ts
const safeOnSubmit = useCallback(
  (data: TFieldValues) => { (onSubmit ?? (() => {}))(data); },
  [onSubmit]
);
```

### IN-02: `processChildrenRecursively` typed `any`; unreachable render-props branch

**File:** `src/Forge/Forge.tsx:68, 81`
**Issue:** `processChildrenRecursively(children: any, ...)` and the `child` callback use `any`, working against the project's strict-TS goal. Separately, line 81's `typeof child === "function"` check is unreachable: line 76's `isElementSlot(child)` guard already returned early for anything that is not a valid React element, and a function is not a valid element. The top-level function-children case is handled separately at line 53, so lines 81-95 are dead in this position.
**Fix:** Type the parameter as `ReactNode` and remove the unreachable function branch inside `processChildrenRecursively` (or move render-props handling before the `isElementSlot` early return if it is actually intended to run here).

### IN-03: `ForgerSlotProps.value` still typed `string` after WR-05 widening

**File:** `src/types.ts:73`
**Issue:** WR-05 correctly widened `transform.input/output` to `unknown`, but `ForgerSlotProps.value` remains `value: string`. Since transforms can now legitimately produce non-string values (booleans for Switch, numbers for Slider — the exact WR-05 rationale), the slot prop type is inconsistent with what `getTransformedValue` passes. It compiles only because `Component` is cast to `any` at the render site (`Forger.tsx:31`), which masks the mismatch from consumers typing against `ForgerSlotProps`.
**Fix:** Widen `ForgerSlotProps.value` to `unknown` (or a documented union) for consistency with the transform widening.

---

_Reviewed: 2026-05-31T08:47:42Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
