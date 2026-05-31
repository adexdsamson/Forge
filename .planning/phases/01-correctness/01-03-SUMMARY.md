---
phase: 01-correctness
plan: "03"
subsystem: form-core, forger, error-handling
tags: [correctness, wizard, submit, gap-closure, type-safety]
dependency_graph:
  requires: [01-01, 01-02]
  provides: [CORR-04, CORR-01, CORR-03]
  affects:
    - src/Forge/Forge.tsx
    - src/logic/updateFieldArrayRootError.ts
    - src/utils.ts
    - src/Forger/Forger.tsx
    - src/types.ts
tech_stack:
  added: []
  patterns:
    - wizard-aware-submit-guard
    - useCallback-memoization
    - useImperativeHandle-wizard-aware
    - compact-semantics-vs-convertToArrayPayload
    - unknown-widened-value-params
key_files:
  created: []
  modified:
    - src/Forge/Forge.tsx
    - src/logic/updateFieldArrayRootError.ts
    - src/utils.ts
    - src/Forger/Forger.tsx
    - src/types.ts
decisions:
  - "onFormSubmit defined as a local handler (not inline) to keep the form element clean; branches on isWizard && !isLastStep before calling handleSubmit (CR-01)"
  - "handleWizardSubmit fallback is a ternary at the last-step button (not optional-chain) to prevent onClick=undefined on hand-built ForgeControl (WR-01)"
  - "useImperativeHandle dependency array extended to include isWizard, isLastStep, handleNext so the wizard-aware imperative handle re-creates only when needed (WR-02)"
  - "safeOnSubmit memoized with useCallback([onSubmit]) to stabilize identity across renders (IN-01)"
  - "compact restored in updateFieldArrayRootError (replacing convertToArrayPayload) to match pre-dedupe semantics — undefined input yields [] not [undefined] (WR-03)"
  - "transform.input/output widened to unknown in types.ts; getTextTransform/getTransformedValue params widened to unknown in Forger.tsx — no runtime behavior change, only type correctness (WR-05)"
metrics:
  duration: "~10m"
  completed_date: "2026-05-31"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 1 Plan 03: Wizard Submit Regression Fix + Cleanups Summary

**One-liner:** Wizard-aware onFormSubmit guard closes CR-01 BLOCKER; handleWizardSubmit fallback, wizard-aware imperative handle, memoized safeOnSubmit, index-aligned field-array errors, dead FieldErrors import removed, and event-handler/transform value types widened off false `string` annotation.

> **Post-review correction (commit `cc45f03`):** The WR-03 fix below originally used `compact(get(errors, name))`. Code review (01-REVIEW.md, CR-01) found this regressed correctness — `compact`'s `filter(Boolean)` strips *all* `undefined` holes from the index-aligned field-array error array, not just the leading phantom, silently shifting later rows' errors to earlier indices. It was reverted to `Array.isArray(existing) ? existing : []`, which still removes the original `[undefined]` phantom but preserves index alignment. The WR-03 narrative below describes the superseded approach.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wizard submit correctness — onFormSubmit guard (CR-01), WR-01 fallback, WR-02 imperative handle, IN-01 memoize | 6587da2 | src/Forge/Forge.tsx |
| 2 | Phantom array error (WR-03), dead import (WR-04), false string value types (WR-05) | fb91ad9 | src/logic/updateFieldArrayRootError.ts, src/utils.ts, src/Forger/Forger.tsx, src/types.ts |

## What Was Built

### Task 1: Wizard Submit Correctness in Forge.tsx (commit `6587da2`)

**CR-01 (BLOCKER) — wizard-aware form submit guard:**
- Added local `onFormSubmit: (e: FormEvent) => void` handler before the return.
- On `isWizard && !isLastStep`: calls `e.preventDefault()`, calls `handleNext?.()`, returns early — no call to safeOnSubmit/handleSubmit.
- Otherwise delegates to `control.handleSubmit(safeOnSubmit)(e)`.
- `<form>` element changed from `onSubmit={control.handleSubmit(safeOnSubmit)}` to `onSubmit={onFormSubmit}`.
- `FormEvent` added to the react named-import block.

**WR-01 — last-step submit fallback:**
- Last-step wizard button onClick changed from optional-chained `control.handleWizardSubmit?.(safeOnSubmit)` (yielded `undefined` when handler absent) to a ternary: `control.handleWizardSubmit ? control.handleWizardSubmit(safeOnSubmit) : control.handleSubmit(safeOnSubmit)`.
- Prevents a silent dead submit button when a hand-built ForgeControl lacks `handleWizardSubmit`.

