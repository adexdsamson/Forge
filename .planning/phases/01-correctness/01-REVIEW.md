---
phase: 01-correctness
reviewed: 2026-05-31T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/Forge/Forge.tsx
  - src/Forger/Forger.tsx
  - src/types.ts
  - src/useFieldArray/useFieldArray.tsx
  - src/useForge/useForge.tsx
  - src/useForgeValues/useForgeValues.tsx
  - src/utils.ts
findings:
  critical: 1
  warning: 6
  info: 3
  total: 10
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-05-31
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Phase 01 ("correctness") reworked form-submit wiring, wizard submit threading, Forger child validation, and consolidated `updateFieldArrayRootError` into `logic/`. The diff was reviewed against `e781aeb`, with full-file context for each changed file plus the helpers the changes touch (`logic/updateFieldArrayRootError.ts`, `validateField.ts`, `reactNative.ts`, `useSubscribe.ts`).

The headline web double-submit fix (removing the redundant `onClick` on submit buttons while keeping `<form onSubmit>`) is sound. However the same change introduced a **wizard navigation regression**: the wizard "next/submit" button is now wrapped inside a real `<form>` whose `onSubmit` fires `handleSubmit(safeOnSubmit)` on *every* step, so pressing Enter (or any implicit submit) on an intermediate wizard step submits the whole form instead of advancing — bypassing the step model. There are also several robustness gaps: an unguarded `handleWizardSubmit?.(...)` that yields `onClick={undefined}` on the last step when wizard handlers are absent, a behavioral divergence in the relocated `updateFieldArrayRootError` (`compact` -> `convertToArrayPayload`), a now-dead `FieldErrors` import, and a stale/contradictory `value` type annotation in `ForgerController` event handlers.

## Critical Issues

### CR-01: Wizard intermediate steps submit the entire form on implicit submit

**File:** `src/Forge/Forge.tsx:271-293` (web branch) in combination with `src/Forge/Forge.tsx:110-139` (wizard nav)
**Issue:** Phase 01 moved all web children — including wizard steps — inside a real `<form onSubmit={control.handleSubmit(safeOnSubmit)}>`. Wizard navigation now relies solely on injecting `onClick` onto `data-wizard-nav` buttons (line 121/124). But a `<form>` submits on *any* implicit trigger: pressing Enter inside a text input, or a click on any descendant `type="submit"` button the tree-walker did not rewrite (e.g. a submit button rendered by a render-prop child, or nested deeper than the depth-10 limit, or one whose `data-wizard-nav` attribute is absent). On an intermediate wizard step this fires `handleSubmit(safeOnSubmit)` and submits the whole form instead of advancing to the next step, defeating the multi-step model and likely calling `onSubmit` with partially-filled data.

Before this phase the form was a `<div>`, so there was no implicit-submit path and wizard navigation was driven purely by the injected `onClick`. The submit semantics fix and the wizard model are now in direct conflict.

**Fix:** In wizard mode, prevent implicit full-form submit on non-final steps. Either gate the form's `onSubmit`, or intercept Enter:
```tsx
const onFormSubmit = (e: React.FormEvent) => {
  if (isWizard && !isLastStep) {
    // On intermediate steps, Enter/implicit submit should advance, not submit
    e.preventDefault();
    handleNext?.();
    return;
  }
  return control.handleSubmit(safeOnSubmit)(e);
};
// ...
<form className={className} noValidate={noValidate} onSubmit={onFormSubmit}>
```
Add a test: render a 3-step wizard with a text input on step 1, simulate Enter, assert `onSubmit` was NOT called and `currentStep === 1`.

## Warnings

### WR-01: `handleWizardSubmit?.(safeOnSubmit)` yields `onClick={undefined}` on the last step

**File:** `src/Forge/Forge.tsx:118-138`
**Issue:** On the final wizard step (`currentStep === totalSteps - 1`), `onClick` is assigned `control.handleWizardSubmit?.(safeOnSubmit)`. `handleWizardSubmit` is optional on `ForgeControl` and is only populated by `useForge` when `isWizard` is true (`useForge.tsx:60-69`). If a consumer drives wizard rendering by passing `isWizard`/step props through a control that did not get the wizard handlers (e.g. a hand-built `ForgeControl`, or `isWizard` toggled at the `Forge` level but not in `useForge`), `handleWizardSubmit` is `undefined`, so `onClick` becomes `undefined` and the final "submit" button silently does nothing — the user cannot complete the form, with no error.
**Fix:** Fall back to a direct submit when the wizard handler is missing:
```tsx
onClick = control.handleWizardSubmit
  ? control.handleWizardSubmit(safeOnSubmit)
  : control.handleSubmit(safeOnSubmit);
```

### WR-02: Wizard handlers omitted from `useImperativeHandle` deps; stale closure risk on programmatic submit

**File:** `src/Forge/Forge.tsx:236-248`
**Issue:** The imperative `onSubmit` handle closes over `control` and `safeOnSubmit`. `safeOnSubmit` is recreated every render (`onSubmit ?? (() => {})` at line 40 — a new function identity each render whenever `onSubmit` is undefined), so the dependency array `[safeOnSubmit, control, currentStep, totalSteps]` re-runs the imperative setup on every render anyway, which is wasteful but not incorrect. More importantly, the handle invokes `control.handleSubmit(safeOnSubmit)` and ignores the wizard path entirely — calling the imperative `onSubmit` while in wizard mode submits the whole form regardless of step, inconsistent with the in-tree wizard nav button behavior.
**Fix:** Memoize `safeOnSubmit` with `useCallback` to stabilize identity, and make the imperative handle wizard-aware (call `handleWizardSubmit` / `handleNext` per step) so programmatic and UI submit paths agree.

