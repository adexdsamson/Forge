---
phase: 02-stability
plan: 06
subsystem: ui
tags: [react-hook-form, typescript, field-array, decorate-on-top, public-api]

# Dependency graph
requires:
  - phase: 02-05
    provides: Stable control identity via Object.assign in-place augmentation (D-11) — eliminates the unstable [fields, name, control] useEffect dep (D-07)
  - phase: 02-01
    provides: ForgeControl<T> typed surface established

provides:
  - Zero control._* access in useFieldArray — STAB-01 satisfied for this file
  - Decorate-on-top useFieldArray: RHF public hook owns mutations/ids/focus/validation; Forge layers per-item inputProps
  - D-07 unstable [fields, name, control] useEffect fully deleted
  - D-05 per-item inputProps keeper intact on returned fields array

affects: [02-07, 02-08, consumers using useFieldArray]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Decorate-on-top hook: call RHF public useFieldArray, useMemo-map fields to attach inputProps, return {...rhf, fields}"
    - "Post-mutation validation delegates to RHF built-in rules (7.34.0+) — no manual validateField path"

key-files:
  created: []
  modified:
    - src/useFieldArray/useFieldArray.tsx

key-decisions:
  - "D-06: Call useRHFFieldArray (public) for all mutation + fields + id; Forge decorates with inputProps only"
  - "D-07: Unstable [fields, name, control] useEffect deleted entirely — RHF public hook handles all internal sync, focus, cleanup"
  - "D-05 KEEPER: useMemo map preserves per-item inputProps on returned fields — the entire reason this hook was hand-rolled"
  - "Post-mutation validation: relies on RHF built-in rules (7.34.0+); no explicit trigger wrapper needed for current usage"
  - "useFormContext<TFieldValues>() with the function's type parameter avoids the Control<FieldValues> vs Control<TFieldValues> invariance error"

patterns-established:
  - "Decorate-on-top: const rhf = useRHFFieldArray({control, name, keyName, rules, shouldUnregister}); const fields = useMemo(() => rhf.fields.map(f => ({...f, inputProps})), [rhf.fields, inputProps]); return {...rhf, fields};"

requirements-completed: [STAB-01]

# Metrics
duration: 8min
completed: 2026-05-31
---

# Phase 02 Plan 06: useFieldArray Decorate-on-Top Rewrite Summary

**~290-line hand-rolled field-array hook with 36 control._* sites replaced by a 70-line decorate-on-top wrapper over RHF's public useFieldArray; per-item inputProps keeper intact**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-31T11:16:00Z
- **Completed:** 2026-05-31T11:24:52Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- All 36 `control._*` access sites deleted — `_getFieldArray`, `_names.array.add`, `_subjects.array`, `_setFieldArray`, `_formValues`, `_fields`, `_f.mount`, `_updateFieldArray`, `_state.action`, `_subjects.state.next`, manual `validateField`, `_subjects.values.next`, `_names.focus` / `iterateFieldsByAction` — all gone
- D-05 KEEPER preserved: `useMemo(() => rhf.fields.map(f => ({...f, inputProps})), [rhf.fields, inputProps])` layers per-item input attributes onto RHF's returned fields
- D-07 unstable effect deleted: the `useEffect(() => {...}, [fields, name, control])` misfire source is fully removed; RHF's public hook handles all internal sync, focus management, and unmount cleanup
- STAB-01 satisfied for `useFieldArray`: zero `control._*` access, zero `as any`, pure public RHF API delegation
- `npx tsc --noEmit` exits 0; `npm run build` clean (CJS + ESM + dts); `npm test` 3/3 GREEN

## Task Commits

1. **Task 1: Decorate-on-top rewrite of useFieldArray (D-05/06/07)** - `c83cd7f` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/useFieldArray/useFieldArray.tsx` — full rewrite: 266 lines removed, 37 lines net; calls `useRHFFieldArray` from react-hook-form, useMemo-maps fields with inputProps

## Decisions Made

- **Decorate-on-top pattern chosen**: `useRHFFieldArray` is called with `{control, name, keyName, rules, shouldUnregister}` — RHF owns mutation, id generation, focus, and rules-based validation. Forge layers `inputProps` in a `useMemo` map and returns `{...rhf, fields}`. This is the D-06 design verbatim.

- **Post-mutation validation strategy**: Relies on RHF's built-in `rules`-based validation (floor 7.34.0). The old manual `validateField` + `_subjects.state.next` path had no public API equivalent for on-every-mutation validation without rules. The plan's "prefer RHF rules" recommendation was applied — no explicit `methods.trigger(name)` wrapper added, since the use of `rules` prop on `useFieldArray` already provides automatic post-mutation validation.

- **TypeScript fix for useFormContext generic**: `useFormContext()` without a type parameter yields `Control<FieldValues>`, which is not assignable to `Control<TFieldValues>` (invariant due to subjects). Using `useFormContext<TFieldValues>()` resolves this — the context is parameterized to match the function's generic, and the default `control = methods.control` assignment type-checks cleanly.

## Deviations from Plan

None — plan executed exactly as written. The TypeScript generic issue with `useFormContext()` was a minor type error caught during `tsc --noEmit` and fixed inline (Rule 1 auto-fix: bug in first draft).

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type error: useFormContext() unparameterized yields Control<FieldValues> not Control<TFieldValues>**
- **Found during:** Task 1 (initial draft)
- **Issue:** `const methods = useFormContext()` yields `UseFormReturn<FieldValues>`, so `methods.control` is `Control<FieldValues, any, FieldValues>`. Assigning that as the default for the typed `control` parameter (which expects `Control<TFieldValues>`) causes a TS2322 error — the types are not assignable due to `_subjects.state` invariance.
- **Fix:** Changed to `useFormContext<TFieldValues>()` — the context is then typed to the hook's own type parameter, making the default assignment valid.
- **Files modified:** `src/useFieldArray/useFieldArray.tsx`
- **Verification:** `npx tsc --noEmit` exits 0 after the fix
- **Committed in:** `c83cd7f` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — type bug in initial draft)
**Impact on plan:** Necessary for TypeScript correctness. No scope creep.

## Issues Encountered
None beyond the type error documented above.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- `useFieldArray` is fully decorate-on-top with zero `control._*` — Plan 07 (useForgeValues thin wrapper) can proceed on a clean foundation
- `useSubscribe`, `validateField`, `updateFieldArrayRootError`, `appendAt`, `removeArrayAt`, `cloneObject` are no longer imported by `useFieldArray` — `useSubscribe` is now internal-only (usePersist was already migrated in 02-04)
- RHF peer floor for `rules` support is ^7.34.0 — Plan 08 package.json changes should lock this in

## Known Stubs
None — no placeholder data, hardcoded empty values, or TODO stubs introduced.

## Threat Flags
None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. The rewrite reduces private-API coupling (T-02.06-02 accepted) and re-homes validation to RHF's official rules path (T-02.06-01 mitigated).

## Self-Check: PASSED
- `src/useFieldArray/useFieldArray.tsx`: EXISTS
- `grep -c "control\._" src/useFieldArray/useFieldArray.tsx` → 0
- `grep -n "as any" src/useFieldArray/useFieldArray.tsx` → 0 matches
- `grep -n "inputProps" src/useFieldArray/useFieldArray.tsx` → lines 16, 33, 48, 56, 59 (keeper present)
- Task commit `c83cd7f`: EXISTS in git log
- `npx tsc --noEmit`: exits 0
- `npm run build`: exits 0 (CJS + ESM + dts produced)
- `npm test`: 3/3 GREEN

---
*Phase: 02-stability*
*Completed: 2026-05-31*
