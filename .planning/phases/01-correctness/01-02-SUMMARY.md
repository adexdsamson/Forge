---
phase: 01-correctness
plan: "02"
subsystem: error-handling, utils
tags: [correctness, error-messages, deduplication, forger, slot]
dependency_graph:
  requires: []
  provides: [CORR-02, CORR-03-dedupe]
  affects: [src/Forger/Forger.tsx, src/utils.ts, src/useFieldArray/useFieldArray.tsx, src/useForgeValues/useForgeValues.tsx]
tech_stack:
  added: []
  patterns: [fail-fast-guard, named-errors, canonical-source-of-truth]
key_files:
  modified:
    - src/utils.ts
    - src/Forger/Forger.tsx
    - src/useFieldArray/useFieldArray.tsx
    - src/useForgeValues/useForgeValues.tsx
decisions:
  - "Slot named-error messages are defensive/forward-looking — Slot is internal (not exported from src/index.ts); fix improves DX without public-API change"
  - "Forger guard fires before Slot so developer sees Forger + field name, not generic Slot message"
  - "canonical updateFieldArrayRootError is src/logic/ (uses convertToArrayPayload); utils.ts duplicate (used compact) removed; no compact shim added per D-09"
  - "compact→convertToArrayPayload semantic change acknowledged: undefined→[undefined] instead of []; both call sites tolerate non-compacted payload"
metrics:
  duration: "~3 minutes"
  completed: "2026-05-31"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
---

# Phase 1 Plan 02: Layered Fail-Fast Child Errors + updateFieldArrayRootError Dedupe Summary

Component-named fail-fast errors layered across Forger (names component + field) and Slot (names Slot), plus single-source-of-truth deduplication of updateFieldArrayRootError (canonical `src/logic/` copy kept, utils.ts duplicate removed, both importers repointed).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Layered fail-fast child errors — Slot + Forger | 3383fea | src/utils.ts, src/Forger/Forger.tsx |
| 2 | Dedupe updateFieldArrayRootError — keep logic/ canonical | f590979 | src/utils.ts, src/useFieldArray/useFieldArray.tsx, src/useForgeValues/useForgeValues.tsx |

## What Was Built

### Task 1: Layered Fail-Fast Child Errors (CORR-02)

**src/utils.ts — Slot:**
- Replaced generic `"Only one child allowed"` throw with `"Slot: only one child is allowed"` (names the component)
- Replaced silent `return null` for non-null, non-element children (e.g. string/number/false) with `throw new Error("Slot: child must be a single valid React element")`
- Empty Slot (`children == null`) still returns null silently — intentional, empty Slot is legitimate
- Slot is internal (NOT re-exported from `src/index.ts`) — named messages are defensive/forward-looking

**src/Forger/Forger.tsx — Forger:**
- Added fail-fast guard BEFORE `<Slot>` delegation that throws `Forger: field "${props.name}" expects exactly one valid React element as its child` for:
  - Multiple children passed (React.Children.count > 1)
  - Non-element, non-null child provided
- Developer sees Forger + field name in the error, not the generic Slot message
- `Forger.displayName = "Forger"` added for cleaner stack traces
- Added `import React from "react"` for `React.Children` and `React.isValidElement` usage
- MemorizeController comparator (:81-111) left completely untouched

### Task 2: Dedupe updateFieldArrayRootError (CORR-03 dedupe half)

**src/utils.ts:**
- Removed duplicate `export const updateFieldArrayRootError` (lines 312-321) — this copy used `compact(get(errors, name))` which strips falsy values (`undefined → []`)
- `compact` remains defined and used elsewhere in utils.ts (lines 67, 110, 238) — only the duplicate function was removed

**src/useFieldArray/useFieldArray.tsx:**
- Removed `updateFieldArrayRootError` from the `../utils` named-import block
- Added `import updateFieldArrayRootError from "../logic/updateFieldArrayRootError"` (default import)
- Removed stray dead comment `// ids.current = fieldValues.map(generateId);` at prior line 92

**src/useForgeValues/useForgeValues.tsx:**
- Removed `updateFieldArrayRootError` from the `../utils` named-import block
- Added `import updateFieldArrayRootError from "../logic/updateFieldArrayRootError"` (default import)

**src/logic/updateFieldArrayRootError.ts (canonical — untouched):**
- Default export using `convertToArrayPayload(get(errors, name))`: wraps undefined → `[undefined]`, does NOT strip falsy values

## Semantic Change Acknowledgment (CORR-03)

The dedupe changes the payload semantics at both call sites:

| Aspect | utils.ts copy (removed) | logic/ canonical (kept) |
|--------|------------------------|------------------------|
| Implementation | `compact(get(errors, name))` | `convertToArrayPayload(get(errors, name))` |
| `undefined` input | `compact(undefined) → []` | `convertToArrayPayload(undefined) → [undefined]` |
| Falsy stripping | Yes — strips falsy values | No — preserves all values |

**Call-site tolerance verification:**

- **useFieldArray :248-254**: the returned errors object is passed directly as `{ errors: ... }` to `control._subjects.state.next(...)`. The merge of the root error onto the array happens inside `updateFieldArrayRootError` itself (via `set(fieldArrayErrors, "root", error[name])`). The caller does not iterate the payload assuming falsy values were stripped — it just forwards the merged errors object to RHF state. Tolerate: YES.

- **useForgeValues :306-310**: same pattern — `updateFieldArrayRootError(control._formState.errors, fieldError, _f.name)` is called and the return value is used to set `control._formState.errors`. The caller does not iterate the array entries. Tolerate: YES.

Neither call site strips or iterates the array payload after `updateFieldArrayRootError` returns. The change from `compact` to `convertToArrayPayload` does not cause crashes or incorrect behavior at these sites. No `compact` shim was added around the canonical copy (D-09 locked).

## Deviations from Plan

None - plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. The only surface change is error message content in thrown `Error` objects — these name only static component names ("Forger", "Slot") and the developer-supplied field `name` identifier, never field values or user-entered data (T-01-04 mitigation satisfied).

## Verification Results

- `npx tsc --noEmit`: PASS (0 errors)
- `npx rollup -c`: PASS (CJS + ESM + dts built cleanly; pre-existing "use client" warnings are out of scope)
- `grep -rn "Only one child allowed" src/`: 0 matches
- `grep -n "Slot" src/index.ts`: 0 matches (Slot is internal, not public API)
- `grep -n "ids.current = fieldValues.map(generateId)" src/useFieldArray/useFieldArray.tsx`: 0 matches
- `grep -n "export const updateFieldArrayRootError" src/utils.ts`: 0 matches
- All `updateFieldArrayRootError` references resolve to `src/logic/` only

## Self-Check: PASSED

- src/utils.ts: modified (Slot guard updated, duplicate removed)
- src/Forger/Forger.tsx: modified (Forger guard added)
- src/useFieldArray/useFieldArray.tsx: modified (import repointed, dead comment removed)
- src/useForgeValues/useForgeValues.tsx: modified (import repointed)
- src/logic/updateFieldArrayRootError.ts: untouched (canonical kept)
- Commits 3383fea and f590979: both present in git log
