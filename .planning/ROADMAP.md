# Roadmap: Forge

## Overview

Forge was extracted from the orbipayx app into a standalone repo. It typechecks and builds, but has known correctness bugs, heavy react-hook-form private-API usage, zero tests, and rough packaging. This milestone fixes the foundation in dependency order — correctness first, then stability, then a test suite that can assert correct behavior, then publish-ready packaging, then documentation and CI plumbing, and finally the actual publish.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Correctness** - Fix the four known behavioral bugs so the library does what it claims (verification gaps_found 2026-05-31: 3/4 — wizard intermediate-step submit regression; gap-closure plan 01-03 added) (completed 2026-05-31)
- [x] **Phase 2: Stability** - Remove private RHF internal dependencies, drop lodash, gate devtools, harden types (completed 2026-05-31)
- [x] **Phase 3: Testing** - Add a real cross-platform test suite with enforced coverage (completed 2026-05-31)
- [x] **Phase 4: Packaging** - Make the package publish-ready (package.json, entry points, dist hygiene, settled registry) (completed 2026-05-31)
- [x] **Phase 5: Docs & CI** - Accurate docs, lint config, CI pipeline, automated publish workflow (completed 2026-05-31)
- [ ] **Phase 6: Publish** - Ship the package to the chosen registry

## Phase Details

### Phase 1: Correctness

**Goal**: The four known behavioral bugs are fixed so the library behaves as documented
**Depends on**: Nothing (first phase)
**Requirements**: CORR-01, CORR-02, CORR-03, CORR-04
**Success Criteria** (what must be TRUE):

  1. A web form wrapped in `<Forge>` submits via the native `<form>` element — pressing Enter in a text field or clicking a submit button triggers `onSubmit`, and browser-native validation (required, pattern) fires before Forge's handler
  2. Passing multiple children or an invalid child to `<Forger>` throws an error that names `Forger` and the field `name` property, not a generic "Only one child allowed" string
  3. Hovering over `useForge` in an IDE shows JSDoc referencing `UseForgeProps` / `UseForgeResult` (not the phantom `ForgeFormProps` / `UseForgeFormResult`), and the duplicated `updateFieldArrayRootError` function no longer appears in both `utils.ts` and `logic/`
  4. A wizard form reaches its last step, the user clicks the next/submit button, and `onSubmit` fires with the collected form data — the call is not a silent no-op

**Plans**: 3 plans

  - [x] 01-01-PLAN.md — Real cross-platform <form> render + submit semantics (CORR-01), wizard last-step submit (CORR-04), useForge JSDoc fix (CORR-03)
  - [x] 01-02-PLAN.md — Layered fail-fast Forger/Slot child errors (CORR-02), dedupe updateFieldArrayRootError (CORR-03)
  - [x] 01-03-PLAN.md — Gap closure: wizard intermediate-step submit guard (CR-01 BLOCKER / CORR-04), handleWizardSubmit fallback + wizard-aware imperative handle (WR-01/WR-02), phantom field-array error fix (WR-03), dead FieldErrors import (WR-04), event-handler/transform value-type lie (WR-05)

### Phase 2: Stability

**Goal**: The library no longer depends on react-hook-form private `_*` internals for its public API hooks, lodash is removed from the runtime bundle, devtools are dev-only, and the public API is properly typed
**Depends on**: Phase 1
**Requirements**: STAB-01, STAB-02, STAB-03, STAB-04, STAB-05
**Success Criteria** (what must be TRUE):

  1. `useFieldArray` append, remove, insert, swap, and update all work correctly using only public RHF APIs (or any unavoidable internal access is isolated in one place, version-guarded, and documented)
  2. `usePersist` and `useForgeValues` (or their replacements) obtain form values and state via `watch` / `useWatch` / `getValues` — no `control._subjects` or `control._formValues` access remains in their call paths
  3. `lodash` does not appear in the published `dependencies` — the six utility calls (`isUndefined`, `isObject`, etc.) are replaced with inline native checks
  4. A consumer project that installs Forge and does NOT pass `debug={true}` has zero trace of `@hookform/devtools` in its dependency graph; `@hookform/devtools` appears only in `devDependencies` and is lazy-loaded when `debug` is active
  5. `useForge` returns an augmented `control` typed as `ForgeControl<T>` with no `as any` on its public API surface; `yarn tsc --noEmit` passes cleanly

