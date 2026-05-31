---
phase: 02-stability
reviewed: 2026-05-31T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/types.ts
  - src/utils.ts
  - src/validateField.ts
  - src/logic/getDirtyFields.ts
  - src/logic/getFieldValueAs.ts
  - src/logic/hasPromiseValidation.ts
  - src/Forge/Forge.tsx
  - src/usePersist/usePersist.tsx
  - src/useForge/useForge.tsx
  - src/Forger/Forger.tsx
  - src/useFieldArray/useFieldArray.tsx
  - src/useForgeValues/useForgeValues.tsx
  - src/Forge/Forge.submit.test.tsx
  - rollup.config.mjs
  - package.json
findings:
  critical: 0
  warning: 6
  info: 5
  total: 11
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-05-31
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Phase 2 ("Stability") set out to (1) remove all react-hook-form private-API access (`control._*`), (2) drop the `lodash` runtime dependency, and (3) make `@hookform/devtools` dev-only/lazy. I verified all three primary goals are met:

- No `control._*` access remains anywhere in `src/` (grep clean; the only `_names`/`_fields` hits are local parameter names in `utils.ts`/`getResolverOptions.ts`, not RHF private reads).
- No `lodash` import remains (the only hit is an explanatory comment in `utils.ts`).
- `package.json` has no `dependencies` block at all; `@hookform/devtools` is a `devDependency` + optional peer, and `Forge.tsx` loads it lazily behind `if (debug)` via a guarded `require`, with `rollup.config.mjs` keeping it `external`.

The rewrites onto public RHF APIs (`useWatch`/`useFormState` in `usePersist`, `useFieldArray` delegation, `useFormContext`-derived methods in `useForgeValues`) are largely sound. However, several correctness and robustness issues remain, the most notable being the in-place `Object.assign` augmentation in `useForge` which never clears stale wizard properties, a null-deref hazard in `useFieldArray` when used outside a `FormProvider`, and an unreachable dead branch in the `Forge` child-walker. No blocker-tier security or data-loss defects were found.

## Warnings

### WR-01: `useForge` Object.assign leaves stale wizard props on the shared control instance

**File:** `src/useForge/useForge.tsx:62-77`
**Issue:** The hook now augments the *same* control instance in place every render (the D-11 fix). The merged payload is `forgeProps = { hasFields, fields, ...wizardProps }`, where `wizardProps` is `{}` when `isWizard` is false. `Object.assign` only adds/overwrites keys — it never deletes them. If `isWizard` (or `totalSteps`) transitions from truthy to falsy across renders, the previously written `isWizard: true`, `currentStep`, `isFirstStep`, `isLastStep`, `handleNext`, `handlePrevious`, `handleWizardSubmit` remain stuck on `control`. `Forge.tsx` reads `isWizard` straight off `control` (line 70-79), so the form would keep rendering only `childrenArray[currentStep]` and the wizard step counter even after wizard mode is turned off. Because it is the same persisted object, the stale values survive indefinitely.
**Fix:** Always write the full wizard shape (set the fields to `undefined`/defaults when not a wizard) so a toggle clears them, or delete the wizard keys when `!isWizard`:
```ts
const wizardProps = isWizard
  ? { isWizard, currentStep, totalSteps, isFirstStep: currentStep === 0,
      isLastStep: currentStep === totalSteps - 1, handleNext, handlePrevious, handleWizardSubmit }
  : { isWizard: false, currentStep: undefined, totalSteps: undefined,
      isFirstStep: undefined, isLastStep: undefined,
      handleNext: undefined, handlePrevious: undefined, handleWizardSubmit: undefined };
Object.assign(methods.control, { hasFields, fields, ...wizardProps });
```

### WR-02: `useFieldArray` dereferences `methods.control` when used outside a FormProvider

