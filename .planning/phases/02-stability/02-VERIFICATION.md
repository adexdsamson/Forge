---
phase: 02-stability
verified: 2026-05-31T12:50:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
---

# Phase 02: Stability Verification Report

**Phase Goal:** The library no longer depends on react-hook-form private `_*` internals for its public API hooks, lodash is removed from the runtime bundle, devtools are dev-only, and the public API is properly typed.
**Verified:** 2026-05-31T12:50:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `useFieldArray` uses only public RHF APIs; zero `control._*` access | VERIFIED | `src/useFieldArray/useFieldArray.tsx` delegates entirely to `useRHFFieldArray` (lines 40-46); grep for `control\._` in that file returns nothing |
| 2 | `usePersist` and `useForgeValues` use only public APIs; no `_subjects`/`_formValues` | VERIFIED | `usePersist` uses `useWatch`+`useFormState` (lines 35-36); `useForgeValues` uses `useFormContext` + `getValues`/`setValue` only; comprehensive grep of `_subjects\|_formValues\|_fields\|_names\|_state\|_options` against all hook files returns zero matches |
| 3 | `lodash` is absent from `package.json` dependencies AND from all `src/` imports | VERIFIED | `package.json` has no `dependencies` block at all; `grep -rn "from \"lodash\"\|from 'lodash'"` against `src/` returns zero hits; only remaining hit is a `// CRITICAL: lodash isObject semantics` comment in `utils.ts` |
| 4 | `@hookform/devtools` is dev-only and never inlined into consumer bundles | VERIFIED | `package.json`: devtools appears only in `devDependencies` and `peerDependenciesMeta.optional`; `Forge.tsx` loads it via `require("@hookform/devtools")` inside `if (debug)` block only; `rollup.config.mjs` lists `"@hookform/devtools"` in the `external` array explicitly; built `dist/index.cjs.js` line 354 shows the `require` is a call-site inside `loadDevTool()` — not a static top-level import |
| 5 | `useForge` returns `control` typed as `ForgeControl<T>`; `tsc --noEmit` passes cleanly | VERIFIED | `useForge.tsx:81`: `control: methods.control as ForgeControl<TFieldValues, TFieldProps>` — typed cast, not `as any`; `npm run typecheck` (`tsc --noEmit`) exits cleanly (zero errors, zero output); the `...(props as any)` at line 32 is an INTERNAL INPUT spread into `useForm()`, documented and classified in Plan 05 SUMMARY as non-public-surface |

**Score:** 5/5 truths verified

---

## Additional Gates

### npm test

**Command:** `npm test` (vitest run)
**Result:** 1 test file, 3 tests passed, 0 failed
**Status:** PASS

Tests in `src/Forge/Forge.submit.test.tsx` cover:
- Test 1: native submit button fires `onSubmit` with field values (CORR-01)
- Test 2: Enter key in a text field submits the form (CORR-01)
- Test 3: wizard last-step submit fires `onSubmit` when next button clicked on final step (CORR-04)

### npm run build

**Command:** `rollup -c`
**Result:** Produced all three required outputs; only warnings were `"use client"` directive stripping (not errors)
**Status:** PASS

| File | Status |
|------|--------|
| `dist/index.cjs.js` | Exists |
| `dist/index.esm.js` | Exists |
| `dist/index.d.ts` | Exists |

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/useFieldArray/useFieldArray.tsx` | Public-RHF-only field array with per-item `inputProps` decoration | VERIFIED | 69 lines; wraps `useRHFFieldArray`; no `_*` access; `inputProps` merged via `useMemo` |
| `src/usePersist/usePersist.tsx` | `useWatch` + `useFormState` subscription | VERIFIED | 41 lines; `useWatch({ control })` + `useFormState({ control })`; `handlerRef` stability idiom preserved |
| `src/useForgeValues/useForgeValues.tsx` | Thin wrapper over `setValue`/`getValues` | VERIFIED | 80 lines; derives from `useFormContext`; `getValue` throws named Forge error for unknown fields; dot-path `hasPath` walk instead of `_names`/`_fields` |
| `src/Forge/Forge.tsx` | Devtools lazy-loaded inside `if (debug)` | VERIFIED | `loadDevTool()` function wraps `require("@hookform/devtools").DevTool`; called only at line 332 inside `if (debug)` |
| `src/useForge/useForge.tsx` | `Object.assign` in-place augmentation; typed return | VERIFIED | `Object.assign(methods.control, forgeProps)` at line 77; return typed `ForgeControl<TFieldValues, TFieldProps>` at line 81 |
| `package.json` | No `dependencies` block; devtools as optional peer + devDep; RHF floor `^7.34.0` | VERIFIED | No `dependencies` key present; `@hookform/devtools` in `devDependencies` + `peerDependenciesMeta`; `react-hook-form` peer is `^7.34.0` |
| `rollup.config.mjs` | `@hookform/devtools` in `external` list | VERIFIED | Line 17: `"@hookform/devtools"` explicitly in `external` array |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/usePersist/usePersist.tsx` | `react-hook-form` public `useWatch`/`useFormState` | named imports | WIRED | `import { ..., useWatch, useFormState } from "react-hook-form"` at line 2 |
| `src/useForgeValues/useForgeValues.tsx` | `react-hook-form` public `useFormContext` | named import | WIRED | `import { ..., useFormContext } from "react-hook-form"` at line 7 |
| `src/useFieldArray/useFieldArray.tsx` | `react-hook-form` public `useFieldArray` | re-export as `useRHFFieldArray` | WIRED | `import { ..., useFieldArray as useRHFFieldArray } from "react-hook-form"` at line 7 |
| `src/Forge/Forge.tsx loadDevTool()` | `@hookform/devtools` at call-site only | `require()` inside `if (debug)` | WIRED | `require("@hookform/devtools").DevTool` at line 354 of built CJS bundle; guarded behind `if (debug)` |
| `src/useForge/useForge.tsx` return | `ForgeControl<TFieldValues, TFieldProps>` type | `as ForgeControl<T>` cast | WIRED | `control: methods.control as ForgeControl<TFieldValues, TFieldProps>` at line 81 |

