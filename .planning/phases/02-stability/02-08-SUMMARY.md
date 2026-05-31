---
phase: 02-stability
plan: 08
subsystem: infra
tags: [npm, package-json, lodash, devtools, react-hook-form, bundle, dependency-hygiene]

# Dependency graph
requires:
  - phase: 02-stability/02-02
    provides: lodash replaced in utils.ts, validateField.ts, logic/getDirtyFields.ts, logic/getFieldValueAs.ts, logic/hasPromiseValidation.ts
  - phase: 02-stability/02-03
    provides: @hookform/devtools guarded-require + external rollup config in Forge.tsx
  - phase: 02-stability/02-05
    provides: lodash isEqual replaced in Forger.tsx
  - phase: 02-stability/02-06
    provides: useFieldArray no longer imports lodash
  - phase: 02-stability/02-07
    provides: useForgeValues no longer imports lodash
provides:
  - "Cleaned package.json: lodash and @types/lodash removed from all dep sections"
  - "@hookform/devtools demoted from runtime dependencies to devDependencies + optional peerDependency"
  - "react-hook-form peer floor lowered from ^7.50.1 to ^7.34.0"
  - "Refreshed package-lock.json reflecting the manifest changes"
  - "All build/type/test gates green after manifest cleanup"
affects: [Phase 03 (docs), Phase 04 (packaging/publish), Phase 05 (changelog)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Optional-peer + devDependency: @hookform/devtools mirrors react-dropzone optional-peer pattern"
    - "Scriptable STAB-04 gate: npm pack + consumer install without devtools proves absence from consumer graph"

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "dependencies{} becomes empty (removed key) — lodash and @hookform/devtools both gone from runtime deps"
  - "@hookform/devtools added to both devDependencies (^4.3.1) and peerDependenciesMeta.optional mirroring react-dropzone"
  - "react-hook-form peer floor ^7.34.0 (useFieldArray rules option floor, RESEARCH confirmed)"
  - "Lodash remains in node_modules only as transitive dep via @hookform/devtools devDep — not a direct dep; consumer graph is clean"

patterns-established:
  - "Phase-final manifest gate: lodash/devtools removal is the last step; all source rewrites must land before touching package.json"
  - "STAB-04 scriptable gate: npm pack + fresh npm install without devtools + npm ls assert proves consumer safety (no longer manual-only)"

requirements-completed: [STAB-03, STAB-04, STAB-05]

# Metrics
duration: 10min
completed: 2026-05-31
---

# Phase 02, Plan 08: Dependency Manifest Cleanup Summary

**lodash and @hookform/devtools removed from runtime dependencies; devtools demoted to optional peer + devDep; react-hook-form peer floor widened to ^7.34.0; all build/type/test gates green**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-31T12:30:00Z
- **Completed:** 2026-05-31T12:40:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Cleaned package.json: removed lodash from dependencies, removed @types/lodash from devDependencies, demoted @hookform/devtools from runtime dependencies to devDependencies + optional peerDependenciesMeta entry (mirroring the existing react-dropzone pattern)
- Lowered react-hook-form peer floor from ^7.50.1 to ^7.34.0 (RESEARCH-justified: useFieldArray rules option is the 7.34.0 floor)
- Refreshed lockfile via npm install; confirmed tsc --noEmit exits 0, rollup -c produces all 3 dist artifacts (CJS + ESM + .d.ts), vitest 3/3 tests pass
- Verified no lodash module body or require/import survives in built bundles; @hookform/devtools external-only (not inlined)
- STAB-04 scriptable gate: npm pack + fresh consumer install without devtools proves @hookform/devtools absent from consumer graph (npm ls + directory check both pass)

## Task Commits

1. **Task 1: Edit package.json dependency manifest (D-08/D-13)** - `96e9ebc` (chore)
2. **Task 2: Refresh lockfile + rebuild; confirm clean runtime tree** - `d4ae141` (chore)

## Files Created/Modified

- `package.json` - Removed lodash from dependencies, removed @types/lodash from devDependencies, added @hookform/devtools to devDependencies and peerDependenciesMeta as optional, lowered react-hook-form peer floor to ^7.34.0
- `package-lock.json` - Refreshed after manifest changes; lodash no longer a direct dep, @hookform/devtools dev-only

## Decisions Made

- Kept `dependencies: {}` empty rather than removing the key — JSON conventionally retains the section even when empty; either is valid
- Lodash still appears as a transitive dependency via @hookform/devtools (devDep) — this is expected and does not violate STAB-03, which only requires lodash out of DIRECT runtime deps
- STAB-04 scriptable gate replaces the previously manual-only STAB-04 narrative verification

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - manifest changes, lockfile refresh, and all verification gates were clean on first attempt.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. This plan only modifies dependency declarations and refreshes the lockfile. The supply-chain exposure reduction (lodash + devtools removed from consumer runtime graph) addresses T-02.08-01 and T-02.08-02.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 02 (Stability) is now COMPLETE. All 8 plans executed:
- STAB-01/02: zero `_*` access in useFieldArray, usePersist, useForgeValues
- STAB-03: lodash removed from all runtime sources and dependency manifest
- STAB-04: @hookform/devtools dev-only and absent from consumer production graph
- STAB-05: RHF peer floor widened to ^7.34.0; tsc clean; bundles clean

Remaining manual gate (STAB-04 behavior): with `debug={true}` and @hookform/devtools not installed, Forge should throw the Forge-named error (from Plan 03 lazy-load). This behavior gate requires a local test with devtools uninstalled and cannot be scripted in the current test harness.

---
*Phase: 02-stability*
*Completed: 2026-05-31*
