---
phase: 02-stability
plan: 03
subsystem: testing
tags: [vitest, jsdom, testing-library, devtools, rollup, typescript, child-walker, wizard, submit]

# Dependency graph
requires:
  - phase: 02-stability/02-02
    provides: lodash removed — native type guards in place; Forge.tsx importable without lodash
provides:
  - "@hookform/devtools moved to dev-only guarded require (STAB-04)"
  - "processChildrenRecursively retyped as-any-free (STAB-05)"
  - "Vitest+jsdom+testing-library harness installed (project's first regression tests)"
  - "RISK-04 gate satisfied by 3/3 automated submit-behavior tests"
affects: [02-08, 02-stability/packaging, any plan touching Forge.tsx child-walker]

# Tech tracking
tech-stack:
  added: [vitest, jsdom, "@testing-library/react", "@testing-library/user-event", "@testing-library/jest-dom"]
  patterns:
    - "Dev-only optional-peer: synchronous guarded require behind if (debug) block — never pulled into production bundle"
    - "AnyElement = React.ReactElement<Record<string,unknown>> pattern for typed child-walker without as-any"
    - "Regression tests co-located with source (src/Forge/Forge.submit.test.tsx)"

key-files:
  created:
    - src/Forge/Forge.submit.test.tsx
    - vitest.config.ts
    - vitest.setup.ts
  modified:
    - src/Forge/Forge.tsx
    - rollup.config.mjs
    - package.json

key-decisions:
  - "loadDevTool() uses synchronous require in try/catch — dynamic import() rejected because async cannot throw during render (D-09)"
  - "@hookform/devtools added explicitly to rollup external so it survives Plan 08's removal from dependencies"
  - "type AnyElement = React.ReactElement<Record<string,unknown>> eliminates as-any in child-walker with zero runtime change"
  - "RISK-04 manual gate replaced with automated submit-behavior harness (3 tests) — faster and repeatable"

patterns-established:
  - "Pattern 1: loadDevTool() — synchronous guarded require for optional-peer dev-only dependencies"
  - "Pattern 2: AnyElement local type alias — type-only child-walker narrowing"
  - "Pattern 3: Vitest+jsdom+Testing Library for Forge component tests"

requirements-completed: [STAB-04, STAB-05]

# Metrics
duration: ~35min
completed: 2026-05-31
---

# Phase 02 Plan 03: Devtools Dev-Gate + Child-Walker Retype Summary