---

## Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| STAB-01 | 02-06 | `useFieldArray` off private `_*` internals | SATISFIED | `useFieldArray.tsx` delegates to public `useRHFFieldArray`; zero `_*` access found |
| STAB-02 | 02-04, 02-07 | `usePersist`/`useForgeValues`/`useSubscribe` use public APIs | SATISFIED | `usePersist` uses `useWatch`+`useFormState`; `useForgeValues` uses `useFormContext`+`getValues`/`setValue`; `useSubscribe` is internal-only (not called by any public hook) |
| STAB-03 | 02-02, 02-05, 02-08 | `lodash` removed as runtime dependency | SATISFIED | Zero `from "lodash"` imports in `src/`; no `dependencies` block in `package.json` |
| STAB-04 | 02-03, 02-08 | `@hookform/devtools` dev-only | SATISFIED | `devDependencies` + optional peer only; lazy `require()` inside `if (debug)` in `Forge.tsx`; externalized in `rollup.config.mjs` |
| STAB-05 | 02-01, 02-03, 02-05, 02-08 | Build correct against `react-hook-form ^7`; `as any`-free public surface; `tsc --noEmit` passes | SATISFIED | `tsc --noEmit` exits 0; `useForge` returns `ForgeControl<T>`; `Forger.tsx` uses `component` (typed `React.ElementType`) not `component as any` |

All five STAB requirements satisfied. No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/useForge/useForge.tsx` | 32 | `...(props as any)` | Info | Internal input spread passing residual `UseForgeProps` options to `useForm()`; NOT on public return surface; explicitly classified in Plan 05 SUMMARY; does not violate STAB-05 |
| `src/Forge/Forge.tsx` | 344-345 | `control as unknown as Parameters<typeof FormProvider>[0]` | Info | Intentional narrow cast for `FormProvider` wiring; tracked with comment for future Phase cleanup |
| `src/Forge/Forge.tsx` | 112-126 | Unreachable function-child branch | Warning (from code review WR-03) | Dead code — `isElementSlot` already returned at line 99 for non-elements; does not affect any success criterion |
| `src/useForge/useForge.tsx` | 62-77 | `Object.assign` leaves stale wizard props | Warning (from code review WR-01) | If `isWizard` toggles false-to-true at runtime, old wizard keys persist; no consumer currently toggles this; does not violate success criteria |
| `src/useFieldArray/useFieldArray.tsx` | 27-36 | `useFormContext` null-deref when used outside FormProvider | Warning (from code review WR-02) | Opaque crash instead of named error if `props.control` is also undefined; does not violate STAB-01 success criterion |

No `TBD`, `FIXME`, or `XXX` debt markers found in any phase-modified files.

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 3 submit harness tests pass | `npm test` | 1 file, 3 tests passed | PASS |
| `tsc --noEmit` exits clean | `npm run typecheck` | Zero errors | PASS |
| Build produces all 3 dist files | `npm run build` | `dist/index.cjs.js`, `dist/index.esm.js`, `dist/index.d.ts` all present | PASS |
| No lodash in src imports | `grep -rn "from \"lodash\"\|from 'lodash'" src/` | Zero matches | PASS |
| `@hookform/devtools` not in runtime deps | check `package.json` + `dist/*.js` | No `dependencies` block; `require` is call-site only, not static import | PASS |

---

## Human Verification Required

None. All five success criteria are verifiable programmatically and all pass.

---

## Gaps Summary

No gaps. All five success criteria are met by the actual codebase.

The three code-review warnings (WR-01 wizard-toggle staleness, WR-02 null-deref outside FormProvider, WR-03 unreachable dead branch) are advisory — none of them contradict a Phase 2 success criterion. They are candidates for Phase 3 cleanup.

---

_Verified: 2026-05-31T12:50:00Z_
_Verifier: Claude (gsd-verifier)_
