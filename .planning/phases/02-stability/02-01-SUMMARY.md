---
phase: 02-stability
plan: 01
subsystem: types
tags: [typescript, react, react-hook-form, type-hardening]

# Dependency graph
requires: []
provides:
  - "src/types.ts: as-any-free public type surface with React.ElementType component types and import type react-dropzone"
affects: [02-02, 02-05, 02-07, 02-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "import type for optional peer deps erased at runtime (react-dropzone)"
    - "React.ElementType over Component<T> for open-contract cross-platform component props"
    - "React.ReactElement over JSX.Element (no global JSX namespace under react-jsx transform)"
    - "Record<string, unknown> over Record<string, any> for passthrough index signatures"

key-files:
  created: []
  modified:
    - src/types.ts

key-decisions:
  - "React.ElementType chosen for ForgerProps.component / ForgerControllerProps.component (not a ForgerSlotProps-constrained generic — avoids false-positive errors on valid cross-platform inputs per RISK-04)"
  - "Record<string, unknown> applied to ForgerProps and ForgerControllerProps index signatures without cascading errors"
  - "Component import removed from react (only used at the two now-retyped sites)"
  - "ForgeControl<T> augmentation shape kept exactly as-is (success criterion #5 lock)"

patterns-established:
  - "import type pattern: first use in repo for runtime-optional peer deps"

requirements-completed: [STAB-05]

# Metrics
duration: 5min
completed: 2026-05-31
---

# Phase 2 Plan 01: Type Surface Hardening Summary

**Public type surface in types.ts swept to React.ElementType + import type react-dropzone + Record<string,unknown>, zero as-any, tsc clean**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-31T10:42:00Z
- **Completed:** 2026-05-31T10:47:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Changed `import { Accept }` to `import type { Accept }` — react-dropzone is now erased at runtime, fixing module-not-found for consumers who haven't installed the optional peer
- Replaced `component: any` with `component: React.ElementType` on ForgerProps, ForgerControllerProps, and TForgerProps
- Replaced `label?: string | JSX.Element` with `label?: string | React.ReactElement` (no global JSX namespace dependency under react-jsx transform)
- Replaced `& Record<string, any>` with `& Record<string, unknown>` on both ForgerProps and ForgerControllerProps index signatures
- Removed now-unused `Component` import from react
- Preserved the ForgeControl<T> augmentation shape exactly (hasFields, fields, isWizard, currentStep, totalSteps, isFirstStep, isLastStep, handleNext, handlePrevious, handleWizardSubmit)
- `tsc --noEmit` passes cleanly

## Task Commits

1. **Task 1: Sweep types.ts public type surface (D-10)** - `52b666b` (feat)

**Plan metadata:** (to be added by final commit)

## Files Created/Modified
- `src/types.ts` - Public type surface hardened: import type react-dropzone, React.ElementType component props, React.ReactElement label, Record<string,unknown> index sigs

## Decisions Made
- Used `React.ElementType` (not `React.ComponentType<any>`) for component props — equivalent in this context, more idiomatic for accepting both string element types and component constructors
- Both `Record<string, any>` sites on ForgerProps and ForgerControllerProps changed to `Record<string, unknown>` without cascading errors — no fallback to `any` needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 01 complete — types.ts is the foundation for Plan 05 (useForge ForgeControl cast + Forger component typing)
- `tsc --noEmit` is now the primary quality gate; it passes cleanly
- Forger.tsx still has `const Component = component as any` at line ~31 — this can be dropped to `const Component = component` once Plan 05 applies ForgerControllerProps typing to Forger.tsx
- No blockers for Plans 02–08

## Known Stubs

None — this plan is types-only, no data flow introduced.

## Threat Flags

None — type-only sweep introduces no new runtime surface.

## Self-Check: PASSED

- `src/types.ts` exists and contains all expected changes
- Commit `52b666b` verified in git log
- `tsc --noEmit` exits 0
- `grep "as any" src/types.ts` returns 0 matches
- `grep "component: any" src/types.ts` returns 0 matches
- `grep "JSX.Element" src/types.ts` returns 0 matches
- `grep "import type { Accept }" src/types.ts` returns 1 match
- ForgeControl augmentation shape intact (all 9 wizard/forge fields present)

---
*Phase: 02-stability*
*Completed: 2026-05-31*
