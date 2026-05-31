---
phase: 01-correctness
verified: 2026-05-31T00:00:00Z
status: gaps_found
score: 3/4 must-haves verified
overrides_applied: 0
gaps:
  - truth: "A wizard form reaches its last step, the user clicks the next/submit button, and onSubmit fires with the collected form data — NOT a silent no-op"
    status: failed
    reason: "The wizard submit wiring is functionally implemented but the same fix that unblocks CORR-04 (the real <form onSubmit>) introduces CR-01: the <form onSubmit={control.handleSubmit(safeOnSubmit)}> wraps ALL wizard steps unconditionally. On intermediate steps, pressing Enter in a text field or any implicit submit event fires handleSubmit(safeOnSubmit) immediately — submitting the whole form with partial data and bypassing the step model. No guard (isWizard && !isLastStep intercept, or per-step onSubmit override) exists in src/Forge/Forge.tsx. Success Criterion #4 requires the wizard to submit on the LAST step; the regression means it can submit on ANY step, which is definitionally a failure of the wizard correctness goal."
    artifacts:
      - path: "src/Forge/Forge.tsx"
        issue: "Line 289: <form onSubmit={control.handleSubmit(safeOnSubmit)}> is unconditional — applies on every wizard step, not just the last. No isWizard+step guard exists on the onSubmit handler."
    missing:
      - "Guard the <form> onSubmit handler: when isWizard is true and currentStep < totalSteps - 1, intercept the submit event, call e.preventDefault(), and invoke handleNext() instead of safeOnSubmit. Suggested pattern from 01-REVIEW.md CR-01: define a local onFormSubmit that branches on (isWizard && !isLastStep) before delegating to control.handleSubmit(safeOnSubmit)(e)."
---

# Phase 1: Correctness Verification Report

