---
phase: quick-260601-ciw
plan: "01"
subsystem: docs
tags: [tsdoc, llms-txt, agents-md, documentation, llm-friendly]
dependency_graph:
  requires: []
  provides: [LLM-01]
  affects: [dist/index.d.ts, AGENTS.md, llms.txt, llms-full.txt]
tech_stack:
  added: []
  patterns: [TSDoc, llmstxt.org]
key_files:
  created:
    - AGENTS.md
    - llms.txt
    - llms-full.txt
  modified:
    - src/Forge/Forge.tsx
    - src/Forger/Forger.tsx
    - src/useForge/useForge.tsx
    - src/useFieldArray/useFieldArray.tsx
    - src/useForgeValues/useForgeValues.tsx
    - src/usePersist/usePersist.tsx
    - src/useSubscribe.ts
    - src/validateField.ts
    - src/reactNative.ts
    - src/types.ts
    - src/utils.ts
decisions:
  - AGENTS.md is the single source of truth for failure-mode prose; llms-full.txt assembles from it verbatim
  - TSDoc one-liners are kept minimal (no invented types/props) and aligned with AGENTS.md direction
  - reactNative={{}} explicitly called out as anti-pattern in both AGENTS.md and Forger TSDoc
metrics:
  duration: ~20min
  completed: 2026-06-01
  tasks_completed: 3
  files_changed: 14
---

# Quick Task 260601-ciw: LLM-friendly Forge Docs — SUMMARY

## One-liner

Added AGENTS.md (7-mistake LLM usage guide), llms.txt (llmstxt.org index), llms-full.txt (single-paste reference), and TSDoc blocks on all exported symbols so `dist/index.d.ts` carries inline usage hints.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Write AGENTS.md | 1ba25bc | AGENTS.md |
| 2 | Write llms.txt and llms-full.txt | 6dd508e | llms.txt, llms-full.txt |
| 3 | Add TSDoc to all exported symbols | 59741ef | 11 src/ files |

## What Was Built

### AGENTS.md (repo root)
Authoritative LLM usage guide with 7 sections: What Forge Is, 8 Exports table, 8 copy-paste recipes (web + RN), `## Common Mistakes` with 7 numbered do-NOT/do items, TypeScript quick reference, further reading. All export names verified against `src/index.ts`. usePersist handler signature verified against `src/usePersist/usePersist.tsx`. transform direction (output=store, input=display) verified against `src/Forger/Forger.tsx`.

### llms.txt (repo root)
llmstxt.org format: H1 `# @adexdsamson/forge`, blockquote summary, link list (README, docs/API.md, AGENTS.md, examples/ReactNativeExample.md, CHANGELOG.md).

### llms-full.txt (repo root)
AGENTS.md body included verbatim, followed by a condensed 8-row API signature table. Ends with "Source of truth: AGENTS.md" note. DRY: no independent copy of failure-mode prose.

### TSDoc on src/ exports
Every exported symbol from `src/index.ts` now has a `/** */` TSDoc block:
- `useForge`: description, remarks on control identity, @param, @returns, @example
- `Forge`: web vs RN rendering, forgeSubmit wiring, @param, @returns, @example
- `Forger`: RN props go flat on `<Forger>` not via `reactNative={{}}`, name required, transform direction
- `useFieldArray`: inputProps layering rationale, @example
- `useForgeValues`: getValue throw behavior, @example
- `usePersist`: fires on mount, handler signature, @example
- `useSubscribe`: Subject<T> observer, disabled flag, @example
- `validateField`: platform-aware (web reportValidity / RN setNativeProps), @param, @returns, @example
- All type exports in `src/types.ts`: ForgeControl, ForgeProps, ForgerProps, UseForgeProps, UseForgeResult, ForgeSubmitButtonProps, FieldProps, FormPropsRef, ForgerControllerProps, ForgerSlotProps, TForgerProps, ReactNativeInputProps, PlatformSpecificProps, CrossPlatformForgerProps
- All reactNative.ts exports: REACT_NATIVE_COMPONENTS, getEventHandlerName, getValuePropertyName, setReactNativeError, getComponentType, mergePlatformProps, REACT_NATIVE_VALIDATION_RULES, handleReactNativeFile, getPlatform, isValidReactNativeComponent
- Exported platform booleans in utils.ts: isWeb, isReactNative, isMobile
- Exported slot guards / type predicates: isTextInput, isCheckBoxInput, isRadioInput, isPicker, isSwitch, isSlider

## Gate Results

| Gate | Result | Notes |
|------|--------|-------|
| `grep -c "## Common Mistakes" AGENTS.md` | 1 | PASS |
| `grep -c "reactNative={{}}" AGENTS.md` | 1 (anti-pattern in do-NOT only) | PASS — no recommended usage |
| `grep -c "# @adexdsamson/forge" llms.txt` | 1 | PASS |
| `grep -c "## Common Mistakes" llms-full.txt` | 1 | PASS |
| `npm run typecheck` | exit 0 | PASS |
| `npm run lint` | 0 errors, 105 warnings (pre-existing) | PASS |
| `npm test` | 9 files / 23 tests passed | PASS |
| `git diff docs/API.md` | empty | PASS — unchanged |
| `package.json` version | 1.0.0 | PASS — unchanged |

## Deviations from Plan

None — plan executed exactly as written. All accuracy rules respected: no invented props, no `reactNative={{}}` as recommended pattern, transform direction (output=store/input=display) confirmed from Forger.tsx source before documenting.

## Known Stubs

None. All three new files contain real, verified content derived from the actual source files.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Documentation only.

## Self-Check: PASSED

- AGENTS.md: exists at repo root — confirmed
- llms.txt: exists at repo root — confirmed
- llms-full.txt: exists at repo root — confirmed
- Commits 1ba25bc, 6dd508e, 59741ef: all present in git log
- npm run typecheck: exit 0 confirmed
- npm run lint: exit 0 (warnings only) confirmed
- npm test: 9 files / 23 tests passed confirmed
- docs/API.md: unchanged confirmed
- package.json version: 1.0.0 confirmed
