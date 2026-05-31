---
phase: 02-stability
plan: 02
subsystem: bundle
tags: [lodash, tree-shaking, native-predicates, typescript, utils]

# Dependency graph
requires:
  - phase: 02-stability/02-01
    provides: type surface hardening (ForgeControl, React.ElementType, import type)
provides:
  - Native isUndefined/isString/isNumber/isObject/isBoolean predicates centralized in utils.ts
  - Zero lodash imports in utils.ts, validateField.ts, getDirtyFields.ts, getFieldValueAs.ts, hasPromiseValidation.ts
  - Exported isObject (lodash semantics), isBoolean, isString, isUndefined from utils.ts
affects:
  - 02-05 (Forger.tsx isEqual->deepEqual — last lodash file in this batch)
  - 02-07 (useForgeValues.tsx lodash removal)
  - 02-08 (phase-wide lodash gate: drop from package.json once ALL files are clean)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Native predicate centralization: lodash utilities replaced with typeof/=== checks in utils.ts, exported for downstream"
    - "Lodash-semantics isObject: v !== null && (typeof v === 'object' || typeof v === 'function') — critical for deepEqual/getDirtyFields"

key-files:
  created: []
  modified:
    - src/utils.ts
    - src/validateField.ts
    - src/logic/getDirtyFields.ts
    - src/logic/getFieldValueAs.ts
    - src/logic/hasPromiseValidation.ts

key-decisions:
  - "isObject exported with lodash semantics (fn->true, null->false) to preserve getDirtyFields/deepEqual/hasPromiseValidation behavior — bare typeof === 'object' is wrong"
  - "isBoolean exported from utils.ts (was local-only) for validateField.ts to import"
  - "isNumber stays non-exported (no external importer in owned files)"
  - "validateField.ts import path is ./utils (same directory src/), not ../utils"

patterns-established:
  - "Shared predicate pattern: all native type-check predicates live in utils.ts and are exported for internal consumers — no duplication across logic/ files"

requirements-completed: [STAB-03]

# Metrics
duration: 10min
completed: 2026-05-31
---

# Phase 02, Plan 02: Lodash Removal (Owned Files) Summary

**Lodash predicates replaced with native typeof checks across five files, with isObject/isBoolean/isString/isUndefined centralized and exported from utils.ts**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-31T00:00:00Z
- **Completed:** 2026-05-31T00:10:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Removed lodash import from `src/utils.ts` and added native replacements: `isUndefined`, `isString`, `isNumber`, `isObject` (with lodash semantics), `isBoolean` (promoted from local to exported)
- Rewired `src/validateField.ts` and `src/logic/getDirtyFields.ts` to import predicates from `./utils`/`../utils` — zero lodash, call sites byte-for-byte identical
- Rewired `src/logic/getFieldValueAs.ts` and `src/logic/hasPromiseValidation.ts` to import from `../utils` — zero lodash, behavior preserved including lodash-semantics `isObject` for validate-map detection

## Task Commits

Each task was committed atomically:

1. **Task 1: Centralize native predicates in utils.ts** - `58d5f19` (refactor)
2. **Task 2: Rewire validateField.ts and getDirtyFields.ts** - `e06cae0` (refactor)
3. **Task 3: Rewire getFieldValueAs.ts and hasPromiseValidation.ts** - `bb32993` (refactor)

## Files Created/Modified

- `src/utils.ts` - Removed lodash import; added native isUndefined/isString/isNumber; exported isObject (lodash semantics), isBoolean, isString, isUndefined; isFunction/deepEqual unchanged
- `src/validateField.ts` - Replaced `from "lodash"` with `from "./utils"` for all 5 predicates; call sites unchanged
- `src/logic/getDirtyFields.ts` - Removed lodash import; extended existing `../utils` import to include isObject and isUndefined
- `src/logic/getFieldValueAs.ts` - Replaced `from "lodash"` with `from "../utils"` for isString/isUndefined
- `src/logic/hasPromiseValidation.ts` - Replaced `from 'lodash'` with `from '../utils'` for isFunction/isObject

## Decisions Made

- `isObject` centralized in utils.ts with exact lodash semantics (`v !== null && (typeof v === "object" || typeof v === "function")`). A bare `typeof v === "object"` would be wrong — it returns true for null and false for functions, breaking `getDirtyFields`, `deepEqual`, and `hasPromiseValidation`.
- `isBoolean` promoted from local-only to exported so `validateField.ts` can import it without re-declaring.
- `isNumber` remains non-exported (no external consumer in the owned 5 files).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. All three tasks completed on first attempt; `tsc --noEmit` passed cleanly after each task.

## User Setup Required

None — no external service configuration required.

## Known Stubs

None — this plan contains no UI rendering or data-wiring; pure import rewiring with no stub risk.

## Threat Flags

No new security-relevant surface introduced. This plan only rewires internal type-predicate imports; no new network endpoints, auth paths, or schema changes.

## Self-Check

- [x] `src/utils.ts` exists and exports `isObject`, `isBoolean`, `isString`, `isUndefined`
- [x] `src/validateField.ts` has zero lodash imports
- [x] `src/logic/getDirtyFields.ts` has zero lodash imports
- [x] `src/logic/getFieldValueAs.ts` has zero lodash imports
- [x] `src/logic/hasPromiseValidation.ts` has zero lodash imports
- [x] All 3 task commits exist: 58d5f19, e06cae0, bb32993
- [x] `tsc --noEmit` passes (verified after each task)

## Self-Check: PASSED

## Next Phase Readiness

- Plans 05 (Forger.tsx isEqual->deepEqual) and 07 (useForgeValues.tsx lodash removal) can proceed; the centralized `isObject`/`isBoolean`/`isString`/`isUndefined` exports are available
- Plan 08 (phase-wide lodash gate: drop from package.json) unblocked for the 5 owned files; requires Plans 05 and 07 to clean the remaining 2 lodash files first

---
*Phase: 02-stability*
*Completed: 2026-05-31*