**Phase Goal:** The four known behavioral bugs are fixed so the library behaves as documented.
**Verified:** 2026-05-31
**Status:** gaps_found — 1 BLOCKER (CR-01 wizard regression compromises SC #4)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A web `<Forge>` submits via the native `<form>` element — pressing Enter or clicking submit triggers `onSubmit`; native validation fires before the handler | VERIFIED | `src/Forge/Forge.tsx:286-292` renders `<form className={className} noValidate={noValidate} onSubmit={control.handleSubmit(safeOnSubmit)}>`. `safeOnSubmit = onSubmit ?? (() => {})` at line 40. No `onClick` injected on web submit buttons (line 106 returns child unchanged). `noValidate` defaults to `false`, enabling native browser validation by default. |
| 2 | Passing multiple children or an invalid child to `<Forger>` throws an error naming `Forger` and the field `name` | VERIFIED | `src/Forger/Forger.tsx:118-131` — guard fires before `<Slot>` for both `React.Children.count(props.children) > 1` and non-element non-null children. Error message: `Forger: field "${props.name}" expects exactly one valid React element as its child`. `Forger.displayName = "Forger"` added at line 147. |
| 3 | JSDoc on `useForge` references `UseForgeProps` / `UseForgeResult` (no phantom `ForgeFormProps` / `UseForgeFormResult`); `updateFieldArrayRootError` exists only in `src/logic/`, not `src/utils.ts` | VERIFIED | `src/useForge/useForge.tsx:9-10` JSDoc reads `@param {UseForgeProps}` and `@returns {UseForgeResult}`. Grep confirms `ForgeFormProps` and `UseForgeFormResult` are absent. `grep "export.*updateFieldArrayRootError" src/utils.ts` returns nothing. Both `useFieldArray` (line 33) and `useForgeValues` (line 36) import the default export from `../logic/updateFieldArrayRootError`. |
| 4 | A wizard form reaches its last step, the user clicks the next/submit button, and `onSubmit` fires with collected form data — NOT a silent no-op | FAILED — BLOCKER (CR-01) | `handleWizardSubmit` is implemented in `useForge.tsx:56-57` and wired at `Forge.tsx:121` (`control.handleWizardSubmit?.(safeOnSubmit)`). However, the `<form onSubmit={control.handleSubmit(safeOnSubmit)}>` at `Forge.tsx:286-289` is unconditional — it applies on every wizard step. On intermediate steps, pressing Enter in a text input or any implicit submit event fires `handleSubmit(safeOnSubmit)` immediately, submitting with partial data and bypassing step progression. No `isWizard && !isLastStep` guard exists anywhere in the file. The wizard last-step path technically works in isolation, but the regression means the form submits prematurely on non-final steps — which is the same class of correctness failure CORR-04 was meant to fix. SC #4 requires the wizard to submit ONLY on the last step. |

**Score:** 3/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/Forge/Forge.tsx` | Web `<form>` + Fragment branch + wizard submit wiring | PARTIAL — Exists, substantive, wired; wizard last-step wiring present but regression on intermediate steps | Lines 276-293: correct web/native branch. Line 121: `handleWizardSubmit?.(safeOnSubmit)` wired. Line 289: unconditional `onSubmit` on all steps — CR-01 regression. |
| `src/useForge/useForge.tsx` | `handleWizardSubmit` in wizardProps + corrected JSDoc | VERIFIED | Lines 56-57: `handleWizardSubmit` implemented. Lines 60-69: included in `wizardProps`. Lines 9-10: JSDoc corrected. |
| `src/types.ts` | `ForgeProps` with optional `onSubmit` + `noValidate` | VERIFIED | Line 119: `onSubmit?:`. Line 120: `noValidate?: boolean`. Line 31: `handleWizardSubmit?:` widened to `(onSubmit?: (data: any) => void) => () => void`. |
| `src/Forger/Forger.tsx` | Fail-fast guard naming Forger + field name | VERIFIED | Lines 118-131: guard with rich error message before `<Slot>`. |
| `src/utils.ts` | Slot named-error; duplicate `updateFieldArrayRootError` removed | VERIFIED | Line 397: `"Slot: only one child is allowed"`. Line 417: throws on non-element non-null child. No `export.*updateFieldArrayRootError` remains (grep confirmed). NOTE: `FieldErrors` import at line 17 is now unused — dead import (WR-04 from review). |
| `src/logic/updateFieldArrayRootError.ts` | Canonical copy kept | VERIFIED | File exists, default export, uses `convertToArrayPayload`. |
| `src/useFieldArray/useFieldArray.tsx` | Import repointed to `logic/` | VERIFIED | Line 33: `import updateFieldArrayRootError from "../logic/updateFieldArrayRootError"`. Dead comment at prior line 92 removed. |
| `src/useForgeValues/useForgeValues.tsx` | Import repointed to `logic/` | VERIFIED | Line 36: `import updateFieldArrayRootError from "../logic/updateFieldArrayRootError"`. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/Forge/Forge.tsx` | `control.handleSubmit(safeOnSubmit)` | `<form onSubmit={...}>` (web branch) | WIRED | Line 289 — present and substantive |
| `src/Forge/Forge.tsx` | `control.handleWizardSubmit?.(safeOnSubmit)` | wizard last-step button onClick injection | WIRED but BROKEN for intermediate steps | Line 121 — last-step wiring correct in isolation; but the unconditional `<form onSubmit>` at line 289 fires `handleSubmit(safeOnSubmit)` on ALL steps (CR-01 regression) |
| `src/useForge/useForge.tsx` | `methods.handleSubmit` | `handleWizardSubmit` returns `methods.handleSubmit(onSubmit ?? (() => {}))` | WIRED | Lines 56-57 |
| `src/Forger/Forger.tsx` | Error naming Forger + field name | guard before `<Slot>` | WIRED | Lines 118-131 |
| `src/useFieldArray/useFieldArray.tsx` | `src/logic/updateFieldArrayRootError` | default import | WIRED | Line 33 |
| `src/useForgeValues/useForgeValues.tsx` | `src/logic/updateFieldArrayRootError` | default import | WIRED | Line 36 |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase fixes behavioral/structural bugs, not data-rendering pipelines. No dynamic data-rendering artifact was introduced.

---

### Behavioral Spot-Checks

| Behavior | Evidence in Code | Status |
|----------|-----------------|--------|
| Web `<Forge>` renders `<form>` not `<div>` | `Forge.tsx:286` — `<form className=...` | PASS |
| Native `<Forge>` renders Fragment, no className/style | `Forge.tsx:279-281` — `<>{formChildren}</>` inside isRNMode branch; no className/style on Fragment; no react-native import added | PASS |
| No `onClick` injected on web submit buttons | `Forge.tsx:106` — `return child;` unchanged on web path | PASS |
| Native submit buttons keep onClick injection | `Forge.tsx:99-101` — `onClick: control.handleSubmit(safeOnSubmit)` in isRNMode branch | PASS |
| `useImperativeHandle` uses safeOnSubmit | `Forge.tsx:241` — `control.handleSubmit(safeOnSubmit)()` | PASS |
| Dead comment `disabled: !control._formState.isValid` removed | Grep returns no match | PASS |
| Forger guard fires before Slot with named error | `Forger.tsx:118-131` — throws before `<Slot>` render | PASS |
| Duplicate `updateFieldArrayRootError` removed from utils.ts | Grep returns no match | PASS |
| JSDoc corrected (no phantom type names) | `useForge.tsx:9-10` — no `ForgeFormProps`/`UseForgeFormResult` | PASS |
| Wizard last-step button fires `onSubmit` via `handleWizardSubmit` | `Forge.tsx:121` — wired | PASS (in isolation) |
| Wizard intermediate step does NOT submit whole form on Enter | Grep for any `isWizard && !isLastStep` guard on form submit — NOTHING FOUND | FAIL (CR-01 BLOCKER) |

---

### Probe Execution

Step 7c: SKIPPED — no `scripts/*/tests/probe-*.sh` files exist; no runnable probes declared in PLAN or SUMMARY.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CORR-01 | Plan 01 | `<Forge>` renders real `<form>` on web + Fragment on RN; native submit semantics | SATISFIED | `Forge.tsx:286-293` web branch; `Forge.tsx:279-281` RN branch |
| CORR-02 | Plan 02 | `<Forger>` produces component-named error for invalid/multiple children | SATISFIED | `Forger.tsx:118-131`; `utils.ts:396-418` (Slot) |
| CORR-03 | Plans 01 + 02 | Stale JSDoc corrected; duplicate `updateFieldArrayRootError` removed | SATISFIED | JSDoc: `useForge.tsx:9-10`; dedup: grep confirmed zero utils.ts export remaining |
| CORR-04 | Plan 01 | Wizard last-step actually fires `onSubmit` | BLOCKED — CR-01 REGRESSION | `handleWizardSubmit` wiring exists but the unconditional `<form onSubmit>` fires `safeOnSubmit` on intermediate wizard steps, defeating step isolation |

All four requirement IDs declared across the two plans are accounted for.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/Forge/Forge.tsx` | 286-289 | `<form onSubmit={control.handleSubmit(safeOnSubmit)}>` unconditional — no wizard step guard | BLOCKER | Wizard intermediate steps submit the whole form on Enter / implicit submit, bypassing step progression. Defeats CORR-04. |
| `src/utils.ts` | 17 | `FieldErrors` import is now unused — `updateFieldArrayRootError` was the only user; it was removed in Plan 02 Task 2 | WARNING | Dead import. `FieldErrors` is imported but nothing in `utils.ts` references it after the dedup. Flagged as WR-04 in the code review. |
| `src/Forge/Forge.tsx` | 18, 23-24 | Commented-out import entries: `// isWeb,`, `// mergePlatformProps,`, `// REACT_NATIVE_COMPONENTS,` | INFO | Dead comment clutter. IN-03 in code review. |
| `src/useForge/useForge.tsx` | 33-34 | `(typeof fields !== "undefined" && fields?.length !== 0) ?? false` — `?? false` can never trigger (left operand is always boolean) | INFO | Dead `?? false` clause — misleading but not incorrect. IN-02 in code review. |

No `TBD`, `FIXME`, or `XXX` markers found in modified files.

---

### Human Verification Required

None triggered by automated checks (all mechanically verifiable). The one pending check (wizard intermediate-step submit regression) is observable in code and classified as a BLOCKER, not a human-only test.

---

## Gaps Summary

**One BLOCKER gap prevents the phase goal from being achieved.**

### Gap: CR-01 — Wizard Intermediate Steps Submit the Whole Form (SC #4 FAILED)

**Root cause:** CORR-01 (real `<form>` element) and CORR-04 (wizard submit) were fixed in the same file (`Forge.tsx`) without coordinating the interaction. The `<form onSubmit={control.handleSubmit(safeOnSubmit)}>` wraps all wizard steps uniformly. Wizard navigation is driven by `onClick` injection on `data-wizard-nav` buttons, but the `<form>` responds to ALL submit events — Enter keypress in any text input on any step, or any descendant `type="submit"` button the tree-walker does not intercept (depth > 10, render-prop children, etc.) — by calling `handleSubmit(safeOnSubmit)` immediately.

**Evidence:** `src/Forge/Forge.tsx:286-289` — `<form onSubmit={control.handleSubmit(safeOnSubmit)}>` with no conditional guard. Grep for `isWizard.*!isLastStep`, `onFormSubmit`, or `preventDefault.*handleNext` returns no matches.

**What must be added:** A wizard-aware submit handler that intercepts the form submit event on non-final steps. The fix from 01-REVIEW.md CR-01 is correct and minimal:

```tsx
const onFormSubmit = (e: React.FormEvent) => {
  if (isWizard && !isLastStep) {
    e.preventDefault();
    handleNext?.();
    return;
  }
  return control.handleSubmit(safeOnSubmit)(e);
};
// ...
<form className={className} noValidate={noValidate} onSubmit={onFormSubmit}>
```

**Scope:** Single change to `src/Forge/Forge.tsx`. No type changes required.

---

**Secondary finding (WARNING, not blocking):** `FieldErrors` at `src/utils.ts:17` is now a dead import. It was the only use removed by the `updateFieldArrayRootError` dedup. Should be cleaned up in the next iteration.

---

**Truths 1, 2, and 3 are cleanly verified.** SC #1 (web form submit), SC #2 (Forger named error), and SC #3 (JSDoc + dedup) are all correctly implemented with no regressions in those areas. Only SC #4 (wizard correctness) is blocked.

---

_Verified: 2026-05-31_
_Verifier: Claude (gsd-verifier)_