**Plans**: 8 plans

  - [x] 02-01-PLAN.md — Type hardening sweep of types.ts (ForgeControl<T> shape preserved, component: React.ElementType, JSX.Element → React.ReactElement, react-dropzone import type) [STAB-05] (wave 1)
  - [x] 02-02-PLAN.md — lodash removal: centralize native predicates in utils.ts + rewire validateField.ts & logic/getDirtyFields.ts & logic/getFieldValueAs.ts & logic/hasPromiseValidation.ts [STAB-03] (wave 1)
  - [x] 02-03-PLAN.md — Forge.tsx: dev-only lazy guarded-require devtools (RISK-03) + as-any-free child-walker retype (RISK-04, 3 manual submit checks) [STAB-04, STAB-05] (wave 1)
  - [x] 02-04-PLAN.md — usePersist onto public useWatch + useFormState (D-12) [STAB-02] (wave 1)
  - [x] 02-05-PLAN.md — useForge in-place Object.assign control augmentation (D-11) + Forger isEqual->deepEqual & typed component [STAB-05, STAB-03] (wave 2, depends 01,02)
  - [x] 02-06-PLAN.md — useFieldArray decorate-on-top over public RHF useFieldArray, inputProps keeper, unstable effect removed [STAB-01] (wave 3, depends 01,05)
  - [x] 02-07-PLAN.md — useForgeValues collapse to thin public-API wrapper; getValue throws on unknown field via dot-path key-presence (RISK-01) [STAB-02] (wave 3, depends 01,05)
  - [x] 02-08-PLAN.md — package.json: drop lodash/@types/lodash, devtools to devDep + optional peer, RHF peer ^7.34.0; refresh lockfile + rebuild [STAB-03, STAB-04, STAB-05] (wave 4, depends 02,03,05,06,07)

### Phase 3: Testing

**Goal**: A real test suite runs against the corrected, stable library and enforces a meaningful coverage threshold
**Depends on**: Phase 2
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04
**Success Criteria** (what must be TRUE):

  1. `yarn test` runs and exits without configuration errors from a clean checkout
  2. A test renders `useForge` + `<Forge>` + `<Forger>`, fills a field value, submits, and asserts the `onSubmit` callback receives the correct data object
  3. Tests exist and pass for: `useFieldArray` append and remove, `usePersist` / `useForgeValues` value subscriptions, `validateField` rules, and wizard navigation including last-step submit
  4. Running `yarn test` fails with a non-zero exit code when coverage falls below the configured threshold; the threshold is documented in the test config

**Plans**: 4 plans

  - [x] 03-01-PLAN.md — Coverage infrastructure: @vitest/coverage-v8 devDep, vitest.config.ts coverage block (placeholder thresholds=0), scripts.test to vitest run --coverage [TEST-01, TEST-04] (wave 1)
  - [x] 03-02-PLAN.md — Web-mode tests: shared TextInput helper, Forge.errors (CORR-02/D-06), validateField rules (web), useFieldArray append/remove, usePersist subscription, useForgeValues getValue/setValue/throws [TEST-02, TEST-03] (wave 1, depends 03-01)
  - [x] 03-03-PLAN.md — RN-branch tests: Forger.rn (onChangeText/onValueChange via hoisted vi.mock), validateField.rn (setNativeProps via hoisted vi.mock) [TEST-03] (wave 2, depends 03-01, 03-02)
  - [x] 03-04-PLAN.md — Measure coverage, set real thresholds in vitest.config.ts, verify npm test enforces them [TEST-04] (wave 3, depends all)

### Phase 4: Packaging

**Goal**: The npm package artifact is correct and publish-ready — right metadata, working entry points, no committed dist, and a settled registry target
**Depends on**: Phase 2
**Requirements**: PKG-01, PKG-02, PKG-03, PKG-04
**Success Criteria** (what must be TRUE):

  1. `package.json` has `name: "@adexdsamson/forge"`, non-empty `description`, `keywords`, `repository`, `homepage`, `author`, and `license`, and does not have `"private": true`
  2. `npm pack --dry-run` lists a `main` (CJS), `module` (ESM), and `types` (`.d.ts`) entry; importing from the packed tarball in a fresh TypeScript project resolves types without manual path configuration; `prepublishOnly` or `prepack` rebuilds artifacts from source
  3. `dist/` is listed in `.gitignore` and is absent from `git ls-files`; a `files` field in `package.json` limits the published artifact to only `dist/` and the necessary root files
  4. `publishConfig.registry` in `package.json` and the registry URL in the CI publish workflow agree on the same registry (public npm or GitHub Packages); the choice is documented in a comment or in PROJECT.md Key Decisions

**Plans**: 2 plans

