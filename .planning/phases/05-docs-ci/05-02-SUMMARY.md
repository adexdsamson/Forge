---
phase: "05-docs-ci"
plan: "02"
subsystem: "documentation"
tags: ["docs", "api-reference", "readme", "react-native", "quickstart"]
dependency_graph:
  requires: []
  provides: ["docs/API.md", "README.md (rewritten)", "examples/ReactNativeExample.md (refreshed)"]
  affects: ["consumers following README", "OSS landing page", "API discoverability"]
tech_stack:
  added: []
  patterns: ["markdown tables for API reference", "shields.io badges", "OSS README structure"]
key_files:
  created:
    - docs/API.md
  modified:
    - ReadMe.md
    - examples/ReactNativeExample.md
decisions:
  - "Documented ForgeProps.onSubmit as (data: TFieldValues) => void — fixed RN example which wrongly passed handleSubmit(onSubmit, onError) to Forge.onSubmit"
  - "ReadMe.md is git-tracked with mixed case (ReadMe.md) even though filesystem shows README.md on Windows — staged using git-tracked name"
  - "usePersist handler documented as (values, { isDirty, isValid }) per D-12 breaking change"
metrics:
  duration: "12min"
  completed_date: "2026-05-31"
  tasks_completed: 2
  files_changed: 3
---

# Phase 5 Plan 2: API Documentation and README Rewrite Summary

**One-liner:** Rewrote README as polished OSS landing page with web+RN quickstarts, created docs/API.md with prop/return tables for all 8 API groups, and refreshed ReactNativeExample with correct @adexdsamson/forge imports.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create docs/API.md — prop/return reference tables | c4748de | docs/API.md |
| 2 | Rewrite README.md and refresh examples/ReactNativeExample.md | 43fe4c0, 4de86eb | ReadMe.md, examples/ReactNativeExample.md |

---

## What Was Built

### Task 1: docs/API.md

Created `docs/` directory and `docs/API.md` with sections covering all 8 required API groups (D-01):

1. **useForge** — Props table (UseForgeProps: defaultValues, resolver, fields, mode, isWizard, initialStep, totalSteps) + Returns table (UseForgeResult, ForgeControl augmentations: hasFields, fields, wizard state + navigation)
2. **Forge** — Props table (ForgeProps: control, onSubmit, className, noValidate, children, ref, debug, platform, isWizard, isNative)
3. **Forger** — Props table (ForgerProps: name, component, rules, transform, handler, dependencies, control, label, accept, multiple, ...rest) + injected props table + transform subsection + platform event wiring table
4. **useFieldArray** — Parameters table + Returns table (fields with inputProps, append, prepend, insert, update, remove, swap, move, replace)
5. **useForgeValues** — Parameters (control) + Returns table (getValue, setValue, getValues)
6. **usePersist** — Parameters (control, handler) + handler signature `(values, { isDirty, isValid })` with D-12 break note
7. **validateField** — Signature + Parameters table + Supported Validation Rules table (required, min, max, minLength, maxLength, pattern, validate)
8. **Platform Detection Utilities** — Two sub-tables: (a) platform booleans from utils.ts (isWeb, isReactNative, isMobile, isTextInput, isCheckBoxInput, isRadioInput, isPicker, isSwitch, isSlider), (b) RN helpers from reactNative.ts (all 10 exports)
9. **TypeScript Types** — Full table of all 13 exported type aliases

### Task 2: README Rewrite and ReactNativeExample Refresh

**ReadMe.md (full rewrite):**
- Hero description + one-paragraph summary
- Three shields.io badges: npm version, CI status, license
- `## Installation` with `npm install @adexdsamson/forge` + peer deps (`react react-hook-form`) + optional peer (`react-dropzone`)
- `## Quickstart (Web)` — realistic signup form with TextInput, RoleSelect (select), CheckboxInput (checkbox) using `useForge → <Forge control={...}> → <Forger name="..." component={...} rules={...}>` pattern; all imports from `@adexdsamson/forge`
- `## React Native` — same form adapted for RN with TextInput, Picker, Switch custom components; explains platform auto-detection
- `## Key Concepts` — three-bullet mental model for useForge / Forge / Forger
- `## API Reference` — link to `docs/API.md`
- `## Examples` — link to `examples/ReactNativeExample.md`
- `## License` — MIT, no Swifter blurb

**examples/ReactNativeExample.md (targeted fixes):**
- Fixed stale `import ... from '../index'` → `import ... from '@adexdsamson/forge'`
- Fixed `<Forge onSubmit={handleSubmit(onSubmit, onError)}>` → `<Forge onSubmit={onSubmit}>` (ForgeProps.onSubmit expects `(data: TFieldValues) => void`, not a wrapped event handler)
- Fixed submit `Button.onPress={handleSubmit(onSubmit, onError)}` → `handleSubmit(onSubmit)` (removed non-existent onError second arg from Forge's internal call)

---

## Verification Results

| Check | Result |
|-------|--------|
| docs/API.md exists | PASS |
| All 10 required symbols present in API.md | PASS (useForge, Forge, Forger, useFieldArray, useForgeValues, usePersist, validateField, isWeb, isReactNative, getEventHandlerName — all found) |
| README no Swifter | PASS |
| README no lib/forge | PASS |
| README no placeholder install | PASS |
| README has @adexdsamson/forge | PASS |
| README has docs/API.md link | PASS |
| README has shields.io badges | PASS |
| ReactNativeExample no ../index | PASS |
| ReactNativeExample has @adexdsamson/forge | PASS |
| grep for stale content in all .md files | 0 results |
| npm run typecheck | exits 0 |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect onSubmit prop usage in ReactNativeExample.md**
- **Found during:** Task 2 — auditing ReactNativeExample.md against current API
- **Issue:** `<Forge onSubmit={handleSubmit(onSubmit, onError)}>` passes the result of `handleSubmit()` (a FormEventHandler) to `ForgeProps.onSubmit` which expects `(data: TFieldValues) => void`. Forge internally calls `control.handleSubmit(safeOnSubmit)` so `onSubmit` should be the raw success callback.
- **Fix:** Changed to `<Forge onSubmit={onSubmit}>` and fixed the Button.onPress to `handleSubmit(onSubmit)` (removed the non-existent onError double-wrapping)
- **Files modified:** examples/ReactNativeExample.md
- **Commit:** 43fe4c0

**2. [Rule 3 - Blocking] Windows filesystem case mismatch: ReadMe.md vs README.md**
- **Found during:** Task 2 commit
- **Issue:** Git tracks the file as `ReadMe.md` but `git add README.md` silently staged nothing on Windows (case-insensitive filesystem). The commit of examples/ReactNativeExample.md went through but the README changes were not included.
- **Fix:** Used `git add ReadMe.md` (matching git's tracked name) and created a separate commit for the README content.
- **Commit:** 4de86eb

---

## Known Stubs

None — all documentation references real API shapes verified against source files. No placeholder or TODO text present in shipped files.

---

## Threat Flags

No new security-relevant surface introduced. This plan produces only static markdown documentation files.

---

## Self-Check: PASSED

| Item | Status |
|------|--------|
| docs/API.md exists | FOUND |
| ReadMe.md exists | FOUND |
| examples/ReactNativeExample.md exists | FOUND |
| 05-02-SUMMARY.md exists | FOUND |
| Commit c4748de (Task 1) | FOUND |
| Commit 43fe4c0 (Task 2 — RN example) | FOUND |
| Commit 4de86eb (Task 2 — README) | FOUND |
