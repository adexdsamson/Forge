---
phase: 02-stability
plan: 04
subsystem: api
tags: [react-hook-form, useWatch, useFormState, autosave, subscription, public-api]

# Dependency graph
requires:
  - phase: 02-stability
    provides: "Research (PATTERNS.md, RESEARCH.md) confirming D-12 approach"
provides:
  - "usePersist rewritten onto public RHF hooks — zero _* access, lighter handler signature"
affects: [02-07, 02-08, phase-3-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useWatch + useFormState public subscription (replaces _subjects.state firehose)"
    - "handlerRef ref-stability idiom: const handlerRef = useRef(handler); handlerRef.current = handler"
    - "Reactive effect with [values, isDirty, isValid] deps for autosave/draft callbacks"

key-files:
  created: []
  modified:
    - src/usePersist/usePersist.tsx

key-decisions:
  - "D-12 applied: usePersist handler signature changed to (values, { isDirty, isValid }) — documented D-01 break from old { name, type, values } firehose shape"
  - "useWatch(control) returns fresh object each tick (Pitfall 5) — accepted as correct autosave semantics, documented in code comment"
  - "useSubscribe import removed from usePersist — no longer feeds RHF _subjects after this rewrite"

patterns-established:
  - "Pattern: public subscription via useWatch + scoped useFormState (RESEARCH Pattern 3)"

requirements-completed: [STAB-02]

# Metrics
duration: 4min
completed: 2026-05-31
---

# Phase 02 Plan 04: usePersist Public-API Rewrite Summary

**usePersist rewritten to zero _* access using useWatch + scoped useFormState, delivering lighter (values, {isDirty, isValid}) autosave handler signature**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-31T11:11:44Z
- **Completed:** 2026-05-31T11:14:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced `(control as any)._subjects.state` firehose subscription with `useWatch({ control })` (reactive values) and `useFormState({ control })` (scoped isDirty/isValid) — zero `_*` access, zero `as any`
- Changed `ForgePersist` handler type from the old `(payload, { name?, type?, values })` shape to the lighter `(values: TFieldValues, { isDirty: boolean, isValid: boolean })` (D-12 + D-01 documented break)
- Removed `useSubscribe` import entirely — usePersist no longer feeds RHF internals
- Preserved the `handlerRef` ref-stability idiom so consumers can pass inline handler functions without causing effect re-binding
- Added code comment documenting the Pitfall 5 firing contract (useWatch fresh-object-each-tick = intentional for autosave)

## Task Commits

1. **Task 1: Rewrite usePersist onto useWatch + useFormState (D-12)** - `24290f1` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/usePersist/usePersist.tsx` — Full rewrite: useSubscribe + _subjects removed; useWatch + useFormState added; ForgePersist handler type updated; handlerRef idiom preserved

## Decisions Made

- D-12 applied as specified: useWatch for values, scoped useFormState for isDirty/isValid flags. No alternatives evaluated — plan and PATTERNS.md were unambiguous.
- Handler type change is a D-01 documented break (pre-1.0, no published consumers). New lighter signature drops the rarely-needed `name`/`type` EventType metadata from the firehose.
- useWatch returns a fresh object reference per tick (RESEARCH Pitfall 5) — this is correct autosave behaviour (handler fires on any value change); documented in a code comment so future maintainers understand why the effect dep is not stable-ref-guarded.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `npx tsc --noEmit` exited 0 on first attempt. `npm test` (3/3 Forge.submit.test.tsx) passed without modification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- STAB-02 partial: usePersist path is now _*-free. useForgeValues (02-07) still accesses control._* — completes STAB-02 when done.
- 02-05 (useForge Object.assign control augmentation) can proceed independently — no dependency on this plan.
- This plan's zero-`_*` constraint is now a verified pattern for the remaining hooks.

---
*Phase: 02-stability*
*Completed: 2026-05-31*