Plans:
**Wave 1**

  - [x] 04-01-PLAN.md — package.json edits (publishConfig/prepack/author/sideEffects/engines), CI working-directory removal, MIT LICENSE creation, PROJECT.md decision log (PKG-01, PKG-02, PKG-03, PKG-04) (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

  - [x] 04-02-PLAN.md — Verification: dist hygiene check, prepack smoke, npm pack --dry-run, manual tarball type-resolution smoke test (PKG-02, PKG-03) (wave 2, depends 04-01)

### Phase 5: Docs & CI

**Goal**: The README is accurate and complete, the API is documented, housekeeping files are corrected, lint tooling is configured, and CI guards every PR and automates publish
**Depends on**: Phase 3, Phase 4
**Requirements**: DOCS-01, DOCS-02, DOCS-03, CICD-01, CICD-02, CICD-03
**Success Criteria** (what must be TRUE):

  1. Following the README install and quickstart on a fresh project — for both a web form and a React Native form — produces a working, validated form using the actual current API (`useForge` + `<Forge control={...}>` + `<Forger>`)
  2. The README or a linked API reference contains prop/return tables for `useForge`, `Forge`, `Forger`, `useFieldArray`, `useForgeValues`, `usePersist`, `validateField`, and the platform-detection utilities
  3. No file in the repo references "Swifter project", contains placeholder install text, or references `__tests__/` that does not exist; a `CHANGELOG.md` exists with at least one entry; `LICENSE` reflects the correct project
  4. `yarn lint` runs ESLint + Prettier across `src/` and exits non-zero on violations; a GitHub Actions workflow runs `yarn lint` and `yarn test` on every push and pull request and the status check is visible in the PR
  5. A GitHub Actions publish workflow triggers on release events, pins the publish action to a commit SHA, reads the appropriate auth token secret, and publishes only after lint and tests pass

**Plans**: 4 plans

Plans:
**Wave 1** (all parallel — no shared files)

  - [x] 05-01-PLAN.md — Lint tooling: ESLint 9 flat config (eslint.config.mjs), Prettier (.prettierrc/.prettierignore), devDeps install, lint/lint:fix/changelog scripts in package.json (CICD-01)
  - [x] 05-02-PLAN.md — README full rewrite + docs/API.md creation + examples/ReactNativeExample.md refresh (DOCS-01, DOCS-02)
  - [x] 05-03-PLAN.md — Housekeeping: MIGRATION.md repurpose (RHF-to-Forge), CHANGELOG.md generation + curation, .versionrc.json skip config (DOCS-03)

**Wave 2** *(blocked on Wave 1 -- needs lint script from Plan 01)*

  - [x] 05-04-PLAN.md — CI workflows: ci.yml (lint+test on push/PR) + publish.yml hardening (release trigger, SHA pins, provenance, lint+test gate) (CICD-02, CICD-03)

### Phase 6: Publish

**Goal**: The package is live on the chosen registry and installable by consumers
**Depends on**: Phase 5
**Requirements**: PUB-01
**Success Criteria** (what must be TRUE):

  1. `npm install @adexdsamson/forge` (or the equivalent GitHub Packages install command) succeeds in a fresh project with no errors
  2. After install, `import { useForge, Forge, Forger, useFieldArray, useForgeValues, usePersist } from "@adexdsamson/forge"` resolves and passes TypeScript type-checking with zero errors
  3. The published version tag on the registry matches the version in `package.json` and a corresponding git tag exists on the main branch

**Plans**: 4 plans

Plans:
**Wave 1** (parallel -- no shared files)

  - [x] 06-01-PLAN.md -- Prepare live-registry smoke scaffold (6-export smoke.ts + remove tarball reference) (wave 1, autonomous)
  - [ ] 06-02-PLAN.md -- Pre-publish readiness gate: npm token type/expiry confirmed, scope ownership, dry-run green (wave 1, human-gated)

**Wave 2** *(blocked on Wave 1 -- readiness gate must pass before bump)*

  - [ ] 06-03-PLAN.md -- Version bump + CHANGELOG heading + release PR opened + human merges to main (wave 2, depends 06-02)

**Wave 3** *(blocked on Wave 2 -- release PR must be on main before GitHub Release)*

  - [ ] 06-04-PLAN.md -- Create GitHub Release, monitor CI publish with provenance, post-publish live smoke SC1+SC2+SC3 (wave 3, depends 06-01, 06-03)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Correctness | 3/3 | Complete   | 2026-05-31 |
| 2. Stability | 8/8 | Complete   | 2026-05-31 |
| 3. Testing | 4/4 | Complete   | 2026-05-31 |
| 4. Packaging | 2/2 | Complete   | 2026-05-31 |
| 5. Docs & CI | 4/4 | Complete   | 2026-05-31 |
| 6. Publish | 1/4 | In Progress|  |