**@hookform/devtools moved to dev-only lazy require, child-walker retyped as-any-free via AnyElement, and RISK-04 submit-behavior gate satisfied by a 3/3-green Vitest+jsdom harness (project's first regression tests)**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-05-31T12:00:00Z
- **Completed:** 2026-05-31T12:06:46Z
- **Tasks:** 3 (2 implementation + 1 harness/gate)
- **Files modified:** 6

## Accomplishments

- Removed top-level `import { DevTool } from "@hookform/devtools"` from Forge.tsx; replaced with `loadDevTool()` synchronous guarded require that only runs inside `if (debug)` — devtools is now absent from every production consumer's bundle (STAB-04, D-08/D-09)
- Retyped `processChildrenRecursively` with `type AnyElement = React.ReactElement<Record<string,unknown>>` eliminating all `as any` casts from the child-walker while keeping every branch and prop-merge byte-for-byte identical (STAB-05, D-10, RISK-04)
- Added `@hookform/devtools` to rollup external list explicitly so the guarded require survives both CJS and ESM bundling after Plan 08 removes it from dependencies
- Installed Vitest+jsdom+testing-library harness as devDependencies and wrote 3 submit-behavior tests that automatically satisfy the RISK-04 gate — native submit, Enter-to-submit, and wizard last-step submit all GREEN

## Task Commits

1. **Task 1: Dev-gate + lazy-load @hookform/devtools** - `893344d` (feat)
2. **Task 2: Retype processChildrenRecursively as-any-free** - `e8eb4c2` (refactor)
3. **Task 3: Vitest submit-behavior harness (RISK-04 gate)** - `b8e95f9` (test)

## Files Created/Modified

- `src/Forge/Forge.tsx` — removed top-level DevTool import; added `loadDevTool()` synchronous guarded require; `AnyElement` local type; `el = child as AnyElement`; `childProps` typed as `Record<string,unknown>`; all child-walker `as any` casts removed
- `rollup.config.mjs` — `@hookform/devtools` added to the external array
- `src/Forge/Forge.submit.test.tsx` — 3 RISK-04 submit-behavior tests (native submit, Enter, wizard last-step)
- `vitest.config.ts` — Vitest config: jsdom environment, globals, setup file
- `vitest.setup.ts` — imports @testing-library/jest-dom matchers
- `package.json` — test/test:watch scripts; vitest+testing-library as devDeps

## Decisions Made

- **Synchronous guarded require for devtools:** `dynamic import()` was rejected because it cannot throw synchronously during render — a missing-package error must propagate through React's render pipeline to be visible; the synchronous `require()` in try/catch satisfies that requirement (D-09).
- **rollup external explicit entry:** The bundler currently picks up `@hookform/devtools` as external via the dependencies scan. Once Plan 08 removes it from dependencies, that scan would miss it. Explicit entry in the external array makes the build robust to that future change.
- **AnyElement instead of any:** `React.ReactElement<Record<string,unknown>>` gives TypeScript enough information to type childProps correctly without widening to `any`, while keeping `el.type` as `string | JSXElementConstructor<unknown>` so `createElement`/`cloneElement` calls remain typed.
- **RISK-04 manual gate → automated:** The plan's three RISK-04 manual submit checks (native submit, Enter-to-submit, wizard last-step submit) were converted to a Vitest test suite against the real Forge API. This is faster, repeatable, and seeds the project's regression suite.

## Deviations from Plan

### Auto-added (continuation scope)

**1. [Rule 2 - Missing Critical] Automated RISK-04 submit-behavior harness**

- **Found during:** Checkpoint — user directed "build an automated test harness" instead of click-through manual verification
- **Issue:** Plan specified three mandatory RISK-04 manual verifications (native submit, Enter-to-submit, wizard last-step) with no automated alternative. Manual-only gates are not repeatable and cannot prevent future regressions.
- **Fix:** Installed Vitest+jsdom+testing-library as devDependencies; created `src/Forge/Forge.submit.test.tsx` with 3 tests against the real Forge API; all 3 GREEN.
- **Files modified:** src/Forge/Forge.submit.test.tsx, vitest.config.ts, vitest.setup.ts, package.json
- **Verification:** `npm test` — 3/3 PASSED; `npm run typecheck` — exits 0
- **Committed in:** b8e95f9

---

**Total deviations:** 1 (harness addition directed at human-verify checkpoint — satisfies the gate with a stronger automated guarantee)
**Impact on plan:** Strictly additive; plan's submit requirements are now verified by code, not memory.

## Issues Encountered

None — both implementation tasks committed cleanly before the continuation agent was spawned. The typecheck (`tsc --noEmit`) exited 0 after harness addition because vitest types are scoped to the test file via `/// <reference types="vitest/globals" />`.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. The loadDevTool() guard is intentionally isolated to the debug path. No new threat flags.

## Self-Check

- [x] `src/Forge/Forge.submit.test.tsx` exists: confirmed
- [x] `vitest.config.ts` exists: confirmed
- [x] `vitest.setup.ts` exists: confirmed
- [x] Implementation commit 893344d exists: confirmed
- [x] Implementation commit e8eb4c2 exists: confirmed
- [x] Harness commit b8e95f9 exists: confirmed
- [x] `npm test` — 3/3 GREEN
- [x] `npm run typecheck` — exits 0

## Self-Check: PASSED

## Next Phase Readiness

- STAB-04 and STAB-05 complete; devtools is dev-only and child-walker is type-safe
- Plan 08 (devtools demotion from dependencies to optional peer) can now proceed — the rollup external entry is already in place
- The Vitest harness is live infrastructure; future plans can add tests without setup overhead
- Blocker for Plan 03 resolved: no remaining manual gates

---
*Phase: 02-stability*
*Completed: 2026-05-31*
