---
phase: 01-correctness
plan: "01"
subsystem: form-core
tags: [correctness, form-render, wizard, submit, cross-platform]
dependency_graph:
  requires: []
  provides: [CORR-01, CORR-04, CORR-03-jsdoc]
  affects: [src/Forge/Forge.tsx, src/useForge/useForge.tsx, src/types.ts]
tech_stack:
  added: []
  patterns: [optional-prop-safe-default, platform-branch-render, rhf-handleSubmit-threading]
key_files:
  created: []
  modified:
    - src/types.ts
    - src/useForge/useForge.tsx
    - src/Forge/Forge.tsx
decisions:
  - "handleWizardSubmit accepts optional onSubmit callback and returns an RHF-validated submit handler via methods.handleSubmit (D-10 planner discretion — threads onSubmit from Forge props into useForge wizard state)"
  - "Web submit buttons no longer receive injected onClick to prevent double-submit; native buttons keep onClick injection since no <form> element exists on native (D-04)"
  - "safeOnSubmit = onSubmit ?? (() => {}) pattern used throughout Forge.tsx for safe no-op when prop absent (D-07)"
metrics:
  duration: "3m"
  completed_date: "2026-05-31"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 1 Plan 01: Submit Wiring + Wizard Submit + JSDoc Fixes Summary

**One-liner:** Real `<form>` on web + Fragment on native + optional onSubmit + RHF-validated wizard last-step submit via handleWizardSubmit threading.

## What Was Built

Fixed three correctness requirements (CORR-01, CORR-03-JSDoc half, CORR-04) across the submit-wiring surface spanning `Forge.tsx`, `useForge.tsx`, and `types.ts`.

### Task 1 — Types + useForge (commit `31422dc`)

**`src/types.ts`:**
- `ForgeProps.onSubmit` changed from required to optional (`onSubmit?:`) — safe no-op when absent
- `ForgeProps` gains `noValidate?: boolean` — defaults `false`, enabling native browser validation by default; consumers opt out explicitly
- `ForgeControl.handleWizardSubmit` signature widened from `() => void` to `(onSubmit?: (data: any) => void) => () => void` — accepts the consumer's submit callback and returns an RHF-validated handler

**`src/useForge/useForge.tsx`:**
- JSDoc `@param` type corrected to `{UseForgeProps}`, `@returns` type corrected to `{UseForgeResult}` — removes phantom `ForgeFormProps` / `UseForgeFormResult` that did not exist
- `handleWizardSubmit` implemented in `wizardProps`: `(onSubmit?) => methods.handleSubmit(onSubmit ?? (() => {}))` — RHF whole-form validation gates the submit callback; invalid form blocks call + populates `errors`

### Task 2 — Forge.tsx (commit `ed0e5fe`)

**Container element:**
- Web branch (`!isRNMode`): `<div className={className}>` replaced with `<form className={className} noValidate={noValidate} onSubmit={control.handleSubmit(safeOnSubmit)}>` — activates native Enter-to-submit, type="submit" button behavior, required/pattern validation. RHF's `handleSubmit` calls `event.preventDefault()` internally (T-01-01 threat mitigation).
- Native branch (`isRNMode`): renders a bare `React.Fragment` (`<>...</>`) — no wrapper element, no `className`, no `style`. No hard `react-native` import added (runtime-detection-only constraint preserved).

**Submit button injection:**
- Web path: removed `onClick: control.handleSubmit(...)` injection on `type="submit"` buttons — the native `<form onSubmit>` drives handleSubmit, preventing double-submit
- Native path: keeps `onClick: control.handleSubmit(safeOnSubmit)` injection (no form element exists on native to drive submit)

**Wizard last-step submit:**
- `onClick = handleWizardSubmit` (bare undefined reference) replaced with `onClick = control.handleWizardSubmit?.(safeOnSubmit)` — threads the consumer `onSubmit` prop through the RHF-validated wizard submit handler from Task 1

**`useImperativeHandle`:**
- `control.handleSubmit(onSubmit)` updated to `control.handleSubmit(safeOnSubmit)` — programmatic ref.onSubmit() no longer crashes when `onSubmit` prop is absent

**Dead comment removed:**
- `// disabled: !control._formState.isValid,` removed from submit-button injection block — referenced RHF private `_formState` and was dead code

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit` exits 0 (strict mode, no new `as any` on public surface)
- `npx rollup -c` builds CJS + ESM + dts cleanly (pre-existing `"use client"` directive warnings are unchanged)
- `grep -n "disabled: !control._formState.isValid" src/Forge/Forge.tsx` returns nothing
- No `react-native` import introduced anywhere in `Forge.tsx`
- Web form branch confirmed: `onSubmit={control.handleSubmit(` and `noValidate={` present
- Native Fragment branch confirmed: `isRNMode` branches to `<>...</>` with no className/style
- Submit-button branching confirmed: native path injects `onClick`, web path returns child unchanged
- Wizard threading confirmed: `control.handleWizardSubmit?.(safeOnSubmit)` at last-step
- JSDoc confirmed: `{UseForgeProps}` and `{UseForgeResult}` present, no phantom names

## Self-Check: PASSED

- `src/types.ts` — exists, `onSubmit?`, `noValidate?`, widened `handleWizardSubmit` signature present
- `src/useForge/useForge.tsx` — exists, `handleWizardSubmit` in wizardProps, corrected JSDoc
- `src/Forge/Forge.tsx` — exists, `<form` branch + Fragment branch + safeOnSubmit wired throughout
- Commit `31422dc` exists (Task 1)
- Commit `ed0e5fe` exists (Task 2)
