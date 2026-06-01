---
phase: 06-publish
plan: 01
subsystem: infra
tags: [npm, smoke-test, registry, publish, typescript]

# Dependency graph
requires:
  - phase: 05-docs-ci
    provides: tarball build, package metadata
provides:
  - smoke scaffold wired to live registry with 6-export type-check probe
affects: [06-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Smoke scaffold uses registry version specifier (not file: tarball) so post-publish SC1 proves real fresh install"
    - "TS2307 (module not found) is the expected pre-publish state; TS1295 is a false-alarm neutralized via verbatimModuleSyntax: false"

key-files:
  created: []
  modified:
    - c:\Temp\forge-smoke-test\smoke.ts
    - c:\Temp\forge-smoke-test\package.json

key-decisions:
  - "smoke package.json pinned to '1.0.0' (exact target version per D-01) instead of '*' or 'latest' — proves SC1 against the exact release"
  - "npm install expected 404 is treated as SUCCESS (registry wiring confirmed); tarball file: reference removed permanently"
  - "npm install + npx tsc --noEmit deferred to plan 06-04 after publish; running them now would error (package not yet on registry)"

patterns-established:
  - "Smoke scaffold principle: wiring to registry before publish so Wave-3 verification is install+tsc, not debugging"

requirements-completed: [PUB-01]

# Metrics
duration: 5min
completed: 2026-06-01
---

# Phase 06 Plan 01: Smoke Scaffold Prep Summary

**Smoke scaffold updated to import all 6 Forge exports and wired to npmjs.org registry at version 1.0.0 — confirmed with expected 404 proving live-registry path active**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-01T00:25:00Z
- **Completed:** 2026-06-01T00:30:00Z
- **Tasks:** 2
- **Files modified:** 2 (outside git repo)

## Accomplishments
- Updated `smoke.ts` from 3 exports to all 6: `useForge, Forge, Forger, useFieldArray, useForgeValues, usePersist`
- Replaced `file:` tarball reference in `package.json` with registry version specifier `"1.0.0"`
- Confirmed scaffold correctly wired to `registry.npmjs.org` — `npm install` returned 404 for `@adexdsamson/forge@1.0.0` (expected; package not yet published)

## Task Commits

Tasks modified files outside the Forge git repo (`c:\Temp\forge-smoke-test\`). No per-task commits made to the Forge repo for task work (non-tracked files, per critical_environment_notes). SUMMARY and state metadata committed below.

**Plan metadata:** (see final commit hash)

## Files Created/Modified
- `c:\Temp\forge-smoke-test\smoke.ts` - Updated to import all 6 named exports; 2-line type-check probe
- `c:\Temp\forge-smoke-test\package.json` - `@adexdsamson/forge` dependency changed from `file:` tarball to `"1.0.0"` registry specifier

## Decisions Made
- Pinned version to `"1.0.0"` (exact target) rather than `"*"` or `"latest"` — ensures SC1 verifies the precise release version
- 404 from `npm install` treated as expected success proof, not a failure — confirms live registry path is active
- Full `npm install` + `npx tsc --noEmit` deferred to plan 06-04 (post-publish); running now against an unpublished package would be meaningless

## Deviations from Plan

None - plan executed exactly as written.

The plan explicitly states the 404 is expected and correct. No deviations or auto-fixes required.

## Issues Encountered
- None. The 404 from `https://registry.npmjs.org/@adexdsamson%2fforge` is the designed confirmation of correct scaffold wiring.

## Deferred Items
- `npm install` actual success + `npx tsc --noEmit` passing: deferred to plan 06-04 (post-publish smoke gate)
- TS2307 (cannot find module `@adexdsamson/forge`) is the expected current state; will resolve after publish

## Threat Surface
- No new threat surface introduced. Smoke dir is a throwaway local scaffold, not a published artifact.
- npm integrity verification (HTTPS + lockfile SHA) handles T-06-01-02.

## Next Phase Readiness
- Smoke scaffold is ready for Wave-3 (plan 06-04) post-publish verification
- When CI publishes `@adexdsamson/forge@1.0.0`, plan 06-04 can immediately run `npm install` + `npx tsc --noEmit` to prove SC1 and SC2
- No blockers

---
*Phase: 06-publish*
*Completed: 2026-06-01*