### WR-03: Relocated `updateFieldArrayRootError` changes behavior (`compact` -> `convertToArrayPayload`)

**File:** `src/useFieldArray/useFieldArray.tsx:33`, `src/useForgeValues/useForgeValues.tsx:36` (import swap) -> `src/logic/updateFieldArrayRootError.ts:9`
**Issue:** Phase 01 switched both call sites from the inline `utils.updateFieldArrayRootError` (which used `compact(get(errors, name))`) to the `logic/` implementation (which uses `convertToArrayPayload(get(errors, name))`). These are not equivalent: when `get(errors, name)` returns `undefined` or a non-array, `compact` returns `[]` (filters falsy), whereas `convertToArrayPayload` returns `[undefined]`. After `set(fieldArrayErrors, 'root', error[name])` the resulting errors array now carries a leading `undefined` element it previously would not, which can leak into `errors[name][0]` and surface a phantom entry to consumers iterating field-array errors.
**Fix:** Confirm the intended semantics. If the `compact` behavior was correct, align `logic/updateFieldArrayRootError.ts` to use `compact` (or filter falsies before `set`). Add a unit test for the empty/undefined-errors case asserting no stray array element is produced.

### WR-04: Unused `FieldErrors` import left behind after removing `updateFieldArrayRootError`

**File:** `src/utils.ts:17`
**Issue:** Removing the inline `updateFieldArrayRootError` (which referenced `FieldErrors`) leaves `FieldErrors` imported but unused — only `FieldError` (line 316) is still referenced. Dead imports are quality debt and, depending on TS config, may not error under `noUnusedLocals` for imports in all setups but will be flagged by linters/build. CLAUDE.md targets a polished OSS package, so dangling imports should not ship.
**Fix:** Remove `FieldErrors` from the import list at `src/utils.ts:17`.

### WR-05: `ForgerController` event-handler value typed as `string` despite handling non-string inputs

**File:** `src/Forger/Forger.tsx:42-64`, `src/types.ts:60-63`
**Issue:** `getEventHandlers` types every handler's value parameter as `string` (e.g. `(value: string) => onChange(getTextTransform(value))`), and `transform.input/output` in `types.ts` are typed `(value: string) => string`. But the same handlers are wired to `onValueChange` for Switch/Slider/Picker (boolean/number values) and to web `onChange` which in this codebase receives the raw event-or-value, not a string. The `string` annotation is incorrect for those paths; coercion bugs (e.g. a boolean Switch value passed through a string transform) will be masked by TypeScript rather than caught. This is a correctness-adjacent type lie in a phase explicitly about correctness.
**Fix:** Widen handler/transform value types to `unknown` (or a generic) and narrow inside the transform, or split the transform contract per input kind. At minimum type Switch/Slider/Picker handlers as `(value: any)` rather than `(value: string)`.

### WR-06: Web submit-button branch returns the original child, dropping accumulated processing

**File:** `src/Forge/Forge.tsx:96-107`
**Issue:** For a `type="submit"` button on web the function now `return child;` unchanged (correct re: avoiding double-submit). However if a submit button also carries `children` that themselves contain Forger fields or nested wizard-nav buttons, those descendants are never walked, because this branch short-circuits before the recursive `childChildren` handling at line 169. A submit button is an unusual place to nest fields, but the previous code path at least cloned the element. This is an edge-case correctness gap rather than a guaranteed bug.
**Fix:** If a submit button can legitimately contain processable descendants, recurse into its children before returning, e.g. clone with `children: processChildrenRecursively(childChildren, depth + 1)` while still omitting the `onClick` injection. Otherwise document the constraint that submit buttons must be leaf-level.

## Info

### IN-01: `safeOnSubmit` recreated every render

**File:** `src/Forge/Forge.tsx:40`
**Issue:** `const safeOnSubmit = onSubmit ?? (() => {});` produces a new function identity on every render when `onSubmit` is undefined, which propagates into `useImperativeHandle` deps (WR-02) and into `handleSubmit(safeOnSubmit)` recreated bindings. Harmless functionally but causes avoidable churn.
**Fix:** `const safeOnSubmit = useCallback(onSubmit ?? (() => {}), [onSubmit]);`

### IN-02: `hasFields` expression mixes `??` with truthy check confusingly

**File:** `src/useForge/useForge.tsx:33-34`
**Issue:** `(typeof fields !== "undefined" && fields?.length !== 0) ?? false` — the left operand is always a boolean, so `?? false` can never trigger and is dead. Also `fields?.length !== 0` is `true` for `undefined` length, but the leading `typeof` guard covers that, so the net result is correct yet the `?? false` is misleading noise. (Pre-existing; not introduced by this phase but in a changed file.)
**Fix:** Simplify to `const hasFields = Array.isArray(fields) && fields.length > 0;`

### IN-03: Commented-out dead import lines left in changed files

**File:** `src/Forge/Forge.tsx:18,23-24`
**Issue:** `// isWeb,`, `// mergePlatformProps,`, `// REACT_NATIVE_COMPONENTS,` remain as commented-out import entries. For an OSS package this is avoidable clutter.
**Fix:** Delete the commented import lines.

---

_Reviewed: 2026-05-31_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