**File:** `src/useFieldArray/useFieldArray.tsx:27-36`
**Issue:** `const methods = useFormContext<TFieldValues>();` returns `null` when the hook is called outside a `<FormProvider>`. The subsequent `const { control = methods.control } = props;` evaluates the default `methods.control` whenever `props.control` is `undefined`, which throws `TypeError: Cannot read properties of null (reading 'control')` — an opaque crash instead of a Forge-named error. Unlike `Forger.tsx` (which guards with `useFormContext() ?? { control: props?.control }`), this hook has no fallback. The architecture notes explicitly allow fields/hooks to receive `control` as a prop when outside a provider, so this path is reachable.
**Fix:** Mirror the Forger idiom and guard the context:
```ts
const methods = useFormContext<TFieldValues>();
const control = props.control ?? methods?.control;
if (!control) {
  throw new Error("useFieldArray: no control found — pass `control` or render inside <Forge>/<FormProvider>");
}
```

### WR-03: Unreachable function-child branch in the Forge child-walker

**File:** `src/Forge/Forge.tsx:112-126`
**Issue:** The branch `if (typeof child === "function")` sits *after* the `if (!isElementSlot(child)) return child;` guard at line 98. `isElementSlot` is `isValidElement(child)`, and `isValidElement` is `false` for functions — so any function child has already returned at line 99 and can never reach line 112. This is dead code. The inline comment acknowledges the element's `.type` may be a function but conflates that with the element itself being a function; the guard makes the whole block unreachable, so the documented "legacy render-prop consumers who pass a bare function as a child" are in fact silently passed through untouched at line 99, not handled here. Either the intended behavior is broken or the branch is dead.
**Fix:** If render-prop children must be supported, detect them *before* the `isElementSlot` guard. Otherwise delete lines 112-126 to remove the misleading dead code.

### WR-04: `Slot` discards `props.style` on web when wrapping a child that has its own style

**File:** `src/utils.ts:400-414`
**Issue:** In `Slot`, the merge is `style: isWeb ? style : [...style, ...customChildStyle]`. On web the parent-supplied `style` is computed but the child's own `style` (`customChildStyle`) is dropped, *and* because the spread order is `{ ...props, ...(children.props as object), style }`, `children.props.style` is first overwritten by the parent `props` then re-set to bare `style`. Net effect on web: the child's original inline `style` is silently lost whenever `Slot` is given any `style` prop. `Forger` currently renders `<Slot>` with no `style`, so this is latent rather than active, but it is a correctness trap for any caller that passes `style` to `Slot` on web.
**Fix:** Merge both on web too, or explicitly document/guarantee that web `Slot` style merging is intentionally parent-only. A safe merge: `style: isWeb ? { ...(customChildStyle as object), ...(style as object) } : [...style, ...customChildStyle]`.

### WR-05: `usePersist` types `useFormState` flags as always-present but they are proxy-gated

**File:** `src/usePersist/usePersist.tsx:36-40`
**Issue:** The effect calls `handlerRef.current(values as TFieldProps, { isDirty, isValid })`. `useFormState` returns a proxy where flags are only *subscribed* if read during render; here they are destructured at line 36 so subscription is established (good). However the effect dependency array is `[values, isDirty, isValid]` while `values` comes from `useWatch`, which returns a fresh reference on every form tick. The documented intent is "fire on every value change," but the handler also fires on the very first mount with the initial (possibly empty) snapshot before any user interaction. For an autosave/draft handler this can write an empty/default draft over an existing persisted value on mount.
**Fix:** Gate the first run or gate on `isDirty` inside the effect, or document that consumers must guard mount writes:
```ts
const mounted = React.useRef(false);
React.useEffect(() => {
  if (!mounted.current) { mounted.current = true; return; }
  handlerRef.current(values as TFieldProps, { isDirty, isValid });
}, [values, isDirty, isValid]);
```

### WR-06: `useForgeValues.getValue` throws for legitimately-undefined registered fields

