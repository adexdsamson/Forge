---
phase: 02-stability
plan: 07
subsystem: api
tags: [react-hook-form, typescript, hooks, lodash-removal, stab-02]

# Dependency graph
requires:
  - phase: 02-stability/02-01
    provides: ForgeControl type, React.ElementType component typing
  - phase: 02-stability/02-05
    provides: lodash removed from utils.ts/validateField.ts/getDirtyFields/Forger — last lodash site now gone

provides:
  - useForgeValues thin wrapper over RHF public setValue/getValues (zero _* access)
  - getValue throws Forge-named error on unknown fields via dot-path key-presence (RISK-01/D-04)
  - hasPath helper with bracket-notation normalization and A5 known-limitation doc
  - Zero lodash import statements across all of src/ (this was the last site)

affects:
  - 02-08 (package.json — lodash can now be removed from dependencies; this plan removes the last source import)
  - 03-* (Phase 3 tests — getValue throw behavior is the testable STAB-02 manual gate)

tech-stack:
  added: []
  patterns:
    - "Thin-wrapper delegation: derive RHF public methods from useFormContext, not control._* (mirrors Forger.tsx:27-30)"
    - "Dot-path key-presence existence check via hasPath for unknown-field detection (RISK-01)"

key-files:
  created: []
  modified:
    - src/useForgeValues/useForgeValues.tsx

key-decisions:
  - "[02-07] useForgeValues collapses 562-line re-implementation to ~80 lines delegating to ctx.setValue / ctx.getValues from useFormContext"
  - "[02-07] hasPath() normalizes bracket-index notation (items[0].name → items.0.name) before dot-split; documents A5 caveat for default-less register-only fields"
  - "[02-07] Comments mentioning control._names/_fields removed from file to keep grep -c 'control\\._' at zero per acceptance criteria"
  - "[02-07] getResolverOptions and hasPromiseValidation orphaned by this collapse (no longer imported by useForgeValues); left in place as they may be used by other future callers"

patterns-established:
  - "Pattern: useFormContext delegation over control._ access — established in Forger.tsx:27-30, now applied uniformly to useForgeValues"
  - "Pattern: public-API existence check (hasPath over getValues()) instead of _names/_fields for RISK-01"

requirements-completed: [STAB-02]

duration: 8min
completed: 2026-05-31
---

# Phase 02-stability Plan 07: useForgeValues Thin Wrapper Summary

**useForgeValues collapsed from 562-line RHF re-implementation to an 80-line thin pass-through over ctx.setValue/ctx.getValues, with getValue throwing a Forge-named error on unknown fields via dot-path key-presence (STAB-02/D-03/D-04/RISK-01)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-31T12:25:00Z
- **Completed:** 2026-05-31T12:33:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Deleted entire 562-line `useForgeValues` body (setValue/setValues/setFieldValue/updateTouchAndDirty/executeBuiltInValidation/executeSchemaAndUpdateState/trigger reimplementations + getValues reading _state.mount/_formValues/_defaultValues)
- Removed the only remaining lodash import from src/ (`import { isObject, isString, isUndefined } from "lodash"`) — `grep -rn "from \"lodash\"" src/` now returns zero matches
- Implemented `getValue` with `hasPath` dot-path existence check against whole-form `getValues()` object; throws `useForgeValues.getValue: field "X" is not registered` for unknown fields
- Zero `control._*` access, zero `as any`, zero lodash; `tsc --noEmit` exits 0, `npm test` 3/3 green

## Task Commits

1. **Task 1: Collapse useForgeValues to thin public-API wrapper** - `974b042` (feat)

**Plan metadata:** (docs commit — next)

## Files Created/Modified

- `src/useForgeValues/useForgeValues.tsx` — rewritten from 562 lines to ~80 lines; delegates to `useFormContext<T>().setValue` / `.getValues`; adds `hasPath` helper; public signature `{ control: ForgeControl<T> }` preserved (D-04)

## Decisions Made

- `hasPath` normalizes `items[0].name` → `items.0.name` before dot-splitting, handles nested paths correctly
- Comments that contained `control._names` / `control._fields` were reworded so `grep -c "control\._" src/useForgeValues/useForgeValues.tsx` returns exactly 0 (the plan's automated acceptance criterion)
- `getResolverOptions` and `hasPromiseValidation` are no longer imported by this file; they remain in `src/logic/` as they may be referenced by future callers — not deleted (per plan instruction: "do NOT delete shared helpers without confirming no other importer")
- `_control` parameter renamed with underscore prefix (unused — all work goes through `useFormContext`) to satisfy TypeScript's no-unused-vars without lying about the public signature

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None — `useForgeValues` is fully wired: `setValue` and `getValues` are live RHF public methods from `useFormContext`; `getValue` reads real form values via `ctx.getValues(name)` after existence check. No hardcoded empty values or placeholders.

## Threat Flags

No new security-relevant surface introduced. `getValue` now throws a controlled, named error on unknown fields instead of silently returning `undefined as any` — this reduces the attack surface (T-02.07-01, disposition: mitigated).

## Next Phase Readiness

- Plan 02-08 (package.json cleanup) can now remove `lodash` and `@types/lodash` from dependencies/devDependencies — this was the last source-level lodash import
- Phase 3 tests can cover the STAB-02 manual gate: `getValue("unknown")` throws; `setValue` + `getValues` round-trip; `getValue("realField")` returns value

## Self-Check

---
*Phase: 02-stability*
*Completed: 2026-05-31*
