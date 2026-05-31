---
phase: 02-stability
plan: 05
subsystem: ui
tags: [react-hook-form, typescript, lodash, control-augmentation, memo]

# Dependency graph
requires:
  - phase: 02-01
    provides: ForgerControllerProps.component typed as React.ElementType (enables const Component = component without as any)
  - phase: 02-02
    provides: deepEqual default-export in utils.ts, native predicates centralized

provides:
  - In-place control augmentation via Object.assign (D-11): stable single RHF control instance, prototype preserved
  - Forger.tsx lodash-free: deepEqual memo comparator, typed component prop (D-13/D-10)
  - Public return typed ForgeControl<TFieldValues, TFieldProps> with no as any (STAB-05)

affects: [02-06, 02-07, 02-08, useFieldArray, useForgeValues]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "In-place control augmentation: Object.assign(methods.control, forgeProps) + return same instance typed as ForgeControl<T>"
    - "Import deepEqual default-export from ../utils as drop-in isEqual replacement in memo comparators"
    - "Component prop typed as React.ElementType (no as any) when ForgerControllerProps.component is already correct"

key-files:
  created: []
  modified:
    - src/useForge/useForge.tsx
    - src/Forger/Forger.tsx

key-decisions:
  - "D-11: Object.assign in-place augmentation — same RHF control instance returned, fixes unstable control identity that misfired useFieldArray's [fields, name, control] useEffect (D-07)"
  - "Internal ...(props as any) input spread retained — classified as internal-input (passes remaining UseForgeProps options into useForm); STAB-05 public-return gate is the typed `control: ForgeControl<T>` in the return, NOT this input spread"
  - "RN displayName check narrowed from component as any to component as React.ComponentType<unknown> — more precise than as any, avoids the generic escape hatch"

patterns-established:
  - "In-place control augmentation: build forgeProps object, Object.assign onto methods.control, return { ...methods, control: methods.control as ForgeControl<T> }"
  - "Local deepEqual (utils.ts default export) as direct replacement for lodash isEqual in memo comparators"

requirements-completed: [STAB-05, STAB-03]

# Metrics
duration: 12min
completed: 2026-05-31
---

# Phase 02 Plan 05: useForge In-Place Control + Forger Lodash Swap Summary

**In-place Object.assign control augmentation (D-11) stabilises the RHF control identity; Forger.tsx swaps lodash isEqual for local deepEqual and drops `component as any` (D-13/D-10)**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-31T12:06:00Z
- **Completed:** 2026-05-31T12:18:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `useForge` now augments the RHF control instance in place (`Object.assign`) and returns that same object — stable identity across renders, prototype and non-enumerable internals intact; fixes the unstable-control useEffect misfire (D-07)
- Public return is `control: methods.control as ForgeControl<TFieldValues, TFieldProps>` — typed, no `as any` on the return path (STAB-05)
- `Forger.tsx` no longer imports lodash; memo comparator uses `deepEqual` from `../utils` (same semantics, cycle-safe, Date/Array/object aware)
- `const Component = component as any` removed; `const Component = component` valid now that `ForgerControllerProps.component` is `React.ElementType` (from 02-01)
- `npm test` 3/3 GREEN — submit + wizard harness unbroken by the control-identity change

## Task Commits

1. **Task 1: In-place control augmentation in useForge (D-11)** - `f47de2f` (feat)
2. **Task 2: Forger.tsx lodash isEqual -> deepEqual + typed component (D-13/D-10)** - `11ecdf8` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/useForge/useForge.tsx` — Object.assign in-place augmentation, ForgeControl<T> typed return, dead "use strict" removed
- `src/Forger/Forger.tsx` — lodash import replaced with deepEqual, Component typed without as any, displayName check narrowed

## Decisions Made

- **In-place augmentation pattern confirmed**: `Object.assign(methods.control, forgeProps)` + return `methods.control as ForgeControl<T>`. This is the only safe pattern — spreading `methods.control` degrades the RHF prototype (drops internal methods/subjects) and creates a new identity every render, which misfires the `useFieldArray` `[fields, name, control]` useEffect (D-07).

- **`...(props as any)` internal input spread retained** (line 30): This spread passes remaining `UseForgeProps` options (e.g. `reValidateMode`, `criteriaMode`) into `useForm`. It is an INTERNAL INPUT spread — not the public return surface. The STAB-05 gate is the typed `control: ForgeControl<TFieldValues, TFieldProps>` in the return statement. Retaining it avoids cascading type errors from mapping every possible `UseFormProps` option into `UseForgeProps`.

- **RN `displayName` check narrowed**: The `(component as any)?.displayName === 'TextInput'` check in the React Native branch was narrowed to `(component as React.ComponentType<unknown>)?.displayName`. This is more precise (React.ComponentType does expose `displayName?`) and keeps the as-any count at zero in Forger.tsx.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Narrowed RN displayName cast from `as any` to typed ComponentType**
- **Found during:** Task 2 (Forger.tsx lodash swap)
- **Issue:** Plan acceptance criteria required zero `component as any` matches; a second `as any` cast existed at line 50 for the RN `displayName` check (`(component as any)?.displayName`). This was not the `const Component = component as any` at line 31, but the grep criteria catches all patterns.
- **Fix:** Changed `(component as any)?.displayName` to `(component as React.ComponentType<unknown>)?.displayName` — `React.ComponentType` exposes `displayName?: string`, making this the correct type.
- **Files modified:** `src/Forger/Forger.tsx`
- **Verification:** `grep -n "component as any" src/Forger/Forger.tsx` returns 0; `npx tsc --noEmit` exits 0
- **Committed in:** `11ecdf8` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing type precision)
**Impact on plan:** Necessary to meet plan's acceptance criteria exactly. No scope creep — the fix is purely a type narrowing within the same file/task.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- `control` is now a single stable instance across renders — Plans 06 (useFieldArray decorate-on-top) and 07 (useForgeValues thin wrapper) can rely on stable `control` identity in their hook deps
- `Forger.tsx` lodash-free — STAB-03 lodash removal is progressing; remaining lodash import is in `useForgeValues.tsx` (owned by 02-07)
- All downstream consumers of `control.hasFields`, `control.fields`, `control.handleWizardSubmit` read from the same real RHF instance — no property-access regressions expected

## Self-Check: PASSED
- `src/useForge/useForge.tsx`: EXISTS, contains `Object.assign(methods.control`
- `src/Forger/Forger.tsx`: EXISTS, contains `deepEqual`, no lodash import
- Task 1 commit `f47de2f`: EXISTS in git log
- Task 2 commit `11ecdf8`: EXISTS in git log
- `npm test`: 3/3 GREEN
- `npx tsc --noEmit`: exits 0

---
*Phase: 02-stability*
*Completed: 2026-05-31*