**File:** `src/useForgeValues/useForgeValues.tsx:67-77`
**Issue:** `getValue` throws "field is not registered" when `hasPath(all, name)` is false. `hasPath` walks the snapshot from `getValues()` and returns false the moment a segment is missing or `cur` is `null`. A field registered with `defaultValue: null` (or whose parent object is `null`) trips `if (cur == null ... ) return false` at line 41, so `getValue` throws even though the field is registered and intentionally null. Likewise an array element index that has been removed but whose parent array exists with a different length yields a false "not registered." The error message is therefore misleading for these valid states. The documented RISK-01 limitation covers never-written fields, but null-valued and sparse-array cases are additional false positives not covered by the comment.
**Fix:** Distinguish "missing key" from "present-but-nullish." Walk with `in`/`hasOwnProperty` only, and treat a present key whose value is `null` as found:
```ts
for (const seg of segments) {
  if (cur == null) return false;
  if (typeof cur !== "object" || !(seg in (cur as object))) return false;
  cur = (cur as Record<string, unknown>)[seg]; // do not bail on null value here
}
return true;
```
(The final `cur` may be null; that is still "registered.")

## Info

### IN-01: Redundant `?? false` after a boolean `&&` expression

**File:** `src/useForge/useForge.tsx:35-36`
**Issue:** `const hasFields = (typeof fields !== "undefined" && fields?.length !== 0) ?? false;` — the `&&` expression already yields a strict boolean, so `?? false` can never trigger (a boolean is never nullish). Harmless but signals confusion about the intended fallback.
**Fix:** Drop `?? false`: `const hasFields = typeof fields !== "undefined" && fields.length !== 0;`

### IN-02: `safeOnSubmit` useCallback wraps a freshly-created fallback each render

**File:** `src/Forge/Forge.tsx:56`
**Issue:** `useCallback(onSubmit ?? (() => {}), [onSubmit])` is functionally correct, but when `onSubmit` is undefined the memoized value is a new no-op closure keyed on `onSubmit`. This is fine, but `react-hooks/exhaustive-deps` will flag the inline arrow. Minor lint noise; no runtime impact.
**Fix:** Optional — hoist a module-level `const NOOP = () => {}` and use `useCallback(onSubmit ?? NOOP, [onSubmit])`.

### IN-03: Commented-out imports left in validateField

**File:** `src/validateField.ts:28-31`
**Issue:** Four commented-out imports (`isTextInput`, `isPicker`, `isSwitch`, `isSlider`) remain. Dead commented code.
**Fix:** Remove the commented lines.

### IN-04: `declare function require` shadows a global and bypasses module typing

**File:** `src/Forge/Forge.tsx:32`
**Issue:** `declare function require(module: string): any;` is a file-local ambient declaration to keep the synchronous `require("@hookform/devtools")` typed without `@types/node`. This works in CJS output, but in the ESM build (`dist/index.esm.js`) `require` is not defined in a pure-ESM consumer (e.g. native ESM in Node without interop or strict bundlers), so `if (debug)` would throw `require is not defined` rather than the intended friendly install-prompt error. The lazy-load is correct for tree-shaking but the ESM runtime path is fragile.
**Fix:** Confirm the ESM build path is exercised (the new test only covers the non-debug web path). Consider wrapping the `require` access itself in the try/catch's reach (it already is) but verify a pure-ESM `debug={true}` consumer gets the friendly error, not a raw `ReferenceError`.

### IN-05: Test suite does not cover the Phase-2 rewrites it most needs to protect

**File:** `src/Forge/Forge.submit.test.tsx:1-203`
**Issue:** The only test file covers submit/Enter/wizard-last-step (RISK-04 / CORR-01/04) — valuable — but none of the actual Phase-2 surface area is tested: `usePersist` firing on `useWatch` ticks, `useFieldArray` outside-provider behavior (WR-02), `useForgeValues.getValue` presence check (WR-06), the `debug` lazy-require path (IN-04), or the `useForge` Object.assign wizard-toggle (WR-01). The stated goal "stays stable across RHF updates" is under-protected by tests.
**Fix:** Add unit tests for `usePersist` (mock handler called on value change), `useForgeValues.getValue` happy + throw paths, and `useFieldArray` standalone control usage.

---

_Reviewed: 2026-05-31_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
