# Forge

## What This Is

Forge is a cross-platform (Web + React Native) React form library that wraps [react-hook-form](https://react-hook-form.com/) with a more streamlined, composable API. A developer calls `useForge(...)` to get react-hook-form's full toolkit plus an augmented `control`, renders a `<Forge control={...}>` form, and drops in `<Forger>` field wrappers around any custom input — web or native. It also ships reactive hooks (`usePersist`, `useForgeValues`, `useFieldArray`, `useSubscribe`), standalone `validateField`, platform detection, and a wizard/multi-step mode. This milestone turns the code (just extracted from the orbipayx app into this standalone repo) into a polished, well-tested, documented open-source npm package.

## Core Value

A React developer — on web **or** React Native — can install Forge, follow the README, and build a working, validated form with custom components in minutes, and it behaves correctly (real form submit, fields re-render, clear errors) and stays stable across react-hook-form updates.

## Requirements

### Validated

<!-- Existing capabilities inferred from the extracted codebase (already built & relied upon). -->

- ✓ `useForge()` initializes react-hook-form and returns its methods plus an augmented `control` (fields, wizard state) — existing
- ✓ `<Forge control={...} onSubmit={...}>` renders a form container that auto-wires children and `fieldProps` — existing
- ✓ `<Forger>` connects any custom component to the form via `useController`, with `transform` and platform-aware event handlers — existing
- ✓ Cross-platform support (Web + React Native) via runtime detection (`isWeb`/`isReactNative`/`isMobile`) and event-handler mapping (`onChange`/`onChangeText`/`onValueChange`) — existing
- ✓ Dynamic field arrays via `useFieldArray` — existing
- ✓ Value subscriptions via `usePersist`, `useForgeValues`, `useSubscribe` — existing
- ✓ Standalone field validation via `validateField` — existing
- ✓ Wizard / multi-step form mode (state + navigation) — existing (last-step submit fixed in Phase 1)
- ✓ Builds to CJS + ESM + bundled type declarations via Rollup — existing (build wired during re-base)
- ✓ Correctness fixes (Phase 1, validated 2026-05-31): real cross-platform `<form>` render + native submit/validation (CORR-01), component-named fail-fast `Forger`/`Slot` child errors (CORR-02), stale JSDoc + duplicate `updateFieldArrayRootError` removed (CORR-03), wizard last-step submit wired with intermediate-step Enter guarded and index-aligned field-array errors (CORR-04)
- ✓ Test suite (Phase 3, validated 2026-05-31): vitest + `@vitest/coverage-v8` wired with `vitest run --coverage` (TEST-01); web-mode integration tests for render/fill/submit, `useFieldArray`, `usePersist`, `useForgeValues`, `validateField`, CORR-02 regression (TEST-02); React-Native branch tests via hoisted `vi.mock` on `utils.ts` for `Forger` event wiring + `validateField` `setNativeProps` (TEST-03); enforced coverage thresholds documented in `vitest.config.ts` that fail the run on shortfall (TEST-04) — 21 tests across 8 files; thresholds set conservatively below measured coverage (lines 56.7%/branches 38.8%), accepted at the human-verify gate

### Active

<!-- This milestone: fix the foundation, then ship as OSS. Hypotheses until shipped. -->

- [x] Correctness fixes: real `<form>` element, component-named child errors, stale JSDoc removed, wizard last-step submit wired — ✓ Phase 1 complete (2026-05-31)
- [ ] Stability: stop depending on react-hook-form private `control._*` internals (or contain/justify them), drop the `lodash` runtime dependency, stop shipping `@hookform/devtools` to production
- [x] Testing: a real cross-platform test suite with enforced coverage — ✓ Phase 3 complete (2026-05-31)
- [ ] Packaging: clean publish-ready `package.json`, settled publish target, no `dist/` in git, modern build
- [ ] Documentation: accurate README + API reference + migration/license cleanup
- [ ] CI/CD: lint + test on every PR/push; automated publish on release
- [ ] Publish: ship the package to the chosen registry

### Out of Scope

- Replacing react-hook-form — Forge is a thin wrapper over RHF by design, not a replacement.
- New form features beyond the current API surface — this milestone is "fix + harden + ship what exists," not feature expansion (wizard fix counts as a correctness fix, not a new feature).
- A hosted documentation site (e.g. TypeDoc → GitHub Pages) — README + API reference suffice for v1.

## Context

- **Origin:** The active library lived vendored inside the `orbipayx` app at `src/lib/forge`. It was extracted into this standalone repo (`C:\Users\HomePC\Documents\GitHub\Forge`) on 2026-05-31 (commits `ce6ec11` re-base, `e43e8a1` build wiring). A stale earlier attempt exists in a sibling `Forge-2` repo and is abandoned.
- **Codebase state:** see `.planning/codebase/` (STACK, ARCHITECTURE, QUALITY, CONCERNS). It typechecks and builds, but: zero tests, ~46 `as any` casts (strict mode effectively bypassed), ~118 react-hook-form private `control._*` access sites across `useFieldArray`/`usePersist`/`useForgeValues`, no lint/CI config, `@hookform/devtools` hard-imported into production, `lodash` runtime dep, and several known correctness bugs.
- **Known correctness bugs:** `<Forge>` renders a `<div>` not a `<form>` (`Forge.tsx:253`); `Slot` throws a generic non-component-named error (`utils.ts:408`); stale JSDoc references non-existent `ForgeFormProps`/`UseForgeFormResult` (`useForge.tsx:9-10`); `handleWizardSubmit` is declared and destructured but never implemented, so wizard last-step submit silently no-ops.
- **Already fixed:** the `MemorizeController` memo comparator (formerly broken so fields never re-rendered) is correct in this codebase.
- **Publishing nuance:** `package.json` `publishConfig` points at GitHub Packages, but the existing CI (`.github/workflows/publish.yml`) publishes to npmjs from `dist/`. The publish target must be settled deliberately.

## Constraints

- **Tech stack**: TypeScript 5.x strict, React ≥18, react-hook-form ^7.x. Prefer public RHF APIs so the library survives routine RHF updates (currently violated via `control._*`).
- **Platform**: Cross-platform Web + React Native for v1 (no hard `react-native` import — support is via runtime detection; RN remains an optional peer for consumers using RN components).
- **Packaging**: Ships CJS + ESM + TypeScript declarations under the `@adexdsamson` scope; semver via conventional commits.
- **Bundle**: Keep runtime light — externalize React/RHF as peers; remove lodash; keep devtools out of production.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Re-base the milestone onto the orbipayx-extracted code in the standalone `Forge` repo | The orbipayx copy is the genuinely active library (2 generations ahead of the abandoned Forge-2 base); planning must reflect real code | ✓ Good |
| Planning (`.planning/`) lives in the `Forge` repo | Code and planning co-located; the old Forge-2 split is abandoned | ✓ Good |
| v1 is cross-platform (Web + React Native) | The extracted code already supports both via runtime detection; reverses the earlier web-only-v1 stance | — Pending |
| Keep `@adexdsamson` scope | Scope already owned | — Pending |
| Publish target (npm vs GitHub Packages) settled to public npm | GitHub Packages requires authenticated .npmrc for consumers; public npm installs zero-config, aligns with core value and existing CI token (NPM_ACCESS_TOKEN / --access public) | Public npm (D-01) — publishConfig and CI workflow now both point to registry.npmjs.org |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-31 — Phase 4 (Packaging) in progress: registry settled to public npm (PKG-04), prepack hook added (PKG-02), MIT LICENSE added (PKG-01)*