**WR-02 / IN-01 — wizard-aware imperative handle + memoized safeOnSubmit:**
- `safeOnSubmit` wrapped in `useCallback(onSubmit ?? (() => {}), [onSubmit])` for stable identity.
- `useCallback` added to the react named-import block.
- `useImperativeHandle` `onSubmit` handle now branches:
  - `isWizard && !isLastStep`: calls `handleNext?.()` and returns (agrees with in-tree wizard nav).
  - Last step / non-wizard: calls `control.handleWizardSubmit(safeOnSubmit)()` or falls back to `control.handleSubmit(safeOnSubmit)()`.
- Dependency array extended: `[safeOnSubmit, control, currentStep, totalSteps, isWizard, isLastStep, handleNext]`.
- Native Fragment branch and the react-native import constraint are completely untouched.

### Task 2: Cleanup Fixes (commit `fb91ad9`)

**WR-03 — restore compact semantics in updateFieldArrayRootError.ts:**
- Import changed from `{ convertToArrayPayload, get, set }` to `{ compact, get, set }` from `../utils`.
- `const fieldArrayErrors = convertToArrayPayload(get(errors, name))` replaced with `compact(get(errors, name))`.
- `compact(undefined)` returns `[]` (no phantom leading undefined), matching the pre-dedupe behavior from the removed utils.ts copy.
- `convertToArrayPayload` is no longer referenced and was removed from the import.

**WR-04 — remove dead FieldErrors import from utils.ts:**
- `FieldErrors` removed from the `react-hook-form` named-import block in `src/utils.ts` (was the only use; that use was removed by the Plan 02 dedupe).
- `FieldError` and all other imported names remain.
- `compact` still exported at line 132 and used at lines 66, 109, 237.

**WR-05 — widen event-handler/transform value types:**
- `src/Forger/Forger.tsx`: `getTextTransform` and `getTransformedValue` param types widened from `string` to `unknown`. All value params in `getEventHandlers` handlers (custom `handler`, `onChangeText`, `onValueChange`, web/generic `onChange`) widened from `string` to `unknown`. Switch/Slider/Picker `onValueChange` specifically noted — these pass boolean/number values that were previously masked by the false `string` annotation.
- `src/types.ts`: `transform.input` and `transform.output` param types widened from `string` to `unknown`; return types widened from `string` to `unknown` as well for consistency with the handler changes. MemorizeController comparator is completely untouched.

## Deviations from Plan

None — plan executed exactly as written. All five gap items (CR-01, WR-01, WR-02/IN-01, WR-03, WR-04, WR-05) addressed as specified.

## Verification Results

- `npx tsc --noEmit`: PASS (0 errors, strict mode)
- `npx rollup -c`: PASS (CJS + ESM + dts built cleanly; pre-existing "use client" directive warnings are unchanged and out of scope)
- Source assertions verified:
  - `onFormSubmit` handler defined and wired to `<form onSubmit={onFormSubmit}>`
  - `isWizard && !isLastStep` guard in `onFormSubmit`
  - Ternary (not optional-chain) at last-step wizard button onClick
  - `safeOnSubmit = useCallback(onSubmit ?? (() => {}), [onSubmit])`
  - `useImperativeHandle` branches on `isWizard && !isLastStep`; wizard members in dep array
  - `compact(get(errors, name))` in updateFieldArrayRootError.ts
  - `FieldErrors` absent from utils.ts; `FieldError` present
  - Handler/transform value params typed `unknown` not `string`
  - No react-native import added to Forge.tsx
  - Native Fragment branch unchanged

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Changes are:
- Submit-routing logic in a client-side form (T-01-06: onFormSubmit guard closes the intermediate-step partial-submit threat)
- In-memory error-shaping (T-01-08: compact restore removes phantom array element, no new surface)
- TypeScript annotation changes (WR-05: no runtime behavior change)

No new threat surface beyond what the plan's threat model already covers.

## Known Stubs

None — all changes are complete functional implementations with no placeholder values or TODO paths.

## Self-Check: PASSED

- `src/Forge/Forge.tsx` — exists, onFormSubmit handler present, <form onSubmit={onFormSubmit}>, useCallback memoization, wizard-aware useImperativeHandle
- `src/logic/updateFieldArrayRootError.ts` — exists, uses compact, convertToArrayPayload removed from import
- `src/utils.ts` — exists, FieldErrors absent, FieldError present, compact exported
- `src/Forger/Forger.tsx` — exists, all handler value params typed unknown
- `src/types.ts` — exists, transform.input/output params typed unknown
- Commit `6587da2` exists (Task 1)
- Commit `fb91ad9` exists (Task 2)
